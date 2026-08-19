import { Spirale } from '../components/Spirale';

export type EtatAccueil = 'pret' | 'chargement' | 'erreur';

interface AccueilProps {
  etat: EtatAccueil;
  onCommencement: () => void;
}

const MESSAGE: Record<EtatAccueil, string> = {
  pret: 'Posez le téléphone au centre de la table, puis touchez la spirale.',
  chargement: 'Préparation du voyage…',
  erreur: "Le voyage n'a pas pu se charger. Vérifiez la connexion, puis touchez à nouveau la spirale.",
};

export function Accueil({ etat, onCommencement }: AccueilProps) {
  return (
    <main className="accueil" data-etat={etat}>
      <h1>La Loka</h1>
      <Spirale
        label="Commencement"
        vivante={etat === 'chargement'}
        captionnee
        onPress={onCommencement}
      />
      <p className="sous-titre" role={etat === 'erreur' ? 'alert' : undefined}>
        {MESSAGE[etat]}
      </p>
    </main>
  );
}
