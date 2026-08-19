// Vérifie public/manifest.json avec le VRAI validateur de l'application, plus
// ce que lui seul ne peut pas voir : unicité des identifiants et existence des
// fichiers. Sans cette étape, une virgule en trop passe la CI et tue l'app en
// production, au premier appui, pour tout le monde.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseManifest } from '../src/content/manifest';

const racine = join(import.meta.dir, '..');
const chemin = join(racine, 'public/manifest.json');

const erreurs: string[] = [];
const brut = await readFile(chemin, 'utf8');

let data: unknown;
try {
  data = JSON.parse(brut);
} catch (e) {
  console.error(`manifest.json illisible : ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}

const manifeste = parseManifest(data);

const vus = new Set<string>();
for (const piste of manifeste.tracks) {
  if (vus.has(piste.id)) erreurs.push(`identifiant en double : "${piste.id}"`);
  vus.add(piste.id);
  if (!existsSync(join(racine, 'public', piste.file))) {
    erreurs.push(`fichier absent pour "${piste.id}" : public/${piste.file}`);
  }
  if (!piste.title) erreurs.push(`titre manquant pour "${piste.id}" (il est affiché aux joueurs)`);
}

if (erreurs.length > 0) {
  console.error('manifest.json invalide :');
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`manifest.json valide : ${String(manifeste.tracks.length)} pistes, mix complet.`);
