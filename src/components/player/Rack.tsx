"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Track } from "./library";
import { TABLE_Y, type Anchor } from "./sim";
import { loadLabelTexture, makeBackTexture } from "./textures";

export const RACK_X = -20;
const SLEEVE = 3.1;
// The focused sleeve floats at this height; the others climb away from it.
export const SLEEVE_Y = TABLE_Y + 2.7;
const NEIGHBOUR_GAP = 1.9;
const PACK_GAP = 1.05;
const WINDOW = 9;
const LOAD_RADIUS = 6;
const INSPECT_DISTANCE = 6.2;
const INSPECT_SCALE = 0.78;

interface Spin {
  x: number;
  y: number;
}

/**
 * Where a sleeve sits for a (fractional) distance from the focused one: a
 * diagonal staircase. Later records climb up and to the right, earlier ones
 * step down and to the left, and both recede into the distance.
 */
function layout(d: number) {
  const absd = Math.abs(d);
  const sign = Math.sign(d);
  const lean = Math.min(absd, 1);
  const run =
    absd < 1 ? absd * NEIGHBOUR_GAP : NEIGHBOUR_GAP + (absd - 1) * PACK_GAP;
  return {
    x: RACK_X + sign * run,
    y: d * (d > 0 ? 0.7 : 0.4),
    z: -absd * 1.1,
    ry: -sign * lean * 0.62,
    absd,
  };
}

/** A thin sheet that bows slightly toward the viewer, like a paper record sleeve. */
function makePaperGeometry(back: boolean) {
  const g = new THREE.PlaneGeometry(SLEEVE, SLEEVE, 24, 24);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) / SLEEVE) * 2;
    const v = (pos.getY(i) / SLEEVE) * 2;
    const bow = 0.05 * (1 - u * u) * (1 - 0.4 * v * v);
    // Slight dog-ear curl on the top corners.
    const curl = 0.025 * Math.max(0, v) * u * u * u * u;
    pos.setZ(i, 0.004 + Math.max(0, bow) + curl);
  }
  g.computeVertexNormals();
  if (back) g.rotateY(Math.PI);
  return g;
}

