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
// Les lettres grecques sont ecrites en toutes lettres (α = alpha) et les exposants
// deviennent des chiffres (R² = R2, distinct de r).
const GREEK = { α: 'alpha', β: 'beta', σ: 'sigma', μ: 'mu', λ: 'lambda', χ: 'khi' }

function compact(str) {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[αβσμλχ]/g, c => GREEK[c])
    .replace(/['’-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/^(the|a|an|to|le|la|les|l|un|une|des)\s+/, '')
    .replace(/\s+/g, '')
}

// Reponse numerique : virgule ou point, signe moins (- ou −), espaces, % en fin et fraction simple (1/2).
// Renvoie null si ce n'est pas un nombre.
function toNumber(str) {
  const s = str.replace(/\s/g, '').replace(/−/g, '-').replace(/,/g, '.').replace(/%$/, '')
  const frac = s.match(/^(-?\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : null
}

// tol : ecart d'arrondi accepte pour une reponse numerique (0,69 avec tol 0,005 accepte 0,6915).
// Une variante en % (« 98 % » a cote de « 0,98 ») a une tolerance 100 fois plus grande.
export function gradeAnswer(input, acceptedAnswers, tol = 0) {
  // Les nombres se comparent par valeur : « 1,5 » = « 1.50 », mais « 15 » ≠ « 1,5 » et « −2 » ≠ « 2 »
  const givenNum = toNumber(input)
  const words = []
  for (const ans of acceptedAnswers) {
    const expectedNum = toNumber(ans)
    if (expectedNum === null) {
      words.push(ans)
      continue
    }
    const margin = (ans.trim().endsWith('%') ? tol * 100 : tol) + 1e-9
    if (givenNum !== null && Math.abs(givenNum - expectedNum) <= margin) {
      return { correct: true, typo: false, closest: ans }
    }
  }

  const given = compact(input)
  if (!given || words.length === 0) return { correct: false, typo: false, closest: acceptedAnswers[0] }
  let best = { dist: Infinity, answer: words[0], expected: '' }
  for (const ans of words) {
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

// Texte sans accents ni ponctuation, mots separes par une espace (et une espace aux deux bouts)
function plain(str) {
  const s = str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return ` ${s} `
}

// Noms d'auteurs cites dans une reponse libre ("darley et latane", "Le Bon", "levy leboyer").
// Une faute de frappe est toleree sur les noms de 6 lettres ou plus.
export function matchNames(input, names) {
  const tokens = plain(input).trim().split(' ').filter(Boolean)
  const candidates = [...tokens, ...tokens.slice(1).map((t, i) => tokens[i] + t)]
  const found = names.filter(name => {
    const target = plain(name).replace(/ /g, '')
    return candidates.some(c => c === target || (target.length >= 6 && levenshtein(c, target) <= 1))
  })
  return { found, missing: names.filter(n => !found.includes(n)) }
}

// Idees cles retrouvees dans une definition ecrite : chaque idee a des racines ("autonom", "responsab").
// `ignore` (le terme a definir) est retire du texte : le recopier ne valide aucune idee.
export function findKeys(text, keys, ignore = '') {
  let t = plain(text)
  if (ignore) t = t.split(plain(ignore).trim()).join(' ')
  return keys.map(k => ({ ...k, found: k.match.some(m => t.includes(m)) }))
}

// "Freedman & Fraser", "Durkheim, Berger & Luckmann"
export function authorLabel(entry) {
  if (entry.authorLabel) return entry.authorLabel
  const a = entry.authors
  return a.length < 2 ? a[0] : `${a.slice(0, -1).join(', ')} & ${a[a.length - 1]}`
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
