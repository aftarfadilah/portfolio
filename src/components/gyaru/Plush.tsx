"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeFaceTexture, makeFleeceTexture, makeShadowTexture } from "./face";

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
  hair: "#2b3772",
  tealTop: "#3f6a96",
  teal: "#35b3a6",
  coat: "#181d3a",
  pants: "#18234e",
  white: "#f4f3ee",
  bow: "#15161d",
  rose: "#37b0d6",
};

// Head ellipsoid; the hair is fitted to it.
const HEAD = { cy: 0.9, rx: 1.14, ry: 0.98, rz: 0.94 };
const HAIR_GROW = 1.06;

/* ------------------------------------------------------------------ hair */

type Key = [number, number];

/**
 * Where the hair stops on the head, as a polar angle from the crown for each
 * azimuth from the front. This is what shapes the bangs: a parting at the
 * front, swept sides, a long tip past each eye, then the back of the head.
 */
const HAIRLINE_R: Key[] = [
  [0, 1.12], [0.07, 1.1], [0.2, 1.36], [0.36, 1.43], [0.56, 1.48],
  [0.72, 1.82], [0.9, 1.56], [1.1, 1.5], [1.4, 1.62], [1.75, 1.98],
  [2.2, 2.4], [3.1416, 2.62],
];
const HAIRLINE_L: Key[] = [
  [0, 1.12], [0.07, 1.16], [0.22, 1.4], [0.4, 1.45], [0.58, 1.5],
  [0.74, 1.88], [0.94, 1.6], [1.1, 1.52], [1.4, 1.64], [1.75, 1.98],
  [2.2, 2.4], [3.1416, 2.62],
];

function interp(keys: Key[], a: number): number {
  for (let i = 1; i < keys.length; i++) {
    if (a <= keys[i][0]) {
      const [a0, v0] = keys[i - 1];
      const [a1, v1] = keys[i];
      return v0 + ((v1 - v0) * (a - a0)) / (a1 - a0);
    }
  }
  return keys[keys.length - 1][1];
}

/** Linear keys, then lightly blurred so tips are soft felt, not spikes. */
function hairline(phi: number): number {
  const keys = phi >= 0 ? HAIRLINE_R : HAIRLINE_L;
  let sum = 0;
  let n = 0;
  for (let o = -3; o <= 3; o++) {
    sum += interp(keys, Math.abs(phi + o * 0.025));
    n++;
  }
  return sum / n;
}

const dirOnHead = (theta: number, phi: number, grow: number) =>
  new THREE.Vector3(
    HEAD.rx * grow * Math.sin(theta) * Math.sin(phi),
    HEAD.cy + HEAD.ry * grow * Math.cos(theta),
    HEAD.rz * grow * Math.sin(theta) * Math.cos(phi),
  );

