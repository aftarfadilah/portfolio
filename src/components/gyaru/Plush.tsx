"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { makeFaceTexture, makeShadowTexture } from "./face";

export interface PlushCtl {
  yaw: number;
  pitch: number;
  /** Spin velocity in rad/s, kept after a drag for inertia. */
  vel: number;
  dragging: boolean;
  /** Squash spring: displacement and velocity. */
  s: number;
  sv: number;
}

export const newCtl = (): PlushCtl => ({
  yaw: 0,
  pitch: 0,
  vel: 0,
  dragging: false,
  s: 0,
  sv: 0,
});

const C = {
  hair: "#2d3a60",
    tealTop: "#3b5c86",
  teal: "#2ba99c",
  coat: "#161b34",
  pants: "#16204a",
  white: "#f5f5f2",
  bow: "#14151c",
  rose: "#3db2d2",
};

// Head ellipsoid; everything hair-shaped is fitted to it.
const HEAD = { cy: 0.9, rx: 1.12, ry: 0.98, rz: 0.98 };

type Pt = [number, number];

/** Round off a closed polygon so the felt panels read as soft cut fabric. */
function chaikin(pts: Pt[], rounds = 2): Pt[] {
  let p = pts;
  for (let k = 0; k < rounds; k++) {
    const out: Pt[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      out.push(
        [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25],
        [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75],
      );
    }
    p = out;
  }
  return p;
}

interface PanelOpts {
  depth: number;
  z?: number;
  /** Drape the panel over the head ellipsoid, this much larger than it. */
  wrap?: number;
  /** Vertical colour ramp [top, bottom] between y values. */
  ramp?: { top: string; bottom: string; yTop: number; yBottom: number };
}

function panel(points: Pt[], { depth, z = 0, wrap, ramp }: PanelOpts) {
  const shape = new THREE.Shape(
    chaikin(points).map(([x, y]) => new THREE.Vector2(x, y)),
  );
  const raw = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 1,
  });

  const pos = raw.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let zz = pos.getZ(i) + z;
    if (wrap) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const q =
        1 - (x / (HEAD.rx * wrap)) ** 2 - ((y - HEAD.cy) / (HEAD.ry * wrap)) ** 2;
      zz += HEAD.rz * wrap * Math.sqrt(Math.max(q, 0));
    }
    pos.setZ(i, zz);
  }

  // Extrusion is un-indexed, which would shade every facet flat. Weld it so
  // the bevels read as puffy.
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  raw.clearGroups();
  const geo = mergeVertices(raw, 1e-3);
  raw.dispose();
  geo.computeVertexNormals();

  if (ramp) {
    const top = new THREE.Color(ramp.top);
    const bottom = new THREE.Color(ramp.bottom);
    const p = geo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = THREE.MathUtils.clamp(
        (ramp.yTop - p.getY(i)) / (ramp.yTop - ramp.yBottom),
        0,
        1,
      );
      c.copy(top).lerp(bottom, t);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

function felt(color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.95,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.15),
    ...extra,
  });
}

