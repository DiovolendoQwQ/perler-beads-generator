import { palettes } from '../data/palettes';

// Simple weighted RGB distance for perceptual color matching
export function getClosestColor(r: number, g: number, b: number, palette: any[]) {
  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const color of palette) {
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;

    // Weighted Euclidean distance (approximation for human perception)
    // Weights: Red: 30%, Green: 59%, Blue: 11%
    const distance = Math.sqrt(
      (0.3 * dr * dr) +
      (0.59 * dg * dg) +
      (0.11 * db * db)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}
