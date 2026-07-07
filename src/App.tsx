import React, { useState } from 'react';
import { Users, Grid3X3, Shuffle } from 'lucide-react';
import type { Student, GridConfig, Seat } from './types';

import StudentList from './components/StudentList';
import GridSetup from './components/GridSetup';
import PlacementEngine from './components/PlacementEngine';

type TabId = 'students' | 'grid' | 'placement';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('students');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({ rows: 5, cols: 5 });
  const [seats, setSeats] = useState<Seat[]>([]);

  const tabs: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode; emoji: string }[] = [
    { id: 'students', label: '명단 입력', shortLabel: '명단', icon: <Users size={20} />, emoji: '👥' },
    { id: 'grid', label: '교실 설정', shortLabel: '교실', icon: <Grid3X3 size={20} />, emoji: '🏫' },
    { id: 'placement', label: '자리 뽑기', shortLabel: '뽑기', icon: <Shuffle size={20} />, emoji: '🎲' },
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      
      {/* ===== 히어로 헤더 ===== */}
      <header className="relative overflow-hidden" style={{ minHeight: '200px' }}>
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/hero_classroom.png)' }}
        />
        {/* 오버레이 그라디언트 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.82) 0%, rgba(251,146,60,0.75) 40%, rgba(244,63,94,0.65) 100%)',
          }}
        />
        {/* 헤더 콘텐츠 */}
        <div className="relative z-10 container mx-auto px-4 max-w-5xl flex items-end pb-8 pt-10 gap-4">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
            style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.4)' }}
          >
            🎲
          </div>
          <div>
            <h1
              className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
            >
              우당탕탕 자리뽑기!
            </h1>
            <p className="text-orange-100 text-sm md:text-base mt-1 font-medium drop-shadow">
              우리 반 맞춤형 스마트 자리 배치 시스템 ✨
            </p>
          </div>

          {/* 학생 수 배지 */}
          {students.length > 0 && (
            <div
              className="ml-auto text-white rounded-2xl px-4 py-2 text-center shadow-lg"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <div className="text-2xl font-black leading-none">{students.length}</div>
              <div className="text-xs font-medium text-orange-100">명 등록</div>
            </div>
          )}
        </div>
      </header>

      {/* ===== 탭 네비게이션 ===== */}
      <div
        className="sticky top-0 z-30 shadow-md"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(249,115,22,0.15)' }}
      >
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 md:py-4 px-2 text-xs md:text-base font-bold transition-all relative ${
                  activeTab === tab.id
                    ? 'text-orange-600'
                    : 'text-slate-400 hover:text-orange-400'
                }`}
              >
                <span className="text-lg md:text-base">{tab.emoji}</span>
                <span className="hidden md:inline">{idx + 1}. </span>
                <span className="md:hidden">{tab.shortLabel}</span>
                <span className="hidden md:inline">{tab.label}</span>
                {/* 활성 탭 인디케이터 */}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 메인 콘텐츠 ===== */}
      <main className="container mx-auto px-3 md:px-4 py-6 max-w-5xl">
        <div
          className="rounded-3xl p-4 md:p-8 shadow-xl"
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 40px rgba(249,115,22,0.1), 0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          {/* 섹션 타이틀 */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
            >
              {currentTab.icon}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800">
              {currentTab.label}
            </h2>
          </div>

          {/* 탭 콘텐츠 */}
          <div key={activeTab} className="animate-fade-slide-up">
            {activeTab === 'students' && (
              <StudentList students={students} setStudents={setStudents} />
            )}
            {activeTab === 'grid' && (
              <GridSetup
                gridConfig={gridConfig}
                setGridConfig={setGridConfig}
                seats={seats}
                setSeats={setSeats}
              />
            )}
            {activeTab === 'placement' && (
              <PlacementEngine
                students={students}
                seats={seats}
                setSeats={setSeats}
                gridConfig={gridConfig}
              />
            )}
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-8" />
      </main>
    </div>
  );
}

export default App;
