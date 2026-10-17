"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * A cutaway of a peat swamp, modelled from boxes, cones and particles.
 *
 * `progress` (0..1) is the scroll position of the chapter. Everything below is a pure
 * function of it: the canal opens, the water table sinks, the peat dries, a fire starts
 * on the surface and creeps down into the dry layer, and smoke rises.
 */

const W = 3.2; // width of one peat block
const D = 2.6; // depth of the cutaway
const FLOOR = -0.7; // top of the mineral soil
const TOP = 0.8; // peat surface

const sm = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Everything that changes with the story, derived from one number. */
function derive(p: number) {
  return {
    gap: 0.06 + 0.86 * sm(0.15, 0.32, p),
    water: 0.7 - 1.0 * sm(0.2, 0.46, p),
    dryness: sm(0.3, 0.62, p),
    treeDry: sm(0.38, 0.62, p),
    burnt: sm(0.7, 0.9, p),
    flame: sm(0.62, 0.7, p) * (1 - 0.8 * sm(0.86, 1, p)),
    smoke: sm(0.64, 0.82, p),
    fire: sm(0.66, 0.97, p),
  };
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

// ───────────── textures (drawn once on a canvas, no image files) ─────────────

function canvasTex(draw: (g: CanvasRenderingContext2D, n: number) => void): THREE.CanvasTexture {
  const n = 128;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  draw(g, n);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const peatTexture = () =>
  canvasTex((g, n) => {
    const r = rng(5);
    g.fillStyle = "#d4d4d4";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 2200; i++) {
      const v = Math.floor(120 + r() * 135);
      g.fillStyle = `rgba(${v},${v},${v},0.55)`;
      g.fillRect(r() * n, r() * n, 1 + r() * 3, 1 + r() * 2);
    }
  });

const emberTexture = () =>
  canvasTex((g, n) => {
    const r = rng(9);
    g.fillStyle = "#3a0d03";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 90; i++) {
      const x = r() * n;
      const y = r() * n;
      const rad = 5 + r() * 16;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, r() > 0.6 ? "#ffd27a" : "#ff6a1f");
      grad.addColorStop(1, "rgba(255,70,10,0)");
      g.fillStyle = grad;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });

const smokeSprite = () =>
  canvasTex((g, n) => {
    const grad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, n, n);
  });

// ───────────── the two halves of the swamp ─────────────

const C_WET = new THREE.Color("#5a4230");
const C_WET_B = new THREE.Color("#3a5878");
const C_MOIST = new THREE.Color("#7a5a3a");
const C_DRY = new THREE.Color("#c4925a");
const C_ASH = new THREE.Color("#4a3e36");
const C_LEAF = new THREE.Color("#2f8a42");
const C_LEAF_DRY = new THREE.Color("#8d8a34");
const C_CHAR = new THREE.Color("#1a1310");

type Tex = { peat: THREE.Texture; ember: THREE.Texture };

const TREES = (() => {
  const r = rng(31);
  return Array.from({ length: 9 }, () => ({
    x: (r() - 0.5) * (W - 0.5),
    z: (r() - 0.5) * (D - 0.6),
    s: 0.75 + r() * 0.5,
    k: 0.6 + r() * 0.4,
  }));
})();

const FLAMES = (() => {
  const r = rng(77);
  return Array.from({ length: 7 }, (_, i) => ({
    x: (r() - 0.5) * (W - 0.6),
    z: (r() - 0.5) * (D - 0.8),
    s: 0.7 + r() * 0.6,
    ph: i * 1.7,
  }));
})();

