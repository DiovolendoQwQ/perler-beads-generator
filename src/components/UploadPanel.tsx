import React, { useRef, ChangeEvent, useState } from 'react';
import { Upload, Settings2, Image as ImageIcon, Grid3X3, Palette, Type, Maximize, Sparkles, Wand2, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { palettes } from '../data/palettes';
import { processImage } from '../utils/imageProcessor';

export default function UploadPanel() {
  const { 
    originalImage, 
    setOriginalImage,
    setTargetWidth,
    setTargetHeight,
    scalePercentage,
    setScalePercentage,
    useDithering,
    setUseDithering,
    showCodes,
    setShowCodes,
    selectedBrand, 
    setSelectedBrand,
    setPixelatedData,
    setBeadCounts,
    isCartoonizing,
    setIsCartoonizing,
    cartoonizeProgress,
    setCartoonizeProgress,
    cartoonizeStatus,
    setCartoonizeStatus
  } = useAppStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setPixelatedData(null); // Reset when new image uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFastCartoonize = async () => {
    if (!originalImage || isCartoonizing) return;
    setIsCartoonizing(true);
    setCartoonizeStatus('快速处理中...');
    
    try {
      const res = await fetch('/api/cartoonize/fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: originalImage })
      });
      const data = await res.json();
      if (data.result) {
        setOriginalImage(data.result);
        
        // Auto process the image to show updated preview
        const currentPalette = palettes[selectedBrand] || palettes['Mard'];
        const result = await processImage(data.result, scalePercentage, useDithering, currentPalette);
        if (result) {
          setPixelatedData(result.pixels);
          setBeadCounts(result.counts);
          setTargetWidth(result.width);
          setTargetHeight(result.height);
        }
      }
    } catch (err) {
      console.error(err);
      alert('极速版请求失败');
    } finally {
      setIsCartoonizing(false);
      setCartoonizeStatus('');
    }
  };

  const handleHighQualityCartoonize = async () => {
    if (!originalImage || isCartoonizing) return;
    setIsCartoonizing(true);
    setCartoonizeProgress(0);
    setCartoonizeStatus('排队中...');

    try {
      const res = await fetch('/api/cartoonize/high-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: originalImage })
      });
      const data = await res.json();
      const taskId = data.task_id;

      if (taskId) {
        pollTaskStatus(taskId);
      }
    } catch (err) {
      console.error(err);
      alert('高清版请求失败');
      setIsCartoonizing(false);
      setCartoonizeStatus('');
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      
      setCartoonizeStatus(data.status === 'PROCESSING' ? '生成中...' : '排队中...');
      setCartoonizeProgress(data.progress || 0);

      if (data.status === 'COMPLETED') {
        if (data.result) {
          setOriginalImage(data.result);
          
          // Auto process the image to show updated preview
          const currentPalette = palettes[selectedBrand] || palettes['Mard'];
          const result = await processImage(data.result, scalePercentage, useDithering, currentPalette);
          if (result) {
            setPixelatedData(result.pixels);
            setBeadCounts(result.counts);
            setTargetWidth(result.width);
            setTargetHeight(result.height);
          }
        }
        setIsCartoonizing(false);
        setCartoonizeStatus('');
        setCartoonizeProgress(0);
      } else if (data.status === 'FAILED') {
        alert('处理失败');
        setIsCartoonizing(false);
        setCartoonizeStatus('');
      } else {
        // Poll again after 1s
        setTimeout(() => pollTaskStatus(taskId), 1000);
      }
    } catch (err) {
      console.error(err);
      alert('轮询进度失败');
      setIsCartoonizing(false);
      setCartoonizeStatus('');
    }
  };

  const handleProcess = async () => {
    if (!originalImage || isCartoonizing) return;
    const currentPalette = palettes[selectedBrand] || palettes['Mard'];
    
    const result = await processImage(originalImage, scalePercentage, useDithering, currentPalette);
    if (result) {
      setPixelatedData(result.pixels);
      setBeadCounts(result.counts);
      setTargetWidth(result.width);
      setTargetHeight(result.height);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 lg:p-5 flex flex-col gap-4 lg:gap-6 shrink-0">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-zinc-500" />
          控制面板
        </h2>
        
        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-zinc-50 transition-colors group"
        >
          <div className="p-3 bg-zinc-100 rounded-full group-hover:scale-110 transition-transform">
            {originalImage ? (
              <img src={originalImage} alt="preview" className="w-8 h-8 object-cover rounded-md" />
            ) : (
              <Upload className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-700">
              {originalImage ? '点击更换图片' : '点击或拖拽上传图片'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">支持 JPG, PNG 格式</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
          />
        </div>

        {/* Cartoonize Styles Area */}
        {originalImage && (
          <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
            <h3 className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4" /> 图像动漫化前置处理
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={handleFastCartoonize}
                disabled={isCartoonizing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg text-sm font-medium text-zinc-700 transition-colors disabled:opacity-50"
                title="极速动漫化 (GAN)，约需 1 秒"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                快速动漫化
              </button>
              
              <button 
                onClick={handleHighQualityCartoonize}
                disabled={isCartoonizing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                title="精细插画化 (Diffusion)，需排队，画质极高"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
                精细插画化
              </button>
            </div>

            {/* Progress Bar for High Quality Cartoonize */}
            {isCartoonizing && cartoonizeStatus && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                  <span>{cartoonizeStatus}</span>
                  {cartoonizeProgress > 0 && <span>{cartoonizeProgress}%</span>}
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-zinc-900 h-1.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${cartoonizeProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Area */}
      <div className="flex flex-col gap-4">
        {/* Scale Percentage */}
        <div className="space-y-2">
          <label className="flex justify-between items-center text-sm font-medium text-zinc-700">
            <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4" /> 原图缩放比例</span>
            <span className="text-xs text-zinc-500">{scalePercentage}%</span>
          </label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={scalePercentage} 
            onChange={(e) => setScalePercentage(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-600"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>1%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Show Codes Toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <Type className="w-4 h-4" /> 图纸标码
          </label>
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setShowCodes(true)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${showCodes ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              有标码
            </button>
            <button
              onClick={() => setShowCodes(false)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!showCodes ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              无标码
            </button>
          </div>
        </div>

        {/* Dithering Toggle */}
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-1.5 text-sm font-medium text-zinc-700">
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> 增强色彩细节 (抖动)</span>
          </label>
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setUseDithering(true)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${useDithering ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              title="使用抖动算法（Dithering）来模拟缺失的颜色，更适合颜色复杂的原图"
            >
              开启
            </button>
            <button
              onClick={() => setUseDithering(false)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!useDithering ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              title="使用纯色块，适合对比度高、大色块的原图"
            >
              关闭
            </button>
          </div>
        </div>

        {/* Brand Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <Palette className="w-4 h-4" /> 拼豆色卡品牌
          </label>
          <select 
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {Object.keys(palettes).map((brand) => (
              <option key={brand} value={brand}>{brand} ({palettes[brand].length} 色)</option>
            ))}
          </select>
        </div>
      </div>

      <button 
        onClick={handleProcess}
        disabled={!originalImage || isCartoonizing}
        className="w-full py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <ImageIcon className="w-4 h-4" />
        生成拼豆图纸
      </button>
    </div>
  );
}
