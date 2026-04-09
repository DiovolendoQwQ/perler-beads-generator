import { getClosestColor } from './colorMatcher';

export const processImage = async (
  imageUrl: string,
  scalePercentage: number,
  useDithering: boolean,
  palette: any[]
): Promise<{ pixels: any[]; counts: Record<string, number>, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      let tWidth = Math.max(1, Math.round(img.width * (scalePercentage / 100)));
      let tHeight = Math.max(1, Math.round(img.height * (scalePercentage / 100)));
      
      // Safety cap to prevent browser crash on extremely large images (max ~300x300 beads)
      const MAX_DIM = 300;
      if (tWidth > MAX_DIM || tHeight > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / tWidth, MAX_DIM / tHeight);
        tWidth = Math.max(1, Math.round(tWidth * ratio));
        tHeight = Math.max(1, Math.round(tHeight * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = tWidth;
      canvas.height = tHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw image scaled down to target dimensions
      ctx.drawImage(img, 0, 0, tWidth, tHeight);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, tWidth, tHeight);
      const data = imageData.data;
      
      const pixels = [];
      const counts: Record<string, number> = {};

      for (let y = 0; y < tHeight; y++) {
        for (let x = 0; x < tWidth; x++) {
          const index = (y * tWidth + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          // Ignore highly transparent pixels
          if (a < 128) continue;

          const closestColor = getClosestColor(r, g, b, palette);
          
          if (useDithering) {
            // Floyd-Steinberg Dithering error calculation
            const errR = r - closestColor.r;
            const errG = g - closestColor.g;
            const errB = b - closestColor.b;

            // Distribute error to neighboring pixels
            const distributeError = (dx: number, dy: number, weight: number) => {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < tWidth && ny >= 0 && ny < tHeight) {
                const nIndex = (ny * tWidth + nx) * 4;
                data[nIndex] = Math.min(255, Math.max(0, data[nIndex] + errR * weight));
                data[nIndex + 1] = Math.min(255, Math.max(0, data[nIndex + 1] + errG * weight));
                data[nIndex + 2] = Math.min(255, Math.max(0, data[nIndex + 2] + errB * weight));
              }
            };

            distributeError(1, 0, 7/16);
            distributeError(-1, 1, 3/16);
            distributeError(0, 1, 5/16);
            distributeError(1, 1, 1/16);
          }
          
          pixels.push({
            x,
            y,
            color: closestColor
          });

          counts[closestColor.code] = (counts[closestColor.code] || 0) + 1;
        }
      }

      resolve({ pixels, counts, width: tWidth, height: tHeight });
    };

    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = imageUrl;
  });
};
