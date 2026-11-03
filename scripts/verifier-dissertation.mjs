// Verifie le module « Préparer la dissertation » d'une matiere (par defaut comportement_humain) :
// - chaque terme du lexique de la fiche a exactement une fiche reflexe (meme orthographe), et aucune fiche hors lexique ;
// - tous les renvois (enchainer, confondre, pieges, grilles, scenes) designent des termes existants ;
// - les QCM n'utilisent que des termes du lexique, du meme type (notion / auteur / film) ;
// - chaque terme apparait dans au moins une grille d'observation.
// npm run verifier-dissertation [-- <matiere>]
import { readFileSync } from 'node:fs'

const matiere = process.argv[2] || 'comportement_humain'
const lire = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const fiche = lire(`${matiere}-fiche.json`)
const d = lire(`${matiere}-dissertation.json`)

const erreurs = []
const err = (m) => erreurs.push(m)

const lexique = new Map(fiche.glossary.map(e => [e.term, e]))
const byId = new Map()
for (const t of d.termes) {
  if (byId.has(t.id)) err(`id en double : ${t.id}`)
  byId.set(t.id, t)
  if (!lexique.has(t.terme)) err(`« ${t.terme} » (${t.id}) n'est pas un terme du lexique`)
  for (const champ of ['reperer', 'ecrire', 'situation']) if (!t[champ]?.trim()) err(`${t.id} : champ « ${champ} » vide`)
}
const termes = new Set(d.termes.map(t => t.terme))
for (const term of lexique.keys()) if (!termes.has(term)) err(`terme du lexique sans fiche réflexe : « ${term} »`)
if (termes.size !== d.termes.length) err('deux fiches réflexe portent le même terme')

// Type d'un terme : les pieges d'un QCM sont du meme type que la bonne reponse
const type = (id) => {
  const cat = lexique.get(byId.get(id)?.terme)?.cat
  return cat === 'auteurs' ? 'auteur' : cat === 'films' ? 'film' : 'notion'
}
const existe = (id, ou) => { if (!byId.has(id)) err(`${ou} : terme inconnu « ${id} »`); return byId.has(id) }

for (const t of d.termes) {
  for (const id of t.enchainer || []) { existe(id, `${t.id}.enchainer`); if (id === t.id) err(`${t.id} s'enchaîne avec lui-même`) }
  if (t.confondre) {
    existe(t.confondre.avec, `${t.id}.confondre`)
    if (t.confondre.avec === t.id) err(`${t.id} : à ne pas confondre avec lui-même`)
  }
  if (t.pieges?.length !== 3) err(`${t.id} : il faut exactement 3 pièges (${t.pieges?.length || 0})`)
  for (const id of t.pieges || []) {
    if (!existe(id, `${t.id}.pieges`)) continue
    if (id === t.id) err(`${t.id} : piège identique à la réponse`)
    if (type(id) !== type(t.id)) err(`${t.id} (${type(t.id)}) : le piège « ${id} » est un(e) ${type(id)}`)
  }
}

const dansGrille = new Set()
for (const g of d.grilles) {
  for (const q of g.questions) for (const id of q.termes) if (existe(id, `grille ${g.id}`)) dansGrille.add(id)
}
for (const t of d.termes) if (!dansGrille.has(t.id)) err(`« ${t.terme} » n'apparaît dans aucune grille`)

const dansScene = new Set()
for (const s of d.scenes) {
  const ids = s.notions.map(n => n.id)
  for (const id of ids) if (existe(id, `scène ${s.id}`)) dansScene.add(id)
  for (const p of s.pieges) {
    existe(p.id, `scène ${s.id} (piège)`)
    if (ids.includes(p.id)) err(`scène ${s.id} : « ${p.id} » est à la fois présent et piège`)
    if (!p.pourquoi?.trim()) err(`scène ${s.id} : piège « ${p.id} » sans explication`)
  }
  if (ids.length < 4) err(`scène ${s.id} : moins de 4 notions`)
  if (s.pieges.length < 3) err(`scène ${s.id} : moins de 3 pièges`)
}

console.log(`${d.termes.length} fiches réflexe pour ${lexique.size} termes du lexique · ${d.grilles.length} grilles · ${d.scenes.length} scènes`)
console.log(`${dansScene.size} termes utilisés dans les scènes d'examen`)
if (erreurs.length) {
  console.error(`\n${erreurs.length} problème(s) :\n- ${erreurs.join('\n- ')}`)
  process.exit(1)
}
console.log('Tout est cohérent.')