/** A thick felt cap over the skull whose lower edge follows `hairline`. */
function hairCap(): THREE.BufferGeometry {
  const NP = 192;
  const NT = 56;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i <= NP; i++) {
    const phi = -Math.PI + (2 * Math.PI * i) / NP;
    const edge = hairline(phi);
    for (let j = 0; j <= NT; j++) {
      const p = dirOnHead((edge * j) / NT, phi, HAIR_GROW);
      pos.push(p.x, p.y, p.z);
      uv.push(i / NP, j / NT);
    }
  }
  const ring = (NT + 1) * (NP + 1);
  for (let i = 0; i <= NP; i++) {
    const phi = -Math.PI + (2 * Math.PI * i) / NP;
    const p = dirOnHead(hairline(phi), phi, 0.985);
    pos.push(p.x, p.y, p.z);
    uv.push(i / NP, 1);
  }

  const at = (i: number, j: number) => i * (NT + 1) + j;
  for (let i = 0; i < NP; i++) {
    for (let j = 0; j < NT; j++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i, j + 1);
      const d = at(i + 1, j + 1);
      idx.push(a, c, b, b, c, d);
    }
    // The cut edge curls back under to meet the head, so it reads as thick felt.
    const o0 = at(i, NT);
    const o1 = at(i + 1, NT);
    idx.push(o0, ring + i, o1, o1, ring + i, ring + i + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

interface StrandOpts {
  width: number;
  thick: number;
  /** Direction the flat face of the strand looks. */
  face: THREE.Vector3;
  /** Colour ramp by height, for the teal ombre. */
  ramp?: { top: string; bottom: string; yTop: number; yBottom: number };
}

/**
 * A puffy, tapered strand of felt: an elliptical cross-section swept along a
 * path, narrowing to a soft point. Real volume, so it holds up from any side.
 */
function strand(points: THREE.Vector3[], o: StrandOpts): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const N = 56;
  const R = 16;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  const T = new THREE.Vector3();
  const B = new THREE.Vector3();
  const Nn = new THREE.Vector3();
  const p = new THREE.Vector3();

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = curve.getPointAt(t);
    curve.getTangentAt(t, T);
    B.crossVectors(T, o.face).normalize();
    Nn.crossVectors(B, T).normalize();
    // Full width for most of the length, then a rounded taper to the tip.
    const taper = Math.pow(Math.max(0, 1 - Math.pow(t, 3.2)), 0.7);
    const w = o.width * taper;
    const th = o.thick * Math.pow(taper, 0.6);
    for (let k = 0; k <= R; k++) {
      const a = (k / R) * Math.PI * 2;
      p.copy(c)
        .addScaledVector(B, Math.cos(a) * w)
        .addScaledVector(Nn, Math.sin(a) * th);
      pos.push(p.x, p.y, p.z);
      uv.push(t * 3, k / R);
    }
  }
  const at = (i: number, k: number) => i * (R + 1) + k;
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < R; k++) {
      const a = at(i, k);
      const b = at(i + 1, k);
      const c = at(i, k + 1);
      const d = at(i + 1, k + 1);
      idx.push(a, b, c, c, b, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  // Make sure the winding faces outward, whichever way the path ran.
  const probe = at(Math.floor(N * 0.4), 0);
  const centre = curve.getPointAt(0.4);
  const n = new THREE.Vector3().fromBufferAttribute(geo.attributes.normal, probe);
  const out = new THREE.Vector3().fromBufferAttribute(geo.attributes.position, probe).sub(centre);
  if (n.dot(out) < 0) {
    const index = geo.index!;
    for (let i = 0; i < index.count; i += 3) {
      const tmp = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, tmp);
    }
    geo.computeVertexNormals();
  }

  if (o.ramp) {
    const top = new THREE.Color(o.ramp.top);
    const bottom = new THREE.Color(o.ramp.bottom);
    const posA = geo.attributes.position;
    const col = new Float32Array(posA.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < posA.count; i++) {
      const t = THREE.MathUtils.clamp(
        (o.ramp.yTop - posA.getY(i)) / (o.ramp.yTop - o.ramp.yBottom),
        0,
        1,
      );
      tmp.copy(top).lerp(bottom, t);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

/** Height of the head's surface at (x, y); zero once past it. */
function surfZ(x: number, y: number) {
  const q = 1 - (x / HEAD.rx) ** 2 - ((y - HEAD.cy) / HEAD.ry) ** 2;
  return HEAD.rz * Math.sqrt(Math.max(q, 0));
}

/** A path down the side of the head: hugs the skull, then hangs free. */
function sidePath(xy: Key[], sign: 1 | -1, lift: number, minZ: number) {
  return xy.map(
    ([x, y]) => new THREE.Vector3(x * sign, y, Math.max(surfZ(x, y) + lift, minZ)),
  );
}

function sideHair(sign: 1 | -1) {
  const tealRamp = { top: C.tealTop, bottom: C.teal, yTop: 0.9, yBottom: -1.1 };
  const face = new THREE.Vector3(0.3 * sign, 0, 0.95).normalize();
  const back = new THREE.Vector3(0.2 * sign, 0, 1).normalize();

  const locks = [
    strand(
      sidePath([[0.78, 1.34], [0.98, 0.95], [1.07, 0.35], [1.09, -0.25], [1.03, -0.88]], sign, 0.07, 0.16),
      { width: 0.2, thick: 0.085, face },
    ),
    strand(
      sidePath([[0.66, 1.3], [0.86, 0.85], [0.95, 0.3], [0.97, -0.2], [0.93, -0.5]], sign, 0.09, 0.26),
      { width: 0.14, thick: 0.07, face },
    ),
  ];

  const tealPath = (pts: [number, number, number][]) =>
    pts.map(([x, y, z]) => new THREE.Vector3(x * sign, y, z));
  const teal = [
    strand(tealPath([[0.95, 0.8, -0.2], [1.18, 0.2, -0.24], [1.26, -0.5, -0.22], [1.17, -1.12, -0.2]]), {
      width: 0.26, thick: 0.09, face: back, ramp: tealRamp,
    }),
    strand(tealPath([[0.8, 0.6, -0.26], [0.95, -0.2, -0.3], [0.9, -0.8, -0.3], [0.84, -1.04, -0.28]]), {
      width: 0.24, thick: 0.09, face: back, ramp: tealRamp,
    }),
    strand(tealPath([[1.0, 0.7, -0.16], [1.3, 0.0, -0.18], [1.4, -0.55, -0.16], [1.36, -0.86, -0.14]]), {
      width: 0.2, thick: 0.08, face: back, ramp: tealRamp,
    }),
  ];
  return { locks, teal };
}

function backTeal() {
  const ramp = { top: C.tealTop, bottom: C.teal, yTop: 0.9, yBottom: -1.1 };
  const face = new THREE.Vector3(0, 0, -1);
  return [-0.56, -0.28, 0, 0.28, 0.56].map((x, i) =>
    strand(
      [
        new THREE.Vector3(x * 0.9, 0.45, -0.58),
        new THREE.Vector3(x, -0.1, -0.54 - (i % 2) * 0.03),
        new THREE.Vector3(x * 1.08, -0.65, -0.52 - (i % 2) * 0.03),
        new THREE.Vector3(x * 1.14, -0.98 - ((i * 7) % 3) * 0.07, -0.5),
      ],
      { width: 0.27, thick: 0.08, face, ramp },
    ),
  );
}

/* ------------------------------------------------------------- materials */

function felt(
  color: string,
  fleece: THREE.Texture,
  extra: THREE.MeshPhysicalMaterialParameters = {},
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.92,
    metalness: 0,
    sheen: 0.8,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.25),
    bumpMap: fleece,
    bumpScale: 0.9,
    ...extra,
  });
}

