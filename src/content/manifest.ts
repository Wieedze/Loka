import type { Manifest, MixConfig, Track, TrackRole } from './types';

const ROLES: readonly TrackRole[] = ['jingle', 'ambiance', 'meditation', 'mantra', 'transition', 'cloture'];

function fail(path: string, expected: string): never {
  throw new Error(`manifest.json invalid: "${path}" ${expected}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'must be a finite number');
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value === '') fail(path, 'must be a non-empty string');
  return value;
}

function isRole(value: string): value is TrackRole {
  const names: readonly string[] = ROLES;
  return names.includes(value);
}

function parseMix(value: unknown): MixConfig {
  if (!isRecord(value)) fail('mix', 'must be an object');
  return {
    duckLevel: asNumber(value.duckLevel, 'mix.duckLevel'),
    duckInSec: asNumber(value.duckInSec, 'mix.duckInSec'),
    duckOutSec: asNumber(value.duckOutSec, 'mix.duckOutSec'),
    crossfadeSec: asNumber(value.crossfadeSec, 'mix.crossfadeSec'),
    voiceFadeSec: asNumber(value.voiceFadeSec, 'mix.voiceFadeSec'),
  };
}

function parseTrack(value: unknown, path: string): Track {
  if (!isRecord(value)) fail(path, 'must be an object');
  const role = asString(value.role, `${path}.role`);
  if (!isRole(role)) fail(`${path}.role`, `must be one of: ${ROLES.join(', ')}`);
  const track: Track = {
    id: asString(value.id, `${path}.id`),
    role,
    file: asString(value.file, `${path}.file`),
  };
  if (value.title !== undefined) track.title = asString(value.title, `${path}.title`);
  if (value.loop !== undefined) {
    if (typeof value.loop !== 'boolean') fail(`${path}.loop`, 'must be a boolean');
    track.loop = value.loop;
  }
  return track;
}

export function parseManifest(data: unknown): Manifest {
  if (!isRecord(data)) fail('(root)', 'must be an object');
  const tracksRaw = data.tracks;
  if (!Array.isArray(tracksRaw)) fail('tracks', 'must be an array');
  const items: readonly unknown[] = tracksRaw;
  return {
    version: asNumber(data.version, 'version'),
    mix: parseMix(data.mix),
    tracks: items.map((item, index) => parseTrack(item, `tracks[${index}]`)),
  };
}

// Sans délai maximum, un réseau saturé — celui d'une salle de jeu — laisse
// l'attente ouverte indéfiniment et l'appui reste sans effet.
const DELAI_MAX_MS = 8000;

export async function loadManifest(): Promise<Manifest> {
  const url = `${import.meta.env.BASE_URL}manifest.json`;
  const response = await fetch(url, { signal: AbortSignal.timeout(DELAI_MAX_MS) });
  if (!response.ok) throw new Error(`manifest.json: HTTP ${response.status}`);
  const data: unknown = await response.json();
  return parseManifest(data);
}

export function trackUrl(track: Track): string {
  const base = import.meta.env.VITE_AUDIO_BASE ?? '/';
  return base.endsWith('/') ? `${base}${track.file}` : `${base}/${track.file}`;
}
