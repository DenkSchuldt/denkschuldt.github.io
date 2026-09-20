interface FrameSample {
  time: number;
  delta: number;
}

interface FrameSampleInput {
  now: number;
  deltaMs: number;
  continuous: boolean;
  visible: boolean;
  warmingUp: boolean;
}

const SAMPLE_WINDOW_MS = 30000;

export class ActiveFrameSamples {
  private samples: FrameSample[] = [];
  private wasContinuous = false;

  clear() {
    this.samples = [];
    this.wasContinuous = false;
  }

  record({ now, deltaMs, continuous, visible, warmingUp }: FrameSampleInput) {
    if (!visible || warmingUp) {
      this.clear();
      return;
    }
    while (this.samples[0] && now - this.samples[0].time > SAMPLE_WINDOW_MS) {
      this.samples.shift();
    }
    // The first frame after demand-rendering idle includes intentional waiting.
    if (continuous && this.wasContinuous && deltaMs > 0 && Number.isFinite(deltaMs)) {
      this.samples.push({ time: now, delta: deltaMs });
    }
    this.wasContinuous = continuous;
  }

  summarize(targetFrameMs: number) {
    const values = this.samples.map(({ delta }) => delta).sort((a, b) => a - b);
    const percentile = (fraction: number) =>
      values[Math.max(0, Math.ceil(values.length * fraction) - 1)] ?? 0;
    return {
      medianFrameMs: percentile(0.5),
      p95FrameMs: percentile(0.95),
      overBudgetRatio: values.length
        ? values.filter((value) => value > targetFrameMs * 1.18).length / values.length
        : 0,
      longestFrameMs: values.at(-1) ?? 0,
      sampleDurationMs: values.reduce((sum, value) => sum + value, 0),
      sampleCount: values.length,
      targetFrameMs,
    };
  }
}
