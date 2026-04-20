/** Normalize API user shape (`id` vs `_id`). */
export function userId(user) {
  if (!user) return null
  if (user.id) return String(user.id)
  if (user._id != null) return String(user._id)
  return null
}
