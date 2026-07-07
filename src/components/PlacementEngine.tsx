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
        colors: ['#f97316', '#fbbf24', '#fb923c', '#f43f5e', '#a855f7', '#22c55e']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#fbbf24', '#fb923c', '#f43f5e', '#a855f7', '#22c55e']
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
        const selectedSeat = candidates.find(seat => !checkAdjacency(seat, student, newSeats));
        
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
      gap: '0.6rem',
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
            backgroundColor: '#fff7ed',
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

  const printChart = async () => {
    const el = document.getElementById('seating-chart-result');
    if (!el) return;

    // 인쇄 전에 모든 카드 공개
    const oldRevealed = [...revealedSeats];
    setRevealedSeats(seats.map(s => s.id));
    await new Promise(r => setTimeout(r, 350));

    try {
      const dataUrl = await toPng(el, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 1.5,
      });

      // 새 창에서 이미지로 인쇄 (한 장 보장)
      const w = window.open('', '_blank', 'width=900,height=650');
      if (!w) {
        alert('팝업이 차단되었습니다. 브라우저에서 팝업 허용 후 다시 시도해주세요.');
        setRevealedSeats(oldRevealed);
        return;
      }
      w.document.write(`<!DOCTYPE html><html><head>
        <title>자리 배치표</title>
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head><body>
        <img src="${dataUrl}" onload="window.print(); window.close();" />
      </body></html>`);
      w.document.close();
    } catch (e) {
      console.error('인쇄 오류:', e);
      window.print();
    } finally {
      setTimeout(() => setRevealedSeats(oldRevealed), 700);
    }
  };

  // 단일 카드 색상 (심플하게 하나로 통일)
  const CARD_COLOR = { bg: '#f3f0ff', border: '#a78bfa', text: '#5b21b6' };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ===== 설정 패널 ===== */}
      <div
        className="p-5 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', border: '1px solid #fed7aa' }}
      >
        <div className="flex flex-col lg:flex-row gap-4 mb-5">
          {/* 짝꿍 규칙 */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
              <Settings size={14} style={{ color: '#f97316' }} /> 짝꿍 규칙
            </label>
            <select
              value={genderMix}
              onChange={(e) => setGenderMix(e.target.value as GenderMix)}
              className="px-4 py-3 rounded-xl border font-semibold focus:outline-none focus:ring-2 cursor-pointer transition-all"
              style={{ borderColor: '#fed7aa', background: 'white', color: '#374151' }}
            >
              <option value="none">🎲 조건 없음 (완전 랜덤)</option>
              <option value="boy-girl">💑 남녀 섞어 앉기</option>
            </select>
          </div>

          {/* 공개 모드 */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
              <Eye size={14} style={{ color: '#f97316' }} /> 공개 방식
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRevealMode('all')}
                className="flex-1 py-3 px-4 rounded-xl border font-bold transition-all text-sm"
                style={revealMode === 'all'
                  ? { background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', borderColor: '#f97316', color: '#ea580c', boxShadow: '0 2px 8px rgba(249,115,22,0.2)' }
                  : { background: 'white', borderColor: '#e2e8f0', color: '#94a3b8' }
                }
              >
                🎊 전체 공개
              </button>
              <button
                onClick={() => setRevealMode('one-by-one')}
                className="flex-1 py-3 px-4 rounded-xl border font-bold transition-all text-sm"
                style={revealMode === 'one-by-one'
                  ? { background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', borderColor: '#f97316', color: '#ea580c', boxShadow: '0 2px 8px rgba(249,115,22,0.2)' }
                  : { background: 'white', borderColor: '#e2e8f0', color: '#94a3b8' }
                }
              >
                🃏 하나씩 뒤집기
              </button>
            </div>
          </div>
        </div>

        {/* 자리 뽑기 버튼 */}
        <button
          onClick={handlePlacement}
          disabled={isAnimating || students.length === 0}
          className="w-full py-4 rounded-2xl font-black text-xl text-white transition-all flex items-center justify-center gap-3"
          style={{
            background: isAnimating || students.length === 0
              ? '#fbb57a'
              : 'linear-gradient(135deg, #f97316, #fb923c, #f43f5e)',
            boxShadow: isAnimating || students.length === 0 ? 'none' : '0 6px 24px rgba(249,115,22,0.45)',
            transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
            cursor: isAnimating || students.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Shuffle size={26} className={isAnimating ? 'animate-spin' : ''} />
          {students.length === 0 ? '학생 명단을 먼저 입력해주세요' : isAnimating ? '자리 배치 중... 🎲' : '자리 뽑기 시작! 🎉'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div
          className="p-4 rounded-2xl font-semibold text-center flex items-center gap-2 justify-center"
          style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ===== 자리 배치표 결과 ===== */}
      <div
        className="p-4 md:p-6 rounded-3xl flex flex-col relative"
        style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #fce7f3 70%, #e0f2fe 100%)',
          border: '1px solid #ddd6fe',
          boxShadow: '0 8px 40px rgba(139,92,246,0.1), 0 2px 8px rgba(236,72,153,0.06)',
          minHeight: '600px',
          height: '80vh',
        }}
        id="seating-chart-result"
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            <h3 className="font-black text-xl text-slate-800">자리 배치표</h3>
            {isCompleted && (
              <span
                className="ml-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: '#dcfce7', color: '#16a34a' }}
              >
                ✅ 완료!
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsTeacherView(!isTeacherView)}
              className="px-3 py-2 rounded-xl border font-semibold text-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
              style={isTeacherView
                ? { background: '#fff7ed', borderColor: '#f97316', color: '#ea580c' }
                : { background: 'white', borderColor: '#e2e8f0', color: '#64748b' }
              }
            >
              <Eye size={15} />
              <span className="hidden sm:inline">{isTeacherView ? '선생님 시점' : '학생 시점'}</span>
            </button>
            {revealMode === 'one-by-one' && isCompleted && revealedSeats.length < seats.length && (
              <button
                onClick={revealAllCards}
                className="px-3 py-2 rounded-xl border font-semibold text-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
                style={{ background: '#f0fdf4', borderColor: '#22c55e', color: '#16a34a' }}
              >
                <CheckCircle2 size={15} />
                <span className="hidden sm:inline">전체 뒤집기</span>
              </button>
            )}
            <button
              onClick={saveAsImage}
              className="p-2 rounded-xl border transition-all shadow-sm"
              style={{ background: 'white', borderColor: '#e2e8f0', color: '#64748b' }}
              title="이미지로 저장"
            >
              <Download size={18} />
            </button>
            <button
              onClick={printChart}
              className="p-2 rounded-xl border transition-all shadow-sm"
              style={{ background: 'white', borderColor: '#e2e8f0', color: '#64748b' }}
              title="인쇄"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        {/* 학생 시점 칠판 */}
        {!isTeacherView && (
          <div className="flex justify-center mb-4 shrink-0">
            <div
              className="px-12 py-2.5 rounded-2xl text-white text-sm font-black tracking-widest shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)', letterSpacing: '0.2em' }}
            >
              ✦ 칠판 ✦
            </div>
          </div>
        )}

        {/* 그리드 */}
        <div className="w-full flex-1 min-h-0" style={getGridStyle()}>
          <AnimatePresence>
            {(isTeacherView ? [...seats].reverse() : seats).map((seat) => {
              const student = students.find(s => s.id === seat.studentId);
              const isOccupied = seat.status === 'occupied' && student;
              const isRevealed = revealedSeats.includes(seat.id);
              // 단일 화투 뒷면 그라디언트
              const BACK_GRAD = 'linear-gradient(135deg, #fde8ff, #e0c8ff, #c8d9ff)';

              if (seat.status === 'disabled') {
                return (
                  <div
                    key={seat.id}
                    className="w-full h-full rounded-2xl flex items-center justify-center"
                    style={{ border: '2px dashed #ddd6fe', background: 'rgba(245,243,255,0.5)', opacity: 0.5 }}
                  />
                );
              }

              return (
                <div key={seat.id} className="relative w-full h-full" style={{ perspective: 1000 }}>
                  <motion.div
                    layout
                    initial={isAnimating ? { opacity: 0, scale: 0.7, y: -24 } : false}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      rotateY: isRevealed ? 0 : 180 
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 280, 
                      damping: 22, 
                      delay: isAnimating ? Math.random() * 0.25 : 0 
                    }}
                    onClick={() => handleSeatClick(seat.id)}
                    className="w-full h-full cursor-pointer"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* ── 카드 뒷면 : 파스텔 그라디언트 ── */}
                    <div
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center shadow-md"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: BACK_GRAD,
                        border: '2px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 4px 16px rgba(139,92,246,0.18)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'clamp(1.2rem, 3.5vw, 2rem)',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                          lineHeight: 1,
                        }}
                      >
                        🎴
                      </span>
                      <span
                        style={{
                          marginTop: '4px',
                          fontSize: 'clamp(0.55rem, 1.2vw, 0.8rem)',
                          fontWeight: 800,
                          color: 'rgba(80,30,120,0.6)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        클릭!
                      </span>
                    </div>

                    {/* ── 카드 앞면 : 파스텔 이름표 ── */}
                    <div
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                        background: isOccupied ? CARD_COLOR.bg : 'rgba(245,243,255,0.6)',
                        border: `2.5px solid ${isOccupied ? CARD_COLOR.border : '#ddd6fe'}`,
                        boxShadow: isOccupied
                          ? `0 4px 16px ${CARD_COLOR.border}55, inset 0 1px 0 rgba(255,255,255,0.9)`
                          : 'none',
                        padding: '3px',
                      }}
                    >
                      {isOccupied ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            padding: '2px 3px',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span
                            style={{
                              color: CARD_COLOR.text,
                              fontWeight: 900,
                              textAlign: 'center',
                              lineHeight: 1.15,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              // 모바일 5열 기준 카드 너비에 맞게 크다임 최소값 줄임
                              fontSize: 'clamp(0.45rem, 2.5vw, 0.95rem)',
                              // 단어 중간에서 끊기지 않도록 강력 유지
                              wordBreak: 'keep-all',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                            } as React.CSSProperties}
                          >
                            {student.name}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.6rem',
                            color: '#c4b5fd',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                          }}
                        >
                          빈자리
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 선생님 시점 칠판 */}
        {isTeacherView && (
          <div className="flex justify-center mt-4 shrink-0">
            <div
              className="px-12 py-2.5 rounded-2xl text-white text-sm font-black tracking-widest shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)', letterSpacing: '0.2em' }}
            >
              ✦ 칠판 ✦
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @page {
          size: A4 landscape;
          margin: 5mm;
        }
        @media print {
          /* 모든 요소 숨기기 */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            background: white !important;
          }
          body > * {
            display: none !important;
          }
          /* 오직 #root 안의 포커스 요소만 표시 */
          body > #root {
            display: block !important;
          }
          /* 자리 배치표 영역만 보이게 */
          #seating-chart-result {
            display: flex !important;
            flex-direction: column !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 10px !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            /* 내용이 넘치면 페이지에 맞게 축소 */
            zoom: 1;
          }
          /* 그리드 컨테이너 - 렬더 포진 콨 */
          #seating-chart-result > div.w-full.flex-1 {
            flex: 1 1 0% !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
