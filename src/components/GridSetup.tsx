import React, { useEffect } from 'react';
import type { GridConfig, Seat } from '../types';
import { ArrowRight, ArrowDown, Info } from 'lucide-react';

interface Props {
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  seats: Seat[];
  setSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
}

export default function GridSetup({ gridConfig, setGridConfig, seats, setSeats }: Props) {
  // 그리드 설정이 바뀔 때마다 좌석 배열 초기화
  useEffect(() => {
    const newSeats: Seat[] = [];
    for (let r = 0; r < gridConfig.rows; r++) {
      for (let c = 0; c < gridConfig.cols; c++) {
        const existingSeat = seats.find(s => s.row === r && s.col === c);
        newSeats.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          status: existingSeat ? existingSeat.status : 'available'
        });
      }
    }
    setSeats(newSeats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridConfig.rows, gridConfig.cols]);

  const toggleSeatStatus = (id: string) => {
    setSeats(seats.map(seat => {
      if (seat.id === id) {
        return { ...seat, status: seat.status === 'available' ? 'disabled' : 'available' };
      }
      return seat;
    }));
  };

  const getGridStyle = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${gridConfig.rows}, minmax(0, 1fr))`,
      gap: '0.35rem',
      flex: 1,
    };
  };

  const disabledCount = seats.filter(s => s.status === 'disabled').length;
  const availableCount = seats.filter(s => s.status === 'available').length;

  return (
    <div className="flex flex-col gap-6">
      
      {/* ===== 설정 카드들 ===== */}
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* 교실 크기 */}
        <div
          className="flex-1 p-5 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', border: '1px solid #fed7aa' }}
        >
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-base">
            <span className="text-xl">📐</span> 교실 크기 설정
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <ArrowRight size={12} /> 가로 (열 수)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={gridConfig.cols}
                onChange={(e) => setGridConfig({ ...gridConfig, cols: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 rounded-xl border text-center font-bold text-lg focus:outline-none focus:ring-2"
                style={{ borderColor: '#fed7aa', background: 'white', color: '#ea580c' }}
              />
            </div>
            <div className="text-2xl font-black text-orange-300 mt-4">×</div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <ArrowDown size={12} /> 세로 (행 수)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={gridConfig.rows}
                onChange={(e) => setGridConfig({ ...gridConfig, rows: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 rounded-xl border text-center font-bold text-lg focus:outline-none focus:ring-2"
                style={{ borderColor: '#fed7aa', background: 'white', color: '#ea580c' }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}
            >
              ✅ 사용 가능: {availableCount}자리
            </span>
            {disabledCount > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
              >
                ❌ 빈자리: {disabledCount}개
              </span>
            )}
          </div>
        </div>

        {/* 빈자리 안내 */}
        <div
          className="flex-1 p-5 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #fef3c7, #ffe4e6)', border: '1px solid #fde68a' }}
        >
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-base">
            <span className="text-xl">🚫</span> 빈자리 설정
          </h3>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            학생이 앉지 않는 자리(기둥, 교탁 앞 등)는<br />
            아래 표에서 <b className="text-orange-600">클릭</b>해서 비활성화 하세요!
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg shadow-sm"
                style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', border: '2px solid #f97316' }}
              />
              <span className="text-slate-600">사용 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg"
                style={{ background: '#f1f5f9', border: '2px dashed #cbd5e1' }}
              />
              <span className="text-slate-400">빈자리</span>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <span>한 번 클릭 = 비활성화, 다시 클릭 = 활성화</span>
          </div>
        </div>
      </div>

      {/* ===== 교실 미리보기 ===== */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: 'white', border: '1px solid #fed7aa', boxShadow: '0 2px 12px rgba(249,115,22,0.07)' }}
      >
        {/* 칠판 */}
        <div className="flex justify-center mb-4">
          <div
            className="px-12 py-2 rounded-xl text-white text-sm font-bold tracking-widest shadow-md"
            style={{ background: 'linear-gradient(135deg, #3d5a30, #4a6741)' }}
          >
            칠 판
          </div>
        </div>

        {/* 좌석 그리드 */}
        <div style={{ ...getGridStyle(), height: `${Math.max(160, gridConfig.rows * 46)}px` }}>
          {seats.map((seat) => (
            <button
              key={seat.id}
              onClick={() => toggleSeatStatus(seat.id)}
              title={seat.status === 'available' ? '클릭하면 빈자리로 설정' : '클릭하면 활성화'}
              className="rounded-lg transition-all duration-200 flex items-center justify-center font-bold text-xs"
              style={seat.status === 'available' ? {
                background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
                border: '2px solid #f97316',
                color: '#ea580c',
                boxShadow: '0 1px 4px rgba(249,115,22,0.15)',
              } : {
                background: '#f8fafc',
                border: '2px dashed #cbd5e1',
                color: '#94a3b8',
                opacity: 0.6,
              }}
            >
              {seat.status === 'available' ? '🪑' : '✕'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
