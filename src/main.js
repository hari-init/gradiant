import './style.css';
import { generateWallpaper, generateRandomPalette } from './gradient.js';

// ─── STATE ─── //
const state = {
  colors: ['#ed625d', '#42b6c6', '#f79f88', '#b2dfe6', '#03232d'],
  chaos: 30,
  grain: 15,
  activeTone: null, // when a preset tone is selected, Random stays in that tone
  autoGen: false,
  autoGenInterval: 3,
  autoGenTimer: null,
  downloadRatio: '16:9',
  downloadScale: 1.5,
  downloadFormat: 'png',
  downloadQuality: 92,
  customRatioW: 16,
  customRatioH: 9,
  isGenerating: false,
};

// ─── TONE DEFINITIONS ─── //
// Each tone has HSL ranges for randomization + sample palettes
const TONES = {
  sunset: {
    label: 'Sunset', icon: '🌅',
    hue: [0, 45], sat: [50, 90], lit: [25, 70],
    palettes: [
      ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a0033'],
      ['#e63946', '#f1a66a', '#f4e285', '#457b9d', '#1d3557'],
      ['#ff4e50', '#fc913a', '#f9d62e', '#eae374', '#e2f4c7'],
      ['#d62828', '#f77f00', '#fcbf49', '#eae2b7', '#003049'],
    ]
  },
  ocean: {
    label: 'Ocean', icon: '🌊',
    hue: [180, 220], sat: [40, 85], lit: [15, 65],
    palettes: [
      ['#0b3d91', '#1b6ca8', '#42b6c6', '#76e5fc', '#073b4c'],
      ['#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#001219'],
      ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
      ['#1a535c', '#4ecdc4', '#f7fff7', '#ff6b6b', '#2e4057'],
    ]
  },
  forest: {
    label: 'Forest', icon: '🌲',
    hue: [90, 160], sat: [30, 75], lit: [15, 60],
    palettes: [
      ['#2d6a4f', '#40916c', '#52b788', '#b7e4c7', '#1b4332'],
      ['#132a13', '#31572c', '#4f772d', '#90a955', '#ecf39e'],
      ['#004b23', '#006400', '#007200', '#38b000', '#9ef01a'],
      ['#283618', '#606c38', '#fefae0', '#dda15e', '#bc6c25'],
    ]
  },
  neon: {
    label: 'Neon', icon: '💜',
    hue: [260, 340], sat: [80, 100], lit: [40, 65],
    palettes: [
      ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b'],
      ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'],
      ['#7400b8', '#6930c3', '#5e60ce', '#5390d9', '#4ea8de'],
      ['#ff0a54', '#ff477e', '#ff5c8a', '#ff7096', '#ff85a1'],
    ]
  },
  earthy: {
    label: 'Earthy', icon: '🍂',
    hue: [15, 50], sat: [30, 70], lit: [15, 60],
    palettes: [
      ['#6b4226', '#c19a6b', '#d2b48c', '#f5deb3', '#2c1b0e'],
      ['#582f0e', '#7f4f24', '#936639', '#a68a64', '#b6ad90'],
      ['#3e1f0d', '#7b3f00', '#c27c3b', '#deb887', '#f5e6cc'],
      ['#4a2c14', '#8b5e34', '#c49a6c', '#e6ccb2', '#ffe8d6'],
    ]
  },
  pastel: {
    label: 'Pastel', icon: '🎀',
    hue: [0, 360], sat: [40, 65], lit: [70, 88],
    palettes: [
      ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#a0c4ff'],
      ['#ffc6ff', '#bdb2ff', '#a0c4ff', '#9bf6ff', '#caffbf'],
      ['#f0ead6', '#dde5b6', '#adc178', '#a98467', '#6c584c'],
      ['#fae1dd', '#f8edeb', '#e8e8e4', '#d8e2dc', '#ece4db'],
    ]
  },
  midnight: {
    label: 'Midnight', icon: '🌙',
    hue: [220, 280], sat: [30, 70], lit: [8, 40],
    palettes: [
      ['#0d1b2a', '#1b2838', '#2c3e50', '#415a77', '#778da9'],
      ['#10002b', '#240046', '#3c096c', '#5a189a', '#7b2cbf'],
      ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
      ['#0b0c10', '#1f2833', '#3a3f47', '#66fcf1', '#45a29e'],
    ]
  },
  candy: {
    label: 'Candy', icon: '🍬',
    hue: [300, 360], sat: [60, 95], lit: [55, 80],
    palettes: [
      ['#ff69b4', '#ff1493', '#c71585', '#db7093', '#ffb6c1'],
      ['#ff0080', '#ff6eb4', '#ffb3d9', '#ffd9ec', '#fff0f5'],
      ['#e91e63', '#f06292', '#f48fb1', '#f8bbd0', '#fce4ec'],
      ['#d81b60', '#ec407a', '#f06292', '#f48fb1', '#f8bbd0'],
    ]
  },
  arctic: {
    label: 'Arctic', icon: '❄️',
    hue: [190, 230], sat: [15, 50], lit: [60, 92],
    palettes: [
      ['#e0fbfc', '#c2dfe3', '#9db4c0', '#5c6b73', '#253237'],
      ['#caf0f8', '#ade8f4', '#90e0ef', '#48cae4', '#00b4d8'],
      ['#f0f4f8', '#d9e2ec', '#bcccdc', '#9fb3c8', '#829ab1'],
      ['#edf2fb', '#d7e3fc', '#ccdbfd', '#c1d3fe', '#abc4ff'],
    ]
  },
  vintage: {
    label: 'Vintage', icon: '📷',
    hue: [20, 60], sat: [20, 50], lit: [30, 70],
    palettes: [
      ['#6d4c3d', '#ba9077', '#eccfc3', '#c6a477', '#997950'],
      ['#555b6e', '#89b0ae', '#bee3db', '#faf9f9', '#ffd6ba'],
      ['#463f3a', '#8a817c', '#bcb8b1', '#f4f3ee', '#e0afa0'],
      ['#5e503f', '#a9927d', '#c2b280', '#d4c5a9', '#f2e9e1'],
    ]
  },
  tropical: {
    label: 'Tropical', icon: '🌴',
    hue: [40, 180], sat: [60, 100], lit: [35, 65],
    palettes: [
      ['#ff6d00', '#ff9100', '#ffc300', '#00c853', '#00bfa5'],
      ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'],
      ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
      ['#006d77', '#83c5be', '#edf6f9', '#ffddd2', '#e29578'],
    ]
  },
  monochrome: {
    label: 'Mono', icon: '◼️',
    hue: [0, 0], sat: [0, 5], lit: [5, 95],
    palettes: [
      ['#000000', '#333333', '#666666', '#999999', '#cccccc'],
      ['#0a0a0a', '#1a1a1a', '#3d3d3d', '#6e6e6e', '#b0b0b0'],
      ['#1c1c1c', '#383838', '#555555', '#aaaaaa', '#f0f0f0'],
      ['#121212', '#2d2d2d', '#4f4f4f', '#8c8c8c', '#e0e0e0'],
    ]
  },
};

