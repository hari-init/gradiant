/**
 * Gradient Wallpaper Engine
 * Generates beautiful gradient textures using Canvas API
 */

// Simple Perlin-ish noise for organic distortion
function createNoiseGrid(width, height, scale) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = Math.random();
    }
  }
  return grid;
}

function smoothNoise(grid, x, y, width, height) {
  const ix = Math.floor(x) % width;
  const iy = Math.floor(y) % height;
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);

  const nx = (ix + 1) % width;
  const ny = (iy + 1) % height;

  const t1 = grid[iy][ix];
  const t2 = grid[iy][nx];
  const t3 = grid[ny][ix];
  const t4 = grid[ny][nx];

  const i1 = t1 + fx * (t2 - t1);
  const i2 = t3 + fx * (t4 - t3);

  return i1 + fy * (i2 - i1);
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

/**
 * Interpolate between colors
 */
function lerpColor(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t)
  };
}

/**
 * Generate the gradient wallpaper
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} colors - Array of hex color strings
 * @param {number} chaos - 0 to 100
 * @param {number} grain - 0 to 100
 * @param {number} [seed] - Optional seed for reproducibility
 */
export function generateWallpaper(canvas, colors, chaos, grain, seed) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  if (colors.length === 0) return;

  // Seed-based random
  let _seed = seed || Math.floor(Math.random() * 999999);
  function seededRandom() {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed & 0x7fffffff) / 0x7fffffff;
  }

  const rgbColors = colors.map(hexToRgb);

  // Create base gradient layer using pixel manipulation for organic feel
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  const chaosNorm = chaos / 100;
  const grainNorm = grain / 100;

  // Generate noise grids for distortion
  const noiseW = 64;
  const noiseH = 64;
  const noiseGrid1 = [];
  const noiseGrid2 = [];
  for (let y = 0; y < noiseH; y++) {
    noiseGrid1[y] = [];
    noiseGrid2[y] = [];
    for (let x = 0; x < noiseW; x++) {
      noiseGrid1[y][x] = seededRandom();
      noiseGrid2[y][x] = seededRandom();
    }
  }

  // Generate random color control points for organic gradients
  const numPoints = rgbColors.length + Math.floor(chaosNorm * rgbColors.length * 2);
  const points = [];
  for (let i = 0; i < rgbColors.length; i++) {
    // Distribute base colors
    const angle = (i / rgbColors.length) * Math.PI * 2 + seededRandom() * chaosNorm * Math.PI;
    const radius = 0.3 + seededRandom() * 0.4;
    points.push({
      x: 0.5 + Math.cos(angle) * radius * (0.5 + chaosNorm * 0.5),
      y: 0.5 + Math.sin(angle) * radius * (0.5 + chaosNorm * 0.5),
      color: rgbColors[i],
      weight: 1 + seededRandom() * chaosNorm * 2
    });
  }

  // Add chaos points (interpolated colors)
  for (let i = rgbColors.length; i < numPoints; i++) {
    const c1 = rgbColors[Math.floor(seededRandom() * rgbColors.length)];
    const c2 = rgbColors[Math.floor(seededRandom() * rgbColors.length)];
    const t = seededRandom();
    points.push({
      x: seededRandom(),
      y: seededRandom(),
      color: lerpColor(c1, c2, t),
      weight: 0.5 + seededRandom() * chaosNorm
    });
  }

  // Render pixel by pixel using inverse distance weighting
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4;

      // Normalized coordinates
      let nx = px / w;
      let ny = py / h;

      // Apply noise-based distortion for chaos
      if (chaosNorm > 0.01) {
        const noiseScale = 4;
        const nsx = nx * noiseScale;
        const nsy = ny * noiseScale;
        const distort = chaosNorm * 0.3;
        nx += (smoothNoise(noiseGrid1, nsx, nsy, noiseW, noiseH) - 0.5) * distort;
        ny += (smoothNoise(noiseGrid2, nsx, nsy, noiseW, noiseH) - 0.5) * distort;
      }

      // Inverse distance weighted color blending
      let totalWeight = 0;
      let rSum = 0, gSum = 0, bSum = 0;

      for (const point of points) {
        const dx = nx - point.x;
        const dy = ny - point.y;
        const distSq = dx * dx + dy * dy;
        const w2 = point.weight / (distSq + 0.001);
        totalWeight += w2;
        rSum += point.color.r * w2;
        gSum += point.color.g * w2;
        bSum += point.color.b * w2;
      }

      let r = rSum / totalWeight;
      let g = gSum / totalWeight;
      let b = bSum / totalWeight;

      // Add grain
      if (grainNorm > 0.01) {
        const noise = (seededRandom() - 0.5) * grainNorm * 80;
        r = Math.max(0, Math.min(255, r + noise));
        g = Math.max(0, Math.min(255, g + noise));
        b = Math.max(0, Math.min(255, b + noise));
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate a random harmonious color palette
 * @param {number} count - Number of colors to generate
 * @returns {string[]} Array of hex color strings
 */
export function generateRandomPalette(count = 5) {
  const strategies = ['analogous', 'complementary', 'triadic', 'split-complementary', 'monochromatic'];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  const baseHue = Math.random() * 360;
  const baseSat = 40 + Math.random() * 40;
  const baseLit = 30 + Math.random() * 35;

  const colors = [];

  switch (strategy) {
    case 'analogous':
      for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i - Math.floor(count / 2)) * (20 + Math.random() * 15)) % 360;
        const sat = baseSat + (Math.random() - 0.5) * 20;
        const lit = baseLit + (i - Math.floor(count / 2)) * 8 + (Math.random() - 0.5) * 10;
        colors.push(hslToHex(hue, sat, lit));
      }
      break;
    case 'complementary':
      for (let i = 0; i < count; i++) {
        const hue = i < count / 2 ? baseHue : (baseHue + 180) % 360;
        const sat = baseSat + (Math.random() - 0.5) * 20;
        const lit = baseLit + (i * 12) + (Math.random() - 0.5) * 15;
        colors.push(hslToHex(hue + (Math.random() - 0.5) * 20, sat, lit));
      }
      break;
    case 'triadic':
      for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i % 3) * 120 + (Math.random() - 0.5) * 20) % 360;
        const sat = baseSat + (Math.random() - 0.5) * 20;
        const lit = baseLit + (Math.random() - 0.5) * 25;
        colors.push(hslToHex(hue, sat, lit));
      }
      break;
    case 'split-complementary':
      for (let i = 0; i < count; i++) {
        const offsets = [0, 150, 210, 30, -30];
        const hue = (baseHue + offsets[i % offsets.length] + (Math.random() - 0.5) * 15) % 360;
        const sat = baseSat + (Math.random() - 0.5) * 20;
        const lit = baseLit + (Math.random() - 0.5) * 25;
        colors.push(hslToHex(hue, sat, lit));
      }
      break;
    case 'monochromatic':
      for (let i = 0; i < count; i++) {
        const sat = baseSat + (Math.random() - 0.5) * 15;
        const lit = 15 + (i * (60 / count)) + (Math.random() - 0.5) * 8;
        colors.push(hslToHex(baseHue, sat, lit));
      }
      break;
  }

  return colors;
}

/**
 * Convert HSL to hex
 */
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (v) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return '#' + toHex(r) + toHex(g) + toHex(b);
}
