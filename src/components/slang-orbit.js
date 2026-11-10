/**
 * slang-orbit.js — additive 3D hero layer for SlangNorm AI
 * ---------------------------------------------------------------
 * Adds (never replaces) to an existing hero section:
 *   1. A glowing, flowing "liquid" 3D mesh (simplex-noise displaced sphere,
 *      fresnel rim + contour ridges) — inspired by the reference video.
 *   2. Slang words revolving on tilted 3D rings around the mesh. A word is
 *      shown as SLANG on the far side of the ring and morphs into its FORMAL
 *      form as it swings to the front  (no cap -> honestly).
 *   3. Parallax starfield, mouse/scroll reactive motion.
 *   4. Two floating glass cards (HTML overlay) like the reference.
 *
 * Usage (one line in your hero):
 *   import { mountSlangOrbit } from './slang-orbit.js';
 *   const orbit = mountSlangOrbit(document.querySelector('.hero'));
 *   // orbit.destroy() on unmount
 *
 * Requires: three (npm i three). No other dependencies. Canvas sits BEHIND
 * your existing content (z-index:-1 inside an isolated stacking context),
 * pointer-events:none, so your current markup/CSS/handlers are untouched.
 */
import * as THREE from 'three';

const DEFAULTS = {
  colorA: '#22d3ee',      // cyan  (matches existing CTA gradient start)
  colorB: '#6366f1',      // indigo (matches existing CTA gradient end)
  colorWord: '#5eead4',   // mint  (matches "INTERNET'S LANGUAGE" gradient)
  font: '"JetBrains Mono","Space Mono",ui-monospace,Menlo,monospace',
  anchor: 'bottom',       // 'bottom' (video-style, mesh rises from below) | 'center'
  cards: true,            // floating glass cards (auto-hidden on phones)
  stars: 1400,
  zIndex: -1,
  pairs: [
    ['no cap', 'honestly'], ['rizz', 'charisma'], ['bruh', 'seriously?'],
    ['lowkey', 'somewhat'], ['gg', 'good game'], ['fr fr', 'truly'],
    ['slay', 'excellent'], ['sus', 'suspicious'], ['bet', 'agreed'],
    ['salty', 'upset'], ['ghosted', 'ignored'], ['flex', 'show off'],
    ['IDK', "I don't know"], ['brb', 'be right back'], ['yaar', 'friend'],
    ['jugaad', 'improvisation'], ['chill kar', 'relax'], ['vibe', 'atmosphere'],
  ],
  cardA: { label: 'SLANG → FORMAL', from: 'no cap', to: 'honestly' },
  cardB: { label: 'NORMALIZATION ACCURACY', value: '96%', pct: 96 },
};

/* ---------- GLSL ---------- */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const BLOB_VERT = /* glsl */ `
uniform float uTime; uniform vec2 uMouse;
varying float vN; varying vec3 vNormal; varying vec3 vView;
${NOISE}
float field(vec3 p){
  float n = snoise(p*0.85 + vec3(0.,uTime*0.12,uTime*0.08));
  n += 0.16*snoise(p*1.6 - vec3(uTime*0.1,0.,uTime*0.14));
  return n;
}
void main(){
  vec3 p = position;
  float n = field(p + vec3(uMouse*0.6,0.));
  vec3 displaced = p + normal * n * 0.5;
  // finite-difference normal so lighting follows the displaced surface
  float e = 0.02;
  vec3 t1 = normalize(cross(normal, vec3(0.,1.,0.001)));
  vec3 t2 = normalize(cross(normal, t1));
  vec3 pa = p + t1*e; vec3 pb = p + t2*e;
  vec3 da = pa + normal * field(pa + vec3(uMouse*0.6,0.)) * 0.5;
  vec3 db = pb + normal * field(pb + vec3(uMouse*0.6,0.)) * 0.5;
  vec3 nrm = normalize(cross(da-displaced, db-displaced));
  if (dot(nrm, normal) < 0.) nrm = -nrm;
  vN = n; vNormal = normalize(normalMatrix * nrm);
  vec4 mv = modelViewMatrix * vec4(displaced,1.);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const BLOB_FRAG = /* glsl */ `
