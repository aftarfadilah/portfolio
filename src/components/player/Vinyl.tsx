"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "./audio";
import { loadLabelTexture, makeGrooveTexture } from "./textures";
import {
  PLATTER_CENTER,
  RECORD_RADIUS,
  SEATED_Y,
  type Anchor,
  type Sim,
} from "./sim";

const LABEL_RADIUS = 0.52;
const THICKNESS = 0.02;

// Pick sequence: slide out of the jacket, swipe across, settle onto the platter.
const OUT_TIME = 0.85;
const CARRY_TIME = 1.1;
const LOWER_TIME = 0.75;
const JACKET_TRAVEL = 3.3; // how far the disc slides before it clears the jacket
const HOVER_HEIGHT = 1.0;

// Records leave toward the rack on the left.
const FROM_RACK = new THREE.Vector3(-8, 1.6, 0.8);

type Phase = "wait" | "out" | "carry" | "lower" | "seated" | "leaving";

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Rig {
  up: THREE.Vector3;
  normal: THREE.Vector3;
  from: THREE.Vector3;
  control: THREE.Vector3;
  hover: THREE.Vector3;
  seat: THREE.Vector3;
  pos: THREE.Vector3;
  qFrom: THREE.Quaternion;
  qHover: THREE.Quaternion;
  qFlat: THREE.Quaternion;
  faceUp: THREE.Quaternion;
  sFrom: number;
}

function makeRig(): Rig {
  return {
    up: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    from: new THREE.Vector3(),
    control: new THREE.Vector3(),
    hover: new THREE.Vector3(
      PLATTER_CENTER.x,
      SEATED_Y + HOVER_HEIGHT,
      PLATTER_CENTER.z,
    ),
    seat: new THREE.Vector3(PLATTER_CENTER.x, SEATED_Y, PLATTER_CENTER.z),
    pos: new THREE.Vector3(),
    qFrom: new THREE.Quaternion(),
    qHover: new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.1, 0.5, -0.16),
    ),
    qFlat: new THREE.Quaternion(),
    faceUp: new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2,
    ),
    sFrom: 1,
  };
}

interface VinylProps {
  videoId: string;
  simRef: React.RefObject<Sim>;
  anchor: React.RefObject<Anchor>;
  leaving: boolean;
  onCarry: () => void;
}

