import anglais from './anglais.json'
import comportement_humain from './comportement_humain.json'
import statistique_informatique from './statistique_informatique.json'
import systeme_information from './systeme_information.json'
import droit_affaires from './droit_affaires.json'
import devoirsAnglais from './anglais-devoirs.json'
import memosAnglais from './anglais-memos.json'
import ficheSysteme from './systeme_information-fiche.json'
import ficheStatistique from './statistique_informatique-fiche.json'
import ficheComportement from './comportement_humain-fiche.json'
import glossaireComportement from './comportement_humain-glossaire.json'

export const DATA = { anglais, comportement_humain, statistique_informatique, systeme_information, droit_affaires }

// Fiches de cours : resume par parties + lexique FR / EN
export const FICHES = {
  comportement_humain: ficheComportement,
  systeme_information: ficheSysteme,
  statistique_informatique: ficheStatistique,
}

// Glossaires : definition → terme + auteur (niveau 1), terme → definition + auteur (niveau 2)
export const GLOSSAIRES = { comportement_humain: glossaireComportement }

// Exercices "AT HOME" des documents de cours, recrees en interactif
export const DEVOIRS = { anglais: devoirsAnglais }

// Pages de cours affichees en "rappel" dans les devoirs (ex. "the hygiene factors in A opposite")
export const MEMOS = memosAnglais
