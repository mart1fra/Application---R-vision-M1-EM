import anglais from './anglais.json'
import comportement_humain from './comportement_humain.json'
import statistique_informatique from './statistique_informatique.json'
import systeme_information from './systeme_information.json'
import droit_affaires from './droit_affaires.json'
import devoirsAnglais from './anglais-devoirs.json'
import memosAnglais from './anglais-memos.json'

export const DATA = { anglais, comportement_humain, statistique_informatique, systeme_information, droit_affaires }

// Exercices "AT HOME" des documents de cours, recrees en interactif
export const DEVOIRS = { anglais: devoirsAnglais }

// Pages de cours affichees en "rappel" dans les devoirs (ex. "the hygiene factors in A opposite")
export const MEMOS = memosAnglais
