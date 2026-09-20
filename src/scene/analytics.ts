import type { Mixpanel } from "mixpanel-browser";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

const MAX_PENDING_EVENTS = 100;
const pendingEvents: AnalyticsEvent[] = [];
let client: Mixpanel | null = null;
let loading: Promise<void> | null = null;

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") return;
  if (client) {
    client.track(name, properties);
    return;
  }
  if (pendingEvents.length === MAX_PENDING_EVENTS) pendingEvents.shift();
  pendingEvents.push({ name, properties });
}

export function scheduleAnalytics() {
  if (process.env.NODE_ENV !== "production") return;
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(
      () => {
        void loadAnalytics();
      },
      { timeout: 5000 },
    );
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(() => {
    void loadAnalytics();
  }, 1000);
  return () => clearTimeout(handle);
}

function loadAnalytics() {
  loading ??= import("mixpanel-browser")
    .then(({ default: mixpanel }) => {
      mixpanel.init("ff576ce4c6538cde6328105772148efb", {
        autocapture: true,
        record_sessions_percent: 0,
      });
      client = mixpanel;
      pendingEvents.splice(0).forEach(({ name, properties }) => client?.track(name, properties));
    })
    .catch((error: unknown) => {
      pendingEvents.length = 0;
      console.warn("Portfolio analytics could not be initialized.", error);
    });
  return loading;
}
