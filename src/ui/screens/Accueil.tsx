import { Spirale } from '../components/Spirale';

interface AccueilProps {
  onCommencement: () => void;
}

export function Accueil({ onCommencement }: AccueilProps) {
  return (
    <main className="accueil">
      <h1>La Loka</h1>
      <Spirale label="Commencement" vivante={false} captionnee onPress={onCommencement} />
      <p className="sous-titre">Posez le téléphone au centre de la table, puis touchez la spirale.</p>
    </main>
  );
}
