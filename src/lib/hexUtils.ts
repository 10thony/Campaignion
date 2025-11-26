/**
 * Hexagon grid utilities for pointy-top hexagonal tiles
 * Uses offset coordinates (standard x, y grid coordinates)
 */

/**
 * Calculate the pixel position for a hexagon center given its grid coordinates
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @param size - Hexagon size (distance from center to vertex, similar to cellSize/2)
 */
export function hexToPixel(x: number, y: number, size: number): { x: number; y: number } {
  // For pointy-top hexagons with offset coordinates
  const hexWidth = size * Math.sqrt(3);
  const hexHeight = size * 2;
  
  const pixelX = x * hexWidth + (y % 2 === 1 ? hexWidth / 2 : 0);
  const pixelY = y * (hexHeight * 0.75);
  
  return { x: pixelX, y: pixelY };
}

/**
 * Convert pixel coordinates to hexagon grid coordinates
 * @param pixelX - Pixel X coordinate
 * @param pixelY - Pixel Y coordinate
 * @param size - Hexagon size
 */
export function pixelToHex(pixelX: number, pixelY: number, size: number): { x: number; y: number } {
  const hexWidth = size * Math.sqrt(3);
  const hexHeight = size * 2;
  
  // Approximate which row we're in
  const approxY = Math.round(pixelY / (hexHeight * 0.75));
  
  // Calculate X based on row (odd rows are offset)
  let approxX = Math.round(pixelX / hexWidth);
  if (approxY % 2 === 1) {
    approxX = Math.round((pixelX - hexWidth / 2) / hexWidth);
  }
  
  // Refine by checking distances to nearby hexes
  let bestHex = { x: approxX, y: approxY };
  let minDist = Infinity;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const testHex = { x: approxX + dx, y: approxY + dy };
      const testPixel = hexToPixel(testHex.x, testHex.y, size);
      const dist = Math.sqrt((pixelX - testPixel.x) ** 2 + (pixelY - testPixel.y) ** 2);
      
      if (dist < minDist) {
        minDist = dist;
        bestHex = testHex;
      }
    }
  }
  
  return bestHex;
}

/**
 * Calculate hexagon distance (not Manhattan distance)
 * For hex grids, we use a different distance calculation
 */
export function hexDistance(x1: number, y1: number, x2: number, y2: number): number {
  // Convert offset coordinates to cube coordinates for distance calculation
  const cube1 = offsetToCube(x1, y1);
  const cube2 = offsetToCube(x2, y2);
  return cubeDistance(cube1, cube2);
}

/**
 * Convert offset coordinates to cube coordinates
 */
function offsetToCube(x: number, y: number): { q: number; r: number; s: number } {
  const q = x;
  const r = y - (x - (x % 2)) / 2;
  const s = -q - r;
  return { q, r, s };
}

/**
 * Calculate distance in cube coordinates
 */
function cubeDistance(a: { q: number; r: number; s: number }, b: { q: number; r: number; s: number }): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
}

/**
 * Get all hexagons within a certain distance from a center hex
 */
export function getHexesInRange(centerX: number, centerY: number, range: number, maxCols: number, maxRows: number): Array<{ x: number; y: number }> {
  const hexes: Array<{ x: number; y: number }> = [];
  
  for (let y = Math.max(0, centerY - range); y <= Math.min(maxRows - 1, centerY + range); y++) {
    for (let x = Math.max(0, centerX - range); x <= Math.min(maxCols - 1, centerX + range); x++) {
      if (hexDistance(centerX, centerY, x, y) <= range) {
        hexes.push({ x, y });
      }
    }
  }
  
  return hexes;
}

/**
 * Generate SVG path for a hexagon shape (pointy-top)
 */
export function getHexagonPath(size: number): string {
  const vertices: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start at top (pointy-top)
    vertices.push({
      x: size * Math.cos(angle),
      y: size * Math.sin(angle)
    });
  }
  
  return `M ${vertices.map(v => `${v.x},${v.y}`).join(' L ')} Z`;
}

/**
 * Generate CSS clip-path polygon for a hexagon (better browser support)
 * Returns percentage coordinates centered at 50%, 50%
 */
export function getHexagonClipPath(size: number): string {
  const vertices: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start at top (pointy-top)
    // Convert to percentage coordinates (50% center, 50% radius)
    const xPercent = 50 + 50 * Math.cos(angle);
    const yPercent = 50 + 50 * Math.sin(angle);
    vertices.push({
      x: xPercent,
      y: yPercent
    });
  }
  
  // Return as percentage-based polygon for clip-path
  return `polygon(${vertices.map(v => `${v.x}% ${v.y}%`).join(', ')})`;
}

/**
 * Get the bounding box dimensions for a hex grid
 */
export function getHexGridDimensions(cols: number, rows: number, size: number): { width: number; height: number } {
  const hexWidth = size * Math.sqrt(3);
  const hexHeight = size * 2;
  
  const width = cols * hexWidth + (rows > 0 && rows % 2 === 1 ? hexWidth / 2 : 0);
  const height = rows * (hexHeight * 0.75) + size * 0.25;
  
  return { width, height };
}
