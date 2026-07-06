import React, { useState } from 'react';
import { Users, Grid3X3, Shuffle } from 'lucide-react';
import type { Student, GridConfig, Seat } from './types';

import StudentList from './components/StudentList';
import GridSetup from './components/GridSetup';
import PlacementEngine from './components/PlacementEngine';

function App() {
  const [activeTab, setActiveTab] = useState<'students' | 'grid' | 'placement'>('students');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({ rows: 5, cols: 5 });
  const [seats, setSeats] = useState<Seat[]>([]);

  return (
    <div className="min-h-screen bg-[#f5f0e6]">
      {/* Header */}
      <header className="bg-[#8b5a2b] text-white py-6 shadow-md border-b-8 border-[#5c3a21]">
        <div className="container mx-auto px-4 max-w-5xl flex items-center gap-3">
          <div className="bg-[#f5f0e6] p-2 rounded-lg text-[#8b5a2b] shadow-inner">
            <Users size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight font-['Comic_Sans_MS',sans-serif]">우당탕탕 자리뽑기! 🎲</h1>
            <p className="text-[#f5f0e6] opacity-90 text-sm mt-1 font-medium">우리 반 맞춤형 스마트 자리 배치 시스템</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-3xl shadow-xl border border-[#e5d9c5] p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row border-b-2 border-[#e5d9c5] mb-8">
            <TabButton 
              id="students" 
              label="1. 명단 입력" 
              icon={<Users size={20} />} 
              isActive={activeTab === 'students'} 
              onClick={() => setActiveTab('students')} 
            />
            <TabButton 
              id="grid" 
              label="2. 교실 설정" 
              icon={<Grid3X3 size={20} />} 
              isActive={activeTab === 'grid'} 
              onClick={() => setActiveTab('grid')} 
            />
            <TabButton 
              id="placement" 
              label="3. 자리 뽑기" 
              icon={<Shuffle size={20} />} 
              isActive={activeTab === 'placement'} 
              onClick={() => setActiveTab('placement')} 
            />
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'students' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-amber-900 flex items-center gap-2">
                  <Users className="text-amber-600" />
                  학생 명단 및 특이사항 입력
                </h2>
                <StudentList students={students} setStudents={setStudents} />
              </div>
            )}
            
            {activeTab === 'grid' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-amber-900 flex items-center gap-2">
                  <Grid3X3 className="text-amber-600" />
                  교실 구조 및 빈자리 설정
                </h2>
                <GridSetup 
                  gridConfig={gridConfig} 
                  setGridConfig={setGridConfig} 
                  seats={seats} 
                  setSeats={setSeats} 
                />
              </div>
            )}

            {activeTab === 'placement' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-amber-900 flex items-center gap-2">
                  <Shuffle className="text-amber-600" />
                  스마트 자리 배치
                </h2>
                <PlacementEngine 
                  students={students} 
                  seats={seats} 
                  setSeats={setSeats} 
                  gridConfig={gridConfig} 
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ id, label, icon, isActive, onClick }: { id: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-lg font-bold transition-all border-b-4 ${
        isActive 
          ? 'text-amber-700 border-amber-600 bg-amber-50 rounded-t-2xl' 
          : 'text-slate-500 border-transparent hover:text-amber-600 hover:bg-amber-50/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
