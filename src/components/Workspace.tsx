import React from 'react';
import UploadPanel from './UploadPanel';
import PreviewCanvas from './PreviewCanvas';
import MaterialStats from './MaterialStats';

export default function Workspace() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-full">
      {/* Left Panel: Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4 lg:gap-6 shrink-0 lg:h-full lg:overflow-hidden pb-2 lg:pb-0 pr-1 lg:pr-2 custom-scrollbar">
        <UploadPanel />
        <MaterialStats />
      </div>
      
      {/* Right Panel: Preview */}
      <div className="flex-1 min-h-[500px] lg:min-h-0 bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
        <PreviewCanvas />
      </div>
    </div>
  );
}
