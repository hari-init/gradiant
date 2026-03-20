/**
 * Gradient Wallpaper Engine v2
 * Generates smooth, organic gradient textures using layered radial gradients
 * Produces results similar to out-of-focus light / mesh gradient style
 */

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
 * Convert RGB to CSS string
 */
function rgbStr(r, g, b, a = 1) {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

/**
 * Seeded random number generator
 */
function createRng(seed) {
  let _s = seed || Math.floor(Math.random() * 2147483647);
  if (_s <= 0) _s = 1;
  return function() {
    _s = (_s * 16807) % 2147483647;
    return (_s & 0x7fffffff) / 0x7fffffff;
  };
}

/**
 * Generate the gradient wallpaper using layered radial gradients
 * This produces smooth, organic mesh-gradient-like results
 *
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
  const maxDim = Math.max(w, h);

  if (colors.length === 0) return;

  const rng = createRng(seed);
  const chaosNorm = chaos / 100;
  const grainNorm = grain / 100;
  const rgbColors = colors.map(hexToRgb);

  // ─── STEP 1: Fill with the darkest color as base ─── //
  // Find the darkest color for the background
  let darkestIdx = 0;
  let darkestLum = Infinity;
  rgbColors.forEach((c, i) => {
    const lum = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    if (lum < darkestLum) {
      darkestLum = lum;
      darkestIdx = i;
    }
  });

  // Blend the two darkest for a richer background
  ctx.fillStyle = `rgb(${rgbColors[darkestIdx].r}, ${rgbColors[darkestIdx].g}, ${rgbColors[darkestIdx].b})`;
  ctx.fillRect(0, 0, w, h);

  // ─── STEP 2: Generate blob positions ─── //
  // Each color gets 1-3 large blobs placed strategically
  const blobs = [];

  for (let i = 0; i < rgbColors.length; i++) {
    const color = rgbColors[i];
    // Number of blobs per color: 1-3 depending on chaos
    const numBlobs = 1 + Math.floor(rng() * (1 + chaosNorm * 2));

    for (let j = 0; j < numBlobs; j++) {
      // Position: distribute around canvas with some randomness
      const baseAngle = ((i + j * 0.5) / (rgbColors.length * 1.5)) * Math.PI * 2;
      const spreadRadius = 0.3 + rng() * 0.4;

      let cx, cy;
      if (j === 0) {
        // Primary blob: distributed evenly with chaos offset
        cx = 0.5 + Math.cos(baseAngle) * spreadRadius * (0.6 + chaosNorm * 0.4);
        cy = 0.5 + Math.sin(baseAngle) * spreadRadius * (0.6 + chaosNorm * 0.4);
      } else {
        // Secondary blobs: more random
        cx = rng();
        cy = rng();
      }

      // Allow blobs to extend beyond canvas edges for natural look
      cx = cx * 1.4 - 0.2;
      cy = cy * 1.4 - 0.2;

      // Blob size: large (40-90% of canvas dimension)
      const radiusBase = 0.4 + rng() * 0.5;
      const radius = radiusBase * maxDim * (0.6 + chaosNorm * 0.4);

      // Opacity: primary blobs stronger, secondary weaker
      const opacity = j === 0
        ? 0.75 + rng() * 0.25
        : 0.35 + rng() * 0.4;

      blobs.push({
        x: cx * w,
        y: cy * h,
        radius,
        color,
        opacity,
        blendMode: j === 0 ? 'normal' : (rng() > 0.5 ? 'screen' : 'normal')
      });
    }
  }

  // Shuffle blobs for layering variety
  for (let i = blobs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [blobs[i], blobs[j]] = [blobs[j], blobs[i]];
  }

  // ─── STEP 3: Render blobs as radial gradients ─── //
  ctx.save();

  for (const blob of blobs) {
    const { x, y, radius, color, opacity, blendMode } = blob;

    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = 1;

    // Create a large soft radial gradient
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Inner color: fully saturated with opacity
    grad.addColorStop(0, rgbStr(color.r, color.g, color.b, opacity));

    // Mid transition: soft falloff
    grad.addColorStop(0.3, rgbStr(color.r, color.g, color.b, opacity * 0.7));
    grad.addColorStop(0.5, rgbStr(color.r, color.g, color.b, opacity * 0.4));
    grad.addColorStop(0.7, rgbStr(color.r, color.g, color.b, opacity * 0.15));

    // Outer edge: fully transparent
    grad.addColorStop(1, rgbStr(color.r, color.g, color.b, 0));

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ─── STEP 4: Add extra glow highlights (chaos-dependent) ─── //
  const numHighlights = Math.floor(chaosNorm * 4);
  for (let i = 0; i < numHighlights; i++) {
    const colorIdx = Math.floor(rng() * rgbColors.length);
    const color = rgbColors[colorIdx];
    const hx = rng() * w;
    const hy = rng() * h;
    const hr = (0.15 + rng() * 0.3) * maxDim;

    ctx.globalCompositeOperation = 'screen';
    const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
    hGrad.addColorStop(0, rgbStr(color.r, color.g, color.b, 0.15 + rng() * 0.2));
    hGrad.addColorStop(0.5, rgbStr(color.r, color.g, color.b, 0.05));
    hGrad.addColorStop(1, rgbStr(color.r, color.g, color.b, 0));
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  // ─── STEP 5: Gentle blur for smoothness (1 pass only) ─── //
  applyCanvasBlur(canvas, ctx, w, h, 1);

  // ─── STEP 6: Subtle vignette for depth ─── //
  const vignetteGrad = ctx.createRadialGradient(
    w * 0.5, h * 0.5, Math.min(w, h) * 0.25,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.75
  );
  vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, w, h);

  // ─── STEP 7: Add film grain overlay ─── //
  if (grainNorm > 0.005) {
    applyGrain(canvas, ctx, w, h, grainNorm, rng);
  }
}

/**
 * Apply smooth blur by downscaling and upscaling
 * This produces a genuine smooth Gaussian-like effect
 */
function applyCanvasBlur(canvas, ctx, w, h, passes) {
  const scale = 0.25; // Downscale to 25%
  const sw = Math.max(1, Math.floor(w * scale));
  const sh = Math.max(1, Math.floor(h * scale));

  // Create offscreen canvases
  const offA = document.createElement('canvas');
  offA.width = sw;
  offA.height = sh;
  const ctxA = offA.getContext('2d');

  const offB = document.createElement('canvas');
  offB.width = sw;
  offB.height = sh;
  const ctxB = offB.getContext('2d');

  // Smooth interpolation
  ctxA.imageSmoothingEnabled = true;
  ctxA.imageSmoothingQuality = 'high';
  ctxB.imageSmoothingEnabled = true;
  ctxB.imageSmoothingQuality = 'high';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let p = 0; p < passes; p++) {
    // Downscale
    ctxA.drawImage(canvas, 0, 0, w, h, 0, 0, sw, sh);

    // Bounce between offscreen canvases for extra smoothing
    ctxB.drawImage(offA, 0, 0, sw, sh, 0, 0, sw, sh);

    // Upscale back
    ctx.drawImage(offB, 0, 0, sw, sh, 0, 0, w, h);
  }
}

