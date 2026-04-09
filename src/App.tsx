import { useState } from 'react';
import Workspace from './components/Workspace';

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <h1 className="text-xl font-bold tracking-tight text-zinc-800">拼豆教程生成器</h1>
        </div>
        <div className="text-sm text-zinc-500 font-medium px-3 py-1 bg-zinc-100 rounded-full">
          Perler Bead Generator
        </div>
      </header>
      
      <main className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-73px)]">
        <Workspace />
      </main>
    </div>
  );
}

export default App;
