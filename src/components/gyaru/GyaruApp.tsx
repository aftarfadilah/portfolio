"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import Plush, { newCtl, type PlushCtl } from "./Plush";

const TARGET = new THREE.Vector3(0, 0.38, 0);

function RoomEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // R3F scene objects are mutated imperatively by design.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = env;
    scene.environmentIntensity = 0.35;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Back the camera off until the whole plush fits, on tall screens too. */
function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const aspect = size.width / size.height;
    const dist = Math.max(3.7 / half, 3.1 / (half * aspect));
    cam.position.set(0, TARGET.y + 0.25, dist);
    cam.lookAt(TARGET);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function GyaruApp() {
  const ctl = useRef<PlushCtl>(newCtl());
  const drag = useRef({ x: 0, y: 0, moved: 0, t: 0 });

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
    ctl.current.dragging = true;
    ctl.current.vel = 0;
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ctl.current.dragging) return;
    const d = drag.current;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const now = performance.now();
    const dtMs = Math.max(now - d.t, 8);
    d.moved += Math.abs(dx) + Math.abs(dy);
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = now;
    const c = ctl.current;
    c.yaw += dx * 0.012;
    c.pitch = THREE.MathUtils.clamp(c.pitch + dy * 0.006, -0.45, 0.45);
    c.vel = THREE.MathUtils.clamp((dx * 0.012 * 1000) / dtMs, -14, 14);
  };
  const up = () => {
    const c = ctl.current;
    c.dragging = false;
    if (drag.current.moved < 6) {
      c.vel = 0;
      c.sv = -5; // a tap squishes it
    }
  };

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 52%, rgba(63,179,168,0.22), transparent 70%), radial-gradient(50% 40% at 15% 10%, rgba(74,108,150,0.28), transparent 70%), #0a0d16",
        touchAction: "none",
        cursor: "grab",
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.1, far: 50, position: [0, 0.6, 9] }}
        gl={{ antialias: true }}
      >
        <RoomEnv />
        <CameraRig />
        <hemisphereLight args={["#cfe9ff", "#1a2036", 0.55]} />
        <directionalLight position={[3, 5, 6]} intensity={1.5} color="#fff4e2" />
        <directionalLight position={[-5, 2, -3]} intensity={0.9} color="#6fd6c9" />
        <Plush ctl={ctl} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 font-mono text-[11px] tracking-widest text-[#8fb7c9]/80 uppercase">
        <span>~/gyaru</span>
        <span>plush &middot; 01</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-center">
        <p className="text-2xl font-semibold tracking-[0.3em] text-[#e4f4f2]">ADO</p>
        <p className="mt-2 font-mono text-[11px] tracking-widest text-[#8fb7c9]/70 uppercase">
          drag to spin &middot; tap to squish
        </p>
      </div>
    </div>
  );
}
