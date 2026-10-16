"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Turntable } from "./Turntable";
import { Vinyl } from "./Vinyl";
import { SHELF, TABLE_Y, createSim, type ArmControl, type Sim } from "./sim";

export interface SceneProps {
  videoId: string | null;
  want: boolean;
  progressRef: React.RefObject<number>;
  resetToken: number;
  onSeat: () => void;
  onUnseat: () => void;
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

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    // Fit the plinth (±2.35 wide) and the shelf record (front) in both axes.
    const dist = Math.max(2.7 / half, 2.6 / (half * aspect));
    const focus = new THREE.Vector3(0, -0.2, 1.5);
    const dir = new THREE.Vector3(0, 0.78, 0.63).normalize();
    cam.position.copy(focus).addScaledVector(dir, dist);
    cam.lookAt(focus);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function World(props: SceneProps) {
  const { videoId, want, progressRef, resetToken } = props;
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
      <CameraRig />
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
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#161823" roughness={0.85} />
      </mesh>

      <Turntable simRef={sim} controlRef={control} />

      {videoId ? (
        <Vinyl
          key={videoId}
          videoId={videoId}
          simRef={sim}
          resetToken={resetToken}
          onSeat={props.onSeat}
          onUnseat={props.onUnseat}
        />
      ) : (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[SHELF.x, TABLE_Y + 0.002, SHELF.z]}
        >
          <ringGeometry args={[1.42, 1.5, 96]} />
          <meshBasicMaterial color="#7c9cff" transparent opacity={0.25} />
        </mesh>
      )}
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
