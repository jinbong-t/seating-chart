import React, { useEffect } from 'react';
import type { GridConfig, Seat } from '../types';
import { Grid3X3, ArrowRight, ArrowDown } from 'lucide-react';

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
      gap: '0.3rem',
      flex: 1,
    };
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex-1 w-full">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Grid3X3 size={18} />
            교실 크기 설정
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <ArrowRight size={14} /> 가로 (칸 수)
              </label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={gridConfig.cols}
                onChange={(e) => setGridConfig({ ...gridConfig, cols: parseInt(e.target.value) || 1 })}
                className="w-24 px-3 py-2 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>
            <div className="text-slate-300 font-bold text-xl">X</div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <ArrowDown size={14} /> 세로 (줄 수)
              </label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={gridConfig.rows}
                onChange={(e) => setGridConfig({ ...gridConfig, rows: parseInt(e.target.value) || 1 })}
                className="w-24 px-3 py-2 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-indigo-500 mt-4 bg-indigo-100/50 p-2 rounded-lg inline-block">
            총 {gridConfig.rows * gridConfig.cols}개의 자리가 생성됩니다.
          </p>
        </div>

        <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 flex-1 w-full">
          <h3 className="font-semibold text-orange-900 mb-2">💡 사용하지 않는 자리(빈자리) 설정</h3>
          <p className="text-sm text-orange-700 mb-4">
            기둥이 있거나 교탁 앞 등, 학생이 앉지 않는 자리가 있다면 아래 표에서 <b>클릭하여 '빈자리'로 만들어주세요.</b>
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-200"></div> 사용 가능
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200 border-2 border-dashed border-slate-400"></div> 빈자리 (사용안함)
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col" style={{ height: '260px' }}>
        <div className="flex justify-center mb-2 shrink-0">
          <div className="w-1/2 py-1.5 bg-slate-100 rounded-xl border border-slate-300 text-center text-slate-500 font-semibold shadow-inner text-xs">
            칠 판
          </div>
        </div>
        
        <div className="w-full" style={getGridStyle()}>
          {seats.map((seat) => (
            <button
              key={seat.id}
              onClick={() => toggleSeatStatus(seat.id)}
              className={`
                rounded-md transition-all duration-200 flex items-center justify-center font-medium text-xs
                ${seat.status === 'available'
                  ? 'bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 shadow-sm text-indigo-700'
                  : 'bg-slate-100 border-2 border-dashed border-slate-300 opacity-60 hover:opacity-100 text-slate-400'
                }
              `}
            >
              {seat.status === 'available' ? '의자' : 'X'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


