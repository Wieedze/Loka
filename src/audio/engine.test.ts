import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeAudioEnvironment, FakeGainNode } from '../testing/fakeAudio';
import { flush, installFakeAudio } from '../testing/fakeAudio';
import { AudioEngine } from './engine';
import { GAIN_FLOOR } from './ramp';

// Les fondus sont exponentiels : à mi-parcours, moyenne géométrique.
const mediane = (a: number, b: number): number =>
  Math.sqrt(Math.max(a, GAIN_FLOOR) * Math.max(b, GAIN_FLOOR));

// Mix values come from the test manifest in fakeAudio.ts.
const DUCK_LEVEL = 0.25;
const DUCK_IN = 1.5;
const DUCK_OUT = 4;
const CROSSFADE = 3;
const VOICE_FADE = 1;
const CUT_FADE = 0.06;

let env: FakeAudioEnvironment;
let engine: AudioEngine;
// init() creates exactly one bus: le fond, qui porte ambiances et mantras.
let fond: FakeGainNode;

async function start(): Promise<void> {
  env = installFakeAudio();
  engine = new AudioEngine();
  await engine.init();
  const [premier] = env.context.gains;
  if (!premier) throw new Error('bus du fond non créé');
  fond = premier;
}

beforeEach(start);
afterEach(() => {
  env.restore();
  vi.useRealTimers();
});

describe("règle 1 — l'ambiance ne s'arrête pas pendant une méditation", () => {
  it("baisse l'ambiance jusqu'au niveau de ducking, sans la couper", async () => {
    engine.playAmbiance('tfe');
    const tfe = env.lastGain();
    await flush();
    env.advance(CROSSFADE);

    engine.playVoice('med-01');
    const t = env.context.currentTime;

    expect(fond.gain.valueAtTime(t)).toBeCloseTo(1);
    expect(fond.gain.valueAtTime(t + DUCK_IN / 2)).toBeCloseTo(mediane(1, DUCK_LEVEL), 3);
    expect(fond.gain.valueAtTime(t + DUCK_IN)).toBeCloseTo(DUCK_LEVEL);
    // The track itself keeps playing at full level: only the bus dips.
    expect(tfe.gain.valueAtTime(t + DUCK_IN)).toBeCloseTo(1);
    expect(env.elementFor('tfe.m4a').playing).toBe(true);
  });

  it('baisse le fond — ambiances et mantras ensemble — mais jamais la voix', async () => {
    engine.playAmbiance('tfe');
    engine.playMantra('mantra-01');
    await flush();

    engine.playVoice('med-01');
    const voix = env.lastGain();
    const t = env.context.currentTime + DUCK_IN;

    // Ambiance et mantra passent par le même bus : un seul gain à baisser.
    expect(fond.gain.valueAtTime(t)).toBeCloseTo(DUCK_LEVEL);
    // La voix va droit à la sortie : rien ne la touche.
    expect(voix.gain.valueAtTime(t)).toBeCloseTo(1);
  });

  it("remonte progressivement à la fin de la méditation", () => {
    engine.playAmbiance('tfe');
    engine.playVoice('med-01');
    env.advance(DUCK_IN);

    env.elementFor('meditations/01').emit('ended');
    const t = env.context.currentTime;

    expect(fond.gain.valueAtTime(t)).toBeCloseTo(DUCK_LEVEL);
    expect(fond.gain.valueAtTime(t + DUCK_OUT / 2)).toBeCloseTo(mediane(DUCK_LEVEL, 1), 3);
    expect(fond.gain.valueAtTime(t + DUCK_OUT)).toBeCloseTo(1);
    expect(engine.getState().voiceId).toBeNull();
  });

  it("remonte aussi quand la lecture échoue, sinon l'ambiance resterait étouffée", async () => {
    engine.playAmbiance('tfe');
    env.armPlayFailure();
    engine.playVoice('med-01');
    await flush();

    const t = env.context.currentTime;
    expect(engine.getState().voiceId).toBeNull();
    expect(fond.gain.valueAtTime(t + DUCK_OUT)).toBeCloseTo(1);
  });

  it("l'arrêt manuel fond la voix au lieu de la couper net", () => {
    engine.playVoice('med-01');
    const voice = env.lastGain();
    env.advance(DUCK_IN);
    const t = env.context.currentTime;

    engine.stopVoice();

    expect(voice.gain.valueAtTime(t)).toBeCloseTo(1);
    expect(voice.gain.valueAtTime(t + VOICE_FADE / 2)).toBeCloseTo(mediane(1, 0), 3);
    expect(voice.gain.valueAtTime(t + VOICE_FADE)).toBeCloseTo(0);
    expect(fond.gain.valueAtTime(t + DUCK_OUT)).toBeCloseTo(1);
  });
});