uniform vec3 uColA; uniform vec3 uColB; uniform float uTime;
varying float vN; varying vec3 vNormal; varying vec3 vView;
void main(){
  float fres = pow(1. - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
  float band = abs(fract(vN*4.0 + uTime*0.04) - 0.5);          // silky contour ridges
  float line = 1. - smoothstep(0., 0.07, band);
  float fine = 1. - smoothstep(0., 0.03, abs(fract(vN*14.) - 0.5));
  vec3 col = mix(uColB, uColA, smoothstep(-0.8, 0.9, vN));
  float a = 0.05 + fres*0.95 + line*0.30 + fine*0.05;
  gl_FragColor = vec4(col * (0.55 + fres*1.3 + line*0.5), a * 0.85);
}`;

/* ---------- helpers ---------- */
function labelTexture(text, { color, font, glow }) {
  const dpr = 2, fs = 54, padX = 44, padY = 40;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `700 ${fs}px ${font}`;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const h = fs + padY * 2;
  c.width = w * dpr; c.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.font = `700 ${fs}px ${font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = glow; ctx.shadowBlur = 22; ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + 2);
  ctx.shadowBlur = 0; ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect: w / h };
}

const CSS = `
.sn-orbit-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block}
.sn-card{position:absolute;z-index:1;pointer-events:none;min-width:168px;padding:12px 14px;border-radius:14px;
  background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.015));
  border:1px solid rgba(94,234,212,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 10px 40px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.03);
  font-family:var(--sn-font,ui-monospace,Menlo,monospace);color:#e6f7ff;animation:sn-float 7s ease-in-out infinite}
.sn-card small{display:block;font-size:9px;letter-spacing:.14em;color:#67e8f9;opacity:.85;margin-bottom:6px}
.sn-card b{font-size:15px;font-weight:700}
.sn-card .sn-from{color:#94a3b8;text-decoration:line-through;text-decoration-color:rgba(148,163,184,.5);margin-right:8px}
.sn-card .sn-to{color:#5eead4}
.sn-card .sn-bar{height:3px;border-radius:3px;background:rgba(255,255,255,.1);margin-top:9px;overflow:hidden}
.sn-card .sn-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22d3ee,#6366f1);
  animation:sn-fill 2.2s .6s cubic-bezier(.2,.8,.2,1) forwards}
.sn-card-a{left:7%;bottom:22%}
.sn-card-b{right:8%;bottom:12%;animation-delay:-3.2s}
@keyframes sn-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes sn-fill{to{width:var(--pct,96%)}}
@media (max-width:760px){.sn-card{display:none}}
@media (prefers-reduced-motion:reduce){.sn-card,.sn-card .sn-bar i{animation:none}.sn-card .sn-bar i{width:var(--pct,96%)}}
`;

