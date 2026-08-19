import { engine } from '../audio/engine';

let listening = false;

// A phone call or an app switch suspends the AudioContext on iOS. Without this
// every button stays silent for the rest of the journey.
export function watchVisibility(): void {
  if (listening) return;
  listening = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void engine.resume();
  });
}