describe('le fond finit toujours par remonter', () => {
  it("relève le fond quand un son non parlé remplace un message parlé", async () => {
    engine.playAmbiance('tfe');
    await flush();

    // Message d'accueil : le fond descend.
    void engine.playOneShot('accueil');
    await flush();
    expect(fond.gain.valueAtTime(env.context.currentTime + DUCK_IN)).toBeCloseTo(DUCK_LEVEL, 3);

    // On enchaîne sur le son de passage, qui ne parle pas : personne d'autre
    // ne relèvera le fond, puisque le message précédent a été coupé.
    env.advance(DUCK_IN);
    void engine.playOneShot('lucidite');
    await flush();

    expect(fond.gain.valueAtTime(env.context.currentTime + DUCK_OUT)).toBeCloseTo(1, 3);
  });

  it('relève le fond pendant une méditation en pause, et le rebaisse à la reprise', async () => {
    engine.playAmbiance('tfe');
    engine.playVoice('med-01');
    await flush();
    env.advance(DUCK_IN);
    expect(fond.gain.valueAtTime(env.context.currentTime)).toBeCloseTo(DUCK_LEVEL, 3);

    engine.pauseVoice();
    expect(fond.gain.valueAtTime(env.context.currentTime + DUCK_OUT)).toBeCloseTo(1, 3);

    env.advance(DUCK_OUT);
    engine.resumeVoice();
    await flush();
    expect(fond.gain.valueAtTime(env.context.currentTime + DUCK_IN)).toBeCloseTo(DUCK_LEVEL, 3);
  });
});