// Legacy compat
const PRESETS = {};
Object.entries(TONES).forEach(([key, tone]) => {
  PRESETS[key] = tone.palettes[0];
});


// ─── DOM ELEMENTS ─── //
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const previewCanvas = $('#preview-canvas');
const colorList = $('#color-list');
const colorCount = $('#color-count');
const chaosSlider = $('#chaos-slider');
const chaosValue = $('#chaos-value');
const grainSlider = $('#grain-slider');
const grainValue = $('#grain-value');
const autoGenToggle = $('#auto-gen-toggle');
const autoGenIntervalEl = $('#auto-gen-interval');
const autoGenSeconds = $('#auto-gen-seconds');
const downloadModal = $('#download-modal');
const fullscreenOverlay = $('#fullscreen-overlay');
const fullscreenCanvas = $('#fullscreen-canvas');
const generatingOverlay = $('#generating-overlay');
const toast = $('#toast');
const qualityRow = $('#quality-row');
const qualitySlider = $('#quality-slider');
const qualityValue = $('#quality-value');
const downloadSizeHint = $('#download-size-hint');
const customRatioRow = $('#custom-ratio-row');
const customRatioW = $('#custom-ratio-w');
const customRatioH = $('#custom-ratio-h');

// ─── INITIALIZE ─── //
function init() {
  renderColorList();
  generate();
  bindEvents();
}

