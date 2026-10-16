"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { holoFragment, holoVertex } from "./holo";
import { loadLabelTexture, makeGrooveTexture } from "./textures";
import {
  DRAG_Y,
  PLATTER_CENTER,
  RECORD_RADIUS,
  SEATED_Y,
  SHELF,
  type Sim,
} from "./sim";

type Status = "shelf" | "drag" | "seated";

const DROP_RADIUS = 1.1;
const LABEL_RADIUS = 0.52;
const THICKNESS = 0.02;

interface VinylProps {
  videoId: string;
  simRef: React.RefObject<Sim>;
  resetToken: number;
  onSeat: () => void;
  onUnseat: () => void;
}

export function Vinyl({ videoId, simRef, resetToken, onSeat, onUnseat }: VinylProps) {
  const { camera, gl, pointer } = useThree();
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const zone = useRef<THREE.Mesh>(null);
  const status = useRef<Status>("shelf");
  const target = useRef(new THREE.Vector3());
  const handlers = useRef({ onSeat, onUnseat });
  useEffect(() => {
    handlers.current = { onSeat, onUnseat };
  });

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

  const holoGeometry = useMemo(() => {
    const g = new THREE.CircleGeometry(RECORD_RADIUS, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const holoMaterial = useRef<THREE.ShaderMaterial>(null);
  const holoUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLight: { value: new THREE.Vector2(1, 0) },
      uRadius: { value: RECORD_RADIUS },
      uLabel: { value: LABEL_RADIUS / RECORD_RADIUS },
      uIntensity: { value: 1 },
    }),
    [],
  );

  // A new record falls in from above; an error/reset sends it back to the shelf.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    status.current = "shelf";
    simRef.current.discSeated = false;
  }, [resetToken, simRef]);
  useEffect(
    () => () => {
      simRef.current.discSeated = false;
      document.body.style.cursor = "";
    },
    [simRef],
  );

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_Y),
    [],
  );

  function aim(ev: PointerEvent) {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, target.current);
  }

  function beginDrag(ev: PointerEvent) {
    if (status.current === "seated") handlers.current.onUnseat();
    simRef.current.discSeated = false;
    status.current = "drag";
    document.body.style.cursor = "grabbing";
    aim(ev);

    const move = (e: PointerEvent) => aim(e);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.cursor = "";
      const near =
        Math.hypot(
          target.current.x - PLATTER_CENTER.x,
          target.current.z - PLATTER_CENTER.z,
        ) < DROP_RADIUS;
      if (near) {
        status.current = "seated";
        simRef.current.discSeated = true;
        handlers.current.onSeat();
      } else {
        status.current = "shelf";
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const st = status.current;

    let tx: number, ty: number, tz: number;
    if (st === "drag") {
      tx = target.current.x;
      ty = DRAG_Y;
      tz = target.current.z;
    } else if (st === "seated") {
      tx = PLATTER_CENTER.x;
      ty = SEATED_Y;
      tz = PLATTER_CENTER.z;
    } else {
      tx = SHELF.x;
      ty = SHELF.y;
      tz = SHELF.z;
    }

    const lambda = st === "drag" ? 14 : 6;
    const px = g.position.x;
    const pz = g.position.z;
    g.position.x = THREE.MathUtils.damp(px, tx, lambda, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, lambda, dt);
    g.position.z = THREE.MathUtils.damp(pz, tz, lambda, dt);

    const vx = (g.position.x - px) / Math.max(dt, 1e-4);
    const vz = (g.position.z - pz) / Math.max(dt, 1e-4);
    const tilt = st === "drag" ? 0.045 : 0;
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      THREE.MathUtils.clamp(vz * tilt, -0.5, 0.5),
      8,
      dt,
    );
    g.rotation.z = THREE.MathUtils.damp(
      g.rotation.z,
      THREE.MathUtils.clamp(-vx * tilt, -0.5, 0.5),
      8,
      dt,
    );

    if (st === "seated" && spin.current) spin.current.rotation.y = simRef.current.platterAngle;

    const t = state.clock.elapsedTime;
    const ang = pointer.x * 1.6 + t * 0.12;
    const holo = holoMaterial.current;
    if (holo) {
      holo.uniforms.uTime.value = t;
      (holo.uniforms.uLight.value as THREE.Vector2).set(Math.cos(ang), Math.sin(ang));
    }

    const z = zone.current;
    if (z) {
      const mat = z.material as THREE.MeshBasicMaterial;
      const near =
        Math.hypot(g.position.x - PLATTER_CENTER.x, g.position.z - PLATTER_CENTER.z) <
        DROP_RADIUS;
      const want = st === "drag" ? (near ? 0.85 : 0.35) : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, want, 10, dt);
    }
  });

  return (
    <>
      <mesh
        ref={zone}
        position={[PLATTER_CENTER.x, SEATED_Y + 0.012, PLATTER_CENTER.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[RECORD_RADIUS - 0.07, RECORD_RADIUS, 96]} />
        <meshBasicMaterial color="#7c9cff" transparent opacity={0} depthWrite={false} />
      </mesh>

      <group
        ref={group}
        position={[SHELF.x, SHELF.y + 2.2, SHELF.z]}
        onPointerDown={(e) => {
          e.stopPropagation();
          beginDrag(e.nativeEvent);
        }}
        onPointerOver={() => {
          if (status.current !== "drag") document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          if (status.current !== "drag") document.body.style.cursor = "";
        }}
      >
        <group ref={spin}>
          <mesh castShadow>
            <cylinderGeometry args={[RECORD_RADIUS, RECORD_RADIUS, THICKNESS, 96]} />
            <meshStandardMaterial color="#0a0a0c" roughness={0.45} metalness={0.15} />
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
              color={label ? "#ffffff" : "#c9c2b0"}
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

        <mesh
          geometry={holoGeometry}
          position={[0, THICKNESS / 2 + 0.0016, 0]}
          renderOrder={2}
        >
          <shaderMaterial
            ref={holoMaterial}
            vertexShader={holoVertex}
            fragmentShader={holoFragment}
            uniforms={holoUniforms}
            transparent
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            polygonOffset
            polygonOffsetFactor={-4}
          />
        </mesh>
      </group>
    </>
  );
}
