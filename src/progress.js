// Progression de l'eleve, gardee sur l'appareil (localStorage) : pour chaque terme, bonnes reponses, erreurs et serie en cours.
// Un terme est maitrise apres MAITRISE bonnes reponses de suite ; une erreur remet la serie a zero.
// Si le stockage est indisponible (navigation privee), l'app marche normalement, sans garder la progression.
const KEY = 'revise-m1:progression:v1'
export const MAITRISE = 2

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function write(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // stockage plein ou bloque : la progression de cette session n'est pas gardee
  }
}

export function loadProgress(scope) {
  return read()[scope] || {}
}

// answers : [{ id, correct }]
export function recordAnswers(scope, answers) {
  const all = read()
  const p = all[scope] || {}
  for (const { id, correct } of answers) {
    const e = p[id] || { ok: 0, ko: 0, serie: 0 }
    if (correct) { e.ok += 1; e.serie += 1 } else { e.ko += 1; e.serie = 0 }
    p[id] = e
  }
  all[scope] = p
  write(all)
}

export function resetProgress(scope) {
  const all = read()
  delete all[scope]
  write(all)
}

export const isMastered = (e) => (e?.serie || 0) >= MAITRISE
// Deja rate au moins une fois et pas encore maitrise
export const toReview = (e) => Boolean(e) && e.ko > 0 && !isMastered(e)