/**
 * Apply film grain overlay
 */
function applyGrain(canvas, ctx, w, h, grainNorm, rng) {
  // Use a smaller noise texture and tile it for performance
  const noiseSize = Math.min(256, Math.min(w, h));
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = noiseSize;
  noiseCanvas.height = noiseSize;
  const noiseCtx = noiseCanvas.getContext('2d');

  const noiseData = noiseCtx.createImageData(noiseSize, noiseSize);
  const nd = noiseData.data;
  const intensity = Math.floor(grainNorm * 50);

  for (let i = 0; i < nd.length; i += 4) {
    const v = (rng() - 0.5) * intensity;
    // Monochromatic noise
    nd[i] = 128 + v;
    nd[i + 1] = 128 + v;
    nd[i + 2] = 128 + v;
    nd[i + 3] = Math.floor(grainNorm * 100); // Opacity based on grain amount
  }

  noiseCtx.putImageData(noiseData, 0, 0);

  // Composite grain using overlay blend mode
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = grainNorm * 0.8;

  // Tile the noise pattern across the canvas
  for (let x = 0; x < w; x += noiseSize) {
    for (let y = 0; y < h; y += noiseSize) {
      ctx.drawImage(noiseCanvas, x, y);
    }
  }

  ctx.restore();
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