function build() {
  const faceTex = makeFaceTexture();
  const shadowTex = makeShadowTexture();

  const mats = {
    skin: felt("#ffffff", { map: faceTex }),
    hair: felt(C.hair, { side: THREE.DoubleSide }),
    hairCap: felt(C.hair),
    teal: felt("#ffffff", { vertexColors: true, side: THREE.DoubleSide }),
    coat: felt(C.coat),
    pants: felt(C.pants),
    white: felt(C.white),
    bow: felt(C.bow),
    rose: felt(C.rose),
    zip: felt("#9aa0b4"),
    shadow: new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    }),
  };

  const teal = (): PanelOpts => ({
    depth: 0.08,
    z: -0.2,
    ramp: { top: C.tealTop, bottom: C.teal, yTop: 1.2, yBottom: -1.15 },
  });

  const geos = {
    head: new THREE.SphereGeometry(1, 64, 48),
    cap: new THREE.SphereGeometry(1, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.47),
    back: new THREE.SphereGeometry(1, 48, 32, Math.PI, Math.PI),
    tealPanel: panel(
      [
        [0.5, 1.25],
        [1.0, 1.2],
        [1.28, 0.6],
        [1.34, 0.0],
        [1.26, -0.6],
        [1.22, -1.0],
        [1.08, -0.82],
        [0.98, -1.2],
        [0.82, -0.88],
        [0.7, -1.14],
        [0.55, -0.76],
        [0.5, 0.2],
      ],
      teal(),
    ),
    lock: panel(
      [
        [0.88, 1.35],
        [1.14, 1.05],
        [1.2, 0.3],
        [1.15, -0.5],
        [1.04, -1.0],
        [0.94, -0.5],
        [0.9, 0.2],
        [0.78, 0.95],
      ],
      { depth: 0.1, z: 0.04, wrap: 1.04 },
    ),
    bangL: panel(
      [
        [0.04, 1.78],
        [-0.5, 1.78],
        [-0.95, 1.5],
        [-1.1, 1.0],
        [-1.12, 0.45],
        [-0.96, 0.52],
        [-0.78, 0.96],
        [-0.56, 1.0],
        [-0.4, 0.94],
        [-0.22, 1.04],
        [-0.08, 1.12],
        [0.04, 1.3],
      ],
      { depth: 0.06, wrap: 1.07 },
    ),
    bangR: panel(
      [
        [-0.04, 1.78],
        [0.5, 1.78],
        [0.95, 1.5],
        [1.1, 1.0],
        [1.12, 0.4],
        [0.96, 0.5],
        [0.8, 0.94],
        [0.62, 1.0],
        [0.44, 1.0],
        [0.22, 1.05],
        [0.08, 1.15],
        [-0.04, 1.3],
      ],
      { depth: 0.06, wrap: 1.07 },
    ),
    torso: new RoundedBoxGeometry(0.98, 0.9, 0.75, 4, 0.14),
    shirt: new RoundedBoxGeometry(0.42, 0.76, 0.14, 3, 0.05),
    tail: new RoundedBoxGeometry(0.36, 0.52, 0.1, 3, 0.04),
    arm: new THREE.CapsuleGeometry(0.15, 0.3, 8, 16),
    hand: new THREE.SphereGeometry(0.17, 24, 16),
    leg: new THREE.CapsuleGeometry(0.21, 0.28, 8, 16),
    knot: new RoundedBoxGeometry(0.16, 0.16, 0.14, 3, 0.05),
    wing: new THREE.ConeGeometry(0.21, 0.34, 4),
    rose: new THREE.SphereGeometry(0.09, 20, 14),
    petal: new THREE.TorusGeometry(0.085, 0.032, 10, 24),
    zip: new THREE.BoxGeometry(0.014, 0.66, 0.02),
    shadow: new THREE.PlaneGeometry(1, 1),
  };

  return { faceTex, shadowTex, mats, geos };
}

type Assets = ReturnType<typeof build>;

