# ReviseM1

Application de revision pour M1 Ecole de Management. Vite + React + Tailwind CSS, deployable sur Vercel.

## Matieres

- Anglais (traductions FR/EN, vocabulaire business)
- Comportement humain (theories de la motivation, leadership, psychologie sociale)
- Statistique informatique (stats descriptives, inferentielles, regression)
- Systeme d'information (donnee / information, typologie STT, SIG, SIAD, SID, CRM, SCM, SIRH, ERP) + fiche de cours avec lexique FR / EN
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
3 ou 4 choix, une seule bonne reponse. L'ordre des choix est melange a chaque affichage : la position dans le JSON n'a pas d'importance.

Champs optionnels (QCM) :
- `notes` : `{ "choix faux": "pourquoi c'est faux" }`, affiche sous chaque mauvais choix apres la reponse
- `example` : phrase du cours (en anglais) affichee dans la correction
- `source` : ex. `"Theme 1 Part 1 · p. 3"`
- `prompt` + `word` : affichage "mot en grand" (`wordLang: "fr"` si le mot est en francais)
- `definition` : definition anglaise affichee en citation
- `sentence` : phrase anglaise avec `___` (QCM "mot en contexte")
- `choicesLang: "en"` : les choix sont en anglais

Chaque serie tire au hasard 20 questions du niveau (`SESSION_SIZE` dans `src/utils.js`).

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
Utiliser `___` pour marquer le trou. Le champ `answers` accepte plusieurs variantes. Champ optionnel `hint` : indice affiche a la demande (ex. la traduction francaise du mot manquant). `free` accepte aussi `definition` et `hint`.

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
- Ponctuation, tirets et espaces (`well-being` = `well being` = `wellbeing`)
- Un article en tete (`le moral` = `moral`, `to avoid` = `avoid`)

Une petite faute de frappe sur un mot long est acceptee mais signalee (`initiatve` -> correct, "attention a l'orthographe"). Une difference uniquement en fin de mot reste fausse, car c'est un autre mot ou une autre forme (`moral` ≠ `morale`, `value` ≠ `valued`).

Toujours fournir plusieurs formulations acceptees dans `answers`.

---

## Regles de generation des exercices par niveau

### ANGLAIS (vocabulaire uniquement)

Les exercices d'anglais portent **exclusivement sur le vocabulaire** extrait des cours (pas de comprehension de texte).

