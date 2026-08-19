// Page de diagnostic (hors application) : elle joue de vraies pistes avec le
// vrai StreamPlayer et trace le niveau réellement mesuré en sortie. Sert à
// vérifier de visu, sur un appareil donné, qu'un fondu s'entend bien.
import { StreamPlayer } from '../audio/players';
import '../styles/tokens.css';
import './diagnostic.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root introuvable');

root.innerHTML = `
  <main>
    <h1>Diagnostic du son</h1>
    <p class="aide">
      Le tracé est le niveau <em>mesuré en sortie</em>, pas la valeur demandée :
      si la courbe monte en pente douce, le fondu s'entend.
    </p>

    <label class="duree">
      Durée du fondu : <output id="valeur">3,0</output> s
      <input id="duree" type="range" min="0.5" max="10" step="0.5" value="3" />
    </label>

    <div class="actions">
      <button id="entree" type="button">Fondu d'entrée</button>
      <button id="croiser" type="button">Fondu croisé vers Air</button>
      <button id="sortie" type="button">Fondu de sortie</button>
      <button id="stop" type="button">Tout couper</button>
    </div>

    <canvas id="trace" width="900" height="220"></canvas>
    <p id="etat" class="etat">Prêt. Touchez un bouton pour démarrer le son.</p>
  </main>
`;

const canvas = document.getElementById('trace') as HTMLCanvasElement;
const dessin = canvas.getContext('2d');
const etat = document.getElementById('etat') as HTMLParagraphElement;
const curseur = document.getElementById('duree') as HTMLInputElement;
const valeur = document.getElementById('valeur') as HTMLOutputElement;

let ctx: AudioContext | null = null;
let analyseur: AnalyserNode | null = null;
let entree: StreamPlayer | null = null;
let sortante: StreamPlayer | null = null;
const points: number[] = [];
const MAX_POINTS = 900;

const duree = (): number => Number(curseur.value);
curseur.addEventListener('input', () => {
  valeur.textContent = duree().toFixed(1).replace('.', ',');
});

function demarrer(): { ctx: AudioContext; analyseur: AnalyserNode } {
  if (!ctx || !analyseur) {
    ctx = new AudioContext();
    analyseur = ctx.createAnalyser();
    analyseur.fftSize = 2048;
    analyseur.connect(ctx.destination);
    boucleDeTrace();
  }
  void ctx.resume();
  return { ctx, analyseur };
}

function niveau(): number {
  if (!analyseur) return 0;
  const donnees = new Float32Array(analyseur.fftSize);
  analyseur.getFloatTimeDomainData(donnees);
  let somme = 0;
  for (const v of donnees) somme += v * v;
  return Math.sqrt(somme / donnees.length);
}

function boucleDeTrace(): void {
  points.push(niveau());
  if (points.length > MAX_POINTS) points.shift();
  if (dessin) {
    const { width, height } = canvas;
    dessin.clearRect(0, 0, width, height);
    dessin.strokeStyle = 'rgba(237, 228, 216, 0.14)';
    dessin.beginPath();
    dessin.moveTo(0, height - 1);
    dessin.lineTo(width, height - 1);
    dessin.stroke();

    dessin.strokeStyle = '#d08b4c';
    dessin.lineWidth = 2;
    dessin.beginPath();
    points.forEach((p, i) => {
      // Échelle : le RMS d'une ambiance est faible, on amplifie pour voir la forme.
      const y = height - Math.min(1, p * 12) * (height - 8) - 4;
      if (i === 0) dessin.moveTo(i, y);
      else dessin.lineTo(i, y);
    });
    dessin.stroke();
  }
  if (ctx) {
    etat.textContent = `horloge audio : ${ctx.currentTime.toFixed(2)} s — état : ${ctx.state} — niveau : ${niveau().toFixed(4)}`;
  }
  requestAnimationFrame(boucleDeTrace);
}

document.getElementById('entree')?.addEventListener('click', () => {
  const { ctx: c, analyseur: a } = demarrer();
  entree?.stop();
  points.length = 0;
  entree = new StreamPlayer(c, '/audio/tfe.m4a', a, 0);
  void entree.play(duree()).catch((e: unknown) => {
    etat.textContent = `lecture refusée : ${String(e)}`;
  });
});

document.getElementById('croiser')?.addEventListener('click', () => {
  const { ctx: c, analyseur: a } = demarrer();
  sortante?.stop();
  sortante = entree;
  sortante?.fadeTo(0, duree());
  entree = new StreamPlayer(c, '/audio/air.m4a', a, 0);
  void entree.play(duree());
});

document.getElementById('sortie')?.addEventListener('click', () => {
  entree?.fadeTo(0, duree());
});

document.getElementById('stop')?.addEventListener('click', () => {
  entree?.stop();
  sortante?.stop();
  entree = null;
  sortante = null;
});
