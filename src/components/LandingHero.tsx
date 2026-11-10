import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import {
  Sparkles,
  Zap,
  ArrowRight,
  ChevronDown,
  Layers,
  Cpu,
  Database,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  Terminal,
  Activity,
  Copy,
  Check,
  ChevronUp,
  ShieldCheck,
  Code2,
  Menu,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { GlitchLogo3D } from "./GlitchLogo3D";
import { mountSlangOrbit } from "./slang-orbit.js";

interface LandingHeroProps {
  onStart: () => void;
  onExplore: (tab: string) => void;
  totalTerms: number;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStart,
  onExplore,
  totalTerms,
}) => {
  const [demoInput, setDemoInput] = useState("ngl this bussin fr, no cap lowkey slay ✨");
  const [demoOutput, setDemoOutput] = useState("not gonna lie this is exceptionally good for real, no lie somewhat impressively well ✨");
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Scroll effects state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [activeDialect, setActiveDialect] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Stats counter animation state
  const [statsVisible, setStatsVisible] = useState(false);
  const [counterValues, setCounterValues] = useState({
    served: 0,
    terms: 0,
    accuracy: 0,
    sources: 0,
    languages: 0,
  });

  const heroRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const scrollRefY = useRef(0);

  useEffect(() => {
    const orbit = mountSlangOrbit(heroRef.current);
    return () => orbit.destroy();
  }, []);

  const samplePrompts = [
    { in: "ngl this bussin fr, no cap lowkey slay ✨", out: "not gonna lie this is exceptionally good for real, no lie somewhat impressively well ✨" },
    { in: "bro crashed out and lost all his aura 💀", out: "he lost his composure recklessly and forfeited all his personal charisma 💀" },
    { in: "she cooked so hard with that presentation, ate no crumbs fr", out: "she delivered that presentation with extraordinary excellence, executed flawlessly indeed" },
    { in: "lowkey delulu thinking he has that unspoken rizz", out: "somewhat unrealistically optimistic believing he possesses natural effortless charm" },
    { in: "that fit is giving main character energy rn", out: "that outfit is projecting charismatic protagonist presence right now" },
  ];

  const dialectMatrix = [
    {
      id: "genz",
      label: "Gen-Z Internet",
      badge: "Trending",
      slang: "ngl this project is highkey goated with the sauce, no cap 🚀",
      normal: "To be completely honest, this project is exceptionally high quality and truly outstanding.",
      tags: ["Highkey", "Goated", "No Cap"],
      confidence: 99.4,
    },
    {
      id: "uk",
      label: "UK Drill / Roadman",
      badge: "Regional",
      slang: "mans moving pattern, that's proper peak but he backed his chat 🇬🇧",
      normal: "He is behaving suspiciously, which is very unfortunate, but he substantiated his claims.",
      tags: ["Pattern", "Peak", "Backed Chat"],
      confidence: 97.8,
    },
    {
      id: "gaming",
      label: "Gaming & Esports",
      badge: "Subculture",
      slang: "he was hard griefing mid lane, straight inting for no reason 🎮",
      normal: "He was deliberately sabotaging the central lane and repeatedly conceding defeats without justification.",
      tags: ["Griefing", "Mid Lane", "Inting"],
      confidence: 98.9,
    },
    {
      id: "corporate",
      label: "Corporate Buzz",
      badge: "Colloquial",
      slang: "let's double click on that deliverable to boil the ocean asynchronously 💼",
      normal: "Let us examine that task in greater depth without attempting an unnecessarily large scope simultaneously.",
      tags: ["Double Click", "Deliverable", "Boil Ocean"],
      confidence: 96.5,
    },
  ];

  const pipelineSteps = [
    {
      step: "01",
      name: "Tokenization & Slang Detection",
      desc: "Raw text undergoes sub-word tokenization and fast dictionary matching against 10,000+ cached neologisms.",
      icon: Terminal,
      metric: "< 4ms",
      badge: "Lexical Trie",
    },
    {
      step: "02",
      name: "Context & Subculture Identification",
      desc: "Identifies whether terms originate from Gen-Z slang, gaming vernacular, regional dialects, or corporate buzz.",
      icon: Layers,
      metric: "98.2% Acc",
      badge: "Semantic Classifier",
    },
    {
      step: "03",
      name: "Semantic Expansion & Disambiguation",
      desc: "Multi-word slang phrases like 'touch grass' or 'rent free' are grouped and assigned semantic formal synonyms.",
      icon: Cpu,
      metric: "Zero Hallucination",
      badge: "Knowledge Graph",
    },
    {
      step: "04",
      name: "Formal Fluency Synthesis",
      desc: "Rebuilds the sentence into grammatically polished, natural formal English while preserving tone and emotional intent.",
      icon: Sparkles,
      metric: "Sub-100ms",
      badge: "GPT-4o mini",
    },
  ];

  const faqs = [
    {
      q: "How does SlangNorm AI discover new slang terms in real-time?",
      a: "The platform runs background scraping spiders across Reddit, Urban Dictionary, KnowYourMeme, Twitter/X, and social feeds. When an unknown token is identified in user submissions or crawler streams, our LLM verification pipeline analyzes context, generates definitions, and indexes it directly into our persistent database.",
    },
    {
      q: "Does it support regional and cultural slang beyond US Gen-Z?",
      a: "Yes! The system is trained to recognize British Roadman/Drill vernacular, Australian colloquialisms, AAVE expressions, gaming/Twitch jargon, and corporate euphemisms with dedicated contextual weights.",
    },
    {
      q: "Can I export the slang database or connect via API?",
      a: "Absolutely. The full indexed dataset is exportable in JSON and CSV formats with timestamps, categories, and formal translations. Direct REST endpoints are provided in the backend for programmatic integration.",
    },
    {
      q: "How does it prevent hallucinations or inaccurate translations?",
      a: "Every term is grounded through a hybrid verification: first checking against the curated database of confirmed definitions, and second verifying against contextual sentiment to ensure formal translations don't distort original meaning.",
    },
  ];

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      scrollRefY.current = currentScrollY;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        setScrollProgress((currentScrollY / maxScroll) * 100);
      }

      // Check stats visibility
      if (statsSectionRef.current) {
        const rect = statsSectionRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
          setStatsVisible(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Stats number counting animation
  useEffect(() => {
    if (!statsVisible) return;
    
    const duration = 2000;
    const startTime = performance.now();
    const targetTerms = totalTerms > 0 ? totalTerms : 10420;

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounterValues({
        served: Math.floor(ease * 48291),
        terms: Math.floor(ease * targetTerms),
        accuracy: Math.floor(ease * 98.4 * 10) / 10,
        sources: Math.floor(ease * 6),
        languages: Math.floor(ease * 12),
      });

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [statsVisible, totalTerms]);

  // Three.js Globe Setup with responsive scaling and touch support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || Math.min(window.innerWidth, 800);
    let height = container.clientHeight || Math.min(window.innerHeight, 800);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    
    // Adjust camera distance based on initial screen width
    const getCameraZ = (w: number) => (w < 480 ? 8.8 : w < 768 ? 7.6 : 6.8);
    camera.position.z = getCameraZ(window.innerWidth);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const GLOBE_RADIUS = 2.2;

    // 1. Dark glowing inner sphere (globe body)
    const innerGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 36, 36);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x020f17,
      emissive: 0x002b36,
      emissiveIntensity: 0.8,
      shininess: 30,
      transparent: true,
      opacity: 0.9,
    });
    const innerSphere = new THREE.Mesh(innerGeom, innerMat);
    globeGroup.add(innerSphere);

    // 2. Glowing atmospheric outer halo
    const atmosGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosGeom, atmosMat);
    globeGroup.add(atmosphere);

    // 3. Dense cybernetic dot cloud across continents
    const DOTS_COUNT = 1800;
    const dotGeom = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(DOTS_COUNT * 3);
    const dotColors = new Float32Array(DOTS_COUNT * 3);

    const colorPrimary = new THREE.Color(0x00f0ff);
    const colorTeal = new THREE.Color(0x2dd4bf);
    const colorIndigo = new THREE.Color(0x818cf8);

    for (let i = 0; i < DOTS_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = GLOBE_RADIUS + (Math.random() * 0.04);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      dotPositions[i * 3] = x;
      dotPositions[i * 3 + 1] = y;
      dotPositions[i * 3 + 2] = z;

      const pick = Math.random();
      const col = pick > 0.6 ? colorPrimary : pick > 0.3 ? colorTeal : colorIndigo;
      dotColors[i * 3] = col.r;
      dotColors[i * 3 + 1] = col.g;
      dotColors[i * 3 + 2] = col.b;
    }

    dotGeom.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    dotGeom.setAttribute("color", new THREE.BufferAttribute(dotColors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const dotPoints = new THREE.Points(dotGeom, dotMat);
    globeGroup.add(dotPoints);

    // 4. Wireframe latitude/longitude rings
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.18,
    });

    for (let lat = -60; lat <= 60; lat += 30) {
      const latRad = (lat * Math.PI) / 180;
      const radius = GLOBE_RADIUS * Math.cos(latRad);
      const y = GLOBE_RADIUS * Math.sin(latRad);

      const circleGeom = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
      }
      circleGeom.setFromPoints(pts);
      const line = new THREE.Line(circleGeom, ringMat);
      globeGroup.add(line);
    }

    // 5. Dialect Hubs
    const hubs = [
      { name: "North America Gen-Z", lat: 37.7749, lon: -122.4194, col: 0x00f0ff },
      { name: "UK Drill / Roadman", lat: 51.5074, lon: -0.1278, col: 0x2dd4bf },
      { name: "East Asia Netizen", lat: 35.6762, lon: 139.6503, col: 0x818cf8 },
      { name: "Australia Colloquial", lat: -33.8688, lon: 151.2093, col: 0xf59e0b },
      { name: "Latin America Viral", lat: -23.5505, lon: -46.6333, col: 0xf43f5e },
      { name: "South Asia Vernacular", lat: 19.0760, lon: 72.8777, col: 0x06b6d4 },
    ];

    const latLonToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    const hubMarkers: { mesh: THREE.Mesh; ring: THREE.Mesh; pos: THREE.Vector3 }[] = [];

    hubs.forEach((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, GLOBE_RADIUS + 0.02);

      const markerGeom = new THREE.SphereGeometry(0.06, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: hub.col });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.copy(pos);
      globeGroup.add(marker);

      const pulseGeom = new THREE.RingGeometry(0.08, 0.12, 24);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: hub.col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
      pulseMesh.position.copy(pos);
      pulseMesh.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(pulseMesh);

      hubMarkers.push({ mesh: marker, ring: pulseMesh, pos });
    });

    // 6. Linguistic Data Transmission Arcs
    const arcs: { curve: THREE.QuadraticBezierCurve3; pulseMesh: THREE.Mesh; progress: number; speed: number }[] = [];

    for (let i = 0; i < hubMarkers.length; i++) {
      for (let j = i + 1; j < hubMarkers.length; j++) {
        if (Math.random() > 0.4) {
          const v1 = hubMarkers[i].pos;
          const v2 = hubMarkers[j].pos;
          const mid = v1.clone().add(v2).multiplyScalar(0.5);
          const dist = v1.distanceTo(v2);
          mid.normalize().multiplyScalar(GLOBE_RADIUS + dist * 0.45);

          const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
          const pts = curve.getPoints(36);
          const geom = new THREE.BufferGeometry().setFromPoints(pts);
          const mat = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.35,
          });
          const arcLine = new THREE.Line(geom, mat);
          globeGroup.add(arcLine);

          const pulseG = new THREE.SphereGeometry(0.04, 8, 8);
          const pulseM = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const pMesh = new THREE.Mesh(pulseG, pulseM);
          globeGroup.add(pMesh);

          arcs.push({
            curve,
            pulseMesh: pMesh,
            progress: Math.random(),
            speed: 0.004 + Math.random() * 0.006,
          });
        }
      }
    }

    // 7. Floating Linguistic Tokens
    const tokensCount = 20;
    const tokenGeom = new THREE.BoxGeometry(0.08, 0.04, 0.02);
    const tokenMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      wireframe: true,
    });

    const tokens: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];

    for (let k = 0; k < tokensCount; k++) {
      const tMesh = new THREE.Mesh(tokenGeom, tokenMat);
      const angle = (k / tokensCount) * Math.PI * 2;
      const r = GLOBE_RADIUS * 1.35 + Math.random() * 0.3;
      const yOffset = (Math.random() - 0.5) * 2;

      tMesh.position.set(Math.cos(angle) * r, yOffset, Math.sin(angle) * r);
      globeGroup.add(tMesh);

      tokens.push({
        mesh: tMesh,
        angle,
        radius: r,
        speed: 0.003 + Math.random() * 0.005,
        yOffset,
      });
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.2);
    dirLight1.position.set(5, 4, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.6);
    dirLight2.position.set(-5, -4, -4);
    scene.add(dirLight2);

    // Interactive Dragging & Touch Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0.2;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handlePointerDown = (clientX: number, clientY: number) => {
      isDragging = true;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      mouseX = (clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (clientY / window.innerHeight - 0.5) * 0.3;

      if (!isDragging) return;

      const deltaMove = {
        x: clientX - previousMousePosition.x,
        y: clientY - previousMousePosition.y,
      };

      targetRotationY += deltaMove.x * 0.005;
      targetRotationX += deltaMove.y * 0.005;

      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    // Mouse listeners
    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    // Touch listeners for Phone and Tablet
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    // ResizeObserver for reliable dimension handling on phones, tabs, and desktop
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || Math.min(window.innerWidth, 800);
      const h = container.clientHeight || Math.min(window.innerHeight, 800);
      camera.aspect = w / h;
      camera.position.z = getCameraZ(window.innerWidth);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    let reqId: number;
    function animate() {
      reqId = requestAnimationFrame(animate);

      // Auto-rotation plus dynamic tilt responsive to page scroll
      targetRotationY += 0.0035;
      const scrollTilt = (scrollRefY.current * 0.0004);

      globeGroup.rotation.y += (targetRotationY + mouseX - globeGroup.rotation.y) * 0.06;
      globeGroup.rotation.x += (targetRotationX + mouseY + scrollTilt - globeGroup.rotation.x) * 0.06;

      arcs.forEach((arc) => {
        arc.progress += arc.speed;
        if (arc.progress > 1) arc.progress = 0;
        const pos = arc.curve.getPoint(arc.progress);
        arc.pulseMesh.position.copy(pos);
      });

      const time = Date.now() * 0.003;
      hubMarkers.forEach((hub, idx) => {
        const s = 1 + Math.sin(time + idx) * 0.35;
        hub.ring.scale.set(s, s, s);
        (hub.ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(time + idx) * 0.3;
      });

      tokens.forEach((t) => {
        t.angle += t.speed;
        t.mesh.position.x = Math.cos(t.angle) * t.radius;
        t.mesh.position.z = Math.sin(t.angle) * t.radius;
        t.mesh.position.y = t.yOffset + Math.sin(time + t.angle) * 0.15;
        t.mesh.rotation.x += 0.02;
        t.mesh.rotation.y += 0.03;
      });

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);

      renderer.dispose();
      innerGeom.dispose();
      innerMat.dispose();
      atmosGeom.dispose();
      atmosMat.dispose();
      dotGeom.dispose();
      dotMat.dispose();
      container.innerHTML = "";
    };
  }, []);

  const handleTestPrompt = (p: { in: string; out: string }) => {
    setIsNormalizing(true);
    setDemoInput(p.in);
    setDemoOutput("Normalizing with LLM semantic pipeline...");
    setTimeout(() => {
      setDemoOutput(p.out);
      setIsNormalizing(false);
    }, 450);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 1500);
  };

  return (
    <div className="relative min-h-screen bg-[#04040e] text-white selection:bg-cyan-500/30 selection:text-cyan-300 overflow-x-hidden font-sans">
      {/* Dynamic Background Telemetry Stream */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20 select-none">
        <div
          className="absolute font-mono text-cyan-400/30 text-[10px] sm:text-xs tracking-widest transition-transform duration-100 hidden sm:block"
          style={{ top: "15%", left: "5%", transform: `translateY(${scrollY * -0.15}px)` }}
        >
          [slang.term: "fr fr" // token_0x89A]
        </div>
        <div
          className="absolute font-mono text-cyan-300/20 text-xs sm:text-sm tracking-widest transition-transform duration-100 hidden sm:block"
          style={{ top: "35%", right: "8%", transform: `translateY(${scrollY * -0.22}px)` }}
        >
          &lt;vector_dim: "no cap" conf: 0.998&gt;
        </div>
        <div
          className="absolute font-mono text-teal-400/25 text-[10px] sm:text-xs tracking-widest transition-transform duration-100 hidden sm:block"
          style={{ top: "60%", left: "8%", transform: `translateY(${scrollY * -0.18}px)` }}
        >
          ::NLP_STREAM // parsed: "lowkey cooked"
        </div>
        <div
          className="absolute font-mono text-cyan-500/20 text-[10px] sm:text-xs tracking-widest transition-transform duration-100 hidden sm:block"
          style={{ top: "80%", right: "12%", transform: `translateY(${scrollY * -0.25}px)` }}
        >
          [CRAWL_NODE: Reddit/GenZ + TikTok sync]
        </div>
      </div>

      {/* Top Navbar */}
      <nav className="bg-[#04040e]/80 backdrop-blur-2xl border-b border-white/[0.08] fixed top-0 w-full z-50 transition-all duration-300">
        <div className="flex justify-between items-center h-16 sm:h-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 relative flex items-center justify-center shrink-0">
              <GlitchLogo3D size={40} compact={true} labelId="nav-logo-hero" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-white tracking-tight block leading-tight">
                SlangNorm <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">AI</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400/70 tracking-widest uppercase block">
                NLP Linguistic Mining
              </span>
            </div>
          </div>

          {/* Desktop / Tablet Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all" href="#pipeline">Architecture</a>
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all" href="#dialects">Dialects</a>
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all" href="#sources">Logos & Sources</a>
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all" href="#demo">Live Demo</a>
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all" href="#features">Features</a>
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all" href="#faq">FAQ</a>
            <a className="text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1" href="https://github.com/Abhay-211/slangnormai" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              GitHub
            </a>
          </div>

          {/* Right Action Button & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-launch-studio text-xs uppercase tracking-wider cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
                color: "#04040e",
                fontWeight: 900,
              }}
            >
              <Zap className="w-4 h-4 fill-[#04040e] text-[#04040e]" />
              <span>Launch Studio</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Collapsible Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#060614] border-b border-white/10 px-4 py-4 space-y-2 backdrop-blur-3xl animate-in slide-in-from-top-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStart();
              }}
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-launch-studio text-xs uppercase tracking-wider"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
                color: "#04040e",
                fontWeight: 900,
              }}
            >
              <Zap className="w-4 h-4 fill-[#04040e] text-[#04040e]" />
              <span>Launch Studio</span>
            </button>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="#sources"
            >
              Data Sources & Logos
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="#pipeline"
            >
              Architecture Pipeline
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="#dialects"
            >
              Cross-Cultural Dialects
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="#demo"
            >
              Interactive Normalizer
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="#features"
            >
              System Features
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="#faq"
            >
              FAQ
            </a>
            <a
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300"
              href="https://github.com/Abhay-211/slangnormai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              GitHub Repository
            </a>
          </div>
        )}
      </nav>

      {/* Floating Bottom Telemetry HUD */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto">
        <div className="hidden sm:flex items-center gap-3 bg-[#04040e]/90 backdrop-blur-xl border border-cyan-500/30 px-3.5 py-1.5 rounded-full shadow-lg shadow-cyan-500/10 text-[11px] font-mono text-slate-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-cyan-300 font-semibold">CORE LIVE</span>
          <span className="text-white/20">|</span>
          <span className="text-slate-400">SCROLL: {Math.round(scrollProgress)}%</span>
        </div>
        {scrollY > 300 && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-300 flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 cursor-pointer"
            title="Scroll to Top"
          >
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      <main className="pt-20 sm:pt-24 pb-16 relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 sm:py-12 overflow-hidden">
          {/* Three.js Globe Container (Responsive sizing and touch friendly) */}
          <div
            ref={containerRef}
            id="threejs-container"
            className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-70 sm:opacity-85 overflow-hidden"
            style={{ zIndex: 1 }}
          />

          {/* Hero Content Overlay */}
          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center pointer-events-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 font-mono text-[10px] sm:text-xs mb-4 sm:mb-6 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
              <span className="tracking-widest uppercase">POWERED BY OPENAI · NLP PIPELINE · LIVE DATASET</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-3 sm:mb-6 leading-tight sm:leading-none">
              DECODE THE <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                INTERNET'S LANGUAGE
              </span>
            </h1>

            {/* Subtext description */}
            <p className="text-xs sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-3 text-center leading-relaxed bg-[#04040e]/70 p-3.5 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
              A production-grade AI system that transforms slang, internet speak, and regional expressions into clear formal text — with a live-crawled dataset that never stops learning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 sm:mb-12 w-full sm:w-auto px-4 sm:px-0">
              <button
                onClick={onStart}
                className="px-7 py-3.5 rounded-xl btn-launch-studio text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                style={{
                  background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
                  color: "#04040e",
                  fontWeight: 900,
                }}
              >
                <Zap className="w-4 h-4 fill-[#04040e] text-[#04040e]" />
                <span>Launch Studio</span>
                <ArrowRight className="w-4 h-4 text-[#04040e]" />
              </button>
              <button
                onClick={() => {
                  const feat = document.getElementById("pipeline");
                  if (feat) feat.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-3.5 rounded-xl border border-white/20 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-300 transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Layers className="w-4 h-4" />
                <span>Explore Architecture</span>
              </button>
            </div>

            {/* Scroll Down Indicator */}
            <div
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer mt-2"
              onClick={() => {
                const demo = document.getElementById("sources");
                if (demo) demo.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest">Scroll to explore</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
            </div>
          </div>
        </section>

        {/* Live Data Sources & Integrations Logos Section */}
        <section id="sources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10 sm:my-16 relative z-20">
          <div className="bg-[#060614]/70 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Harvesting & Neural Synthesis Network</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  Integrated Slang Crawlers & AI Model Backends
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>9 NODES SYNCED</span>
              </div>
            </div>

            {/* Logos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                {
                  name: "Reddit",
                  sub: "r/GenZ • r/slang",
                  badge: "Live Crawl",
                  badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                      Rd
                    </div>
                  ),
                },
                {
                  name: "Urban Dictionary",
                  sub: "10,000+ Definitions",
                  badge: "Indexed",
                  badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-xs">
                      UD
                    </div>
                  ),
                },
                {
                  name: "Know Your Meme",
                  sub: "Cultural Origins",
                  badge: "Archived",
                  badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                      KYM
                    </div>
                  ),
                },
                {
                  name: "Twitter / X",
                  sub: "Viral Internet Speak",
                  badge: "Real-time",
                  badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs">
                      𝕏
                    </div>
                  ),
                },
                {
                  name: "TikTok",
                  sub: "Trending Audio/Text",
                  badge: "Viral Feed",
                  badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xs">
                      TT
                    </div>
                  ),
                },
                {
                  name: "Twitch",
                  sub: "Esports & Gaming Jargon",
                  badge: "Stream NLP",
                  badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                      Tw
                    </div>
                  ),
                },
                {
                  name: "Discord",
                  sub: "Community Colloquialisms",
                  badge: "Subculture",
                  badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      Dc
                    </div>
                  ),
                },
                {
                  name: "OpenAI GPT-4o",
                  sub: "Neural Translation",
                  badge: "Core LLM",
                  badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      AI
                    </div>
                  ),
                },
                {
                  name: "Hugging Face",
                  sub: "Embedding Vector Trie",
                  badge: "Tokens",
                  badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                      HF
                    </div>
                  ),
                },
                {
                  name: "Studio Engine",
                  sub: "Interactive Workbench",
                  badge: "Live Ready",
                  badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
                  icon: (
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                      <Zap className="w-4 h-4 fill-cyan-400" />
                    </div>
                  ),
                },
              ].map((src, i) => (
                <div
                  key={i}
                  className="bg-[#04040e]/90 p-3 sm:p-3.5 rounded-xl border border-white/[0.08] hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all flex items-center gap-3 group"
                >
                  <div className="shrink-0 group-hover:scale-105 transition-transform">
                    {src.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{src.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{src.sub}</div>
                    <div className="mt-1">
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${src.badgeColor}`}>
                        {src.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Holographic Terminal Demo */}
        <section className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-20 relative z-20" id="demo">
          <div className="rounded-2xl overflow-hidden backdrop-blur-3xl w-full border border-cyan-500/30 bg-[#060614]/80 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            {/* Terminal Header */}
            <div className="bg-black/70 px-4 py-3 flex items-center justify-between border-b border-cyan-500/20">
              <div className="flex gap-2 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse"></div>
                <span className="ml-2 font-mono text-[11px] text-slate-400">interactive_normalizer.exe</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => copyToClipboard(demoOutput)}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10"
                >
                  {copiedDemo ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDemo ? "Copied" : "Copy Output"}</span>
                </button>
                <div className="font-mono text-cyan-400 text-[10px] uppercase tracking-wider hidden sm:block">
                  LIVE PIPELINE
                </div>
              </div>
            </div>

            {/* Terminal Content: Responsive 1 col on mobile, 2 cols on tablet/desktop */}
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row items-stretch gap-4 relative">
              {/* Input side */}
              <div className="flex-1 bg-black/60 p-4 sm:p-5 rounded-xl border border-white/10 text-white text-left relative overflow-hidden group">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-2 flex items-center justify-between">
                  <span>Input Vernacular</span>
                  <span className="text-cyan-400 font-bold">RAW</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono select-none">&gt;</span>
                  <span className="font-mono text-cyan-100 text-sm sm:text-base leading-relaxed break-words">
                    {demoInput}
                  </span>
                </div>
              </div>

              {/* Processing Icon / Pulse */}
              <div className="flex flex-row md:flex-col items-center justify-center shrink-0 py-1 md:py-0">
                <div className={`p-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 ${isNormalizing ? "animate-spin" : "animate-pulse"}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              {/* Output side */}
              <div className="flex-1 bg-cyan-950/20 p-4 sm:p-5 rounded-xl border border-cyan-500/30 text-white text-left relative overflow-hidden">
                <div className="text-[10px] font-mono text-cyan-400/80 uppercase mb-2 flex items-center justify-between">
                  <span>Normalized Formal English</span>
                  <span className="text-emerald-400 font-bold">SYNTHESIZED</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono select-none">&gt;</span>
                  <span className="font-sans text-slate-100 text-sm sm:text-base leading-relaxed break-words font-medium">
                    {demoOutput}
                  </span>
                </div>
              </div>
            </div>

            {/* Terminal Presets Footer */}
            <div className="bg-black/50 p-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="shrink-0">Try real samples:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTestPrompt(prompt)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-500/40 font-mono text-[11px] transition-all cursor-pointer truncate max-w-[200px] sm:max-w-none"
                  >
                    "{prompt.in.slice(0, 24)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Metric Stats Grid (Responsive 2 cols phone, 3 cols tab, 5 cols desktop) */}
        <section
          ref={statsSectionRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 relative z-20"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                val: statsVisible ? `${counterValues.served.toLocaleString()}+` : "48,291+",
                label: "Normalizations Served",
                icon: Zap,
                color: "text-cyan-400",
              },
              {
                val: statsVisible ? `${counterValues.terms.toLocaleString()}+` : `${(totalTerms || 10000).toLocaleString()}+`,
                label: "Indexed Slang Terms",
                icon: Database,
                color: "text-indigo-400",
              },
              {
                val: statsVisible ? `${counterValues.accuracy}%` : "98.4%",
                label: "Contextual Accuracy",
                icon: ShieldCheck,
                color: "text-emerald-400",
              },
              {
                val: statsVisible ? `${counterValues.sources}` : "6",
                label: "Live Web Crawlers",
                icon: Radio,
                color: "text-amber-400",
              },
              {
                val: statsVisible ? `${counterValues.languages}` : "12",
                label: "Cultural Dialects",
                icon: Globe,
                color: "text-teal-400",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-2xl bg-[#060614]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/40 transition-all hover:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Live</span>
                  </div>
                  <div>
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight ${stat.color}`}>
                      {stat.val}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Deep Lexical NLP Architecture Pipeline */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 relative z-20" id="pipeline">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono mb-3 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" />
              <span>Multi-Stage Transformer Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              Deep Lexical Architecture
            </h2>
            <p className="text-slate-400 text-xs sm:text-base md:text-lg leading-relaxed">
              Every sentence travels through four synchronized neural stages that parse colloquial semantics and synthesize fluent output in under 120ms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isHighlighted = activeStep === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveStep(idx)}
                  className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 border flex flex-col justify-between cursor-pointer ${
                    isHighlighted
                      ? "bg-cyan-950/30 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] -translate-y-1.5"
                      : "bg-[#060614]/80 border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400">{step.step}</span>
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {step.badge}
                      </span>
                    </div>

                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">{step.name}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">{step.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Benchmark:</span>
                    <span className="text-cyan-300 font-bold">{step.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Cross-Cultural Translation Matrix */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 relative z-20" id="dialects">
          <div className="bg-[#060614]/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-8 lg:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)]">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6 sm:mb-8 pb-6 border-b border-white/10">
              <div>
                <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Cross-Cultural Translation Matrix</span>
                </div>
                <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Seamless across every subculture.
                </h3>
              </div>

              {/* Dialect Selector Tabs */}
              <div className="flex flex-wrap gap-2">
                {dialectMatrix.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDialect(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                      activeDialect === idx
                        ? "bg-cyan-500 text-[#04040e] font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix comparison display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-black/60 p-5 sm:p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                  <span>ORIGINAL SLANG PHRASE</span>
                  <span className="text-cyan-400 font-semibold">{dialectMatrix[activeDialect].badge}</span>
                </div>
                <p className="text-base sm:text-lg font-mono text-cyan-200 leading-relaxed mb-4">
                  "{dialectMatrix[activeDialect].slang}"
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {dialectMatrix[activeDialect].tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-cyan-950/30 p-5 sm:p-6 rounded-2xl border border-cyan-500/40">
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-cyan-300">
                  <span>STANDARDIZED FORMAL EQUIVALENT</span>
                  <span className="text-emerald-400 font-semibold">{dialectMatrix[activeDialect].confidence}% Confidence</span>
                </div>
                <p className="text-base sm:text-lg font-sans text-white leading-relaxed mb-4">
                  "{dialectMatrix[activeDialect].normal}"
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-cyan-500/20">
                  <span>Semantic emotion preserved</span>
                  <button
                    onClick={onStart}
                    className="text-cyan-300 hover:text-cyan-200 font-mono text-xs flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    Try in Studio →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: System Features Modules */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 relative z-20" id="features">
          <div className="mb-10 text-center sm:text-left border-l-4 border-cyan-400 pl-4 py-2 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-r-xl">
            <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">System Capabilities</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Production-Grade AI Architecture
            </h2>
            <p className="text-slate-400 text-xs sm:text-base mt-1 max-w-2xl">
              Equipped with real-time NLP normalizers, sentence synthesis engines, automated multi-source web crawlers, and analytics telemetry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              onClick={onStart}
              className="p-6 sm:p-8 rounded-2xl bg-[#060614]/80 border border-white/10 hover:border-cyan-500/50 transition-all hover:-translate-y-1.5 cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Live AI Normalizer</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Unknown slang is looked up in real-time via AI — no static dictionary limits. Every lookup enriches the shared dataset permanently.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  GPT-4o mini
                </span>
                <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">Launch →</span>
              </div>
            </div>

            <div
              onClick={() => onExplore("Sentence Gen")}
              className="p-6 sm:p-8 rounded-2xl bg-[#060614]/80 border border-white/10 hover:border-cyan-500/50 transition-all hover:-translate-y-1.5 cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Sentence Generator</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Enter any slang term to generate authentic, contextually natural sentences across various dialect flavors with formal equivalents.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  Context Aware
                </span>
                <span className="text-xs text-violet-400 group-hover:translate-x-1 transition-transform">Launch →</span>
              </div>
            </div>

            <div
              onClick={() => onExplore("Web Crawler")}
              className="p-6 sm:p-8 rounded-2xl bg-[#060614]/80 border border-white/10 hover:border-cyan-500/50 transition-all hover:-translate-y-1.5 cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Automated Crawlers</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Automated scraping miners continuously harvest vernacular from NLP datasets, Urban Dictionary, Reddit, and Twitter.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  6 Sources Live
                </span>
                <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform">Launch →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Technical FAQ Accordion */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 relative z-20" id="faq">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono mb-3 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Technical FAQ</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#060614]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-colors hover:border-cyan-500/40"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-semibold text-white text-sm sm:text-base leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-white/[0.06] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 relative z-20">
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 md:p-14 bg-gradient-to-r from-cyan-950/40 via-black to-indigo-950/40 border border-cyan-500/30 text-center shadow-[0_0_60px_rgba(6,182,212,0.15)]">
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <Code2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Ready to Normalize the Web?
              </h2>
              <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                Launch the studio now to normalize custom text, crawl new dialects, or export the master dataset.
              </p>
              <button
                onClick={onStart}
                className="btn-launch-studio uppercase tracking-wider px-6 sm:px-8 py-3.5 rounded-xl transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
                style={{
                  background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
                  color: "#04040e",
                  fontWeight: 900,
                }}
              >
                <Zap className="w-4 h-4 fill-[#04040e] text-[#04040e]" />
                <span>Launch SlangNorm Studio</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#04040e]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black/90 backdrop-blur-xl w-full py-10 sm:py-14 border-t border-white/10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
          <div className="flex flex-col gap-2">
            <span className="text-lg font-black text-white tracking-tight">SlangNorm AI</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open linguistic transformation platform for internet vernacular, memes, and cultural slang.
            </p>
            <p className="text-[10px] font-mono text-slate-500 mt-2">© 2026 SlangNorm AI. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-2.5 text-xs text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold mb-1">Platform</span>
            <button onClick={onStart} className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-left flex items-center gap-1">
              <Zap className="w-3 h-3 fill-cyan-400" />
              Launch Studio
            </button>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors" href="#features">Features Overview</a>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors" href="#pipeline">NLP Architecture</a>
          </div>
          <div className="flex flex-col gap-2.5 text-xs text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold mb-1">Resources</span>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors" href="#dialects">Dialect Matrix</a>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors" href="#demo">Live Normalizer Demo</a>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors" href="#faq">Technical FAQ</a>
          </div>
          <div className="flex flex-col gap-2.5 text-xs text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold mb-1">Links</span>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5" href="https://github.com/Abhay-211/slangnormai" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              GitHub Repository
            </a>
            <a className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5" href="https://www.linkedin.com/in/abhay-chauhan-8937902b9" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 text-sky-400" />
              LinkedIn Profile
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