/* ---------- main ---------- */
export function mountSlangOrbit(container, userOpts = {}) {
  if (!container) return { destroy() {} };
  const o = { ...DEFAULTS, ...userOpts };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.getElementById('sn-orbit-style')) {
    const st = document.createElement('style'); st.id = 'sn-orbit-style'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.className = 'sn-orbit-canvas';
  canvas.style.zIndex = String(o.zIndex);
  canvas.setAttribute('aria-hidden', 'true');
  container.insertBefore(canvas, container.firstChild);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const rig = new THREE.Group(); scene.add(rig);          // parallax / scroll rig

  /* liquid mesh */
  const blobMat = new THREE.ShaderMaterial({
    vertexShader: BLOB_VERT, fragmentShader: BLOB_FRAG,
    uniforms: {
      uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() },
      uColA: { value: new THREE.Color(o.colorA) }, uColB: { value: new THREE.Color(o.colorB) },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 48), blobMat);
  rig.add(blob);

  /* stars */
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(o.stars * 3);
  for (let i = 0; i < o.stars; i++) {
    const r = 6 + Math.random() * 16, th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1);
    sp[i * 3] = r * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = r * Math.cos(ph) * 0.7; sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 4;
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({
    size: 0.045, color: o.colorWord, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(stars);

  /* revolving text rings */
  const rings = [];
  const ringDefs = [
    { r: 3.3, tilt: [0.38, 0, 0.12], speed: 0.16, count: 7, h: 0.40 },
    { r: 4.2, tilt: [-0.52, 0, -0.2], speed: -0.11, count: 8, h: 0.34 },
    { r: 2.75, tilt: [1.05, 0, 0.3], speed: 0.21, count: 5, h: 0.30 },
  ];
  let pairCursor = 0;
  const disposables = [];
  const buildRings = () => {
    const small = innerWidth < 760;
    ringDefs.forEach((d) => {
      const g = new THREE.Group();
      g.rotation.set(d.tilt[0], d.tilt[1], d.tilt[2]);
      rig.add(g);
      const n = small ? Math.max(3, d.count - 3) : d.count;
      const items = [];
      for (let i = 0; i < n; i++) {
        const [slang, formal] = o.pairs[pairCursor++ % o.pairs.length];
        const A = labelTexture(slang, { color: '#cfefff', glow: o.colorA, font: o.font });
        const B = labelTexture(formal, { color: o.colorWord, glow: o.colorWord, font: o.font });
        disposables.push(A.tex, B.tex);
        const mat = new THREE.SpriteMaterial({ map: A.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        disposables.push(mat);
        const sprite = new THREE.Sprite(mat);
        g.add(sprite);
        items.push({ sprite, mat, A, B, phase: (i / n) * Math.PI * 2, formal: false, pop: 0 });
      }
      rings.push({ g, d, items });
    });
  };

  /* glass cards */
  let cardEls = [];
  if (o.cards) {
    const a = document.createElement('div'); a.className = 'sn-card sn-card-a';
    a.innerHTML = `<small>${o.cardA.label}</small><b><span class="sn-from">${o.cardA.from}</span><span class="sn-to">${o.cardA.to}</span></b>`;
    const b = document.createElement('div'); b.className = 'sn-card sn-card-b'; b.style.setProperty('--pct', o.cardB.pct + '%');
    b.innerHTML = `<small>${o.cardB.label}</small><b>${o.cardB.value}</b><div class="sn-bar"><i></i></div>`;
    cardEls = [a, b];
    container.insertBefore(a, canvas.nextSibling); container.insertBefore(b, a.nextSibling);
    cardEls.forEach((el) => (el.style.zIndex = '0'));
  }

  /* layout */
  let W = 1, H = 1, scale = 1;
  const resize = () => {
    const r = container.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const visW = visH * camera.aspect;
    scale = THREE.MathUtils.clamp(visW / 9.5, 0.42, 1.15);
    rig.scale.setScalar(scale);
    rig.position.y = o.anchor === 'bottom' ? -visH * (W < 760 ? 0.27 : 0.30) : 0;
  };
  const ro = new ResizeObserver(resize); ro.observe(container);

  /* input */
  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
  const onMove = (e) => { mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)); };
  addEventListener('pointermove', onMove, { passive: true });
  let scrollY = 0;
  const onScroll = () => { scrollY = Math.min(1, scrollY * 0 + window.scrollY / Math.max(1, H)); };
  addEventListener('scroll', onScroll, { passive: true });

  /* loop */
  const clock = new THREE.Clock();
  let running = true, visible = true, raf = 0, t = 0;
  const camSpace = new THREE.Vector3();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!running || !visible) return;
    const dt = Math.min(clock.getDelta(), 0.05) * (reduce ? 0.12 : 1);
    t += dt;
    mouseS.lerp(mouse, 0.04);
    blobMat.uniforms.uTime.value = t;
    blobMat.uniforms.uMouse.value.copy(mouseS);

    rig.rotation.y = mouseS.x * 0.22 + t * 0.03;
    rig.rotation.x = -mouseS.y * 0.12 + scrollY * 0.25;
    blob.rotation.y = t * 0.08;
    stars.rotation.y = t * 0.012 + mouseS.x * 0.05;
    stars.position.y = scrollY * 0.8;

    rings.forEach(({ d, items }) => {
      items.forEach((it) => {
        const a = it.phase + t * d.speed;
        it.sprite.position.set(Math.cos(a) * d.r, Math.sin(a * 2) * 0.12, Math.sin(a) * d.r);
        it.sprite.getWorldPosition(camSpace);
        camSpace.sub(rig.position);
        const front = THREE.MathUtils.clamp((camSpace.z / (d.r * scale)) * 0.5 + 0.5, 0, 1);
        const wantFormal = front > 0.5;
        if (wantFormal !== it.formal) { it.formal = wantFormal; it.mat.map = wantFormal ? it.B.tex : it.A.tex; it.pop = 1; }
        it.pop = Math.max(0, it.pop - dt * 3);
        const cur = it.formal ? it.B : it.A;
        const s = d.h * (W < 760 ? 1.45 : 1) * (0.7 + front * 0.6) * (1 + it.pop * 0.35);
        it.sprite.scale.set(s * cur.aspect, s, 1);
        it.mat.opacity = (0.12 + Math.pow(front, 1.6) * 0.88) * (it.formal ? 1 : 0.8);
      });
    });
    renderer.render(scene, camera);
  };

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; clock.getDelta(); }, { threshold: 0 });
  io.observe(container);
  const onVis = () => { running = !document.hidden; clock.getDelta(); };
  document.addEventListener('visibilitychange', onVis);

  // build rings once fonts are ready so the canvas textures use the real typeface
  (document.fonts?.ready ?? Promise.resolve()).then(() => { buildRings(); resize(); });
  resize(); frame();

  return {
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      disposables.forEach((d) => d.dispose());
      blob.geometry.dispose(); blobMat.dispose(); sg.dispose(); stars.material.dispose();
      renderer.dispose(); canvas.remove(); cardEls.forEach((e) => e.remove());
    },
  };
}
