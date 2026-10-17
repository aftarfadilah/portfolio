"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { loadLabelTexture, makeGrooveTexture } from "./textures";
import { PLATTER_CENTER, RECORD_RADIUS, SEATED_Y, type Sim } from "./sim";

const LABEL_RADIUS = 0.52;
const THICKNESS = 0.02;
const SLIDE_DELAY = 0.7;

// Records come from, and go back to, the rack on the left.
const FROM_RACK = new THREE.Vector3(-8, 1.6, 0.8);

interface VinylProps {
  videoId: string;
  simRef: React.RefObject<Sim>;
  leaving: boolean;
}

export function Vinyl({ videoId, simRef, leaving }: VinylProps) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const age = useRef(0);

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
    age.current += dt;
    const sim = simRef.current;

    const home = !leaving && age.current > SLIDE_DELAY;
    const tx = home ? PLATTER_CENTER.x : FROM_RACK.x;
    const tz = home ? PLATTER_CENTER.z : FROM_RACK.z;
    const ty = home ? SEATED_Y : FROM_RACK.y;
    const lambda = home ? 5 : 3.5;
    g.position.x = THREE.MathUtils.damp(g.position.x, tx, lambda, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, lambda, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, tz, lambda, dt);

    // Gentle tilt while travelling, flat once it settles.
    const travel = Math.hypot(g.position.x - tx, g.position.z - tz);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, Math.min(travel * 0.05, 0.4), 6, dt);

    const arrived = home && travel < 0.04 && Math.abs(g.position.y - SEATED_Y) < 0.03;
    sim.discSeated = arrived;
    if (arrived && spin.current) spin.current.rotation.y = sim.platterAngle;
  });

  return (
    <group ref={group} position={[FROM_RACK.x, FROM_RACK.y, FROM_RACK.z]}>
      <group ref={spin}>
        <mesh castShadow>
          <cylinderGeometry args={[RECORD_RADIUS, RECORD_RADIUS, THICKNESS, 96]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, THICKNESS / 2 + 0.0004, 0]}>
          <circleGeometry args={[RECORD_RADIUS - 0.01, 96]} />
          <meshStandardMaterial
            map={grooves}
            roughness={0.32}
            metalness={0.25}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, THICKNESS / 2 + 0.0009, 0]}>
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
          <meshStandardMaterial color="#9a9aa2" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
