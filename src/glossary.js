import GLOSSARY from './data/glossaire-anglais.json'

// Nombre maximum de mots dans une expression du glossaire ("use their initiative", "frame of reference"...)
const MAX_PHRASE = 4
const WORD_RE = /[A-Za-z](?:[A-Za-z'’-]*[A-Za-z])?/g

function clean(word) {
  return word.toLowerCase().replace(/’/g, "'")
}

// Formes de base possibles d'un mot flechi : managers -> manager, imposed -> impose, ...
function variants(word) {
  const out = [word]
  if (word.endsWith("'s")) out.push(word.slice(0, -2))
  if (word.endsWith('ies') || word.endsWith('ied')) out.push(word.slice(0, -3) + 'y')
  if (word.endsWith('es')) out.push(word.slice(0, -2))
  if (word.endsWith('s') && !word.endsWith('ss')) out.push(word.slice(0, -1))
  if (word.endsWith('ed')) out.push(word.slice(0, -2), word.slice(0, -1))
  if (word.endsWith('ing')) out.push(word.slice(0, -3), word.slice(0, -3) + 'e')
  return out
}

function lookupPhrase(words) {
  const head = words.slice(0, -1).join(' ')
  for (const last of variants(words[words.length - 1])) {
    const key = head ? `${head} ${last}` : last
    if (GLOSSARY[key]) return { key, fr: GLOSSARY[key] }
  }
  return null
}

export function excludedWords(terms = []) {
  const set = new Set()
  for (const term of terms) {
    for (const m of String(term).matchAll(WORD_RE)) {
      for (const v of variants(clean(m[0]))) set.add(v)
    }
  }
  return set
}

// Decoupe un texte en morceaux : { text } ou { text, key, fr } pour les mots/expressions traduisibles.
export function segment(text, excluded) {
  const words = [...text.matchAll(WORD_RE)].map(m => ({ raw: m[0], w: clean(m[0]), start: m.index, end: m.index + m[0].length }))
  const parts = []
  let cursor = 0
  let i = 0
  while (i < words.length) {
    let found = null
    for (let n = Math.min(MAX_PHRASE, words.length - i); n >= 1 && !found; n--) {
      const slice = words.slice(i, i + n)
      // une expression ne traverse pas la ponctuation
      const contiguous = slice.every((wd, k) => k === 0 || /^\s+$/.test(text.slice(slice[k - 1].end, wd.start)))
      if (!contiguous) continue
      const hit = lookupPhrase(slice.map(wd => wd.w))
      if (!hit) continue
      const blocked = slice.some(wd => variants(wd.w).some(v => excluded.has(v)))
      if (!blocked) found = { ...hit, n, start: slice[0].start, end: slice[n - 1].end }
    }
    if (found) {
      if (found.start > cursor) parts.push({ text: text.slice(cursor, found.start) })
      parts.push({ text: text.slice(found.start, found.end), key: found.key, fr: found.fr })
      cursor = found.end
      i += found.n
    } else {
      i++
    }
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}