// ─── RENDER COLOR LIST ─── //
function renderColorList() {
  colorList.innerHTML = '';
  state.colors.forEach((color, index) => {
    const item = document.createElement('div');
    item.className = 'color-item';
    item.innerHTML = `
      <div class="color-swatch-wrapper">
        <div class="color-swatch" style="background: ${color}"></div>
        <input type="color" class="color-picker-input" value="${color}" data-index="${index}" />
      </div>
      <input type="text" class="color-hex-input" value="${color}" data-index="${index}" maxlength="7" spellcheck="false" />
      ${state.colors.length > 2 ? `<button class="color-remove-btn" data-index="${index}">×</button>` : ''}
    `;
    colorList.appendChild(item);
  });
  colorCount.textContent = `${state.colors.length} color${state.colors.length !== 1 ? 's' : ''}`;

  // Bind color events
  $$('.color-picker-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      state.colors[idx] = e.target.value;
      renderColorList();
      generate();
    });
  });

  $$('.color-hex-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index);
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9a-fA-F]{6}$/.test(val) || /^#[0-9a-fA-F]{3}$/.test(val)) {
        state.colors[idx] = val;
        renderColorList();
        generate();
      } else {
        e.target.value = state.colors[idx];
        showToast('Invalid hex color');
      }
    });
  });

  $$('.color-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      state.colors.splice(idx, 1);
      renderColorList();
      generate();
    });
  });
}

// ─── GENERATE WALLPAPER ─── //
function generate() {
  if (state.isGenerating) return;
  state.isGenerating = true;
  generatingOverlay.classList.add('visible');

  // Use requestAnimationFrame to let the overlay render before the heavy computation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      generateWallpaper(previewCanvas, state.colors, state.chaos, state.grain);
      state.isGenerating = false;
      generatingOverlay.classList.remove('visible');
    });
  });
}

// ─── BIND EVENTS ─── //
function bindEvents() {
  // Generate button
  $('#btn-generate').addEventListener('click', generate);

  // Fullscreen
  $('#canvas-wrapper').addEventListener('click', openFullscreen);
  $('#btn-fullscreen').addEventListener('click', openFullscreen);
  $('#btn-fs-close').addEventListener('click', closeFullscreen);
  $('#btn-fs-generate').addEventListener('click', () => {
    generate();
    updateFullscreenCanvas();
  });
  $('#btn-fs-download').addEventListener('click', () => {
    closeFullscreen();
    openDownloadModal();
  });

  // Download modal
  $('#btn-download-open').addEventListener('click', openDownloadModal);
  $('#btn-download-cancel').addEventListener('click', closeDownloadModal);
  $('#btn-download-confirm').addEventListener('click', downloadWallpaper);
  downloadModal.addEventListener('click', (e) => {
    if (e.target === downloadModal) closeDownloadModal();
  });

  // Ratio buttons
  $$('#ratio-grid .ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#ratio-grid .ratio-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.downloadRatio = btn.dataset.ratio;
      customRatioRow.classList.toggle('visible', state.downloadRatio === 'custom');
      updateResolutionLabels();
    });
  });

  // Custom ratio
  customRatioW.addEventListener('input', () => {
    state.customRatioW = parseInt(customRatioW.value) || 16;
    updateResolutionLabels();
  });
  customRatioH.addEventListener('input', () => {
    state.customRatioH = parseInt(customRatioH.value) || 9;
    updateResolutionLabels();
  });

  // Resolution buttons
  $$('#resolution-grid .res-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#resolution-grid .res-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.downloadScale = parseFloat(btn.dataset.scale);
      updateResolutionLabels();
    });
  });

  // Format buttons
  $$('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.downloadFormat = btn.dataset.format;
      qualityRow.classList.toggle('visible', btn.dataset.format !== 'png');
    });
  });

  // Quality slider
  qualitySlider.addEventListener('input', () => {
    state.downloadQuality = parseInt(qualitySlider.value);
    qualityValue.textContent = qualitySlider.value;
  });

  // Chaos slider
  chaosSlider.addEventListener('input', () => {
    state.chaos = parseInt(chaosSlider.value);
    chaosValue.textContent = chaosSlider.value;
  });
  chaosSlider.addEventListener('change', generate);

  // Grain slider
  grainSlider.addEventListener('input', () => {
    state.grain = parseInt(grainSlider.value);
    grainValue.textContent = grainSlider.value;
  });
  grainSlider.addEventListener('change', generate);

  // Add color
  $('#btn-add-color').addEventListener('click', () => {
    if (state.colors.length >= 10) {
      showToast('Maximum 10 colors');
      return;
    }
    // Generate a color that complements existing ones
    const randomHue = Math.random() * 360;
    const newColor = hslToHex(randomHue, 50 + Math.random() * 30, 40 + Math.random() * 30);
    state.colors.push(newColor);
    renderColorList();
    generate();
  });

  // Random palette (tone-aware)
  $('#btn-random-palette').addEventListener('click', () => {
    const count = getColorCount();
    if (state.activeTone && TONES[state.activeTone]) {
      state.colors = generateTonePalette(state.activeTone, count);
    } else {
      state.colors = generateRandomPalette(count);
    }
    renderColorList();
    generate();
  });

  // Preset palettes — sets active tone
  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toneName = btn.dataset.preset;
      const tone = TONES[toneName];
      if (tone) {
        state.activeTone = toneName;
        const count = getColorCount();
        // Pick a random sample palette from this tone and adapt to count
        const sample = tone.palettes[Math.floor(Math.random() * tone.palettes.length)];
        state.colors = adaptPalette([...sample], count);
        // Highlight active tone button
        $$('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('#active-tone-badge').textContent = tone.label;
        renderColorList();
        generate();
        showToast(`${tone.icon} ${tone.label} tone active`);
      }
    });
  });

  // Auto generate
  autoGenToggle.addEventListener('change', () => {
    state.autoGen = autoGenToggle.checked;
    autoGenIntervalEl.classList.toggle('active', state.autoGen);
    if (state.autoGen) {
      startAutoGen();
    } else {
      stopAutoGen();
    }
  });

  autoGenSeconds.addEventListener('change', () => {
    state.autoGenInterval = Math.max(1, Math.min(60, parseInt(autoGenSeconds.value) || 3));
    autoGenSeconds.value = state.autoGenInterval;
    if (state.autoGen) {
      stopAutoGen();
      startAutoGen();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in an input
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      generate();
    } else if (e.code === 'Escape') {
      if (fullscreenOverlay.classList.contains('visible')) {
        closeFullscreen();
      } else if (downloadModal.classList.contains('visible')) {
        closeDownloadModal();
      }
    } else if (e.code === 'KeyD' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openDownloadModal();
    } else if (e.code === 'KeyF') {
      openFullscreen();
    }
  });
}

