export type RenderReason =
  | "navigation-transition"
  | "camera-settle"
  | "camera-breathing"
  | "coffee-steam"
  | "certificate-animation"
  | "phone-screen"
  | "poems-preview"
  | "dof-focus"
  | "projection-sync"
  | "asset-ready"
  | "quality-change"
  | "working-set-change"
  | "resize"
  | "pointer-interaction"
  | "visibility-restored"
  | "effects-settle"
  | "diagnostics-capture"
  | "initial-render";

export type RenderCadence = "display" | "30fps" | "15fps";
export type RenderPriority = 0 | 1 | 2 | 3;

export interface RenderLeaseRequest {
  ownerId: string;
  reason: RenderReason;
  priority?: RenderPriority;
  cadence?: RenderCadence;
  expiresAt?: number | null;
  lifecycleId?: string;
  metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface RenderLease extends Required<
  Omit<RenderLeaseRequest, "expiresAt" | "lifecycleId" | "metadata">
> {
  id: string;
  startedAt: number;
  expiresAt: number | null;
  lifecycleId: string | null;
  metadata: Readonly<Record<string, string | number | boolean>>;
  generation: number;
}

export interface RenderSchedulerSnapshot {
  mode: "idle" | "one-shot" | "continuous" | "periodic";
  frameloop: "demand";
  visible: boolean;
  continuousLeases: readonly RenderLease[];
  periodicLeases: readonly RenderLease[];
  pendingInvalidations: number;
  lastInvalidationReason: RenderReason | null;
  lastInvalidationOwner: string | null;
  lastRenderedAt: number | null;
  idleSince: number | null;
  renderedFrames: number;
  framesWhileIdle: number;
  projectionUpdates: number;
  dofUpdates: number;
  invalidationsByOwner: Readonly<Record<string, number>>;
  warnings: readonly string[];
  forcedMode: "demand" | "continuous" | null;
}