describe('règle 2 — les mantras se superposent, un seul à la fois', () => {
  it('fait entrer le mantra en fondu par-dessus une ambiance qui continue', async () => {
    engine.playAmbiance('tfe');
    const tfe = env.lastGain();
    await flush();
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    engine.playMantra('mantra-01');
    const mantra = env.lastGain();
    await flush();

    expect(mantra.gain.valueAtTime(t)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(mantra.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
    // The ambiance is untouched: superposition, not replacement.
    expect(tfe.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
    expect(fond.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
  });

  it('remplace un mantra par un fondu croisé', async () => {
    engine.playMantra('mantra-01');
    const first = env.lastGain();
    await flush();
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    engine.playMantra('mantra-02');
    const second = env.lastGain();
    await flush();

    expect(first.gain.valueAtTime(t)).toBeCloseTo(1);
    expect(first.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(0);
    expect(second.gain.valueAtTime(t)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(second.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
    expect(engine.getState().mantraId).toBe('mantra-02');
  });
});

describe('règle 3 — Terre-Feu-Eau boucle sans couture', () => {
  it('démarre le jumeau en fondu croisé avant la fin de la piste', async () => {
    vi.useFakeTimers();
    engine.playAmbiance('tfe');
    const first = env.lastGain();
    const element = env.elementFor('tfe.m4a');

    // Just inside the crossfade window (duration 90, crossfade 3).
    element.currentTime = element.duration - CROSSFADE + 0.5;
    await vi.advanceTimersByTimeAsync(300);
    await flush();

    const second = env.lastGain();
    expect(second).not.toBe(first);
    const t = env.context.currentTime;
    expect(second.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
    expect(first.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(0);
    expect(engine.getState().ambianceId).toBe('tfe');
  });

  it("garde l'ambiance en vie si iOS refuse de lancer le jumeau", async () => {
    vi.useFakeTimers();
    engine.playAmbiance('tfe');
    const first = env.lastGain();
    const element = env.elementFor('tfe.m4a');
    element.currentTime = element.duration - 1;

    env.armPlayFailure();
    await vi.advanceTimersByTimeAsync(300);
    await flush();

    // The original player must not have been faded out.
    const t = env.context.currentTime;
    expect(first.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
    expect(element.playing).toBe(true);
    expect(engine.getState().ambianceId).toBe('tfe');
  });
});

describe("le fondu part du moment où le son sort vraiment", () => {
  it("attend le démarrage du fichier au lieu de s'écouler pendant le chargement", async () => {
    env.armSlowStart();
    engine.playAmbiance('tfe');
    const tfe = env.lastGain();
    await flush();

    // Le fichier met 5 s à se mettre à sonner : plus que la durée du fondu.
    env.advance(5);
    const demarrage = env.context.currentTime;
    env.elementFor('tfe.m4a').releaseStart();
    await flush();

    // Le fondu ne doit pas être déjà terminé : il commence maintenant.
    expect(tfe.gain.valueAtTime(demarrage)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(tfe.gain.valueAtTime(demarrage + CROSSFADE / 2)).toBeCloseTo(mediane(0, 1), 3);
    expect(tfe.gain.valueAtTime(demarrage + CROSSFADE)).toBeCloseTo(1);
  });
});

describe('règle 4 — le passage Lucidité est un fondu enchaîné', () => {
  it("fait sortir Terre-Feu-Eau pendant que l'Air entre", async () => {
    engine.playAmbiance('tfe');
    const tfe = env.lastGain();
    await flush();
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    engine.playAmbiance('air');
    const air = env.lastGain();
    await flush();

    expect(tfe.gain.valueAtTime(t)).toBeCloseTo(1);
    expect(tfe.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(0);
    expect(air.gain.valueAtTime(t)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(air.gain.valueAtTime(t + CROSSFADE / 2)).toBeCloseTo(mediane(0, 1), 3);
    expect(air.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
    expect(engine.getState().ambianceId).toBe('air');
  });

  it("ne réempile pas une ambiance déjà en cours", async () => {
    engine.playAmbiance('tfe');
    await flush();
    const avant = env.context.gains.length;

    // Terre, Feu et Eau ouvrent la même bande-son.
    engine.playAmbiance('tfe');
    engine.playAmbiance('tfe');
    await flush();

    expect(env.context.gains.length).toBe(avant);
    expect(env.elements.filter((e) => e.src.includes('tfe.m4a'))).toHaveLength(1);
    expect(engine.getState().ambianceId).toBe('tfe');
  });

  it("la toute première ambiance entre aussi en fondu, jamais d'un coup", async () => {
    engine.playAmbiance('tfe');
    const tfe = env.lastGain();
    await flush();
    const t = env.context.currentTime;

    expect(tfe.gain.valueAtTime(t)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(tfe.gain.valueAtTime(t + CROSSFADE / 2)).toBeCloseTo(mediane(0, 1), 3);
    expect(tfe.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
  });

  it("le son de passage se superpose sans baisser le fondu enchaîné", async () => {
    engine.playAmbiance('tfe');
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    void engine.playOneShot('lucidite');
    engine.playAmbiance('air');
    await flush();

    // 'transition' is sound design, not speech: nothing gets ducked.
    expect(fond.gain.valueAtTime(t + DUCK_IN)).toBeCloseTo(1);
  });
});

describe('règle 5 — la Porte prend le relais', () => {
  it("fait sortir l'ambiance du voyage en fondu", async () => {
    engine.playAmbiance('tfe');
    const tfe = env.lastGain();
    await flush();
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    engine.stopAmbiance();

    expect(tfe.gain.valueAtTime(t)).toBeCloseTo(1);
    expect(tfe.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(0);
    expect(engine.getState().ambianceId).toBeNull();
  });

  it('enchaîne Renouveau en fondu après le bruit de porte', async () => {
    engine.playAmbiance('tfe');
    env.advance(CROSSFADE);
    engine.stopAmbiance();

    const porte = engine.playOneShot('porte');
    await flush();
    const source = env.context.sources[env.context.sources.length - 1];
    source?.onended?.();
    await porte;

    const t = env.context.currentTime;
    engine.playAmbiance('renouveau');
    const renouveau = env.lastGain();
    await flush();
    expect(renouveau.gain.valueAtTime(t)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(renouveau.gain.valueAtTime(t + CROSSFADE)).toBeCloseTo(1);
  });
});

describe('un fondu de sortie se termine par une coupure', () => {
  it("coupe réellement la piste une fois le fondu terminé, pas seulement son volume", async () => {
    vi.useFakeTimers();
    engine.playAmbiance('tfe');
    await flush();
    const element = env.elementFor('tfe.m4a');
    expect(element.playing).toBe(true);

    engine.stopAmbiance();

    // Pendant le fondu, la piste joue encore : la couper tout de suite
    // produirait un blanc au lieu d'une sortie douce.
    await vi.advanceTimersByTimeAsync(CROSSFADE * 1000 - 200);
    expect(element.playing).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    expect(element.playing).toBe(false);
  });

  it("laisse le ducking remonter, lui, sans jamais couper la piste", async () => {
    vi.useFakeTimers();
    engine.playAmbiance('tfe');
    await flush();
    const element = env.elementFor('tfe.m4a');

    engine.playVoice('med-01');
    await vi.advanceTimersByTimeAsync((DUCK_IN + DUCK_OUT) * 1000 + 1000);

    expect(element.playing).toBe(true);
    expect(engine.getState().ambianceId).toBe('tfe');
  });
});

describe('messages parlés', () => {
  it("le message d'accueil passe au premier plan en baissant l'ambiance", () => {
    engine.playAmbiance('tfe');
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    void engine.playOneShot('accueil');

    expect(fond.gain.valueAtTime(t + DUCK_IN)).toBeCloseTo(DUCK_LEVEL);
  });

  it('le message de clôture baisse aussi le renouveau', () => {
    engine.playAmbiance('renouveau');
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    void engine.playOneShot('cloture');

    expect(fond.gain.valueAtTime(t + DUCK_IN)).toBeCloseTo(DUCK_LEVEL);
  });

  it("le bruit de Porte, lui, ne baisse rien", () => {
    engine.playAmbiance('tfe');
    env.advance(CROSSFADE);
    const t = env.context.currentTime;

    void engine.playOneShot('porte');

    expect(fond.gain.valueAtTime(t + DUCK_IN)).toBeCloseTo(1);
  });

  it("ne remonte l'ambiance qu'une fois la dernière voix terminée", async () => {
    engine.playAmbiance('tfe');
    engine.playVoice('med-01');
    void engine.playOneShot('cloture');
    await flush();

    // The one-shot ends first; the meditation is still speaking.
    const source = env.context.sources[env.context.sources.length - 1];
    source?.onended?.();
    const t = env.context.currentTime;
    expect(fond.gain.valueAtTime(t + DUCK_OUT)).toBeCloseTo(DUCK_LEVEL);

    env.elementFor('meditations/01').emit('ended');
    const t2 = env.context.currentTime;
    expect(fond.gain.valueAtTime(t2 + DUCK_OUT)).toBeCloseTo(1);
  });

  it('un double appui espacé fait taire le premier message aussitôt', async () => {
    void engine.playOneShot('accueil');
    const firstGain = env.lastGain();
    await flush();
    const first = env.context.sources[env.context.sources.length - 1];
    expect(first?.started).toBe(true);

    const t = env.context.currentTime;
    void engine.playOneShot('accueil');
    await flush();
    const second = env.context.sources[env.context.sources.length - 1];

    expect(second).not.toBe(first);
    expect(second?.started).toBe(true);
    // Silenced in a fraction of a second, not crossfaded over the new message.
    expect(firstGain.gain.valueAtTime(t + CUT_FADE)).toBeCloseTo(0);
  });

  it("un double appui rapide n'en démarre qu'un, même pendant le chargement", async () => {
    void engine.playOneShot('accueil');
    void engine.playOneShot('accueil');
    await flush();

    const started = env.context.sources.filter((source) => source.started && !source.stopped);
    expect(started).toHaveLength(1);
  });
});