Le vocabulaire est stocke dans `src/data/vocabulaire-anglais.json` avec pour chaque entree : `francais`, `anglais` (traductions acceptees), `theme`, `cours_source`, `exemple` (phrase d'exemple en anglais).

| Niveau | Types autorises | Contenu |
|--------|----------------|---------|
| **Facile** | QCM uniquement, **3 choix** | Surtout "Que veut dire « X » ?" (mot anglais -> sens en francais), plus "Comment dit-on… en anglais ?" et "Quel mot correspond a cette definition ?" (tableau de vocabulaire du cours). Mots du cours (entreprise, management) **et** mots difficiles des textes. Les mauvais choix sont des pieges plausibles (faux amis, mots proches) et chacun a sa `note`. |
| **Moyen** | QCM "mot en contexte" (`sentence`) + traduction ecrite (`translation`) | Phrases du cours avec un trou et 3 mots pieges (moral/morale, valued/valuable, underpin/undermine…). Traductions de mots a ecrire (FR→EN et EN→FR). |
| **Difficile** | Traduction d'expressions (`translation`) + texte a trous (`fill`) + definition -> mot (`free`) | Expressions completes a traduire. Mot manquant a ecrire dans une phrase du cours (avec `hint`). Mot a retrouver a partir de sa definition anglaise. |

**Traduction au toucher :** dans les textes anglais (definitions, phrases, exemples, devoirs), les mots presents dans `src/data/glossaire-anglais.json` sont soulignes en pointilles. Les toucher affiche leur traduction. Les mots de la reponse ne sont pas traduisibles tant que la question n'est pas corrigee. Le glossaire accepte des expressions de plusieurs mots ("use their initiative") et reconnait les formes flechies (managers -> manager, imposed -> impose).

**Workflow pour ajouter un cours d'anglais :**
1. Placer le PDF dans `/cours/anglais/`
2. Ajouter le vocabulaire a `src/data/anglais.json` (3 niveaux, voir ci-dessus)
3. Recreer les pages "AT HOME" du document dans `src/data/anglais-devoirs.json` (voir ci-dessous)
4. Ajouter au glossaire les mots des nouveaux textes anglais

### DEVOIRS "AT HOME" (anglais)

Les pages "AT HOME / SELF-STUDY" des documents sont recreees en exercices interactifs dans `src/data/anglais-devoirs.json`. Elles s'affichent sous les niveaux dans l'ecran Anglais, groupees par document. Champs communs : `id`, `doc`, `page`, `kind`, `title`, `titleFr`, `instructions`, `instructionsFr`. Optionnels : `bonus: true` pour une variante inventee sur le meme modele, et `keepOrder: true` pour garder l'ordre A/B/C du document (sinon les choix sont melanges).

| `kind` | Exercice | Donnees |
|--------|----------|---------|
| `cloze` | Texte a trous avec choix (A/B/C) | `passage` avec `{1}`, `{2}`… + `items[]` : `sentence`, `choices`, `answer`, `notes`, `explanation`, `translation` |
| `choice` | QCM phrase par phrase | `items[]` comme `cloze`, sans `passage` |
| `bank` | Banque de mots (choisir le mot parmi une liste commune) | `bank` (liste des mots, `bankLetters: true` pour A, B, C…) + `items[]` : `text` (definition) ou `sentence`, `answer`, `accept` (autres reponses justes), `explanation`, `translation`. `passage` optionnel. `shuffleItems: true` pour melanger l'ordre des items |
| `gaps` | Mot a ecrire (trous d'un texte, tableau, indices) | `items[]` : `text` ou `sentence` avec `___`, `answers`, `placeholder` (ex. `"e…"`), `hint`, `explanation`. `passage` optionnel |
| `write` | Remplacer le passage souligne | `items[]` : `sentence` avec `[[passage souligne]]`, `answers`, `hint`, `explanation` |
| `match` | Relier (draw a line) | `items[]` : `left`, `leftFr`, `right`, `rightFr`, `explanation` + `right` (ordre du document), `leftLabel`, `rightLabel`, `explanation`. `passage` optionnel (texte de reference, passages soulignes entre `[[ ]]`) |
| `open` | Phrase a terminer librement | `items[]` : `start`, `models` (exemples corrects), `explanation`. Correction par comparaison avec les modeles et auto-evaluation |
| `reading` | Comprehension ecrite type examen | `paragraphs[]` + `items[]` : `question`, `paragraphs` (numeros des paragraphes a afficher) ou `extract` (extrait avec reperes `[A]`…`[D]`), `choices`, `answer` (ou `answers` pour plusieurs reponses), `notes`, `explanation` |
| `order` | Remettre les mots dans l'ordre | `comma: true` ajoute une virgule a placer + `items[]` : `words`, `accept` (phrases correctes), `explanation`, `translation` |

`memo: { "ref": "t1p2-p5", "sections": ["A"] }` ajoute un bouton "Rappel du cours" qui affiche une page de reference definie dans `src/data/anglais-memos.json` (ex. "the hygiene factors in A opposite").

Une activite impossible a recreer (plateforme externe) peut etre listee avec `unavailable: "raison"`.

### AUTRES MATIERES (Comportement humain, Statistique informatique, Systeme d'information, Droit des affaires)

| Niveau | Types autorises | Contenu |
|--------|----------------|---------|
| **Facile** | QCM uniquement (3 ou 4 choix) | Definitions de base, notions essentielles, rappels de cours |
| **Moyen** | QCM + reponse courte a ecrire (`free`) | QCM plus pointus (nuances, cas d'application). Reponses courtes : un terme, un acronyme, une notion |
| **Difficile** | Texte a trous (`fill`) + reponse a ecrire (`free`) | Textes a trous dans des definitions ou enonces. Reponses ecrites : definitions, notions cles, petits cas pratiques (droit) |

**Systeme d'information :** les acronymes se revisent aussi en anglais, a tous les niveaux (ERP = Enterprise Resource Planning, STT = TPS, SIG = MIS, SIAD = DSS, SID = ESS, SIRH = HRIS…). Chaque mauvais choix de QCM a sa `note`.

### Regles generales

- **Pas de QCM en difficile** (sauf anglais moyen)
- **Pas de reponses ecrites en facile** : le facile est 100% QCM
- **Reponses ecrites** : toujours accepter plusieurs formulations dans `answers`
- **Exercices fideles aux cours** : generer uniquement a partir du contenu reel des fichiers de cours dans `/cours/<matiere>/`
- **Progression claire** : facile = reconnaitre, moyen = comprendre et appliquer, difficile = formuler et analyser

## Fiches de cours

Une matiere peut avoir une fiche de cours (resume + lexique FR / EN), accessible au-dessus des niveaux. Elle est dans `src/data/<matiere>-fiche.json` et declaree dans `FICHES` (`src/data/index.js`). Exemple : `systeme_information-fiche.json`.

- `title`, `subtitle`, `cardDesc` : en-tete de la fiche et texte de la carte
- `sections[]` : `id`, `title`, `source` (ex. `"Seance 1 · p. 8-17"`), `blocks[]`
- `glossaryCats[]` : `id`, `label` ; `glossary[]` : `cat`, `term`, `fr`, `en`, `def`, et `extra: true` si la definition n'est pas dans les diapos (badge « hors diapos »)

| `type` de bloc | Donnees |
|--------|---------|
| `p` / `h` | `text` (paragraphe / sous-titre) |
| `list` | `items[]`, `title` optionnel |
| `def` | `term`, `text`, optionnels `fr`, `en`, `author` |
| `example` / `tip` | `text` (encadre « Exemple » / « A retenir ») |
| `table` | `head[]`, `rows[][]`, `title` optionnel, `wide: true` pour un tableau large qui defile horizontalement |
| `flow` | `steps[]` (schema en etapes), `title` et `note` optionnels |
| `pyramid` | `levels[]` : `label`, `text`, `sub` (du sommet a la base) |
| `stack` | `items[]` : `title`, `text`, `out`, `star` ; `links[]` entre les blocs |

Dans tous les textes, `**gras**` est mis en evidence. Les nombres a milliers s'ecrivent avec une espace insecable (`100 000`) pour ne pas etre coupes en fin de ligne.

## Ajouter des exercices

1. Ouvrir `src/data/<matiere>.json`
2. Ajouter un objet au tableau en suivant le schema et les regles de niveau ci-dessus
3. Rebuilder : `npm run build`
