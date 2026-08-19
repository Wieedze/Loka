let sentinel: WakeLockSentinel | null = null;
let listening = false;

async function request(): Promise<void> {
  if (!('wakeLock' in navigator)) return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => {
      if (sentinel === lock) sentinel = null;
    });
    sentinel = lock;
  } catch {
    sentinel = null;
  }
}

// The phone sits on the table for a whole hour: the screen must not sleep,
// and the lock is dropped by the system whenever the page is hidden.
export async function acquireWakeLock(): Promise<void> {
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && sentinel === null) void request();
    });
  }
  await request();
}