function Block({ side, progress, tex, still }: { side: -1 | 1; progress: MotionValue<number>; tex: Tex; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const wet = useRef<THREE.Mesh>(null);
  const wetMat = useRef<THREE.MeshStandardMaterial>(null);
  const dry = useRef<THREE.Mesh>(null);
  const dryMat = useRef<THREE.MeshStandardMaterial>(null);
  const line = useRef<THREE.Mesh>(null);
  const burn = useRef<THREE.Mesh>(null);
  const burnMat = useRef<THREE.MeshBasicMaterial>(null);
  const canopies = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const crowns = useRef<(THREE.Group | null)[]>([]);
  const flames = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const p = progress.get();
    const d = derive(p);
    const t = still ? 2 : state.clock.elapsedTime;

    group.current?.position.set(side * (W / 2 + d.gap / 2), 0, 0);

    const wetH = d.water - FLOOR;
    wet.current?.scale.set(W, wetH, D);
    wet.current?.position.set(0, FLOOR + wetH / 2, 0);
    wetMat.current?.color.lerpColors(C_WET, C_WET_B, 0.35 * (1 - d.dryness));

    const dryH = TOP - d.water;
    dry.current?.scale.set(W, dryH, D);
    dry.current?.position.set(0, d.water + dryH / 2, 0);
    if (dryMat.current) {
      dryMat.current.color.lerpColors(C_MOIST, C_DRY, d.dryness).lerp(C_ASH, d.burnt * 0.85);
    }

    line.current?.position.set(0, d.water, 0);

    // smouldering volume: starts at the surface and eats down towards the water table
    const depth = d.fire * dryH;
    if (burn.current) {
      burn.current.visible = depth > 0.01;
      burn.current.scale.set(W + 0.02, Math.max(depth, 0.001), D + 0.02);
      burn.current.position.set(0, TOP - depth / 2, 0);
    }
    if (burnMat.current) {
      const flicker = 0.78 + 0.22 * Math.sin(t * 5 + side) * Math.sin(t * 2.3);
      burnMat.current.color.setScalar(flicker);
      tex.ember.offset.set(t * 0.012, -t * 0.02);
    }

    TREES.forEach((tr, i) => {
      const m = canopies.current[i];
      const g = crowns.current[i];
      if (m) m.color.lerpColors(C_LEAF, C_LEAF_DRY, d.treeDry).lerp(C_CHAR, d.burnt);
      if (g) {
        const s = tr.s * (1 - 0.3 * d.treeDry * tr.k - 0.25 * d.burnt);
        g.scale.setScalar(s);
        g.position.set(tr.x, TOP, tr.z);
        g.rotation.z = d.burnt * 0.12 * tr.k * side;
      }
    });

    FLAMES.forEach((f, i) => {
      const m = flames.current[i];
      if (!m) return;
      const flick = 0.65 + 0.35 * Math.sin(t * 9 + f.ph) * Math.sin(t * 5.3 + f.ph * 2);
      const h = d.flame * f.s * flick;
      m.visible = h > 0.02;
      m.scale.set(f.s * (0.6 + 0.4 * d.flame), Math.max(h, 0.001), f.s * (0.6 + 0.4 * d.flame));
      m.position.set(f.x, TOP + h * 0.25, f.z);
    });
  });

  return (
    <group ref={group}>
      <mesh ref={wet}>
        <boxGeometry />
        <meshStandardMaterial ref={wetMat} map={tex.peat} roughness={1} />
      </mesh>
      <mesh ref={dry}>
        <boxGeometry />
        <meshStandardMaterial ref={dryMat} map={tex.peat} roughness={1} />
      </mesh>
      {/* the water table, a thin bright line on the cut face */}
      <mesh ref={line} scale={[W + 0.03, 0.045, D + 0.03]}>
        <boxGeometry />
        <meshBasicMaterial color="#5ec8ff" />
      </mesh>
      <mesh ref={burn} visible={false}>
        <boxGeometry />
        <meshBasicMaterial ref={burnMat} map={tex.ember} toneMapped={false} />
      </mesh>

      {TREES.map((tr, i) => (
        <group key={i} ref={(g) => void (crowns.current[i] = g)}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 0.44, 6]} />
            <meshStandardMaterial color="#3b2a1c" roughness={1} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <icosahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial ref={(m) => void (canopies.current[i] = m)} color="#2f8a42" flatShading roughness={0.9} />
          </mesh>
        </group>
      ))}

      {FLAMES.map((_, i) => (
        <mesh key={i} ref={(m) => void (flames.current[i] = m)} visible={false}>
          <coneGeometry args={[0.16, 1, 7, 1, true]} />
          <meshBasicMaterial color="#ff5a14" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────── shared parts ─────────────

function Base({ progress }: { progress: MotionValue<number> }) {
  const canal = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const d = derive(progress.get());
    const h = Math.max(0.02, d.water - FLOOR);
    canal.current?.scale.set(Math.max(d.gap - 0.02, 0.001), h, D - 0.04);
    canal.current?.position.set(0, FLOOR + h / 2, 0);
  });
  return (
    <>
      <mesh position={[0, FLOOR - 0.45, 0]} scale={[W * 2 + 1.2, 0.9, D]}>
        <boxGeometry />
        <meshStandardMaterial color="#7a6552" roughness={1} />
      </mesh>
      <mesh ref={canal}>
        <boxGeometry />
        <meshStandardMaterial color="#2a7fb8" transparent opacity={0.65} roughness={0.2} />
      </mesh>
    </>
  );
}

const SMOKE_N = 360;

function Smoke({ progress, still }: { progress: MotionValue<number>; still: boolean }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const geo = useRef<THREE.BufferGeometry>(null);
  const sprite = useMemo(() => smokeSprite(), []);
  const seed = useMemo(() => {
    const r = rng(101);
    return Array.from({ length: SMOKE_N }, () => ({
      x: (r() > 0.5 ? 1 : -1) * (0.5 + r() * (W - 0.6)),
      z: (r() - 0.5) * (D - 0.6),
      v: 0.05 + r() * 0.07,
      ph: r(),
      w: r() * 6,
    }));
  }, []);
  const positions = useMemo(() => new Float32Array(SMOKE_N * 3), []);

  useFrame((state) => {
    const d = derive(progress.get());
    const t = still ? 6 : state.clock.elapsedTime;
    if (mat.current) mat.current.opacity = 0.5 * d.smoke;
    seed.forEach((s, i) => {
      const life = (t * s.v + s.ph) % 1;
      positions[i * 3] = s.x + life * 2.6 + Math.sin(life * 7 + s.w) * 0.25;
      positions[i * 3 + 1] = TOP + 0.1 + life * 5.2;
      positions[i * 3 + 2] = s.z + Math.cos(life * 5 + s.w) * 0.2;
    });
    const attr = geo.current?.getAttribute("position");
    if (attr) attr.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={SMOKE_N} />
      </bufferGeometry>
      <pointsMaterial ref={mat} map={sprite} size={1.3} sizeAttenuation transparent opacity={0} depthWrite={false} color="#8d7466" />
    </points>
  );
}

const SKY_A = new THREE.Color("#1d3248");
const SKY_B = new THREE.Color("#7a3d20");
const SKY_C = new THREE.Color("#2e1b14");

function Rig({ progress }: { progress: MotionValue<number> }) {
  const light = useRef<THREE.PointLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  useFrame((state, dt) => {
    const p = progress.get();
    const d = derive(p);
    const sky = SKY_A.clone().lerp(SKY_B, sm(0.35, 0.68, p)).lerp(SKY_C, sm(0.78, 1, p));
    if (state.scene.background instanceof THREE.Color) state.scene.background.copy(sky);
    if (state.scene.fog) state.scene.fog.color.copy(sky);

    const k = 1 - Math.exp(-dt * 3);
    const tx = Math.sin(p * 1.3) * 1.3 + state.pointer.x * 0.5;
    const ty = 1.8 + p * 0.4 + state.pointer.y * 0.25;
    const tz = 10.2 - p * 1.2;
    state.camera.position.x += (tx - state.camera.position.x) * k;
    state.camera.position.y += (ty - state.camera.position.y) * k;
    state.camera.position.z += (tz - state.camera.position.z) * k;
    state.camera.lookAt(0, 0.45, 0);

    if (light.current) light.current.intensity = 14 * d.flame + 6 * d.fire;
    if (sun.current) sun.current.intensity = 2.2 - 1.2 * sm(0.4, 0.8, p);
  });

  return (
    <>
      <color attach="background" args={["#1d3248"]} />
      <fog attach="fog" args={["#1d3248", 9, 22]} />
      <hemisphereLight args={["#bcd4ee", "#4a3322", 0.8]} />
      <directionalLight ref={sun} position={[3, 5, 5]} intensity={2.2} />
      <pointLight ref={light} position={[0, 1.2, 1.8]} color="#ff7a2a" intensity={0} distance={9} />
    </>
  );
}

export default function PeatScene({
  progress,
  active,
  still,
}: {
  progress: MotionValue<number>;
  active: boolean;
  still: boolean;
}) {
  const tex = useMemo<Tex>(() => ({ peat: peatTexture(), ember: emberTexture() }), []);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.8, 10.2], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-label="3D cutaway of a peat swamp"
    >
      <Rig progress={progress} />
      <Base progress={progress} />
      <Block side={-1} progress={progress} tex={tex} still={still} />
      <Block side={1} progress={progress} tex={tex} still={still} />
      <Smoke progress={progress} still={still} />
    </Canvas>
  );
}