// ─── AUTO GENERATE ─── //
function startAutoGen() {
  stopAutoGen();
  state.autoGenTimer = setInterval(() => {
    const count = getColorCount();
    if (state.activeTone && TONES[state.activeTone]) {
      state.colors = generateTonePalette(state.activeTone, count);
    } else {
      state.colors = generateRandomPalette(count);
    }
    renderColorList();
    generate();
  }, state.autoGenInterval * 1000);
}

function stopAutoGen() {
  if (state.autoGenTimer) {
    clearInterval(state.autoGenTimer);
    state.autoGenTimer = null;
  }
}

// ─── FULLSCREEN ─── //
function openFullscreen() {
  updateFullscreenCanvas();
  fullscreenOverlay.classList.add('visible');

  // Show controls briefly then fade
  fullscreenOverlay.classList.add('show-controls');
  setTimeout(() => {
    fullscreenOverlay.classList.remove('show-controls');
  }, 2000);
}

function updateFullscreenCanvas() {
  fullscreenCanvas.width = previewCanvas.width;
  fullscreenCanvas.height = previewCanvas.height;
  const ctx = fullscreenCanvas.getContext('2d');
  ctx.drawImage(previewCanvas, 0, 0);
}

function closeFullscreen() {
  fullscreenOverlay.classList.remove('visible');
}

// ─── DOWNLOAD MODAL ─── //
function openDownloadModal() {
  updateResolutionLabels();
  downloadModal.classList.add('visible');
}

function closeDownloadModal() {
  downloadModal.classList.remove('visible');
}

function getDownloadDimensions() {
  let ratioW, ratioH;

  if (state.downloadRatio === 'custom') {
    ratioW = state.customRatioW;
    ratioH = state.customRatioH;
  } else {
    const [rw, rh] = state.downloadRatio.split(':').map(Number);
    ratioW = rw;
    ratioH = rh;
  }

  const baseWidth = 1920;
  const baseHeight = Math.round(baseWidth * (ratioH / ratioW));
  const width = Math.round(baseWidth * state.downloadScale);
  const height = Math.round(baseHeight * state.downloadScale);

  return { width, height };
}

function updateResolutionLabels() {
  const scales = [
    { scale: 1, el: '#res-hd-size' },
    { scale: 1.5, el: '#res-fhd-size' },
    { scale: 2, el: '#res-2k-size' },
    { scale: 2.67, el: '#res-4k-size' },
  ];

  let ratioW, ratioH;
  if (state.downloadRatio === 'custom') {
    ratioW = state.customRatioW;
    ratioH = state.customRatioH;
  } else {
    const [rw, rh] = state.downloadRatio.split(':').map(Number);
    ratioW = rw;
    ratioH = rh;
  }

  const baseWidth = 1920;
  scales.forEach(({ scale, el }) => {
    const w = Math.round(baseWidth * scale);
    const h = Math.round((baseWidth * (ratioH / ratioW)) * scale);
    $(el).textContent = `${w} × ${h}`;
  });

  const { width, height } = getDownloadDimensions();
  downloadSizeHint.textContent = `Output: ${width} × ${height} px`;
}