export function Vinyl({
  videoId,
  simRef,
  anchor: anchorRef,
  leaving,
  onCarry,
}: VinylProps) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const phase = useRef<Phase>("wait");
  const clock = useRef(0);
  const onCarryRef = useRef(onCarry);
  useEffect(() => {
    onCarryRef.current = onCarry;
  });
  const rigRef = useRef<Rig | null>(null);
  const slid = useRef(false);

  const [label, setLabel] = useState<THREE.Texture | null>(null);
  const grooves = useMemo(() => makeGrooveTexture(), []);
  useEffect(() => () => grooves.dispose(), [grooves]);
  useEffect(() => {
    let cancelled = false;
    let loaded: THREE.Texture | null = null;
    loadLabelTexture(videoId)
      .then((tex) => {
        if (cancelled) tex.dispose();
        else {
          loaded = tex;
          setLabel(tex);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [videoId]);

  useEffect(
    () => () => {
      simRef.current.discSeated = false;
    },
    [simRef],
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const sim = simRef.current;
    const r = (rigRef.current ??= makeRig());
    const anchor = anchorRef.current;

    if (leaving && phase.current !== "leaving") {
      phase.current = "leaving";
      sim.discSeated = false;
      g.visible = true;
    }
    clock.current += dt;

    switch (phase.current) {
      case "wait": {
        // Hidden inside the jacket until the sleeve has turned to face us.
        g.visible = false;
        if (anchor.settled || clock.current > 2.5) {
          phase.current = "out";
          clock.current = 0;
        }
        break;
      }
      case "out": {
        // Slide out of the jacket's right edge, then ease forward off its face.
        const e = smooth(Math.min(clock.current / OUT_TIME, 1));
        r.up.set(1, 0, 0).applyQuaternion(anchor.quat);
        r.normal.set(0, 0, 1).applyQuaternion(anchor.quat);
        const clear = smooth(Math.max(0, (e - 0.55) / 0.45));
        r.pos
          .copy(anchor.pos)
          .addScaledVector(r.up, JACKET_TRAVEL * anchor.scale * e)
          .addScaledVector(r.normal, 0.3 * anchor.scale * clear);
        g.position.copy(r.pos);
        g.quaternion.copy(anchor.quat).multiply(r.faceUp);
        g.scale.setScalar(anchor.scale);
        g.visible = true;
        if (!slid.current) {
          slid.current = true;
          sfx.sleeveSlide();
        }
        if (clock.current >= OUT_TIME) {
          r.from.copy(g.position);
          r.qFrom.copy(g.quaternion);
          r.sFrom = g.scale.x;
          phase.current = "carry";
          clock.current = 0;
          onCarryRef.current();
        }
        break;
      }
      case "carry": {
        // A soft arc across to the right, banking and laying flat as it goes.
        const t = Math.min(clock.current / CARRY_TIME, 1);
        const u = smooth(t);
        r.control.copy(r.from).lerp(r.hover, 0.5);
        r.control.y += 1.2;
        const a = 1 - u;
        g.position
          .copy(r.from)
          .multiplyScalar(a * a)
          .addScaledVector(r.control, 2 * a * u)
          .addScaledVector(r.hover, u * u);
        g.quaternion.slerpQuaternions(r.qFrom, r.qHover, u);
        g.scale.setScalar(THREE.MathUtils.lerp(r.sFrom, 1, u));
        if (t >= 1) {
          phase.current = "lower";
          clock.current = 0;
        }
        break;
      }
      case "lower": {
        // Gentle descent onto the spindle; the label turns to match the platter.
        const t = Math.min(clock.current / LOWER_TIME, 1);
        const u = easeOut(t);
        g.position.lerpVectors(r.hover, r.seat, u);
        g.quaternion.slerpQuaternions(r.qHover, r.qFlat, u);
        g.scale.setScalar(1);
        if (spin.current) spin.current.rotation.y = sim.platterAngle;
        if (t >= 1) {
          phase.current = "seated";
          sim.discSeated = true;
          sfx.discPlace();
        }
        break;
      }
      case "seated": {
        g.position.copy(r.seat);
        g.quaternion.identity();
        if (spin.current) spin.current.rotation.y = sim.platterAngle;
        break;
      }
      case "leaving": {
        g.position.x = THREE.MathUtils.damp(g.position.x, FROM_RACK.x, 3.5, dt);
        g.position.y = THREE.MathUtils.damp(g.position.y, FROM_RACK.y, 3.5, dt);
        g.position.z = THREE.MathUtils.damp(g.position.z, FROM_RACK.z, 3.5, dt);
        break;
      }
    }
  });

  return (
    <group ref={group} visible={false}>
      <group ref={spin}>
        <mesh castShadow>
          <cylinderGeometry
            args={[RECORD_RADIUS, RECORD_RADIUS, THICKNESS, 96]}
          />
          <meshStandardMaterial
            color="#0a0a0c"
            roughness={0.45}
            metalness={0.15}
          />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, THICKNESS / 2 + 0.0004, 0]}
        >
          <circleGeometry args={[RECORD_RADIUS - 0.01, 96]} />
          <meshStandardMaterial
            map={grooves}
            roughness={0.32}
            metalness={0.25}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, THICKNESS / 2 + 0.0009, 0]}
        >
          <circleGeometry args={[LABEL_RADIUS, 64]} />
          <meshStandardMaterial
            key={label ? "label" : "blank"}
            map={label}
            color={label ? "#9c9c9c" : "#c9c2b0"}
            roughness={0.5}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
        <mesh position={[0, THICKNESS / 2 + 0.002, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.004, 24]} />
          <meshStandardMaterial
            color="#9a9aa2"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
