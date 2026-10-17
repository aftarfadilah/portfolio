import { MathUtils } from "three";

// World units: 1 unit = 10 cm. A 12" LP is 3 units across.
export const PLATTER_CENTER = { x: -0.6, z: 0 };
export const RECORD_RADIUS = 1.5;
export const TABLE_Y = -0.56;
export const SEATED_Y = 0.19;
export const ARM = { px: 1.75, pz: -1.15, y: 0.33, length: 2.35 };

const PLATTER_RPM = 100 / 3;
export const PLATTER_SPEED = (PLATTER_RPM / 60) * Math.PI * 2;

// Yaw (rotation.y) that places the stylus at `radius` from the spindle.
function yawForRadius(radius: number): number {
  const dist = (t: number) =>
    Math.hypot(
      ARM.px + ARM.length * Math.cos(t) - PLATTER_CENTER.x,
      ARM.pz + ARM.length * Math.sin(t) - PLATTER_CENTER.z,
    );
  let lo = Math.PI / 2;
  let hi = Math.atan2(PLATTER_CENTER.z - ARM.pz, PLATTER_CENTER.x - ARM.px);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (dist(mid) > radius) lo = mid;
    else hi = mid;
  }
  return -(lo + hi) / 2;
}

export const ARM_YAW_START = yawForRadius(1.4);
export const ARM_YAW_END = yawForRadius(0.68);
export const ARM_YAW_REST = -1.45;

export type ArmPhase =
  | "rest"
  | "raise-in"
  | "swing-in"
  | "lower"
  | "play"
  | "raise-out"
  | "swing-out"
  | "lower-out";

export interface Sim {
  platterAngle: number;
  platterSpeed: number;
  armYaw: number;
  armLift: number;
  armPhase: ArmPhase;
  discSeated: boolean;
}

export function createSim(): Sim {
  return {
    platterAngle: 0,
    platterSpeed: 0,
    armYaw: ARM_YAW_REST,
    armLift: 0,
    armPhase: "rest",
    discSeated: false,
  };
}

export interface ArmControl {
  want: boolean;
  progress: number;
  onNeedleDown: () => void;
  onLiftOff: () => void;
}

const OUT_PHASES: ArmPhase[] = ["raise-out", "swing-out", "lower-out"];

export function isRetreating(phase: ArmPhase) {
  return OUT_PHASES.includes(phase);
}

/** Advances the tonearm sequence: lift, swing over, lower, track, lift, return. */
export function stepArm(sim: Sim, ctl: ArmControl, dt: number) {
  const wantIn = ctl.want && sim.discSeated;
  const playYaw = MathUtils.lerp(
    ARM_YAW_START,
    ARM_YAW_END,
    MathUtils.clamp(ctl.progress, 0, 1),
  );

  const retreat = () => {
    sim.armPhase = "raise-out";
    ctl.onLiftOff();
  };

  switch (sim.armPhase) {
    case "rest":
      if (wantIn) sim.armPhase = "raise-in";
      break;
    case "raise-in":
      if (!wantIn) return retreat();
      sim.armLift = MathUtils.damp(sim.armLift, 1, 6, dt);
      if (sim.armLift > 0.96) sim.armPhase = "swing-in";
      break;
    case "swing-in":
      if (!wantIn) return retreat();
      sim.armYaw = MathUtils.damp(sim.armYaw, playYaw, 3, dt);
      if (Math.abs(sim.armYaw - playYaw) < 0.015) sim.armPhase = "lower";
      break;
    case "lower":
      if (!wantIn) return retreat();
      sim.armYaw = MathUtils.damp(sim.armYaw, playYaw, 8, dt);
      sim.armLift = MathUtils.damp(sim.armLift, 0, 5, dt);
      if (sim.armLift < 0.03) {
        sim.armLift = 0;
        sim.armPhase = "play";
        ctl.onNeedleDown();
      }
      break;
    case "play":
      if (!wantIn) return retreat();
      sim.armYaw = MathUtils.damp(sim.armYaw, playYaw, 8, dt);
      break;
    case "raise-out":
      if (wantIn) sim.armPhase = "raise-in";
      sim.armLift = MathUtils.damp(sim.armLift, 1, 6, dt);
      if (sim.armLift > 0.96) sim.armPhase = "swing-out";
      break;
    case "swing-out":
      if (wantIn) sim.armPhase = "raise-in";
      sim.armYaw = MathUtils.damp(sim.armYaw, ARM_YAW_REST, 3, dt);
      if (Math.abs(sim.armYaw - ARM_YAW_REST) < 0.015) sim.armPhase = "lower-out";
      break;
    case "lower-out":
      if (wantIn) sim.armPhase = "raise-in";
      sim.armLift = MathUtils.damp(sim.armLift, 0, 5, dt);
      if (sim.armLift < 0.03) {
        sim.armLift = 0;
        sim.armYaw = ARM_YAW_REST;
        sim.armPhase = "rest";
      }
      break;
  }
}

/** Platter spins while a record is seated and the arm is out of the way or working. */
export function stepPlatter(sim: Sim, dt: number) {
  // Keep spinning until the arm is home, then spin down.
  const target = sim.discSeated && sim.armPhase !== "rest" ? PLATTER_SPEED : 0;
  sim.platterSpeed = MathUtils.damp(
    sim.platterSpeed,
    target,
    target > 0 ? 1.2 : 0.7,
    dt,
  );
  if (target === 0 && sim.platterSpeed < 0.01) sim.platterSpeed = 0;
  sim.platterAngle =
    (sim.platterAngle + sim.platterSpeed * dt) % (Math.PI * 2);
}
