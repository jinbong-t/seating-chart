import React, { useState } from 'react';
import type { Student, Seat, GridConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Download, Printer, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

interface Props {
  students: Student[];
  seats: Seat[];
  setSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
  gridConfig: GridConfig;
}

type GenderMix = 'none' | 'boy-girl' | 'same-gender';

export default function PlacementEngine({ students, seats, setSeats, gridConfig }: Props) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [genderMix, setGenderMix] = useState<GenderMix>('none');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const getAvailableSeats = () => seats.filter(s => s.status === 'available');

  const shuffleArray = <T,>(array: T[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const checkAdjacency = (seat: Seat, student: Student, currentSeats: Seat[]) => {
    if (!student.separationGroup) return false;
    
    // 인접한 4방향 (상, 하, 좌, 우) 확인
    const adjacentDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of adjacentDirs) {
      const r = seat.row + dr;
      const c = seat.col + dc;
      const neighbor = currentSeats.find(s => s.row === r && s.col === c && s.status === 'occupied');
      
      if (neighbor && neighbor.studentId) {
        const neighborStudent = students.find(s => s.id === neighbor.studentId);
        if (neighborStudent && neighborStudent.separationGroup === student.separationGroup) {
          return true; // 인접 위치에 같은 그룹 학생이 있음 (충돌)
        }
      }
    }
    return false;
  };

  const handlePlacement = () => {
    const availableSeats = getAvailableSeats();
    
    if (students.length > availableSeats.length) {
      setErrorMsg(`학생 수(${students.length}명)가 사용 가능한 자리(${availableSeats.length}개)보다 많습니다. 교실 설정을 확인해주세요.`);
      return;
    }
    setErrorMsg('');
    setIsAnimating(true);
    setIsCompleted(false);

    let newSeats = seats.map(s => s.status === 'occupied' ? { ...s, status: 'available' as const, studentId: undefined } : s);
    
    let frontStudents = students.filter(s => s.isFixedFront);
    let backStudents = students.filter(s => s.isFixedBack && !s.isFixedFront);
    let normalStudents = students.filter(s => !s.isFixedFront && !s.isFixedBack);

    frontStudents = shuffleArray(frontStudents);
    backStudents = shuffleArray(backStudents);
    normalStudents = shuffleArray(normalStudents);

    let sortedSeats = [...newSeats.filter(s => s.status === 'available')].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    const assignSeat = (student: Student, targetSeatId: string) => {
      newSeats = newSeats.map(s => 
        s.id === targetSeatId ? { ...s, status: 'occupied', studentId: student.id } : s
      );
      sortedSeats = sortedSeats.filter(s => s.id !== targetSeatId);
    };

    // 1. 앞자리 고정 배치
    frontStudents.forEach(student => {
      if (sortedSeats.length > 0) assignSeat(student, sortedSeats[0].id);
    });

    // 2. 뒷자리 고정 배치
    backStudents.forEach(student => {
      if (sortedSeats.length > 0) assignSeat(student, sortedSeats[sortedSeats.length - 1].id);
    });

    // 남은 학생 배치 (단순 성별 섞기 유도)
    if (genderMix === 'boy-girl') {
      let boys = normalStudents.filter(s => s.gender === 'male');
      let girls = normalStudents.filter(s => s.gender === 'female');
      let unknowns = normalStudents.filter(s => s.gender === 'none');
      
      const combined = [];
      while (boys.length > 0 || girls.length > 0 || unknowns.length > 0) {
        if (boys.length > 0) combined.push(boys.pop()!);
        if (girls.length > 0) combined.push(girls.pop()!);
        if (unknowns.length > 0) combined.push(unknowns.pop()!);
      }
      normalStudents = combined;
    }

    // 3. 남은 학생 분리 규칙 적용하여 배치
    normalStudents.forEach(student => {
      if (sortedSeats.length === 0) return;

      // 분리 그룹이 있는 경우, 가능한 한 충돌이 없는 자리를 찾음
      if (student.separationGroup) {
        // 충돌 없는 자리 찾기 (랜덤하게 섞어서 먼저 나오는 것)
        const candidates = shuffleArray([...sortedSeats]);
        let selectedSeat = candidates.find(seat => !checkAdjacency(seat, student, newSeats));
        
        if (selectedSeat) {
          assignSeat(student, selectedSeat.id);
        } else {
          // 어쩔 수 없이 충돌하는 자리라도 배치
          assignSeat(student, sortedSeats[Math.floor(Math.random() * sortedSeats.length)].id);
        }
      } else {
        assignSeat(student, sortedSeats[Math.floor(Math.random() * sortedSeats.length)].id);
      }
    });

    // 애니메이션 후 폭죽
    setTimeout(() => {
      setSeats(newSeats);
      setIsAnimating(false);
      setIsCompleted(true);
      
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }, 1200);
  };

  const getGridStyle = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
      gap: '0.75rem',
    };
  };

  const saveAsImage = async () => {
    const el = document.getElementById('seating-chart-result');
    if (el) {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#1e293b' }); // 칠판 배경색상 맞춰서 캡처
      const link = document.createElement('a');
      link.download = '자리배치표.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const printChart = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-[#fdfbf7] p-6 rounded-2xl border-2 border-[#e5d9c5] flex flex-col md:flex-row gap-6 justify-between items-center shadow-sm">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-sm font-bold text-amber-900 flex items-center gap-1">
            <Settings size={16} /> 짝꿍 규칙 (선택)
          </label>
          <select 
            value={genderMix}
            onChange={(e) => setGenderMix(e.target.value as GenderMix)}
            className="px-4 py-2 rounded-xl border-2 border-[#e5d9c5] focus:border-amber-500 focus:ring-0 focus:outline-none bg-white text-amber-900 font-medium"
          >
            <option value="none">조건 없음 (완전 랜덤)</option>
            <option value="boy-girl">남녀 섞어 앉기 유도</option>
          </select>
        </div>

        <button
          onClick={handlePlacement}
          disabled={isAnimating || students.length === 0}
          className={`flex-1 md:flex-none py-4 px-10 rounded-2xl font-black text-xl text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-4 border-amber-600/30
            ${isAnimating ? 'bg-amber-400 cursor-not-allowed animate-pulse' : 'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-amber-500/30 text-amber-950'}`}
        >
          <Shuffle size={28} className={isAnimating ? 'animate-spin' : ''} />
          {isAnimating ? '배치 중...' : '자리 뽑기 시작!'}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* 칠판 테마 결과 화면 */}
      <div className="bg-[#1e293b] p-6 md:p-10 rounded-[2rem] border-[12px] border-[#8b5a2b] shadow-2xl overflow-x-auto relative min-h-[600px]" id="seating-chart-result">
        
        {/* 분필 가루 질감 효과를 위한 오버레이 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        <div className="flex justify-between items-center mb-10 no-print relative z-10">
          <h3 className="font-black text-2xl text-white drop-shadow-md font-['Comic_Sans_MS',sans-serif]">🧑‍🏫 우리 반 자리 배치표</h3>
          <div className="flex gap-3">
            <button onClick={saveAsImage} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/20" title="이미지로 저장">
              <Download size={20} />
            </button>
            <button onClick={printChart} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/20" title="인쇄">
              <Printer size={20} />
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-14 relative z-10">
          <div className="w-2/3 py-5 bg-[#334155]/80 backdrop-blur-md rounded-2xl border-b-4 border-[#0f172a] text-center text-white/90 font-black text-3xl shadow-lg tracking-widest">
            교 탁
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10" style={getGridStyle()}>
          <AnimatePresence>
            {seats.map((seat) => {
              const student = students.find(s => s.id === seat.studentId);
              const isOccupied = seat.status === 'occupied' && student;

              if (seat.status === 'disabled') {
                return (
                  <div key={seat.id} className="aspect-[4/3] rounded-2xl border-4 border-dashed border-white/10 flex items-center justify-center opacity-20">
                  </div>
                );
              }

              return (
                <motion.div
                  key={seat.id}
                  layout
                  initial={isAnimating ? { opacity: 0, scale: 0.5, rotateY: 90 } : false}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 12, delay: isAnimating ? Math.random() * 0.5 : 0 }}
                  className={`
                    relative aspect-[4/3] rounded-2xl flex flex-col items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.2)] border-2
                    ${isOccupied 
                      ? 'bg-[#eecda3] bg-gradient-to-br from-[#efd5ff] to-[#eecda3] border-[#d4a373] text-[#5c4033]' // 나무 질감 느낌의 그라데이션
                      : 'bg-white/5 border-white/10 text-white/30 backdrop-blur-sm'
                    }
                    transform transition-transform hover:-translate-y-1 hover:shadow-[0_12px_0_0_rgba(0,0,0,0.2)]
                  `}
                >
                  {isOccupied ? (
                    <>
                      {/* 카드 상단 장식물 (압정 느낌) */}
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-400 shadow-sm border border-red-500/50"></div>
                      
                      <span className="font-black text-2xl md:text-3xl drop-shadow-sm">{student.name}</span>
                      
                      <div className="flex gap-1 mt-2">
                        {student.gender === 'male' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        {student.gender === 'female' && <span className="w-2 h-2 rounded-full bg-pink-500"></span>}
                        {student.separationGroup && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold border border-red-200">
                            G{student.separationGroup}
                          </span>
                        )}
                      </div>
                      
                      <span className="text-xs font-bold opacity-60 mt-1 absolute bottom-2">
                        {student.isFixedFront && '🌟 앞자리'}
                        {student.isFixedBack && '🌟 뒷자리'}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium">빈 자리</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #seating-chart-result, #seating-chart-result * {
            visibility: visible;
          }
          #seating-chart-result {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          /* 인쇄 시 어두운 테마 반전 처리 */
          #seating-chart-result h3, #seating-chart-result .text-white {
            color: black !important;
            text-shadow: none !important;
          }
          #seating-chart-result .bg-\\[\\#334155\\]\\/80 {
            background-color: #f1f5f9 !important;
            color: #334155 !important;
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>
    </div>
  );
}
