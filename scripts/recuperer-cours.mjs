import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { config } from 'dotenv'

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Erreur : VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY doivent etre definis dans .env')
  console.error('Note : Supabase utilise les nouvelles cles sb_publishable_ et sb_secret_')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)
const BUCKET = 'scans'
const COURS_DIR = resolve(process.cwd(), 'cours')

async function main() {
  console.log('Recuperation des cours depuis Supabase...\n')

  // List all folders (matieres) in the bucket
  const { data: folders, error: foldersError } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 100 })

  if (foldersError) {
    console.error('Erreur lors du listing du bucket :', foldersError.message)
    process.exit(1)
  }

  // Filter to only folders (matieres have null metadata)
  const matieres = folders.filter(f => f.id === null || f.metadata === null)
  // Also try listing known matiere names directly
  const MATIERE_IDS = ['anglais', 'comportement_humain', 'statistique_informatique', 'systeme_information', 'droit_affaires']

  let totalDownloaded = 0
  let totalSkipped = 0

  for (const matiereId of MATIERE_IDS) {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list(matiereId, { limit: 1000 })

    if (listError) {
      // Folder might not exist yet
      continue
    }

    if (!files || files.length === 0) continue

    const pdfFiles = files.filter(f => f.name.endsWith('.pdf'))
    if (pdfFiles.length === 0) continue

    const localDir = join(COURS_DIR, matiereId)
    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true })
    }

    for (const file of pdfFiles) {
      const localPath = join(localDir, file.name)

      if (existsSync(localPath)) {
        console.log(`  [skip] ${matiereId}/${file.name} (deja present)`)
        totalSkipped++
        continue
      }

      const remotePath = `${matiereId}/${file.name}`
      const { data, error: dlError } = await supabase.storage
        .from(BUCKET)
        .download(remotePath)

      if (dlError) {
        console.error(`  [erreur] ${remotePath} : ${dlError.message}`)
        continue
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      writeFileSync(localPath, buffer)
      console.log(`  [ok] ${remotePath} -> cours/${matiereId}/${file.name}`)
      totalDownloaded++
    }
  }

  console.log(`\nTermine : ${totalDownloaded} telecharge(s), ${totalSkipped} ignore(s).`)
}

main().catch(err => {
  console.error('Erreur fatale :', err)
  process.exit(1)
})
