import { useSyncExternalStore } from 'react'

function subscribeToMediaQuery(query, callback) {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function getServerSnapshot() {
  return false
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToMediaQuery(query, onStoreChange),
    () => window.matchMedia(query).matches,
    getServerSnapshot,
  )
}
