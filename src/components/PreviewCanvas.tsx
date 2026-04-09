import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Maximize2, Minimize2, Grid, Type, Download } from 'lucide-react';

export default function PreviewCanvas() {
  const { 
    pixelatedData, 
    targetWidth, 
    targetHeight, 
    showGrid, 
    setShowGrid, 
    showCodes, 
    setShowCodes 
  } = useAppStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Render the pixel data onto the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixelatedData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || pixelatedData.length === 0) return;

    // Define bead size for drawing
    const beadSize = 20; 

    // Set canvas dimension based on actual data bounds instead of target settings
    // to support transparent/irregular bounding boxes
    const maxX = Math.max(...pixelatedData.map(p => p.x));
    const maxY = Math.max(...pixelatedData.map(p => p.y));
    
    // We only render what exists in pixelatedData (which ignores transparent pixels)
    // Add +1 because indices are 0-based
    canvas.width = (maxX + 1) * beadSize;
    canvas.height = (maxY + 1) * beadSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // First draw Grid (if enabled) so it appears behind the beads
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= maxX; x++) {
        for (let y = 0; y <= maxY; y++) {
          ctx.strokeRect(x * beadSize, y * beadSize, beadSize, beadSize);
        }
      }
    }

    pixelatedData.forEach(({ color, x, y }) => {
      const px = x * beadSize;
      const py = y * beadSize;

      // Draw bead
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      // Make it look slightly like a bead (circle with a small hole)
      ctx.arc(px + beadSize / 2, py + beadSize / 2, beadSize / 2 - 1, 0, Math.PI * 2);
      ctx.fill();

      // Optional: Draw a small hole in the middle to simulate Perler beads
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(px + beadSize / 2, py + beadSize / 2, beadSize / 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw Grid
      // We moved this up so grid is behind.

      // Draw color code
      if (showCodes) {
        ctx.fillStyle = getContrastColor(color.r, color.g, color.b);
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.code, px + beadSize / 2, py + beadSize / 2);
      }
    });

  }, [pixelatedData, targetWidth, targetHeight, showGrid, showCodes]);

  // Handle zoom
  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.2));

  // Download functionality
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `perler-pattern-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Helper for contrast text color
  const getContrastColor = (r: number, g: number, b: number) => {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 relative rounded-2xl overflow-hidden group">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-zinc-200 shadow-sm rounded-full px-3 py-1.5 lg:px-4 lg:py-2 flex items-center gap-2 lg:gap-4 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-md lg:shadow-sm w-[max-content]">
        <button 
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-full transition-colors ${showGrid ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100 text-zinc-600'}`}
          title="切换网格"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setShowCodes(!showCodes)}
          className={`p-2 rounded-full transition-colors ${showCodes ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100 text-zinc-600'}`}
          title="切换色号"
        >
          <Type className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <button onClick={handleZoomOut} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors" title="缩小">
          <Minimize2 className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-zinc-500 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors" title="放大">
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <button onClick={handleDownload} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors" title="下载图纸">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-10 custom-scrollbar relative bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgA2NjY/wPZhPVI0bCqH4UDeMQHQQA96QIQ3R8/BwAAAABJRU5ErkJggg==')] bg-repeat"
      >
        {pixelatedData ? (
          <div 
            className="transition-transform origin-center shadow-2xl rounded-sm bg-white"
            style={{ transform: `scale(${scale})` }}
          >
            <canvas ref={canvasRef} className="block max-w-none" />
          </div>
        ) : (
          <div className="text-zinc-400 flex flex-col items-center gap-3 bg-white/80 backdrop-blur px-8 py-6 rounded-2xl border border-zinc-200 shadow-sm">
            <span className="text-4xl">🎨</span>
            <p className="font-medium">请先在左侧上传并生成图纸</p>
          </div>
        )}
      </div>
    </div>
  );
}
