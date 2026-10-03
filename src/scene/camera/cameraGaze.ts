import * as THREE from "three";

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const gazeMatrix = new THREE.Matrix4();
const gazeQuaternion = new THREE.Quaternion();

export class CameraGaze {
  private weight = 0;
  private readonly target = new THREE.Vector3();
  private readonly offset = new THREE.Vector3();
  private fovOffset = 0;
  private appliedFovOffset = 0;

  get isEngaged() {
    return this.weight > 0.0001;
  }

  aimAt(target: THREE.Vector3) {
    this.target.copy(target);
  }

  steerToward(target: THREE.Vector3, lambda: number, step: number) {
    this.weight = THREE.MathUtils.damp(this.weight, 1, 2.4, step);
    this.target.x = THREE.MathUtils.damp(this.target.x, target.x, lambda, step);
    this.target.y = THREE.MathUtils.damp(this.target.y, target.y, lambda, step);
    this.target.z = THREE.MathUtils.damp(this.target.z, target.z, lambda, step);
  }

  relax(lambda: number, step: number) {
    this.weight = THREE.MathUtils.damp(this.weight, 0, lambda, step);
    if (this.weight < 0.002) this.weight = 0;
  }

  frame(offset: THREE.Vector3, amount: number, fovOffset: number) {
    this.offset.copy(offset).multiplyScalar(amount);
    this.fovOffset = fovOffset;
  }

  reset() {
    this.weight = 0;
    this.offset.set(0, 0, 0);
    this.fovOffset = 0;
  }

  releaseLens(camera: THREE.Camera) {
    if (!(camera instanceof THREE.PerspectiveCamera) || this.appliedFovOffset === 0) return;
    camera.fov -= this.appliedFovOffset;
    this.appliedFovOffset = 0;
    camera.updateProjectionMatrix();
  }

  apply(camera: THREE.Camera) {
    if (!this.isEngaged) return;
    camera.position.addScaledVector(this.offset, this.weight);
    gazeMatrix.lookAt(camera.position, this.target, WORLD_UP);
    gazeQuaternion.setFromRotationMatrix(gazeMatrix);
    camera.quaternion.slerp(gazeQuaternion, this.weight);
    if (!(camera instanceof THREE.PerspectiveCamera) || this.fovOffset === 0) return;
    this.appliedFovOffset = this.fovOffset * this.weight;
    camera.fov += this.appliedFovOffset;
    camera.updateProjectionMatrix();
  }
}