function Sleeve({
  track,
  index,
  pos,
  focus,
  inspecting,
  spinRef,
  anchor: anchorRef,
  onSelect,
}: {
  track: Track;
  index: number;
  pos: React.RefObject<number>;
  focus: number;
  inspecting: boolean;
  spinRef: React.RefObject<{ target: Spin; current: Spin }>;
  anchor: React.RefObject<Anchor>;
  onSelect: (index: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const { camera } = useThree();
  const focused = index === focus;
  const showBack = inspecting && focused;
  const near = Math.abs(index - focus) <= LOAD_RADIUS;

  const frontGeometry = useMemo(() => makePaperGeometry(false), []);
  const backGeometry = useMemo(() => makePaperGeometry(true), []);
  useEffect(
    () => () => {
      frontGeometry.dispose();
      backGeometry.dispose();
    },
    [frontGeometry, backGeometry],
  );

  const [cover, setCover] = useState<THREE.Texture | null>(null);
  const wantsCover = near && !cover;
  useEffect(() => {
    if (!wantsCover) return;
    let cancelled = false;
    loadLabelTexture(track.id, 512)
      .then((tex) => {
        if (cancelled) tex.dispose();
        else setCover(tex);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wantsCover, track.id]);
  useEffect(() => () => cover?.dispose(), [cover]);

  const back = useMemo(
    () =>
      showBack ? makeBackTexture(track.title, track.author, track.id) : null,
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
    const { x, y, z, ry, absd } = layout(d);

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

      const a = anchorRef.current;
      a.pos.copy(g.position);
      a.quat.copy(g.quaternion);
      a.scale = g.scale.x;
      a.settled =
        g.position.distanceTo(goal) < 0.06 &&
        Math.abs(g.scale.x - INSPECT_SCALE) < 0.02 &&
        g.quaternion.angleTo(quat) < 0.04 &&
        Math.abs(spin.x - spinRef.current.target.x) < 0.04 &&
        Math.abs(spin.y - spinRef.current.target.y) < 0.04;
      return;
    }

    // Sleeves near the ends of the loaded window shrink away so they never pop.
    const edge = THREE.MathUtils.clamp((WINDOW + 0.5 - absd) / 2, 0, 1);
    const targetScale = inspecting ? 0.001 : edge;
    const lift = focused && !inspecting ? 0.12 : 0;
    scratch.euler.set(0, ry, 0);
    scratch.quat.setFromEuler(scratch.euler);

    if (!placed.current) {
      // First frame: appear exactly where the layout puts this sleeve.
      placed.current = true;
      g.position.set(x, SLEEVE_Y + y + lift, z);
      g.quaternion.copy(scratch.quat);
      g.scale.setScalar(targetScale);
    } else {
      g.position.x = THREE.MathUtils.damp(g.position.x, x, 12, dt);
      g.position.y = THREE.MathUtils.damp(
        g.position.y,
        SLEEVE_Y + y + lift,
        10,
        dt,
      );
      g.position.z = THREE.MathUtils.damp(g.position.z, z, 12, dt);
      g.quaternion.slerp(scratch.quat, 1 - Math.exp(-12 * dt));
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 8, dt));
    }
    g.visible = g.scale.x > 0.02;
  });

  return (
    <group
      ref={group}
      visible={false}
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
      {/* Printed card sleeve: matte paper with just a light satin finish. */}
      <mesh geometry={frontGeometry}>
        <meshPhysicalMaterial
          key={cover ? "cover" : "blank"}
          map={cover}
          color={cover ? "#ffffff" : "#2a2c38"}
          roughness={0.62}
          metalness={0}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          envMapIntensity={0.9}
        />
      </mesh>
      <mesh geometry={backGeometry}>
        <meshPhysicalMaterial
          key={back ? "back" : "plain"}
          map={back}
          color={back ? "#ffffff" : "#d8d2c4"}
          roughness={0.7}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
          envMapIntensity={0.8}
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
  /** Bumped when a record is picked: the sleeve turns to face the viewer. */
  pickToken: number;
  anchor: React.RefObject<Anchor>;
  onFocus: (index: number) => void;
  onInspect: () => void;
  onBack: () => void;
}

export function Rack({
  records,
  focus,
  inspecting,
  active,
  pickToken,
  anchor: anchorRef,
  onFocus,
  onInspect,
  onBack,
}: RackProps) {
  const { gl, camera, pointer } = useThree();
  const pos = useRef(focus);
  const dragFocus = useRef<number | null>(null);
  const spin = useRef({ target: { x: 0, y: 0 }, current: { x: 0, y: 0 } });
  const light = useRef<THREE.PointLight>(null);

  const state = useRef({
    records,
    focus,
    inspecting,
    active,
    onFocus,
    onInspect,
    onBack,
  });
  useEffect(() => {
    state.current = {
      records,
      focus,
      inspecting,
      active,
      onFocus,
      onInspect,
      onBack,
    };
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

  // Picking a record squares the sleeve up so the disc slides out of its front.
  useEffect(() => {
    if (pickToken === 0) return;
    spin.current.target.x = -0.04;
    spin.current.target.y = 0.08;
    anchorRef.current.settled = false;
  }, [pickToken, anchorRef]);

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
      wheelAccum +=
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
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
          dragFocus.current = THREE.MathUtils.clamp(
            raw,
            0,
            state.current.records.length - 1,
          );
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
      else if (e.key === "Enter" && !s.inspecting && s.records.length)
        s.onInspect();
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
    pos.current = THREE.MathUtils.damp(
      pos.current,
      dragFocus.current ?? focus,
      9,
      dt,
    );

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
      l.intensity = THREE.MathUtils.damp(
        l.intensity,
        inspecting ? 26 : 0,
        6,
        dt,
      );
    }
  });

  const from = Math.max(0, focus - WINDOW);
  const visible = records.slice(from, focus + WINDOW + 1);

  return (
    <>
      <pointLight ref={light} color="#fff4e0" decay={2} />
      {/* Rack lighting, kept separate from the turntable's shadow-casting light. */}
      <pointLight
        position={[RACK_X + 2, 6.5, 7]}
        intensity={70}
        color="#ffe9cc"
      />
      <pointLight
        position={[RACK_X - 6, 3.5, 6]}
        intensity={34}
        color="#9db4ff"
      />

      {visible.map((track, i) => (
        <Sleeve
          key={track.id}
          track={track}
          index={from + i}
          pos={pos}
          focus={focus}
          inspecting={inspecting}
          spinRef={spin}
          anchor={anchorRef}
          onSelect={(index) => {
            if (index === state.current.focus) state.current.onInspect();
            else state.current.onFocus(index);
          }}
        />
      ))}
    </>
  );
}
