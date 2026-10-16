// Hero 3D: three browser windows (Chromium, Firefox, WebKit) running a live
// Playwright-style test — a locator highlight walks the page and ticks elements.
import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('browsers');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#101114';
const PASS = '#0f9d58';
const LIME = '#c7f23a';
const LOCATOR = 'rgba(56, 132, 255, 0.18)';
const LOCATOR_EDGE = '#3884ff';

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Each mock app: url, and elements [x, y, w, h, kind, label, locator]
const APPS = [
  {
    engine: 'chromium',
    url: 'bank.test/cases',
    build: (W, H) => {
      const els = [];
      els.push([24, 70, 150, H - 94, 'side', '', "getByRole('navigation')"]);
      els.push([194, 70, W - 218, 44, 'title', 'Case monitor', "getByRole('heading', { name: 'Case monitor' })"]);
      for (let i = 0; i < 4; i++) els.push([194, 130 + i * 62, W - 218, 48, 'row', ['TXN-2041  ₹4,80,000', 'TXN-2042  ₹12,500', 'TXN-2043  ₹9,90,000', 'TXN-2044  ₹3,200'][i], `getByRole('row').nth(${i})`]);
      els.push([W - 190, H - 66, 166, 42, 'btn', 'Flag case', "getByRole('button', { name: 'Flag case' })"]);
      return els;
    },
  },
  {
    engine: 'firefox',
    url: 'portal.test/login',
    build: (W, H) => {
      const cx = W / 2 - 170;
      return [
        [cx, 76, 340, 40, 'title', 'Vendor portal', "getByRole('heading')"],
        [cx, 140, 340, 46, 'field', 'vendor@acme.com', "getByLabel('Email')"],
        [cx, 204, 340, 46, 'field', '••••••••', "getByLabel('Password')"],
        [cx, 270, 340, 50, 'btn', 'Sign in', "getByRole('button', { name: 'Sign in' })"],
        [cx, 344, 340, 40, 'toast', 'Welcome back!', "getByText('Welcome back!')"],
      ];
    },
  },
  {
    engine: 'webkit',
    url: 'shop.test/checkout',
    build: (W, H) => {
      const els = [];
      for (let i = 0; i < 3; i++) els.push([24 + i * ((W - 48) / 3), 74, (W - 48) / 3 - 14, 150, 'card', ['5G Plan', 'Router', 'Add-on'][i], `getByTestId('plan-${i + 1}')`]);
      els.push([24, 244, W - 48, 46, 'field', 'Total  ₹1,499 / month', "getByText('Total')"]);
      els.push([24, 306, W - 48, 50, 'btn', 'Complete sale', "getByRole('button', { name: 'Complete sale' })"]);
      return els;
    },
  },
];