function build() {
  const faceTex = makeFaceTexture();
  const shadowTex = makeShadowTexture();
  const fleece = makeFleeceTexture();

  const mats = {
    skin: felt("#ffffff", fleece, { map: faceTex, sheen: 1, sheenColor: new THREE.Color("#fff1d2") }),
    hair: felt(C.hair, fleece),
    teal: felt("#ffffff", fleece, { vertexColors: true }),
    coat: felt(C.coat, fleece),
    pants: felt(C.pants, fleece),
    white: felt(C.white, fleece),
    bow: felt(C.bow, fleece),
    rose: felt(C.rose, fleece),
    zip: new THREE.MeshStandardMaterial({ color: "#a9aebf", roughness: 0.5 }),
    shadow: new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    }),
  };

  const R = sideHair(1);
  const L = sideHair(-1);

  const geos = {
    head: new THREE.SphereGeometry(1, 96, 64),
    cap: hairCap(),
    locksR: R.locks,
    locksL: L.locks,
    tealR: R.teal,
    tealL: L.teal,
    tealBack: backTeal(),
    torso: new RoundedBoxGeometry(0.98, 0.9, 0.75, 6, 0.22),
    shirt: new RoundedBoxGeometry(0.42, 0.76, 0.14, 4, 0.06),
    tail: new RoundedBoxGeometry(0.36, 0.52, 0.12, 4, 0.05),
    arm: new THREE.CapsuleGeometry(0.15, 0.3, 10, 20),
    hand: new THREE.SphereGeometry(0.17, 32, 20),
    leg: new THREE.CapsuleGeometry(0.21, 0.28, 10, 20),
    knot: new RoundedBoxGeometry(0.16, 0.16, 0.14, 4, 0.06),
    wing: new THREE.ConeGeometry(0.21, 0.34, 4),
    rose: new THREE.SphereGeometry(0.09, 24, 16),
    petal: new THREE.TorusGeometry(0.085, 0.032, 12, 28),
    zip: new THREE.BoxGeometry(0.014, 0.66, 0.02),
    shadow: new THREE.PlaneGeometry(1, 1),
  };

  return { faceTex, shadowTex, fleece, mats, geos };
}

