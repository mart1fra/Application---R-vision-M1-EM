import anglais from './anglais.json'
import comportement_humain from './comportement_humain.json'
import statistique_informatique from './statistique_informatique.json'
import systeme_information from './systeme_information.json'
import droit_affaires from './droit_affaires.json'
import intercultural_management from './intercultural_management.json'
import devoirsAnglais from './anglais-devoirs.json'
import memosAnglais from './anglais-memos.json'
import ficheSysteme from './systeme_information-fiche.json'
import ficheStatistique from './statistique_informatique-fiche.json'
import ficheComportement from './comportement_humain-fiche.json'
import glossaireComportement from './comportement_humain-glossaire.json'
import dissertationComportement from './comportement_humain-dissertation.json'
import ficheInterculturel from './intercultural_management-fiche.json'

export const DATA = { anglais, comportement_humain, statistique_informatique, systeme_information, intercultural_management, droit_affaires }

// Fiches de cours : resume par parties + lexique FR / EN
// (fiche bilingue : le cours en francais, puis le meme cours en anglais avec traduction au toucher)
export const FICHES = {
  comportement_humain: ficheComportement,
  systeme_information: ficheSysteme,
  statistique_informatique: ficheStatistique,
  intercultural_management: ficheInterculturel,
}

// Glossaires : definition → terme + auteur (niveau 1), terme → definition + auteur (niveau 2)
export const GLOSSAIRES = { comportement_humain: glossaireComportement }

// Préparer la dissertation : chaque terme du lexique de la fiche, quand l'utiliser face à une vidéo et comment l'écrire
export const DISSERTATIONS = { comportement_humain: dissertationComportement }

// Exercices "AT HOME" des documents de cours, recrees en interactif
export const DEVOIRS = { anglais: devoirsAnglais }

// Pages de cours affichees en "rappel" dans les devoirs (ex. "the hygiene factors in A opposite")
export const MEMOS = memosAnglais
