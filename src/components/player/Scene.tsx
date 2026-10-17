"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Turntable } from "./Turntable";
import { Rack, RACK_X } from "./Rack";
import { Vinyl } from "./Vinyl";
import type { Track } from "./library";
import { TABLE_Y, createSim, type ArmControl, type Sim } from "./sim";

export type View = "deck" | "rack";

export interface SceneProps {
  view: View;
  records: Track[];
  focus: number;
  inspecting: boolean;
  /** Video id of the record on (or heading to) the platter. */
  loadedId: string | null;
  leaving: boolean;
  want: boolean;
  progressRef: React.RefObject<number>;
  onFocus: (index: number) => void;
  onInspect: () => void;
  onBack: () => void;
  onNeedleDown: () => void;
  onLiftOff: () => void;
}

function RoomEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // R3F scene objects are mutated imperatively by design.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function CameraRig({ view }: { view: View }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const placed = useRef(false);

  const pose = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    if (view === "rack") {
      const dist = Math.max(2.9 / half, 3.2 / (half * aspect));
      const focus = new THREE.Vector3(RACK_X, 0.9, 0);
      const dir = new THREE.Vector3(0, 0.2, 1).normalize();
      return { focus, position: focus.clone().addScaledVector(dir, dist) };
    }
    // The plinth (4.7 x 3.7) centred in frame with room for the overlay UI.
    const dist = Math.max(3.0 / half, 3.5 / (half * aspect));
    const focus = new THREE.Vector3(0, TABLE_Y - 0.05, -0.1);
    const dir = new THREE.Vector3(0, 0.78, 0.63).normalize();
    return { focus, position: focus.clone().addScaledVector(dir, dist) };
  }, [camera, size, view]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!placed.current) {
      placed.current = true;
      camera.position.copy(pose.position);
      look.current.copy(pose.focus);
    } else {
      const k = 1 - Math.exp(-3.2 * dt);
      camera.position.lerp(pose.position, k);
      look.current.lerp(pose.focus, k);
    }
    camera.lookAt(look.current);
  });
  return null;
}

function World(props: SceneProps) {
  const { view, want, progressRef, loadedId, leaving } = props;
  const sim = useRef<Sim>(createSim());
  const handlers = useRef(props);
  const control = useRef<ArmControl>({
    want: false,
    progress: 0,
    onNeedleDown: () => handlers.current.onNeedleDown(),
    onLiftOff: () => handlers.current.onLiftOff(),
  });

  useEffect(() => {
    handlers.current = props;
    control.current.want = want;
  });
  // Poll the shared progress value each frame rather than re-rendering.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      control.current.progress = progressRef.current;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <>
      <color attach="background" args={["#0d0f16"]} />
      <CameraRig view={view} />
      <RoomEnv />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 9, 5]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-4, 3, 4]} intensity={8} color="#8aa4ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TABLE_Y - 0.001, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#161823" roughness={0.85} />
      </mesh>

      <Turntable simRef={sim} controlRef={control} />

      {loadedId && (
        <Vinyl key={loadedId} videoId={loadedId} simRef={sim} leaving={leaving} />
      )}

      <Rack
        records={props.records}
        focus={props.focus}
        inspecting={props.inspecting}
        active={view === "rack"}
        onFocus={props.onFocus}
        onInspect={props.onInspect}
        onBack={props.onBack}
      />
    </>
  );
}

export function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 35, near: 0.1, far: 80 }}
      gl={{ antialias: true }}
      style={{ touchAction: "none" }}
    >
      <World {...props} />
    </Canvas>
  );
}