type Assets = ReturnType<typeof build>;

/* ----------------------------------------------------------------- plush */

export default function Plush({ ctl }: { ctl: React.RefObject<PlushCtl> }) {
  const a = useMemo<Assets>(() => build(), []);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tealL = useRef<THREE.Group>(null);
  const tealR = useRef<THREE.Group>(null);
  const lockL = useRef<THREE.Group>(null);
  const lockR = useRef<THREE.Group>(null);
  const tealB = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);

  useEffect(
    () => () => {
      a.faceTex.dispose();
      a.shadowTex.dispose();
      a.fleece.dispose();
      Object.values(a.mats).forEach((m) => m.dispose());
      Object.values(a.geos)
        .flat()
        .forEach((g) => g.dispose());
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
    if (tealB.current) tealB.current.rotation.x = sway(0.4, 0.02) - lag * 0.2;
    if (armL.current) armL.current.rotation.z = -0.5 - Math.sin(t * 1.1) * 0.04;
    if (armR.current) armR.current.rotation.z = 0.5 + Math.sin(t * 1.1 + 1) * 0.04;
    if (shadow.current) shadow.current.scale.setScalar(3.4 - squash * 1.2);
  });
  /* eslint-enable react-hooks/immutability */

  const m = a.mats;
  const g = a.geos;
  const PIVOT = 1.1;

  const hang = (geos: THREE.BufferGeometry[], mat: THREE.Material) =>
    geos.map((geo, i) => <mesh key={i} geometry={geo} material={mat} />);

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
        <group ref={body}>
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
            <group position={[0, -0.01, 0.1]} scale={1.1}>
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
            {/* teal underlayer, behind everything */}
            <group ref={tealB}>{hang(g.tealBack, m.teal)}</group>
            <group ref={tealR} position={[0, PIVOT, 0]}>
              <group position={[0, -PIVOT, 0]}>{hang(g.tealR, m.teal)}</group>
            </group>
            <group ref={tealL} position={[0, PIVOT, 0]}>
              <group position={[0, -PIVOT, 0]}>{hang(g.tealL, m.teal)}</group>
            </group>

            {/* head with the painted-on face, and the felt cap over it */}
            <mesh
              geometry={g.head}
              material={m.skin}
              position={[0, HEAD.cy, 0]}
              scale={[HEAD.rx, HEAD.ry, HEAD.rz]}
            />
            <mesh geometry={g.cap} material={m.hair} />

            {/* long navy locks framing the face */}
            <group ref={lockR} position={[0, PIVOT, 0]}>
              <group position={[0, -PIVOT, 0]}>{hang(g.locksR, m.hair)}</group>
            </group>
            <group ref={lockL} position={[0, PIVOT, 0]}>
              <group position={[0, -PIVOT, 0]}>{hang(g.locksL, m.hair)}</group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
