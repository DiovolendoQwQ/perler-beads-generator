import { useState } from 'react';
import Workspace from './components/Workspace';

function App() {
  return (
    <div className="h-screen flex flex-col bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <h1 className="text-xl font-bold tracking-tight text-zinc-800">拼豆教程生成器</h1>
        </div>
        <div className="text-xs md:text-sm text-zinc-500 font-medium px-3 py-1 bg-zinc-100 rounded-full">
          Perler Bead Generator
        </div>
      </header>
      
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-y-auto lg:overflow-hidden">
        <Workspace />
      </main>
    </div>
  );
}

export default App;
