import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock DOMMatrix for PDF.js compatibility
global.DOMMatrix = vi.fn().mockImplementation(() => ({
  a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
  m11: 1, m12: 0, m21: 0, m22: 1, m31: 0, m32: 0, m33: 1, m34: 0, m41: 0, m42: 0, m43: 0, m44: 1,
  is2D: true,
  isIdentity: true,
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  rotateFromVector: vi.fn(),
  flipX: vi.fn(),
  flipY: vi.fn(),
  skewX: vi.fn(),
  skewY: vi.fn(),
  multiply: vi.fn(),
  inverse: vi.fn(),
}));

// Mock CanvasRenderingContext2D for PDF.js
global.CanvasRenderingContext2D = vi.fn().mockImplementation(() => ({
  canvas: null,
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  createLinearGradient: vi.fn(),
  createRadialGradient: vi.fn(),
  createPattern: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  arcTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  drawFocusIfNeeded: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(),
  isPointInStroke: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0, fontBoundingBoxAscent: 0, fontBoundingBoxDescent: 0, emHeightAscent: 0, emHeightDescent: 0, hangingBaseline: 0, alphabeticBaseline: 0, ideographicBaseline: 0 })),
  drawImage: vi.fn(),
  createImageData: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  getContextAttributes: vi.fn(() => ({ alpha: true, colorSpace: 'srgb', desynchronized: false, willReadFrequently: false })),
}));