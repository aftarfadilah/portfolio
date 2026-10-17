"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "./audio";
import {
  ARM,
  ARM_YAW_REST,
  PLATTER_CENTER,
  PLATTER_SPEED,
  RECORD_RADIUS,
  stepArm,
  stepPlatter,
  type ArmControl,
  type ArmPhase,
  type Sim,
} from "./sim";

const PLINTH = { w: 4.7, d: 3.7, h: 0.5 };

function usePlinthGeometry() {
  return useMemo(() => {
    const { w, d, h } = PLINTH;
    const r = 0.14;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -d / 2);
    shape.lineTo(w / 2 - r, -d / 2);
    shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
    shape.lineTo(w / 2, d / 2 - r);
    shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
    shape.lineTo(-w / 2 + r, d / 2);
    shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
    shape.lineTo(-w / 2, -d / 2 + r);
    shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h - 0.04,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -h + 0.02, 0);
    return geo;
  }, []);
}

interface TurntableProps {
  simRef: React.RefObject<Sim>;
  controlRef: React.RefObject<ArmControl>;
  onToggleHold: () => void;
}

export function Turntable({
  simRef,
  controlRef,
  onToggleHold,
}: TurntableProps) {
  const plinth = usePlinthGeometry();
  const platter = useRef<THREE.Group>(null);
  const armYaw = useRef<THREE.Group>(null);
  const armLift = useRef<THREE.Group>(null);
  const lever = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const lastPhase = useRef<ArmPhase>("rest");

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const sim = simRef.current;
    stepArm(sim, controlRef.current, dt);
    stepPlatter(sim, dt);

    if (sim.armPhase !== lastPhase.current) {
      if (sim.armPhase === "rest" && lastPhase.current === "lower-out") {
        sfx.armRest();
      }
      lastPhase.current = sim.armPhase;
    }
    sfx.setMotor(sim.platterSpeed / PLATTER_SPEED);

    if (platter.current) platter.current.rotation.y = sim.platterAngle;
    if (armYaw.current) armYaw.current.rotation.y = sim.armYaw;
    if (armLift.current) armLift.current.rotation.z = sim.armLift * 0.1;
    if (lever.current) lever.current.rotation.z = -sim.armLift * 0.6;
    if (led.current) {
      led.current.emissiveIntensity = THREE.MathUtils.clamp(
        sim.platterSpeed / 2,
        0,
        1.6,
      );
    }
  });

  const restDir = { x: Math.cos(-ARM_YAW_REST), z: Math.sin(-ARM_YAW_REST) };

  return (
    <group>
      {/* Plinth */}
      <mesh geometry={plinth} castShadow receiveShadow>
        <meshStandardMaterial
          color="#161618"
          roughness={0.55}
          metalness={0.1}
        />
      </mesh>
      {[
        [-2.0, -1.55],
        [2.0, -1.55],
        [-2.0, 1.55],
        [2.0, 1.55],
      ].map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, -0.53, z]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.06, 24]} />
          <meshStandardMaterial color="#0a0a0b" roughness={0.9} />
        </mesh>
      ))}

      {/* Platter */}
      <group position={[PLATTER_CENTER.x, 0, PLATTER_CENTER.z]}>
        <mesh position={[0, -0.03, 0]}>
          <cylinderGeometry args={[1.62, 1.62, 0.06, 64]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.7} />
        </mesh>
        <group ref={platter}>
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <cylinderGeometry
              args={[RECORD_RADIUS + 0.02, RECORD_RADIUS + 0.02, 0.16, 96]}
            />
            <meshStandardMaterial
              color="#b9bdc6"
              metalness={0.9}
              roughness={0.32}
            />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[1.46, 1.46, 0.02, 96]} />
            <meshStandardMaterial color="#1b1b1e" roughness={0.95} />
          </mesh>
          <mesh position={[RECORD_RADIUS - 0.06, 0.162, 0]}>
            <boxGeometry args={[0.12, 0.004, 0.05]} />
            <meshStandardMaterial
              color="#222226"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.14, 16]} />
            <meshStandardMaterial
              color="#d6d8de"
              metalness={1}
              roughness={0.2}
            />
          </mesh>
        </group>
      </group>

      {/* Controls */}
      {[1.0, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.012, 1.45]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 24]} />
          <meshStandardMaterial
            color="#2a2a2e"
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>
      ))}
      <mesh position={[1.85, 0.015, 1.45]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 32]} />
        <meshStandardMaterial color="#c9ccd3" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[1.85, 0.036, 1.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.07, 0.095, 32]} />
        <meshStandardMaterial
          ref={led}
          color="#222"
          emissive="#ffb347"
          emissiveIntensity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Arm rest */}
      <group position={[ARM.px + restDir.x * 1.5, 0, ARM.pz + restDir.z * 1.5]}>
        <mesh position={[0, 0.13, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.06, 0.26, 16]} />
          <meshStandardMaterial color="#1e1e21" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.275, 0]} rotation={[0, ARM_YAW_REST, 0]}>
          <boxGeometry args={[0.07, 0.03, 0.16]} />
          <meshStandardMaterial color="#2b2b30" roughness={0.5} />
        </mesh>
      </group>

      {/* Tonearm */}
      <group position={[ARM.px, 0, ARM.pz]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.24, 0.28, 32]} />
          <meshStandardMaterial
            color="#26262a"
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        <mesh position={[0, ARM.y - 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.14, 32]} />
          <meshStandardMaterial
            color="#b9bdc6"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>

        {/* Cue lever */}
        <group position={[0.18, 0.2, 0.2]}>
          <mesh
            position={[0.2, 0.02, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHold();
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <boxGeometry args={[0.6, 0.22, 0.3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <group ref={lever}>
            <mesh position={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.36, 0.025, 0.05]} />
              <meshStandardMaterial
                color="#c9ccd3"
                metalness={0.8}
                roughness={0.35}
              />
            </mesh>
          </group>
        </group>

        <group ref={armYaw} position={[0, ARM.y, 0]}>
          <group ref={armLift}>
            <mesh
              rotation={[0, 0, Math.PI / 2]}
              position={[ARM.length / 2 - 0.05, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.028, 0.028, ARM.length - 0.1, 16]} />
              <meshStandardMaterial
                color="#c3c6ce"
                metalness={0.9}
                roughness={0.28}
              />
            </mesh>
            <mesh
              rotation={[0, 0, Math.PI / 2]}
              position={[-0.3, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.03, 0.03, 0.6, 16]} />
              <meshStandardMaterial
                color="#c3c6ce"
                metalness={0.9}
                roughness={0.28}
              />
            </mesh>
            <mesh
              rotation={[0, 0, Math.PI / 2]}
              position={[-0.58, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.1, 0.1, 0.24, 32]} />
              <meshStandardMaterial
                color="#202023"
                metalness={0.6}
                roughness={0.45}
              />
            </mesh>
            <group position={[ARM.length, 0, 0]} rotation={[0, 0.3, 0]}>
              <mesh position={[0.03, -0.01, 0]} castShadow>
                <boxGeometry args={[0.3, 0.02, 0.12]} />
                <meshStandardMaterial color="#101012" roughness={0.5} />
              </mesh>
              <mesh position={[0.05, -0.07, 0]} castShadow>
                <boxGeometry args={[0.2, 0.1, 0.09]} />
                <meshStandardMaterial color="#d9d9dd" roughness={0.45} />
              </mesh>
              <mesh position={[0.1, -0.15, 0]}>
                <coneGeometry args={[0.012, 0.06, 8]} />
                <meshStandardMaterial
                  color="#e8e8ea"
                  metalness={1}
                  roughness={0.1}
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
