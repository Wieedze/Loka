// Banc de mesure : rend l'audio hors-ligne dans un vrai Chrome et renvoie
// l'enveloppe réelle, pour vérifier qu'un fondu s'entend vraiment.
// Usage : bun tools/mesure-enveloppe.ts [port-vite] [port-cdp]
const PORT = Number(process.argv[2] ?? 5191);
const CDP = Number(process.argv[3] ?? 9223);

const targets = (await (await fetch(`http://localhost:${CDP}/json`)).json()) as Array<{
  type: string;
  webSocketDebuggerUrl: string;
}>;
const page = targets.find((t) => t.type === 'page');
if (!page) throw new Error('aucune page');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const waiting = new Map<number, (v: unknown) => void>();

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: unknown };
  if (msg.id !== undefined && waiting.has(msg.id)) {
    waiting.get(msg.id)?.(msg.error ?? msg.result);
    waiting.delete(msg.id);
  }
});

const send = (method: string, params: unknown = {}): Promise<unknown> => {
  const current = ++id;
  return new Promise((resolve) => {
    waiting.set(current, resolve);
    ws.send(JSON.stringify({ id: current, method, params }));
  });
};

await new Promise((resolve) => ws.addEventListener('open', resolve));
await send('Page.enable');
await send('Page.navigate', { url: `http://localhost:${PORT}/` });
await new Promise((r) => setTimeout(r, 2500));

const EXPRESSION = `(async () => {
  const { GainRamp } = await import('/src/audio/ramp.ts');
  const bytesA = await (await fetch('/audio/tfe.m4a')).arrayBuffer();
  const bytesB = await (await fetch('/audio/air.m4a')).arrayBuffer();
  const SR = 44100, DUREE = 10;
  const ctx = new OfflineAudioContext(1, SR * DUREE, SR);
  const bufA = await ctx.decodeAudioData(bytesA);
  const bufB = await ctx.decodeAudioData(bytesB.slice(0));

  const piste = (buf, gainInitial) => {
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const g = ctx.createGain();
    src.connect(g); g.connect(ctx.destination);
    src.start(0);
    return new GainRamp(g.gain, gainInitial);
  };

  // Le scénario du moteur : A entre en fondu, puis à t=4 on croise vers B.
  const a = piste(bufA, 0);
  const b = piste(bufB, 0);
  a.to(1, 0, 3);
  a.to(0, 4, 3);
  b.to(1, 4, 3);

  const rendu = await ctx.startRendering();
  const data = rendu.getChannelData(0);
  const points = [];
  for (let s = 0; s < DUREE; s += 0.5) {
    let crete = 0;
    for (let i = Math.floor(s * SR); i < Math.floor((s + 0.5) * SR); i++) {
      const v = Math.abs(data[i]);
      if (v > crete) crete = v;
    }
    points.push(Number(crete.toFixed(3)));
  }
  return JSON.stringify(points);
})()`;

const result = (await send('Runtime.evaluate', {
  expression: EXPRESSION,
  awaitPromise: true,
  returnByValue: true,
})) as { result?: { value?: string }; exceptionDetails?: { text?: string } };

if (result.exceptionDetails) {
  console.log('ERREUR', JSON.stringify(result.exceptionDetails));
} else {
  const points = JSON.parse(result.result?.value ?? '[]') as number[];
  console.log('ENVELOPPE DU CROISEMENT (crête par tranche de 0,5 s) :');
  points.forEach((p, i) => {
    const bar = '█'.repeat(Math.round(p * 40));
    console.log(`${(i * 0.5).toFixed(1).padStart(4)}s |${bar} ${p}`);
  });
}
ws.close();
process.exit(0);