function drawScreen(ctx, W, H, t, app, els) {
  // Browser chrome
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ecebe6';
  ctx.fillRect(0, 0, W, 50);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(24 + i * 20, 25, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#ffffff';
  rr(ctx, 96, 11, W - 220, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#6b6e76';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillText('🔒 ' + app.url, 112, 30);
  ctx.fillStyle = INK;
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(app.engine, W - 18, 30);
  ctx.textAlign = 'left';

  // Test progress: one element per 1.1 s, then hold "all passed" for a moment
  const n = els.length;
  const cycle = n * 1.1 + 2.2;
  const local = t % cycle;
  const active = Math.min(Math.floor(local / 1.1), n);
  const k = (local % 1.1) / 1.1;

  els.forEach(([x, y, w, h, kind, label], i) => {
    // element body
    if (kind === 'side') {
      ctx.fillStyle = '#f3f1ec';
      rr(ctx, x, y, w, h, 12);
      ctx.fill();
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = j === 1 ? INK : '#d9d6cf';
        rr(ctx, x + 14, y + 18 + j * 40, w - 28, 18, 9);
        ctx.fill();
      }
    } else if (kind === 'title') {
      ctx.fillStyle = INK;
      ctx.font = '800 26px Syne, sans-serif';
      ctx.fillText(label, x, y + 30);
    } else if (kind === 'row' || kind === 'field') {
      ctx.fillStyle = kind === 'row' ? '#f7f6f2' : '#ffffff';
      ctx.strokeStyle = '#d9d6cf';
      ctx.lineWidth = 2;
      rr(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3b3e45';
      ctx.font = '600 16px Manrope, sans-serif';
      ctx.fillText(label, x + 16, y + h / 2 + 6);
      if (kind === 'row' && (i === 1 || i === 3)) {
        ctx.fillStyle = '#fde2df';
        rr(ctx, x + w - 96, y + 12, 80, 24, 12);
        ctx.fill();
        ctx.fillStyle = '#c4320a';
        ctx.font = '700 12px Manrope, sans-serif';
        ctx.fillText('FLAGGED', x + w - 84, y + 29);
      }
    } else if (kind === 'btn') {
      ctx.fillStyle = INK;
      rr(ctx, x, y, w, h, h / 2);
      ctx.fill();
      ctx.fillStyle = LIME;
      ctx.font = '700 16px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h / 2 + 6);
      ctx.textAlign = 'left';
    } else if (kind === 'toast') {
      if (active >= i) {
        ctx.fillStyle = '#d7f5e5';
        rr(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.fillStyle = '#07743f';
        ctx.font = '700 15px Manrope, sans-serif';
        ctx.fillText('✓  ' + label, x + 14, y + h / 2 + 5);
      }
    } else if (kind === 'card') {
      ctx.fillStyle = '#f7f6f2';
      ctx.strokeStyle = '#d9d6cf';
      ctx.lineWidth = 2;
      rr(ctx, x, y, w, h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ['#c7f23a', '#cfe3ff', '#ffe1c2'][i % 3];
      rr(ctx, x + 14, y + 14, w - 28, 64, 10);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = '700 17px Manrope, sans-serif';
      ctx.fillText(label, x + 14, y + 104);
      ctx.fillStyle = '#6b6e76';
      ctx.font = '500 13px Manrope, sans-serif';
      ctx.fillText('in stock', x + 14, y + 126);
    }

    // passed tick
    if (i < active) {
      ctx.fillStyle = PASS;
      ctx.beginPath();
      ctx.arc(x + w - 4, y + 4, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w - 10, y + 4);
      ctx.lineTo(x + w - 5, y + 9);
      ctx.lineTo(x + w + 3, y - 1);
      ctx.stroke();
    }
  });

  // locator highlight on the element under test
  if (active < n) {
    const [x, y, w, h, , , locator] = els[active];
    const pad = 6 * (1 - Math.min(k * 3, 1)) + 3;
    ctx.fillStyle = LOCATOR;
    ctx.strokeStyle = LOCATOR_EDGE;
    ctx.lineWidth = 3;
    rr(ctx, x - pad, y - pad, w + pad * 2, h + pad * 2, 10);
    ctx.fill();
    ctx.stroke();
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const tw = ctx.measureText(locator).width + 16;
    const ly = y - pad - 30 < 54 ? y + h + pad + 6 : y - pad - 30;
    const lx = Math.min(Math.max(x - pad, 8), W - tw - 8);
    ctx.fillStyle = LOCATOR_EDGE;
    rr(ctx, lx, ly, tw, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(locator, lx + 8, ly + 17);
  } else {
    // all passed banner
    ctx.fillStyle = 'rgba(15, 157, 88, 0.95)';
    rr(ctx, W / 2 - 130, H - 70, 260, 46, 23);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 17px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`✓  ${n} passed`, W / 2, H - 41);
    ctx.textAlign = 'left';
  }
}

function makeCheckTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = PASS;
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#fff';
  g.lineWidth = 14;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(38, 66);
  g.lineTo(56, 84);
  g.lineTo(90, 46);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 13);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-4, 6, 8);
  scene.add(key);

  const W = 3.4;
  const H = 2.3;
  const body = new THREE.ExtrudeGeometry(roundedShape(W, H, 0.2), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 10 });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#fbfaf7', roughness: 0.55, metalness: 0 });
  const shadowGeo = new THREE.ShapeGeometry(roundedShape(W + 0.06, H + 0.06, 0.22), 10);
  const screenW = W - 0.14;
  const screenH = H - 0.14;
  const screenGeo = new THREE.PlaneGeometry(screenW, screenH);

  const TEX_W = 768;
  const TEX_H = Math.round(TEX_W * (screenH / screenW));
  const layout = [
    { pos: [-1.75, 1.15, 0.2], rot: [0.04, 0.32, -0.04], shadow: INK },
    { pos: [1.5, 0.15, -0.9], rot: [-0.02, -0.28, 0.03], shadow: LIME },
    { pos: [-0.55, -1.45, 0.9], rot: [0.06, 0.12, 0.02], shadow: INK },
  ];

  const windows = APPS.map((app, i) => {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(body, frameMat);
    frame.position.z = -0.12;
    group.add(frame);
    // Hard offset "brutalist" shadow plate, like the cards on the page
    const plate = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: layout[i].shadow }));
    plate.position.set(0.16, -0.16, -0.2);
    group.add(plate);
    const c = document.createElement('canvas');
    c.width = TEX_W;
    c.height = TEX_H;
    const ctx = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    screen.position.z = 0.036;
    group.add(screen);
    group.position.set(...layout[i].pos);
    group.rotation.set(...layout[i].rot);
    scene.add(group);
    return { group, ctx, tex, app, els: app.build(TEX_W, TEX_H), base: layout[i], phase: i * 1.7 };
  });

  // Floating pass ticks
  const checkTex = makeCheckTexture();
  const ticks = Array.from({ length: 7 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: checkTex, transparent: true, depthWrite: false }));
    const r = 0.22 + Math.random() * 0.16;
    s.scale.set(r, r, 1);
    s.userData = { a: (i / 7) * Math.PI * 2, rad: 2.8 + Math.random() * 0.7, y: (Math.random() - 0.5) * 3.6, sp: 0.08 + Math.random() * 0.06 };
    scene.add(s);
    return s;
  });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull back on narrow screens so all three windows fit
    camera.position.z = w / h < 1 ? 14.5 / Math.max(w / h, 0.62) : 14.5;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const clock = new THREE.Clock();
  let visible = true;
  let raf = 0;
  const frame = () => {
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    windows.forEach((w, i) => {
      drawScreen(w.ctx, TEX_W, TEX_H, t + w.phase, w.app, w.els);
      w.tex.needsUpdate = true;
      w.group.position.y = w.base.pos[1] + Math.sin(t * 0.8 + i * 1.3) * 0.08;
      w.group.rotation.y = w.base.rot[1] + mouse.x * 0.18;
      w.group.rotation.x = w.base.rot[0] + mouse.y * 0.1;
    });
    ticks.forEach((s) => {
      const d = s.userData;
      d.a += d.sp * 0.01;
      s.position.set(Math.cos(d.a + t * d.sp) * d.rad, d.y + Math.sin(t * 0.9 + d.a) * 0.2, Math.sin(d.a + t * d.sp) * 1.4 - 0.5);
    });
    renderer.render(scene, camera);
    if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible) start();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(raf); });
  canvas.addEventListener('webglcontextrestored', start);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  start();
}

if (canvas && webgl()) {
  try {
    init();
  } catch (err) {
    console.warn('3D disabled:', err);
    document.documentElement.classList.add('no-webgl');
    canvas.remove();
  }
} else {
  document.documentElement.classList.add('no-webgl');
  if (canvas) canvas.remove();
}
