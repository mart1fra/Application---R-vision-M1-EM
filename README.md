# ReviseM1

Application de revision pour M1 Ecole de Management. Vite + React + Tailwind CSS, deployable sur Vercel.

## Matieres

- Anglais (traductions FR/EN, vocabulaire business)
- Comportement humain (theories de la motivation, leadership, psychologie sociale)
- Statistique informatique (stats descriptives, inferentielles, regression)
- Systeme d'information (ERP, BDD, architecture SI, gouvernance)
- Droit des affaires (formes juridiques, contrats, procedures collectives)

## Lancer le projet

```bash
npm install
npm run dev
```

## Deployer sur Vercel

```bash
npx vercel
```

Ou connecter le repo GitHub a Vercel (auto-detection Vite).

## Schema des exercices JSON

Les exercices sont dans `src/data/<matiere>.json`. Chaque fichier est un tableau d'objets.

### Types d'exercices

#### QCM (`type: "qcm"`)
```json
{
  "type": "qcm",
  "level": "facile | moyen | difficile",
  "question": "Texte de la question",
  "choices": ["Choix A", "Choix B", "Choix C", "Choix D"],
  "answer": "Choix B",
  "explanation": "Explication apres reponse"
}
```
3 ou 4 choix, une seule bonne reponse.

#### Texte a trous (`type: "fill"`)
```json
{
  "type": "fill",
  "level": "moyen | difficile",
  "question": "Texte avec ___ a completer",
  "answers": ["reponse1", "reponse2"],
  "explanation": "Explication"
}
```
Utiliser `___` pour marquer le trou. Le champ `answers` accepte plusieurs variantes.

#### Reponse libre (`type: "free"`)
```json
{
  "type": "free",
  "level": "moyen | difficile",
  "question": "Question ouverte",
  "answers": ["reponse1", "reponse2", "variante"],
  "explanation": "Explication"
}
```

#### Traduction (`type: "translation"`) - Anglais uniquement
```json
{
  "type": "translation",
  "level": "moyen | difficile",
  "question": "Traduire : mot ou phrase",
  "direction": "fr-en | en-fr",
  "answers": ["translation1", "translation2"],
  "explanation": "Explication"
}
```

### Comparaison tolerante

Les reponses ecrites sont comparees en ignorant :
- Majuscules / minuscules
- Accents (e = e)
- Ponctuation
- Espaces multiples

Toujours fournir plusieurs formulations acceptees dans `answers`.

---

## Regles de generation des exercices par niveau

### ANGLAIS (vocabulaire uniquement)

Les exercices d'anglais portent **exclusivement sur le vocabulaire** extrait des cours (pas de comprehension de texte).

Le vocabulaire est stocke dans `src/data/vocabulaire-anglais.json` avec pour chaque entree : `francais`, `anglais` (traductions acceptees), `theme`, `cours_source`, `exemple` (phrase d'exemple en anglais).

| Niveau | Types autorises | Contenu |
|--------|----------------|---------|
| **Facile** | QCM uniquement (3-4 choix) | "Comment dit-on 'X' en anglais ?" et "Que signifie 'X' ?". Mots courants. Les mauvaises reponses sont des mots du meme theme. |
| **Moyen** | QCM + traduction ecrite (`translation`) | QCM avec mots/expressions plus difficiles. Traductions a ecrire (FR→EN et EN→FR) de mots individuels. |
| **Difficile** | Traduction d'expressions (`translation`) + texte a trous (`fill`) | Traduire des expressions ou locutions completes (FR→EN et EN→FR). Retrouver le mot manquant dans une phrase d'exemple en anglais. |

**Workflow pour ajouter un cours d'anglais :**
1. Placer le PDF dans `/cours/anglais/`
2. Extraire le vocabulaire dans `src/data/vocabulaire-anglais.json` (meme format)
3. Regenerer `src/data/anglais.json` a partir de la liste de vocabulaire uniquement

### AUTRES MATIERES (Comportement humain, Statistique informatique, Systeme d'information, Droit des affaires)

| Niveau | Types autorises | Contenu |
|--------|----------------|---------|
| **Facile** | QCM uniquement (3 ou 4 choix) | Definitions de base, notions essentielles, rappels de cours |
| **Moyen** | QCM + reponse courte a ecrire (`free`) | QCM plus pointus (nuances, cas d'application). Reponses courtes : un terme, un acronyme, une notion |
| **Difficile** | Texte a trous (`fill`) + reponse a ecrire (`free`) | Textes a trous dans des definitions ou enonces. Reponses ecrites : definitions, notions cles, petits cas pratiques (droit) |

### Regles generales

- **Pas de QCM en difficile** (sauf anglais moyen)
- **Pas de reponses ecrites en facile** : le facile est 100% QCM
- **Reponses ecrites** : toujours accepter plusieurs formulations dans `answers`
- **Exercices fideles aux cours** : generer uniquement a partir du contenu reel des fichiers de cours dans `/cours/<matiere>/`
- **Progression claire** : facile = reconnaitre, moyen = comprendre et appliquer, difficile = formuler et analyser

## Ajouter des exercices

1. Ouvrir `src/data/<matiere>.json`
2. Ajouter un objet au tableau en suivant le schema et les regles de niveau ci-dessus
3. Rebuilder : `npm run build`
