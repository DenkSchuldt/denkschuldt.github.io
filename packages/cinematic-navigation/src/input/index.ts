import type { CinematicEngine, FocusDirection } from "../core/index.js";

export type NavigationIntent =
  | { type: "NEXT_SCENE" }
  | { type: "PREVIOUS_SCENE" }
  | { type: "ENTER_FOCUS"; collectionId: string; itemId: string }
  | { type: "GO_TO_FOCUS"; itemId: string }
  | { type: "EXIT_FOCUS" }
  | { type: "MOVE_FOCUS"; direction: FocusDirection }
  | { type: "INTERRUPT" };

export function dispatchNavigationIntent(engine: CinematicEngine, intent: NavigationIntent) {
  switch (intent.type) {
    case "NEXT_SCENE":
      return engine.nextScene();
    case "PREVIOUS_SCENE":
      return engine.previousScene();
    case "ENTER_FOCUS":
      return engine.enterFocus(intent.collectionId, intent.itemId);
    case "GO_TO_FOCUS":
      return engine.goToFocus(intent.itemId);
    case "EXIT_FOCUS":
      return engine.exitFocus();
    case "MOVE_FOCUS":
      return engine.moveFocus(intent.direction);
    case "INTERRUPT":
      engine.interruptTransition();
      return null;
  }
}
