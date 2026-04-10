import { create } from 'zustand';

interface PaletteColor {
  code: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

interface AppState {
  originalImage: string | null;
  targetWidth: number;
  targetHeight: number;
  scalePercentage: number;
  useDithering: boolean;
  selectedBrand: string;
  pixelatedData: { color: PaletteColor; x: number; y: number }[] | null;
  beadCounts: Record<string, number>;
  showGrid: boolean;
  showCodes: boolean;
  
  // Cartoonization state
  isCartoonizing: boolean;
  cartoonizeProgress: number;
  cartoonizeStatus: string;
  
  setOriginalImage: (url: string | null) => void;
  setTargetWidth: (width: number) => void;
  setTargetHeight: (height: number) => void;
  setScalePercentage: (scale: number) => void;
  setUseDithering: (dithering: boolean) => void;
  setSelectedBrand: (brand: string) => void;
  setPixelatedData: (data: { color: PaletteColor; x: number; y: number }[] | null) => void;
  setBeadCounts: (counts: Record<string, number>) => void;
  setShowGrid: (show: boolean) => void;
  setShowCodes: (show: boolean) => void;
  
  setIsCartoonizing: (isCartoonizing: boolean) => void;
  setCartoonizeProgress: (progress: number) => void;
  setCartoonizeStatus: (status: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  originalImage: null,
  targetWidth: 50,
  targetHeight: 50,
  scalePercentage: 10,
  useDithering: false,
  selectedBrand: 'Mard',
  pixelatedData: null,
  beadCounts: {},
  showGrid: true,
  showCodes: true,
  isCartoonizing: false,
  cartoonizeProgress: 0,
  cartoonizeStatus: '',
  
  setOriginalImage: (url) => set({ originalImage: url }),
  setTargetWidth: (width) => set({ targetWidth: width }),
  setTargetHeight: (height) => set({ targetHeight: height }),
  setScalePercentage: (scale) => set({ scalePercentage: scale }),
  setUseDithering: (dithering) => set({ useDithering: dithering }),
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  setPixelatedData: (data) => set({ pixelatedData: data }),
  setBeadCounts: (counts) => set({ beadCounts: counts }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowCodes: (show) => set({ showCodes: show }),
  
  setIsCartoonizing: (isCartoonizing) => set({ isCartoonizing }),
  setCartoonizeProgress: (progress) => set({ cartoonizeProgress: progress }),
  setCartoonizeStatus: (status) => set({ cartoonizeStatus: status }),
}));
