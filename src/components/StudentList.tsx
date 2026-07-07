import React, { useState, useRef } from 'react';
import type { Student, Gender } from '../types';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, UserPlus, Download } from 'lucide-react';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

export default function StudentList({ students, setStudents }: Props) {
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

      const newStudents: Student[] = [];
      data.forEach((row, index) => {
        if (index === 0 && (row[0] === '이름' || row[0] === 'name' || row[0] === 'Name')) return;
        if (row[0]) {
          const name = String(row[0]).trim();
          let gender: Gender = 'none';
          if (row[1]) {
            const g = String(row[1]).trim().toLowerCase();
            if (g === '남' || g === 'm' || g === 'male' || g === '남자') gender = 'male';
            if (g === '여' || g === 'f' || g === 'female' || g === '여자') gender = 'female';
          }
          newStudents.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            gender,
            isFixedFront: false,
            isFixedBack: false
          });
        }
      });
      setStudents([...students, ...newStudents]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setStudents([
      ...students,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: newName.trim(),
        gender: 'none',
        isFixedFront: false,
        isFixedBack: false
      }
    ]);
    setNewName('');
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(students.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const genderAvatar = (g: Gender) => {
    if (g === 'male') return { emoji: '👦', bg: '#dbeafe', color: '#1d4ed8' };
    if (g === 'female') return { emoji: '👧', bg: '#fce7f3', color: '#be185d' };
    return { emoji: '🧑', bg: '#f3f4f6', color: '#6b7280' };
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* ===== 상단 입력 + 버튼 영역 ===== */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', border: '1px solid #fed7aa' }}
      >
        {/* 이름 입력 폼 */}
        <form onSubmit={handleAddStudent} className="flex gap-2">
          <input
            type="text"
            placeholder="학생 이름 입력 후 Enter ↩"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 text-slate-700 font-medium"
            style={{
              borderColor: '#fed7aa',
              background: 'rgba(255,255,255,0.9)',
              focusRingColor: '#f97316',
            } as React.CSSProperties}
          />
          <button
            type="submit"
            className="btn-primary flex items-center gap-2 px-5 py-3 whitespace-nowrap"
          >
            <Plus size={18} /> 추가
          </button>
        </form>

        {/* 버튼 그룹 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-auto">
            <span className="text-slate-500 text-sm font-medium">총</span>
            <span
              className="text-xl font-black"
              style={{ color: '#f97316' }}
            >
              {students.length}
            </span>
            <span className="text-slate-500 text-sm font-medium">명</span>
          </div>

          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ borderColor: '#fed7aa', background: 'white', color: '#ea580c' }}
          >
            <Upload size={15} /> 엑셀 업로드
          </button>
          <button
            onClick={() => {
              const ws = XLSX.utils.aoa_to_sheet([['이름', '성별'], ['홍길동', '남'], ['김영희', '여']]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "학생명단양식");
              XLSX.writeFile(wb, "자리뽑기_명단양식.xlsx");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ borderColor: '#e2e8f0', background: 'white', color: '#64748b' }}
          >
            <Download size={15} /> 양식
          </button>
          <button
            onClick={() => {
              if (window.confirm('등록된 학생 명단을 모두 삭제하시겠습니까?')) {
                setStudents([]);
              }
            }}
            disabled={students.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: '#fecdd3', background: 'white', color: '#e11d48' }}
          >
            <Trash2 size={15} /> 전체 삭제
          </button>
        </div>
      </div>

      {/* ===== 학생 목록 ===== */}
      {students.length === 0 ? (
        /* 빈 상태 */
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: 'rgba(249,115,22,0.04)', border: '2px dashed #fed7aa' }}
        >
          <UserPlus size={48} className="mb-3" style={{ color: '#fdba74' }} />
          <p className="text-slate-500 font-semibold text-lg">학생을 추가해주세요</p>
          <p className="text-slate-400 text-sm mt-1">이름 입력 또는 엑셀 파일로 한 번에 업로드!</p>
          <p className="text-xs text-slate-300 mt-2">(엑셀: A열 이름, B열 성별)</p>
        </div>
      ) : (
        <>
          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: '1px solid #fed7aa', boxShadow: '0 2px 12px rgba(249,115,22,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', borderBottom: '1px solid #fed7aa' }}>
                    <th className="p-4 font-bold text-slate-600 text-sm">이름</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">성별</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">자리 고정</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">분리 그룹</th>
                    <th className="p-4 font-bold text-slate-600 text-sm text-center w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const av = genderAvatar(student.gender);
                    return (
                      <tr
                        key={student.id}
                        className="transition-colors"
                        style={{
                          background: idx % 2 === 0 ? 'white' : 'rgba(255,247,237,0.5)',
                          borderBottom: '1px solid rgba(254,215,170,0.4)',
                        }}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm"
                              style={{ background: av.bg }}
                            >
                              {av.emoji}
                            </div>
                            <span className="font-semibold text-slate-700">{student.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={student.gender}
                            onChange={(e) => updateStudent(student.id, { gender: e.target.value as Gender })}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 cursor-pointer"
                            style={{
                              background: av.bg,
                              color: av.color,
                              border: 'none',
                              focusRingColor: '#f97316',
                            } as React.CSSProperties}
                          >
                            <option value="none">선택안함</option>
                            <option value="male">👦 남학생</option>
                            <option value="female">👧 여학생</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={student.isFixedFront}
                                onChange={(e) => updateStudent(student.id, { isFixedFront: e.target.checked, isFixedBack: false })}
                                className="rounded"
                                style={{ accentColor: '#f97316' }}
                              />
                              <span className={student.isFixedFront ? 'text-orange-600 font-semibold' : 'text-slate-400'}>앞자리</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={student.isFixedBack}
                                onChange={(e) => updateStudent(student.id, { isFixedBack: e.target.checked, isFixedFront: false })}
                                className="rounded"
                                style={{ accentColor: '#a855f7' }}
                              />
                              <span className={student.isFixedBack ? 'text-purple-600 font-semibold' : 'text-slate-400'}>뒷자리</span>
                            </label>
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={student.separationGroup || ''}
                            onChange={(e) => updateStudent(student.id, { separationGroup: e.target.value.trim() || undefined })}
                            placeholder="그룹명 입력..."
                            className="w-full min-w-[120px] px-3 py-1.5 rounded-lg border text-sm focus:ring-2 focus:border-orange-400 focus:outline-none transition-shadow"
                            style={{ borderColor: '#e2e8f0', focusRingColor: '#f97316' } as React.CSSProperties}
                            title="같은 그룹명끼리는 붙어 앉지 않습니다."
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeStudent(student.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                            style={{ color: '#cbd5e1' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 모바일: 카드 뷰 */}
          <div className="md:hidden flex flex-col gap-3">
            {students.map((student) => {
              const av = genderAvatar(student.gender);
              return (
                <div
                  key={student.id}
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'white',
                    border: '1px solid #fed7aa',
                    boxShadow: '0 2px 8px rgba(249,115,22,0.07)',
                  }}
                >
                  {/* 카드 헤더 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-sm flex-shrink-0"
                      style={{ background: av.bg }}
                    >
                      {av.emoji}
                    </div>
                    <span className="font-bold text-slate-800 text-lg flex-1">{student.name}</span>
                    <button
                      onClick={() => removeStudent(student.id)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ color: '#fca5a5', background: '#fff1f2' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* 카드 옵션들 */}
                  <div className="flex flex-col gap-2.5">
                    {/* 성별 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold w-16 flex-shrink-0">성별</span>
                      <select
                        value={student.gender}
                        onChange={(e) => updateStudent(student.id, { gender: e.target.value as Gender })}
                        className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none"
                        style={{ background: av.bg, color: av.color, border: 'none' }}
                      >
                        <option value="none">선택안함</option>
                        <option value="male">👦 남학생</option>
                        <option value="female">👧 여학생</option>
                      </select>
                    </div>

                    {/* 자리 고정 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold w-16 flex-shrink-0">고정</span>
                      <div className="flex gap-3 flex-1">
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer flex-1 justify-center py-1.5 rounded-xl" style={{ background: student.isFixedFront ? '#fff7ed' : '#f8fafc', border: `1.5px solid ${student.isFixedFront ? '#f97316' : '#e2e8f0'}` }}>
                          <input
                            type="checkbox"
                            checked={student.isFixedFront}
                            onChange={(e) => updateStudent(student.id, { isFixedFront: e.target.checked, isFixedBack: false })}
                            style={{ accentColor: '#f97316' }}
                          />
                          <span className={`font-semibold ${student.isFixedFront ? 'text-orange-600' : 'text-slate-400'}`}>앞자리</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer flex-1 justify-center py-1.5 rounded-xl" style={{ background: student.isFixedBack ? '#faf5ff' : '#f8fafc', border: `1.5px solid ${student.isFixedBack ? '#a855f7' : '#e2e8f0'}` }}>
                          <input
                            type="checkbox"
                            checked={student.isFixedBack}
                            onChange={(e) => updateStudent(student.id, { isFixedBack: e.target.checked, isFixedFront: false })}
                            style={{ accentColor: '#a855f7' }}
                          />
                          <span className={`font-semibold ${student.isFixedBack ? 'text-purple-600' : 'text-slate-400'}`}>뒷자리</span>
                        </label>
                      </div>
                    </div>

                    {/* 분리 그룹 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold w-16 flex-shrink-0">분리</span>
                      <input
                        type="text"
                        value={student.separationGroup || ''}
                        onChange={(e) => updateStudent(student.id, { separationGroup: e.target.value.trim() || undefined })}
                        placeholder="그룹명 (예: 떠드는팀)"
                        className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                        style={{ borderColor: '#e2e8f0' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
