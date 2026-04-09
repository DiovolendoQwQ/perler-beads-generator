import React from 'react';
import UploadPanel from './UploadPanel';
import PreviewCanvas from './PreviewCanvas';
import MaterialStats from './MaterialStats';

export default function Workspace() {
  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel: Controls */}
      <div className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pb-4 pr-2 custom-scrollbar">
        <UploadPanel />
        <MaterialStats />
      </div>
      
      {/* Right Panel: Preview */}
      <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
        <PreviewCanvas />
      </div>
    </div>
  );
}