export default function Plush({ ctl }: { ctl: React.RefObject<PlushCtl> }) {
  const a = useMemo<Assets>(() => build(), []);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tealL = useRef<THREE.Group>(null);
  const tealR = useRef<THREE.Group>(null);
  const lockL = useRef<THREE.Group>(null);
  const lockR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);

  useEffect(
    () => () => {
      a.faceTex.dispose();
      a.shadowTex.dispose();
      Object.values(a.mats).forEach((m) => m.dispose());
      Object.values(a.geos).forEach((g) => g.dispose());
    },
    [a],
  );

  /* R3F frame loop: the sim state lives in a ref and is stepped imperatively. */
  /* eslint-disable react-hooks/immutability */
  useFrame((state, dt) => {
    const c = ctl.current;
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 1 / 30);

    if (!c.dragging) {
      c.yaw += c.vel * d;
      c.vel *= Math.exp(-3 * d);
      c.pitch *= Math.exp(-1.6 * d);
      // Once it stops, settle back to facing the front.
      if (Math.abs(c.vel) < 0.3) {
        const home = Math.round(c.yaw / (Math.PI * 2)) * Math.PI * 2;
        c.yaw += (home - c.yaw) * (1 - Math.exp(-0.9 * d));
      }
    }

    // Squash and stretch on a damped spring.
    c.sv += (-130 * c.s - 9 * c.sv) * d;
    c.s += c.sv * d;
    const squash = THREE.MathUtils.clamp(c.s, -0.4, 0.4);

    if (root.current) {
      root.current.rotation.y = c.yaw + Math.sin(t * 0.6) * 0.16;
      root.current.rotation.x = c.pitch;
      root.current.position.y = Math.sin(t * 1.2) * 0.03;
    }
    if (body.current) {
      // Squash about the floor so the plush stays seated.
      body.current.position.y = 1.24 * squash * 0.5;
      body.current.scale.set(1 - squash * 0.45, 1 + squash * 0.5, 1 - squash * 0.45);
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.9) * 0.03 + squash * 0.1;
    }

    const lag = THREE.MathUtils.clamp(c.vel * 0.04, -0.3, 0.3);
    const sway = (phase: number, amp: number) => Math.sin(t * 1.4 + phase) * amp;
    if (tealL.current) tealL.current.rotation.z = sway(0, 0.025) + lag;
    if (tealR.current) tealR.current.rotation.z = sway(1.7, 0.025) + lag;
    if (lockL.current) lockL.current.rotation.z = sway(0.8, 0.02) + lag * 0.7;
    if (lockR.current) lockR.current.rotation.z = sway(2.4, 0.02) + lag * 0.7;
    if (armL.current) armL.current.rotation.z = -0.5 - Math.sin(t * 1.1) * 0.04;
    if (armR.current) armR.current.rotation.z = 0.5 + Math.sin(t * 1.1 + 1) * 0.04;
    if (shadow.current) shadow.current.scale.setScalar(3.4 - squash * 1.2);
  });
  /* eslint-enable react-hooks/immutability */

  const m = a.mats;
  const g = a.geos;
  const PIVOT = 1.1;

  return (
    <>
      <mesh
        ref={shadow}
        geometry={g.shadow}
        material={m.shadow}
        rotation-x={-Math.PI / 2}
        position={[0, -1.25, 0]}
      />
      <group ref={root}>
        <group ref={body} position={[0, 0, 0]}>
          {/* legs */}
          <mesh geometry={g.leg} material={m.pants} position={[-0.26, -0.88, 0.1]} />
          <mesh geometry={g.leg} material={m.pants} position={[0.26, -0.88, 0.1]} />

          {/* coat */}
          <mesh geometry={g.torso} material={m.coat} position={[0, -0.25, 0]} />
          <mesh
            geometry={g.tail}
            material={m.coat}
            position={[-0.34, -0.82, -0.3]}
            rotation={[0.1, 0, 0.1]}
          />
          <mesh
            geometry={g.tail}
            material={m.coat}
            position={[0.34, -0.82, -0.3]}
            rotation={[0.1, 0, -0.1]}
          />
          <mesh geometry={g.shirt} material={m.white} position={[0, -0.3, 0.33]} />
          <mesh geometry={g.zip} material={m.zip} position={[0, -0.3, 0.405]} />

          {/* bow + rose */}
          <group position={[0, -0.13, 0.43]}>
            <mesh geometry={g.knot} material={m.bow} />
            <mesh
              geometry={g.wing}
              material={m.bow}
              position={[0.2, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              scale={[1, 1, 0.45]}
            />
            <mesh
              geometry={g.wing}
              material={m.bow}
              position={[-0.2, 0, 0]}
              rotation={[0, 0, -Math.PI / 2]}
              scale={[1, 1, 0.45]}
            />
            <group position={[0, -0.01, 0.1]} scale={1.45}>
              <mesh geometry={g.rose} material={m.rose} scale={[1, 1, 0.8]} />
              <mesh geometry={g.petal} material={m.rose} position={[0, 0, 0.02]} />
              <mesh
                geometry={g.petal}
                material={m.rose}
                scale={0.62}
                position={[0, 0, 0.06]}
                rotation={[0, 0, 0.6]}
              />
            </group>
          </group>

          {/* arms */}
          <group ref={armL} position={[-0.58, -0.04, 0.05]}>
            <mesh geometry={g.arm} material={m.coat} position={[0, -0.22, 0]} />
            <mesh geometry={g.hand} material={m.white} position={[0, -0.5, 0]} />
          </group>
          <group ref={armR} position={[0.58, -0.04, 0.05]}>
            <mesh geometry={g.arm} material={m.coat} position={[0, -0.22, 0]} />
            <mesh geometry={g.hand} material={m.white} position={[0, -0.5, 0]} />
          </group>

        <group ref={head}>
          {/* back hair and the long teal underlayer */}
          <mesh
            geometry={g.back}
            material={m.hairCap}
            position={[0, 0.84, -0.2]}
            scale={[1.2, 1.08, 0.9]}
          />
          <group ref={tealR} position={[0, PIVOT, 0]}>
            <mesh geometry={g.tealPanel} material={m.teal} position={[0, -PIVOT, 0]} />
          </group>
          <group ref={tealL} position={[0, PIVOT, 0]}>
            <mesh
              geometry={g.tealPanel}
              material={m.teal}
              position={[0, -PIVOT, 0]}
              scale={[-1, 1, 1]}
            />
          </group>

          {/* head, painted face and the hair cap over it */}
          <mesh
            geometry={g.head}
            material={m.skin}
            position={[0, HEAD.cy, 0]}
            scale={[HEAD.rx, HEAD.ry, HEAD.rz]}
          />
          <mesh
            geometry={g.cap}
            material={m.hairCap}
            position={[0, HEAD.cy, 0]}
            scale={[1.15, 1.0, 1.0]}
          />
          <mesh geometry={g.bangL} material={m.hair} />
          <mesh geometry={g.bangR} material={m.hair} />

          {/* long navy locks framing the face */}
          <group ref={lockR} position={[0, PIVOT, 0]}>
            <mesh geometry={g.lock} material={m.hair} position={[0, -PIVOT, 0]} />
          </group>
          <group ref={lockL} position={[0, PIVOT, 0]}>
            <mesh
              geometry={g.lock}
              material={m.hair}
              position={[0, -PIVOT, 0]}
              scale={[-1, 1, 1]}
            />
          </group>
        </group>
        </group>
      </group>
    </>
  );
}
