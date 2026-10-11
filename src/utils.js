function levenshtein(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

// Compare une reponse ecrite aux reponses acceptees.
// Une petite faute de frappe sur un mot assez long est acceptee, mais signalee (typo: true).
// Une difference uniquement en fin de mot (moral/morale, value/valued) n'est pas une faute
// de frappe mais un autre mot ou une autre forme : elle reste fausse.
// Forme compacte pour comparer : sans accents, ponctuation, espaces ni article en tete
// ("l'evaluation" = "evaluation", "to avoid" = "avoid", "well-being" = "well being").
function compact(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/^(the|a|an|to|le|la|les|l|un|une|des)\s+/, '')
    .replace(/\s+/g, '')
}

export function gradeAnswer(input, acceptedAnswers) {
  const given = compact(input)
  if (!given) return { correct: false, typo: false, closest: acceptedAnswers[0] }
  let best = { dist: Infinity, answer: acceptedAnswers[0], expected: '' }
  for (const ans of acceptedAnswers) {
    const expected = compact(ans)
    if (expected === given) return { correct: true, typo: false, closest: ans }
    const dist = levenshtein(given, expected)
    if (dist < best.dist) best = { dist, answer: ans, expected }
  }
  const len = best.expected.length
  const tolerance = len >= 10 ? 2 : len >= 6 ? 1 : 0
  const formChange = best.expected.startsWith(given) || given.startsWith(best.expected)
  const typo = best.dist <= tolerance && !formChange
  return { correct: typo, typo, closest: best.answer }
}

// Nombre de questions tirees au hasard par serie
export const SESSION_SIZE = 20

// Types d'exercices "AT HOME"
export const KIND_LABEL = {
  cloze: 'Texte à trous',
  choice: 'Choix multiple',
  bank: 'Banque de mots',
  gaps: 'Mots à écrire',
  write: 'Mot à écrire',
  match: 'Associer',
  open: 'Phrases à compléter',
  reading: 'Compréhension écrite',
  order: 'Remettre dans l’ordre',
}

export function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const MATIERES = [
  { id: 'anglais', label: 'Anglais', icon: '🇬🇧', color: 'var(--color-anglais)' },
  { id: 'comportement_humain', label: 'Comportement humain', icon: '🧠', color: 'var(--color-comportement)' },
  { id: 'statistique_informatique', label: 'Statistique informatique', icon: '📊', color: 'var(--color-statistique)' },
  { id: 'systeme_information', label: "Systeme d'information", icon: '💻', color: 'var(--color-systeme)' },
  { id: 'droit_affaires', label: 'Droit des affaires', icon: '⚖️', color: 'var(--color-droit)' },
]
