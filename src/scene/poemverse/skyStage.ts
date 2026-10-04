import * as THREE from "three";

import { ConstellationSky } from "./constellationSky";

import type { SkyLayout } from "./constellationLayout";
import type { SkyBasis } from "./constellationSky";

export class SkyStage {
  readonly root = new THREE.Group();
  private sky: ConstellationSky | null = null;
  private landedAt = -1;
  private now = 0;
  private hoverIndex = -1;
  private pulseIndex = -1;
  private pulseStartedAt = -1;

  get current() {
    return this.sky;
  }

  get hovered() {
    return this.hoverIndex;
  }

  get sinceLanding() {
    return this.landedAt >= 0 ? this.now - this.landedAt : -1;
  }

  get isSettled() {
    const since = this.sinceLanding;
    return this.sky === null || (since >= 0 && this.sky.isFullyDrawn(since));
  }

  rebuild(
    layout: SkyLayout,
    basis: SkyBasis,
    landing: THREE.Vector3,
    orientation: THREE.Quaternion,
  ) {
    this.disposeSky();
    this.sky = new ConstellationSky(layout);
    this.sky.place(basis, landing, orientation);
    this.root.add(this.sky.group);
    this.landedAt = -1;
    this.hoverIndex = -1;
    this.pulseIndex = -1;
    this.pulseStartedAt = -1;
  }

  markLanded(time: number) {
    this.landedAt = time;
  }

  pulse(index: number, time: number) {
    this.pulseIndex = index;
    this.pulseStartedAt = time;
  }

  tick(time: number, scale: number) {
    this.now = time;
    this.sky?.update(this.sinceLanding, scale, this.hoverIndex);
    this.sky?.setPulse(this.pulseIndex, this.pulseIndex >= 0 ? time - this.pulseStartedAt : -1);
  }

  hover(index: number) {
    if (index === this.hoverIndex) return false;
    this.hoverIndex = index;
    return true;
  }

  dispose() {
    this.disposeSky();
  }

  private disposeSky() {
    if (!this.sky) return;
    this.root.remove(this.sky.group);
    this.sky.dispose();
    this.sky = null;
  }
}
