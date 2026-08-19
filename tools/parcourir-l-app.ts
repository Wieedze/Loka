// Ouvre l'app dans un vrai Chrome, joue une séquence de clics et capture.
const PORT = Number(process.argv[2] ?? 5173);
const CDP = Number(process.argv[3] ?? 9224);
const SORTIE = process.argv[4] ?? '/tmp/sortie.png';

const cibles = (await (await fetch(`http://localhost:${CDP}/json`)).json()) as Array<{
  type: string;
  webSocketDebuggerUrl: string;
}>;
const page = cibles.find((t) => t.type === 'page');
if (!page) throw new Error('aucune page');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const attente = new Map<number, (v: unknown) => void>();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(String(e.data)) as { id?: number; result?: unknown; error?: unknown };
  if (m.id !== undefined && attente.has(m.id)) {
    attente.get(m.id)?.(m.error ?? m.result);
    attente.delete(m.id);
  }
});
const envoyer = (method: string, params: unknown = {}): Promise<unknown> => {
  const n = ++id;
  return new Promise((r) => {
    attente.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
};
const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const evaluer = async (expr: string): Promise<unknown> => {
  const r = (await envoyer('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })) as {
    result?: { value?: unknown };
    exceptionDetails?: { text?: string };
  };
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result?.value;
};

await new Promise((r) => ws.addEventListener('open', r));
await envoyer('Page.enable');
await envoyer('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await envoyer('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
await pause(2500);

// 1. la spirale d'accueil
await evaluer(`document.querySelector('.accueil .spirale').click()`);
await pause(1500);
// 2. le nœud Terre du mandala
await evaluer(`document.querySelector('[data-cle="terre"]').click()`);
await pause(2200);

console.log('état :', await evaluer(`JSON.stringify({
  page: !!document.querySelector('.page-element'),
  titre: document.querySelector('.page-element-titre h2')?.textContent,
  etat: document.querySelector('.lecture-etat')?.textContent,
  retour: !!document.querySelector('.retour'),
  opacite: getComputedStyle(document.querySelector('.page-element')).opacity,
})`));

// 3. la flèche de retour
await evaluer(`document.querySelector('.retour').click()`);
await pause(1600);
console.log('après retour :', await evaluer(`JSON.stringify({
  page: !!document.querySelector('.page-element'),
  noeuds: document.querySelectorAll('.noeud').length,
  visibles: [...document.querySelectorAll('.noeud')].filter(n => getComputedStyle(n).opacity === '1' && getComputedStyle(n).visibility === 'visible').length,
  spirale: getComputedStyle(document.querySelector('.spirale')).opacity,
  joue: document.querySelector('.ce-qui-joue')?.textContent,
})`));

const shot = (await envoyer('Page.captureScreenshot', { format: 'png' })) as { data?: string };
if (shot.data) await Bun.write(SORTIE, Buffer.from(shot.data, 'base64'));
console.log('capture ->', SORTIE);
ws.close();
process.exit(0);
