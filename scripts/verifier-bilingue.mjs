// Verifie une matiere bilingue (par defaut intercultural_management) : QCM en anglais avec traduction, et fiche FR / EN.
// QCM :
// - la bonne reponse fait partie des choix, choix uniques, 3 ou 4 choix ;
// - chaque choix a sa traduction (`choicesFr`) et chaque mauvais choix sa note (`notes`), avec exactement les memes cles ;
// - question, traduction, source et explication remplies (et `contextFr` si la question a une situation) ;
// - pas d'indice de longueur : la bonne reponse n'est pas trop souvent la plus longue (ni la plus courte) des choix.
// Fiche : chaque texte traduit { fr, en } a ses deux langues, chaque terme du lexique a son anglais et une categorie connue.
// npm run verifier-bilingue [-- <matiere>]
import { readFileSync } from 'node:fs'

const matiere = process.argv[2] || 'intercultural_management'
const lire = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const questions = lire(`${matiere}.json`)
const fiche = lire(`${matiere}-fiche.json`)

// Au-dela de ce taux, la longueur des choix donne la reponse (hasard : 1 sur 3 ou 4)
const SEUIL = 0.35

const erreurs = []
const err = (m) => erreurs.push(m)
const vide = (s) => typeof s !== 'string' || !s.trim()
const memesCles = (obj, attendues) => {
  const cles = Object.keys(obj || {})
  return cles.length === attendues.length && attendues.every(c => cles.includes(c))
}

const vues = new Set()
const stats = {}
questions.forEach((q, i) => {
  const ref = `#${i + 1} (${q.level}) « ${(q.question || '').slice(0, 50)} »`
  if (q.type !== 'qcm') err(`${ref} : type « ${q.type} », seul le QCM est prévu`)
  if (!['facile', 'moyen', 'difficile'].includes(q.level)) err(`${ref} : niveau inconnu`)
  for (const champ of ['question', 'questionFr', 'source', 'explanation']) if (vide(q[champ])) err(`${ref} : champ « ${champ} » vide`)
  if (q.context && vide(q.contextFr)) err(`${ref} : situation sans traduction (contextFr)`)
  if (vues.has(q.question)) err(`${ref} : question en double`)
  vues.add(q.question)

  const choix = q.choices || []
  if (choix.length < 3 || choix.length > 4) err(`${ref} : ${choix.length} choix (3 ou 4 attendus)`)
  if (new Set(choix).size !== choix.length) err(`${ref} : deux choix identiques`)
  if (!choix.includes(q.answer)) err(`${ref} : la réponse n'est pas dans les choix`)
  if (!memesCles(q.choicesFr, choix)) err(`${ref} : les traductions (choicesFr) ne correspondent pas aux choix`)
  for (const c of choix) if (vide(q.choicesFr?.[c])) err(`${ref} : traduction vide pour « ${c} »`)
  const faux = choix.filter(c => c !== q.answer)
  if (!memesCles(q.notes, faux)) err(`${ref} : il faut une note pour chaque mauvais choix, et seulement eux`)
  for (const c of faux) if (vide(q.notes?.[c])) err(`${ref} : note vide pour « ${c} »`)

  const s = (stats[q.level] ||= { n: 0, longue: 0, courte: 0 })
  const autres = faux.map(c => c.length)
  s.n++
  if (q.answer.length > Math.max(...autres)) s.longue++
  if (q.answer.length < Math.min(...autres)) s.courte++
})

for (const [niveau, s] of Object.entries(stats)) {
  const pct = (x) => `${Math.round((100 * x) / s.n)} %`
  console.log(`${niveau} : ${s.n} questions · réponse la plus longue ${pct(s.longue)} · la plus courte ${pct(s.courte)}`)
  if (s.longue / s.n > SEUIL) err(`${niveau} : la bonne réponse est trop souvent la plus longue (${pct(s.longue)})`)
  if (s.courte / s.n > SEUIL) err(`${niveau} : la bonne réponse est trop souvent la plus courte (${pct(s.courte)})`)
}

// Fiche : toute paire { fr, en } doit avoir ses deux langues
const isPair = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).length === 2 && 'fr' in v && 'en' in v
let paires = 0
const parcourir = (v, ou) => {
  if (isPair(v)) {
    paires++
    if (vide(v.fr) || vide(v.en)) err(`fiche, ${ou} : traduction incomplète`)
  } else if (Array.isArray(v)) v.forEach((x, i) => parcourir(x, `${ou}[${i}]`))
  else if (v !== null && typeof v === 'object') for (const [k, x] of Object.entries(v)) parcourir(x, `${ou}.${k}`)
}
if (!fiche.bilingual) err('fiche : « bilingual: true » manquant')
fiche.sections.forEach(s => {
  if (!isPair(s.title)) err(`fiche, section ${s.id} : titre sans traduction`)
  parcourir(s, `section ${s.id}`)
})
const cats = new Set(fiche.glossaryCats.map(c => c.id))
for (const e of fiche.glossary) {
  if (vide(e.term) || vide(e.en) || vide(e.def)) err(`lexique : entrée incomplète « ${e.term} »`)
  if (!cats.has(e.cat)) err(`lexique : catégorie inconnue « ${e.cat} » pour « ${e.term} »`)
}

console.log(`${questions.length} QCM · fiche : ${fiche.sections.length} parties, ${paires} textes traduits, ${fiche.glossary.length} termes au lexique`)
if (erreurs.length) {
  console.error(`\n${erreurs.length} problème(s) :\n- ${erreurs.join('\n- ')}`)
  process.exit(1)
}
console.log('Tout est cohérent.')
