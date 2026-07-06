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
        if (index === 0 && (row[0] === '이름' || row[0] === 'name' || row[0] === 'Name')) return; // Skip header
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
        <form onSubmit={handleAddStudent} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="학생 이름 입력"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 md:w-48 px-4 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Plus size={18} /> 추가
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
          <div className="text-sm text-slate-500 font-medium mr-2">
            총 <span className="text-indigo-600 font-bold text-lg">{students.length}</span>명
          </div>
          <div className="h-8 w-[1px] bg-indigo-200 hidden md:block mr-2"></div>
          <button 
            onClick={() => {
              if (window.confirm('등록된 학생 명단을 모두 삭제하시겠습니까?')) {
                setStudents([]);
              }
            }}
            disabled={students.length === 0}
            className="flex-1 md:flex-none bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="명단 전체 삭제"
          >
            <Trash2 size={16} />
            전체 삭제
          </button>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 flex-1 md:flex-none"
          >
            <Upload size={18} />
            업로드
          </button>
          <button 
            onClick={() => {
              const ws = XLSX.utils.aoa_to_sheet([['이름', '성별'], ['홍길동', '남'], ['김영희', '여']]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "학생명단양식");
              XLSX.writeFile(wb, "자리뽑기_명단양식.xlsx");
            }}
            className="bg-slate-100 border border-slate-200 hover:border-slate-300 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 flex-1 md:flex-none"
            title="업로드용 엑셀 양식 다운로드"
          >
            <Download size={18} />
            양식 다운로드
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold w-1/5">이름</th>
                <th className="p-4 font-semibold w-1/5">성별</th>
                <th className="p-4 font-semibold w-1/4">특이사항 (자리 고정)</th>
                <th className="p-4 font-semibold w-1/4">절대 떨어져! (분리 그룹)</th>
                <th className="p-4 font-semibold w-16 text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <UserPlus className="mx-auto mb-2 opacity-50" size={32} />
                    학생을 추가하거나 파일을 업로드해주세요.<br/>
                    <span className="text-xs mt-2 block">(엑셀 파일은 A열에 이름, B열에 성별을 입력해주세요)</span>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${student.gender === 'male' ? 'bg-blue-400' : student.gender === 'female' ? 'bg-pink-400' : 'bg-slate-400'}`}>
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={student.gender}
                        onChange={(e) => updateStudent(student.id, { gender: e.target.value as Gender })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="none">선택안함</option>
                        <option value="male">남학생</option>
                        <option value="female">여학생</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={student.isFixedFront}
                            onChange={(e) => updateStudent(student.id, { isFixedFront: e.target.checked, isFixedBack: false })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={student.isFixedFront ? "text-indigo-700 font-medium" : "text-slate-500"}>앞자리 고정</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer ml-4">
                          <input 
                            type="checkbox" 
                            checked={student.isFixedBack}
                            onChange={(e) => updateStudent(student.id, { isFixedBack: e.target.checked, isFixedFront: false })}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className={student.isFixedBack ? "text-purple-700 font-medium" : "text-slate-500"}>뒷자리 고정</span>
                        </label>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">그룹:</span>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={student.separationGroup || ''}
                          onChange={(e) => updateStudent(student.id, { separationGroup: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="번호"
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
                          title="같은 숫자를 입력한 학생들끼리는 상하좌우로 붙어 앉지 않습니다."
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => removeStudent(student.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