// ─── DOWNLOAD ─── //
function downloadWallpaper() {
  const { width, height } = getDownloadDimensions();

  showToast(`Generating ${width}×${height} wallpaper…`);
  closeDownloadModal();

  // Use offscreen canvas for high-res render
  requestAnimationFrame(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;

    generateWallpaper(offscreen, state.colors, state.chaos, state.grain);

    let mimeType, extension;
    let quality = state.downloadQuality / 100;

    switch (state.downloadFormat) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        extension = 'jpg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        extension = 'webp';
        break;
      default:
        mimeType = 'image/png';
        extension = 'png';
        quality = undefined;
        break;
    }

    offscreen.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gradiant-${width}x${height}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
      showToast(`Downloaded! (${sizeMB} MB)`);
    }, mimeType, quality);
  });
}

// ─── TONE-AWARE PALETTE GENERATION ─── //
/**
 * Generate a random palette within a specific tone's HSL bounds
 */
function generateTonePalette(toneName, count) {
  const tone = TONES[toneName];
  if (!tone) return generateRandomPalette(count);

  const [hueMin, hueMax] = tone.hue;
  const [satMin, satMax] = tone.sat;
  const [litMin, litMax] = tone.lit;

  const colors = [];
  const hueRange = hueMax - hueMin;

  // Spread lightness evenly for good gradient contrast
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);

    // Hue: random within range, with slight spread
    let hue;
    if (hueRange === 0) {
      hue = hueMin; // monochrome
    } else {
      hue = hueMin + Math.random() * hueRange;
    }

    // Saturation: random within range with slight variance
    const sat = satMin + Math.random() * (satMax - satMin);

    // Lightness: spread from dark to light based on position
    const litSpread = litMax - litMin;
    const lit = litMin + t * litSpread + (Math.random() - 0.5) * (litSpread * 0.2);

    colors.push(hslToHex(
      ((hue % 360) + 360) % 360,
      Math.max(0, Math.min(100, sat)),
      Math.max(litMin, Math.min(litMax, lit))
    ));
  }

  // Shuffle slightly for visual variety (not fully sorted by lightness)
  if (count > 2 && Math.random() > 0.4) {
    // Swap 1-2 random pairs
    const swaps = 1 + Math.floor(Math.random() * 2);
    for (let s = 0; s < swaps; s++) {
      const a = Math.floor(Math.random() * count);
      const b = Math.floor(Math.random() * count);
      [colors[a], colors[b]] = [colors[b], colors[a]];
    }
  }

  return colors;
}

// ─── TOAST ─── //
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2500);
}

// ─── UTILS ─── //

/**
 * Get the universal color count from the input
 */
function getColorCount() {
  return Math.max(2, Math.min(10, parseInt($('#random-color-count').value) || 5));
}

/**
 * Adapt a palette to a target count by trimming or interpolating
 */
function adaptPalette(palette, targetCount) {
  if (palette.length === targetCount) return palette;

  if (palette.length > targetCount) {
    // Evenly sample from the palette
    const result = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.round((i / (targetCount - 1)) * (palette.length - 1));
      result.push(palette[idx]);
    }
    return result;
  }

  // Need more colors — interpolate between existing ones
  const result = [];
  for (let i = 0; i < targetCount; i++) {
    const t = i / (targetCount - 1); // 0..1
    const pos = t * (palette.length - 1);
    const low = Math.floor(pos);
    const high = Math.min(low + 1, palette.length - 1);
    const frac = pos - low;

    if (frac < 0.001 || low === high) {
      result.push(palette[low]);
    } else {
      // Interpolate hex colors
      const c1 = hexToRgbUtil(palette[low]);
      const c2 = hexToRgbUtil(palette[high]);
      const r = Math.round(c1.r + (c2.r - c1.r) * frac);
      const g = Math.round(c1.g + (c2.g - c1.g) * frac);
      const b = Math.round(c1.b + (c2.b - c1.b) * frac);
      result.push('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''));
    }
  }
  return result;
}

function hexToRgbUtil(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

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

// ─── START ─── //
init();
