import React, { useState } from 'react';
import type { Student, Seat, GridConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Download, Printer, Settings, Eye, CheckCircle2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

interface Props {
  students: Student[];
  seats: Seat[];
  setSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
  gridConfig: GridConfig;
}

type GenderMix = 'none' | 'boy-girl' | 'same-gender';
type RevealMode = 'all' | 'one-by-one';

const playPopSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error(e);
  }
};

const playTadaSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(523.25, now, 0.4); 
    playNote(659.25, now + 0.15, 0.4); 
    playNote(783.99, now + 0.3, 0.6); 
    playNote(1046.50, now + 0.3, 0.6); 
  } catch (e) {
    console.error(e);
  }
};

export default function PlacementEngine({ students, seats, setSeats, gridConfig }: Props) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [genderMix, setGenderMix] = useState<GenderMix>('none');
  const [revealMode, setRevealMode] = useState<RevealMode>('all');
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [revealedSeats, setRevealedSeats] = useState<string[]>([]);

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
    
    const adjacentDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of adjacentDirs) {
      const r = seat.row + dr;
      const c = seat.col + dc;
      const neighbor = currentSeats.find(s => s.row === r && s.col === c && s.status === 'occupied');
      
      if (neighbor && neighbor.studentId) {
        const neighborStudent = students.find(s => s.id === neighbor.studentId);
        if (neighborStudent && neighborStudent.separationGroup === student.separationGroup) {
          return true; 
        }
      }
    }
    return false;
  };

  const fireConfetti = () => {
    playTadaSound();
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
    setRevealedSeats([]);

    playPopSound();

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

    frontStudents.forEach(student => {
      if (sortedSeats.length > 0) assignSeat(student, sortedSeats[0].id);
    });

    backStudents.forEach(student => {
      if (sortedSeats.length > 0) assignSeat(student, sortedSeats[sortedSeats.length - 1].id);
    });

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

    normalStudents.forEach(student => {
      if (sortedSeats.length === 0) return;

      if (student.separationGroup) {
        const candidates = shuffleArray([...sortedSeats]);
        let selectedSeat = candidates.find(seat => !checkAdjacency(seat, student, newSeats));
        
        if (selectedSeat) {
          assignSeat(student, selectedSeat.id);
        } else {
          assignSeat(student, sortedSeats[Math.floor(Math.random() * sortedSeats.length)].id);
        }
      } else {
        assignSeat(student, sortedSeats[Math.floor(Math.random() * sortedSeats.length)].id);
      }
    });

    setTimeout(() => {
      setSeats(newSeats);
      setIsAnimating(false);
      setIsCompleted(true);
      
      if (revealMode === 'all') {
        setRevealedSeats(newSeats.map(s => s.id));
        fireConfetti();
      } else {
        playPopSound();
      }
    }, 1500);
  };

  const handleSeatClick = (seatId: string) => {
    if (revealMode === 'one-by-one' && isCompleted && !revealedSeats.includes(seatId)) {
      playPopSound();
      setRevealedSeats(prev => [...prev, seatId]);
    }
  };

  const revealAllCards = () => {
    setRevealedSeats(seats.map(s => s.id));
    fireConfetti();
  };

  const getGridStyle = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${gridConfig.rows}, minmax(0, 1fr))`,
      gap: '0.75rem',
      height: '100%'
    };
  };

  const saveAsImage = async () => {
    try {
      const el = document.getElementById('seating-chart-result');
      if (el) {
        const oldRevealed = [...revealedSeats];
        setRevealedSeats(seats.map(s => s.id));
        
        setTimeout(async () => {
          const dataUrl = await toPng(el, { 
            quality: 1, 
            backgroundColor: '#f8fafc',
            pixelRatio: 2
          });
          const link = document.createElement('a');
          link.download = '자리배치표.png';
          link.href = dataUrl;
          link.click();
          
          setRevealedSeats(oldRevealed);
        }, 300);
      }
    } catch (error) {
      console.error('이미지 저장 중 오류 발생:', error);
      alert('이미지를 저장하는 중 오류가 발생했습니다. 브라우저의 인쇄 기능(PDF로 저장)을 대신 이용해 주세요.');
    }
  };

  const printChart = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 깔끔한 모던 설정 패널 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6 justify-between shadow-sm">
        <div className="flex flex-col gap-5 w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col gap-2 w-full lg:w-1/2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Settings size={16} /> 짝꿍 규칙 (선택)
              </label>
              <select 
                value={genderMix}
                onChange={(e) => setGenderMix(e.target.value as GenderMix)}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-800 font-medium w-full transition-colors cursor-pointer"
              >
                <option value="none">조건 없음 (랜덤)</option>
                <option value="boy-girl">남녀 섞어 앉기 유도</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 w-full lg:w-1/2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Eye size={16} /> 공개 모드 (선택)
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setRevealMode('all')}
                  className={`flex-1 py-3 px-3 rounded-xl border font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${revealMode === 'all' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  전체 공개
                </button>
                <button 
                  onClick={() => setRevealMode('one-by-one')}
                  className={`flex-1 py-3 px-3 rounded-xl border font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${revealMode === 'one-by-one' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  하나씩 뒤집기
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-end w-full md:w-auto">
          <button
            onClick={handlePlacement}
            disabled={isAnimating || students.length === 0}
            className={`w-full md:w-auto min-w-[180px] py-4 px-6 rounded-xl font-bold text-lg text-white transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap
              ${isAnimating ? 'bg-indigo-400 cursor-not-allowed opacity-80' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20'}`}
          >
            <Shuffle size={24} className={isAnimating ? 'animate-spin' : ''} />
            {isAnimating ? '배치 중...' : '자리 뽑기 시작!'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* 깔끔한 모던 결과 화면 (한 화면에 다 들어가도록 수정) */}
      <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-inner flex flex-col h-[85vh] min-h-[600px] relative" id="seating-chart-result">
        
        <div className="flex justify-between items-center mb-6 no-print relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-2xl text-slate-800 tracking-tight">자리 배치표</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsTeacherView(!isTeacherView)} 
              className={`px-4 py-2 font-semibold rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap ${isTeacherView ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              title="교탁 위치를 반대로 뒤집어 선생님이 보는 방향으로 바꿉니다."
            >
              <Eye size={18} />
              {isTeacherView ? '선생님 시점' : '학생 시점'}
            </button>
            {revealMode === 'one-by-one' && isCompleted && revealedSeats.length < seats.length && (
              <button onClick={revealAllCards} className="px-4 py-2 font-semibold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-colors flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 size={18} />
                전체 뒤집기
              </button>
            )}
            <button onClick={saveAsImage} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm" title="이미지로 저장">
              <Download size={20} />
            </button>
            <button onClick={printChart} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm" title="인쇄">
              <Printer size={20} />
            </button>
          </div>
        </div>

        {/* 학생 시점 교탁 (위) */}
        {!isTeacherView && (
          <div className="flex justify-center mb-6 relative z-10 shrink-0">
            <div className="w-1/2 md:w-1/3 py-3 bg-slate-800 rounded-xl shadow-md text-center text-white font-bold text-xl tracking-widest">
              교 탁
            </div>
          </div>
        )}
        
        {/* 그리드 영역 */}
        <div className="w-full relative z-10 flex-1 min-h-0" style={getGridStyle()}>
          <AnimatePresence>
            {(isTeacherView ? [...seats].reverse() : seats).map((seat) => {
              const student = students.find(s => s.id === seat.studentId);
              const isOccupied = seat.status === 'occupied' && student;
              const isRevealed = revealedSeats.includes(seat.id);

              if (seat.status === 'disabled') {
                return (
                  <div key={seat.id} className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center opacity-50">
                  </div>
                );
              }

              return (
                <div key={seat.id} className="relative w-full h-full" style={{ perspective: 1000 }}>
                  <motion.div
                    layout
                    initial={isAnimating ? { opacity: 0, scale: 0.8, y: -20 } : false}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      rotateY: isRevealed ? 0 : 180 
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20, 
                      delay: isAnimating ? Math.random() * 0.2 : 0 
                    }}
                    onClick={() => handleSeatClick(seat.id)}
                    className="w-full h-full preserve-3d cursor-pointer"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* 카드 뒷면 (프리미엄 패턴 무늬) */}
                    <div 
                      className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-400 backface-hidden ${!isRevealed ? 'pointer-events-auto hover:-translate-y-1 hover:shadow-md transition-all' : 'pointer-events-none'}`}
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)',
                        backgroundColor: '#334155',
                        backgroundImage: 'repeating-linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b), repeating-linear-gradient(45deg, #1e293b 25%, #334155 25%, #334155 75%, #1e293b 75%, #1e293b)',
                        backgroundPosition: '0 0, 10px 10px',
                        backgroundSize: '20px 20px'
                      }}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 border border-slate-500 rounded-full flex items-center justify-center shadow-inner z-10">
                        <span className="text-lg sm:text-xl font-black text-slate-300">?</span>
                      </div>
                    </div>

                    {/* 카드 앞면 (깔끔한 이름표) */}
                    <div 
                      className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-200 backface-hidden p-1 sm:p-2
                        ${isOccupied 
                          ? 'bg-white' 
                          : 'bg-slate-100 text-slate-400'
                        }
                      `}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
                    >
                      {isOccupied ? (
                        <span className="font-bold text-[clamp(1rem,2vw,2rem)] text-slate-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                          {student.name}
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm font-medium">빈 자리</span>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 선생님 시점 교탁 (아래) */}
        {isTeacherView && (
          <div className="flex justify-center mt-6 relative z-10 shrink-0">
            <div className="w-1/2 md:w-1/3 py-3 bg-slate-800 rounded-xl shadow-md text-center text-white font-bold text-xl tracking-widest">
              교 탁
            </div>
          </div>
        )}
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
        }
      `}</style>
    </div>
  );
}
