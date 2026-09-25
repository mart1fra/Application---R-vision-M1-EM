export function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function checkAnswer(input, acceptedAnswers) {
  const normalizedInput = normalize(input)
  return acceptedAnswers.some(ans => normalize(ans) === normalizedInput)
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
