import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface GlitchLogo3DProps {
  size?: number | string;
  className?: string;
  labelId?: string;
  compact?: boolean;
}

export const GlitchLogo3D: React.FC<GlitchLogo3DProps> = ({
  size = 256,
  className = "",
  labelId = "slangnorm-label",
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous children if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const currentSize =
      typeof size === "number" ? size : container.clientWidth || 256;

    const COLORS = {
      cyan: 0x00e5ff,
      violet: 0x8b5cf6,
      white: 0xffffff,
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0, compact ? 4.2 : 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(currentSize, currentSize);
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    const logoGroup = new THREE.Group();
    mainGroup.add(logoGroup);

    const segments: THREE.Mesh[] = [];
    const segMat = new THREE.MeshPhongMaterial({
      color: COLORS.white,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.75,
      shininess: 100,
      transparent: true,
      opacity: 1,
    });

    function addBox(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      rz = 0
    ) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, segMat.clone());
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      mesh.userData = {
        homePos: new THREE.Vector3(x, y, z),
        homeRotZ: rz,
      };
      logoGroup.add(mesh);
      segments.push(mesh);
    }

    const unit = 0.62;
    const t = 0.09;
    const half = unit / 2;

    // S
    const sx = -0.52;
    addBox(unit * 0.85, t, t, sx, half, 0);
    addBox(unit * 0.85, t, t, sx, 0, 0);
    addBox(unit * 0.85, t, t, sx, -half, 0);
    addBox(t, half + t / 2, t, sx - unit * 0.42 + t / 2, half / 2, 0);
    addBox(t, half + t / 2, t, sx + unit * 0.42 - t / 2, -half / 2, 0);

    // N
    const nx = 0.52;
    addBox(t, unit, t, nx - unit * 0.42, 0, 0);
    addBox(t, unit, t, nx + unit * 0.42, 0, 0);
    const diagLen = unit * 1.12;
    addBox(t, diagLen, t, nx, 0, 0, -Math.atan2(unit, unit * 0.84));

    const ghosts: THREE.Group[] = [];
    for (let i = 0; i < 2; i++) {
      const ghost = logoGroup.clone();
      ghost.visible = false;
      ghost.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = (child.material as THREE.Material).clone();
          (child.material as THREE.MeshPhongMaterial).opacity = 0.25;
          (child.material as THREE.MeshPhongMaterial).emissive.set(
            i === 0 ? COLORS.violet : COLORS.cyan
          );
        }
      });
      scene.add(ghost);
      ghosts.push(ghost);
    }

    const TOKENS = [
      "fr",
      "ngl",
      "no cap",
      "rizz",
      "[NLP]",
      "[0.98]",
      "bruh",
      "[decode]",
    ];
    function makeTokenTexture(text: string) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "600 30px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#7fefff";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 8;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 128, 32);
      }
      return new THREE.CanvasTexture(canvas);
    }

    const tokenSprites: THREE.Sprite[] = [];
    const TOKEN_COUNT = compact ? 4 : 6;
    for (let i = 0; i < TOKEN_COUNT; i++) {
      const text = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      const mat = new THREE.SpriteMaterial({
        map: makeTokenTexture(text),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.9, 0.22, 1);
      const angle = (i / TOKEN_COUNT) * Math.PI * 2;
      const r = 1.35 + Math.random() * 0.3;
      sprite.userData = {
        angle,
        radius: r,
        speed: 0.06 + Math.random() * 0.05,
        yOff: (Math.random() - 0.5) * 0.6,
        baseOpacity: 0.16 + Math.random() * 0.12,
      };
      scene.add(sprite);
      tokenSprites.push(sprite);
    }

    const PCOUNT = 90;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PCOUNT * 3);
    for (let i = 0; i < PCOUNT * 3; i++) pPos[i] = (Math.random() - 0.5) * 0.15;
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: COLORS.cyan,
      size: 0.02,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const pointLight = new THREE.PointLight(COLORS.cyan, 1.1, 12);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const targetTilt = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTilt.y = nx * 0.3;
      targetTilt.x = ny * 0.2;
    };
    const onPointerLeave = () => {
      targetTilt.x = 0;
      targetTilt.y = 0;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    let isGlitching = false;
    let glitchStart = 0;
    const GLITCH_DURATION = 220;
    let nextGlitchAt = performance.now() + 3000 + Math.random() * 3000;

    function triggerGlitch(now: number) {
      isGlitching = true;
      glitchStart = now;
      ghosts.forEach((g) => (g.visible = true));

      const label = document.getElementById(labelId);
      if (label) {
        const original = "SLANGNORM AI";
        const chars = "01#/[]_";
        let frames = 0;
        const iv = setInterval(() => {
          label.innerText = original
            .split("")
            .map((c) =>
              c !== " " && Math.random() > 0.82
                ? chars[Math.floor(Math.random() * chars.length)]
                : c
            )
            .join("");
          if (frames++ > 3) {
            clearInterval(iv);
            label.innerText = original;
          }
        }, 45);
      }
    }

    const clock = new THREE.Clock();
    let animId: number;

    function tick() {
      animId = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      logoGroup.rotation.y += dt * 0.55;
      logoGroup.rotation.x = Math.sin(t * 0.3) * 0.08;
      mainGroup.rotation.x += (targetTilt.x - mainGroup.rotation.x) * 0.08;
      mainGroup.rotation.y += (targetTilt.y - mainGroup.rotation.y) * 0.08;

      if (!isGlitching && now > nextGlitchAt) {
        triggerGlitch(now);
        nextGlitchAt = now + 4000 + Math.random() * 3000;
      }

      if (isGlitching) {
        const elapsed = now - glitchStart;
        const progress = elapsed / GLITCH_DURATION;
        const severity = 1 - progress;
        segments.forEach((seg) => {
          seg.position.set(
            seg.userData.homePos.x + (Math.random() - 0.5) * 0.03 * severity,
            seg.userData.homePos.y + (Math.random() - 0.5) * 0.03 * severity,
            seg.userData.homePos.z
          );
        });
        camera.position.x = (Math.random() - 0.5) * 0.02 * severity;
        camera.position.y = (Math.random() - 0.5) * 0.02 * severity;
        ghosts.forEach((ghost) => {
          ghost.position.set(
            (Math.random() - 0.5) * 0.08 * severity,
            (Math.random() - 0.5) * 0.08 * severity,
            0
          );
          ghost.rotation.copy(logoGroup.rotation);
        });
        pMat.opacity = 0.5 * severity;
        const parr = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < PCOUNT * 3; i += 3) {
          parr[i] += (Math.random() - 0.5) * 0.05;
          parr[i + 1] += (Math.random() - 0.5) * 0.05;
          parr[i + 2] += (Math.random() - 0.5) * 0.05;
          if (Math.abs(parr[i]) > 1.1) parr[i] *= 0.3;
        }
        pGeo.attributes.position.needsUpdate = true;
        if (elapsed > GLITCH_DURATION) {
          isGlitching = false;
          segments.forEach((seg) => seg.position.copy(seg.userData.homePos));
          ghosts.forEach((g) => (g.visible = false));
          camera.position.x = 0;
          camera.position.y = 0;
        }
      } else {
        pMat.opacity += (0 - pMat.opacity) * 0.1;
      }

      tokenSprites.forEach((s) => {
        const d = s.userData;
        d.angle += dt * d.speed;
        s.position.set(
          Math.cos(d.angle) * d.radius,
          Math.sin(d.angle) * d.radius * 0.4 + d.yOff,
          Math.sin(d.angle * 0.7) * 0.5
        );
        if (!isGlitching)
          s.material.opacity += (d.baseOpacity - s.material.opacity) * 0.02;
      });

      renderer.render(scene, camera);
    }
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || currentSize;
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      renderer.setSize(w, w);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [size, compact, labelId]);

  return (
    <div
      ref={containerRef}
      id={`threejs-container-${labelId}`}
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
    />
  );
};
