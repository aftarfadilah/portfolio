"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Track } from "./library";
import { TABLE_Y } from "./sim";
import { loadLabelTexture, makeBackTexture, makeWoodTexture } from "./textures";

export const RACK_X = -20;
const SLEEVE = 3.1;
const SLEEVE_Y = TABLE_Y + 1.1;
const NEIGHBOUR_GAP = 1.9;
const WINDOW = 8;
const INSPECT_DISTANCE = 6.2;
const INSPECT_SCALE = 0.78;

interface Spin {
  x: number;
  y: number;
}

function Sleeve({
  track,
  index,
  pos,
  focus,
  inspecting,
  spinRef,
  onSelect,
}: {
  track: Track;
  index: number;
  pos: React.RefObject<number>;
  focus: number;
  inspecting: boolean;
  spinRef: React.RefObject<{ target: Spin; current: Spin }>;
  onSelect: (index: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const focused = index === focus;
  const showBack = inspecting && focused;

  const [cover, setCover] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let loaded: THREE.Texture | null = null;
    loadLabelTexture(track.id, 768)
      .then((tex) => {
        if (cancelled) tex.dispose();
        else {
          loaded = tex;
          setCover(tex);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [track.id]);

  const back = useMemo(
    () => (showBack ? makeBackTexture(track.title, track.author, track.id) : null),
    [showBack, track],
  );
  useEffect(() => () => back?.dispose(), [back]);

  const scratch = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      up: new THREE.Vector3(),
      goal: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      spinQuat: new THREE.Quaternion(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const d = index - pos.current;
    const absd = Math.abs(d);
    const sign = Math.sign(d);

    if (inspecting && focused) {
      const { forward, up, goal, quat, euler, spinQuat } = scratch;
      camera.getWorldDirection(forward);
      up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      goal
        .copy(camera.position)
        .addScaledVector(forward, INSPECT_DISTANCE)
        .addScaledVector(up, 0.25);
      g.position.x = THREE.MathUtils.damp(g.position.x, goal.x, 7, dt);
      g.position.y = THREE.MathUtils.damp(g.position.y, goal.y, 7, dt);
      g.position.z = THREE.MathUtils.damp(g.position.z, goal.z, 7, dt);
      const spin = spinRef.current.current;
      const sway = Math.sin(state.clock.elapsedTime * 0.7) * 0.03;
      euler.set(spin.x + sway, spin.y, 0, "YXZ");
      spinQuat.setFromEuler(euler);
      quat.copy(camera.quaternion).multiply(spinQuat);
      g.quaternion.slerp(quat, 1 - Math.exp(-8 * dt));
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, INSPECT_SCALE, 8, dt));
      g.visible = true;
      return;
    }

    const hidden = inspecting;
    const lean = Math.min(absd, 1);
    const x =
      RACK_X + (absd < 1 ? d * NEIGHBOUR_GAP : sign * (NEIGHBOUR_GAP + (absd - 1) * 0.42));
    const lift = focused && !inspecting ? 0.12 : 0;
    g.position.x = THREE.MathUtils.damp(g.position.x, x, 10, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, SLEEVE_Y + lift, 10, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, -lean * 0.9, 10, dt);
    scratch.euler.set(0, -sign * lean * 1.05, 0);
    scratch.quat.setFromEuler(scratch.euler);
    g.quaternion.slerp(scratch.quat, 1 - Math.exp(-10 * dt));
    const scale = THREE.MathUtils.damp(g.scale.x, hidden ? 0.001 : 1, 8, dt);
    g.scale.setScalar(scale);
    g.visible = scale > 0.02;
  });

  return (
    <group
      ref={group}
      position={[RACK_X + (index - focus) * NEIGHBOUR_GAP, SLEEVE_Y - 0.6, -0.5]}
      scale={0.6}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 6) return;
        onSelect(index);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh castShadow={false}>
        <boxGeometry args={[SLEEVE, SLEEVE, 0.045]} />
        <meshStandardMaterial attach="material-0" color="#16171d" roughness={0.8} />
        <meshStandardMaterial attach="material-1" color="#16171d" roughness={0.8} />
        <meshStandardMaterial attach="material-2" color="#16171d" roughness={0.8} />
        <meshStandardMaterial attach="material-3" color="#16171d" roughness={0.8} />
        {/* Glossy "shrink-wrapped" cover: clearcoat gives it the plastic sheen. */}
        <meshPhysicalMaterial
          attach="material-4"
          key={cover ? "cover" : "blank"}
          map={cover}
          color={cover ? "#ffffff" : "#2a2c38"}
          roughness={0.42}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.7}
          sheen={0.4}
          sheenRoughness={0.5}
          sheenColor="#ffffff"
        />
        <meshPhysicalMaterial
          attach="material-5"
          key={back ? "back" : "plain"}
          map={back}
          color={back ? "#ffffff" : "#17181f"}
          roughness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

export interface RackProps {
  records: Track[];
  focus: number;
  inspecting: boolean;
  /** The rack is on screen (rack or inspect view). */
  active: boolean;
  onFocus: (index: number) => void;
  onInspect: () => void;
  onBack: () => void;
}

export function Rack({ records, focus, inspecting, active, onFocus, onInspect, onBack }: RackProps) {
  const { gl, camera, pointer } = useThree();
  const pos = useRef(focus);
  const dragFocus = useRef<number | null>(null);
  const spin = useRef({ target: { x: 0, y: 0 }, current: { x: 0, y: 0 } });
  const light = useRef<THREE.PointLight>(null);
  const wood = useMemo(() => makeWoodTexture(), []);
  useEffect(() => () => wood.dispose(), [wood]);

  const state = useRef({ records, focus, inspecting, active, onFocus, onInspect, onBack });
  useEffect(() => {
    state.current = { records, focus, inspecting, active, onFocus, onInspect, onBack };
  });

  // Entering / leaving inspect resets the sleeve's orientation.
  useEffect(() => {
    const s = spin.current;
    s.target.x = inspecting ? -0.12 : 0;
    s.target.y = inspecting ? 0.4 : 0;
    if (!inspecting) {
      s.current.x = s.current.y = 0;
    }
  }, [inspecting]);

  useEffect(() => {
    const el = gl.domElement;
    let wheelAccum = 0;
    let wheelAt = 0;

    const step = (by: number) => {
      const s = state.current;
      const next = Math.min(Math.max(s.focus + by, 0), s.records.length - 1);
      if (next !== s.focus) s.onFocus(next);
    };

    const onWheel = (e: WheelEvent) => {
      const s = state.current;
      if (!s.active || s.inspecting) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelAt > 250) wheelAccum = 0;
      wheelAt = now;
      wheelAccum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(wheelAccum) > 50) {
        step(wheelAccum > 0 ? 1 : -1);
        wheelAccum = 0;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const s = state.current;
      if (!s.active) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const startFocus = s.focus;
      let moved = false;
      const move = (m: PointerEvent) => {
        const dx = m.clientX - startX;
        const dy = m.clientY - startY;
        if (Math.hypot(dx, dy) > 6) moved = true;
        if (state.current.inspecting) {
          spin.current.target.y += (m.movementX ?? 0) * 0.011;
          spin.current.target.x = THREE.MathUtils.clamp(
            spin.current.target.x + (m.movementY ?? 0) * 0.011,
            -1.1,
            1.1,
          );
        } else if (moved) {
          const raw = startFocus - dx / 110;
          dragFocus.current = THREE.MathUtils.clamp(raw, 0, state.current.records.length - 1);
        }
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if (dragFocus.current !== null) {
          const next = Math.round(dragFocus.current);
          dragFocus.current = null;
          if (next !== state.current.focus) state.current.onFocus(next);
        }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };

    const onKey = (e: KeyboardEvent) => {
      const s = state.current;
      if (!s.active) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" && !s.inspecting) step(1);
      else if (e.key === "ArrowLeft" && !s.inspecting) step(-1);
      else if (e.key === "Enter" && !s.inspecting && s.records.length) s.onInspect();
      else if (e.key === "Escape") s.onBack();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [gl]);

  const forward = useMemo(() => new THREE.Vector3(), []);
  const rightV = useMemo(() => new THREE.Vector3(), []);
  const upV = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    pos.current = THREE.MathUtils.damp(pos.current, dragFocus.current ?? focus, 9, dt);

    const s = spin.current;
    s.current.x = THREE.MathUtils.damp(s.current.x, s.target.x, 10, dt);
    s.current.y = THREE.MathUtils.damp(s.current.y, s.target.y, 10, dt);

    // A light that follows the pointer so the plastic catches a moving highlight.
    const l = light.current;
    if (l) {
      camera.getWorldDirection(forward);
      rightV.set(1, 0, 0).applyQuaternion(camera.quaternion);
      upV.set(0, 1, 0).applyQuaternion(camera.quaternion);
      l.position
        .copy(camera.position)
        .addScaledVector(forward, INSPECT_DISTANCE - 2.4)
        .addScaledVector(rightV, pointer.x * 4.2)
        .addScaledVector(upV, pointer.y * 3.2 + 0.3);
      l.intensity = THREE.MathUtils.damp(l.intensity, inspecting ? 26 : 0, 6, dt);
    }
  });

  const from = Math.max(0, focus - WINDOW);
  const visible = records.slice(from, focus + WINDOW + 1);

  return (
    <>
      <pointLight ref={light} color="#fff4e0" decay={2} />
      {/* Rack lighting, kept separate from the turntable's shadow-casting light. */}
      <pointLight position={[RACK_X + 2, 6.5, 7]} intensity={70} color="#ffe9cc" />
      <pointLight position={[RACK_X - 6, 3.5, 6]} intensity={34} color="#9db4ff" />

      {/* Back wall */}
      <mesh position={[RACK_X, 4, -3.4]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#1a1c28" roughness={0.9} />
      </mesh>

      {/* Wooden bench the sleeves stand in */}
      <group position={[RACK_X, TABLE_Y, -0.4]}>
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <boxGeometry args={[18, 0.6, 3.6]} />
          <meshStandardMaterial map={wood} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.36, 1.78]}>
          <boxGeometry args={[18, 0.72, 0.16]} />
          <meshStandardMaterial map={wood} roughness={0.55} color="#c9a07c" />
        </mesh>
        {[-9, 9].map((x) => (
          <mesh key={x} position={[x, 0.9, 0]}>
            <boxGeometry args={[0.3, 1.8, 3.8]} />
            <meshStandardMaterial map={wood} roughness={0.65} />
          </mesh>
        ))}
      </group>

      {visible.map((track, i) => (
        <Sleeve
          key={track.id}
          track={track}
          index={from + i}
          pos={pos}
          focus={focus}
          inspecting={inspecting}
          spinRef={spin}
          onSelect={(index) => {
            if (index === state.current.focus) state.current.onInspect();
            else state.current.onFocus(index);
          }}
        />
      ))}
    </>
  );
}
