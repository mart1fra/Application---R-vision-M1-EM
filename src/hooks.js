import { useRef, useEffect } from 'react'

// Donne le focus a un element (le bouton « suivant ») des que la condition devient vraie
export function useFocusWhen(flag) {
  const ref = useRef(null)
  useEffect(() => {
    if (flag) ref.current?.focus()
  }, [flag])
  return ref
}
