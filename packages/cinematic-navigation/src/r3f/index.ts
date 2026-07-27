import { useLayoutEffect } from "react";

import { useFrame } from "@react-three/fiber";

import type { RefObject } from "react";
import type { Object3D } from "three";
import type { CinematicRuntime } from "../core/index.js";

export type SubjectHandle = Object3D;
export type SubjectResolver = (subjectId: string) => SubjectHandle | null;

export class SubjectRegistry {
  readonly #subjects = new Map<string, SubjectHandle>();
  register(subjectId: string, handle: SubjectHandle) {
    if (this.#subjects.has(subjectId))
      throw new Error(`[cinematic-navigation/r3f] Duplicate subject ID: ${subjectId}`);
    this.#subjects.set(subjectId, handle);
    return () => this.unregister(subjectId, handle);
  }
  unregister(subjectId: string, handle?: SubjectHandle) {
    if (!handle || this.#subjects.get(subjectId) === handle) this.#subjects.delete(subjectId);
  }
  resolve(subjectId: string) {
    return this.#subjects.get(subjectId) ?? null;
  }
  require(subjectId: string) {
    const subject = this.resolve(subjectId);
    if (!subject)
      throw new Error(`[cinematic-navigation/r3f] Missing subject registration: ${subjectId}`);
    return subject;
  }
  clear() {
    this.#subjects.clear();
  }
}

export const createSubjectRegistry = () => new SubjectRegistry();

export function useSubjectRegistration(
  registry: SubjectRegistry,
  subjectId: string,
  ref: RefObject<Object3D | null>,
) {
  useLayoutEffect(() => {
    const subject = ref.current;
    if (!subject) {
      if (process.env.NODE_ENV !== "production")
        console.warn(
          `[cinematic-navigation/r3f] Subject '${subjectId}' was not mounted during registration.`,
        );
      return;
    }
    return registry.register(subjectId, subject);
  }, [registry, subjectId, ref]);
}

/** One bridge owns the render-loop tick for the lifecycle scheduler. */
export function RuntimeFrameBridge({
  runtime,
  paused = false,
}: {
  runtime: CinematicRuntime;
  paused?: boolean;
}) {
  useFrame(({ clock }, delta) => {
    if (!paused) runtime.update(delta, clock.elapsedTime);
  });
  return null;
}
