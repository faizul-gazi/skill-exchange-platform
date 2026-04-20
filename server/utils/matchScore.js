/**
 * Normalizes skill strings for case-insensitive comparison.
 */
function normalizeList(list) {
  if (!Array.isArray(list)) return []
  return list.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
}

/**
 * Share of `needList` that appears in `offerList` (0–1), or null if `needList` is empty.
 */
export function overlapRatio(needList, offerList) {
  const needs = normalizeList(needList)
  const offers = new Set(normalizeList(offerList))
  if (needs.length === 0) return null

  let hits = 0
  for (const n of needs) {
    if (offers.has(n)) hits += 1
  }
  return hits / needs.length
}

/**
 * Match score 0–100: balances (your wants ∩ their offers) and (their wants ∩ your offers).
 * Averages only the sides where that user has at least one “want”; if both sides have no wants, returns 0.
 */
export function computeMatchScorePercent(me, them) {
  const yourWantsTheirOffers = overlapRatio(me.skillsWanted, them.skillsOffered)
  const theirWantsYourOffers = overlapRatio(them.skillsWanted, me.skillsOffered)

  if (yourWantsTheirOffers === null && theirWantsYourOffers === null) {
    return 0
  }
  if (yourWantsTheirOffers === null) {
    return Math.round(theirWantsYourOffers * 100)
  }
  if (theirWantsYourOffers === null) {
    return Math.round(yourWantsTheirOffers * 100)
  }

  return Math.round(((yourWantsTheirOffers + theirWantsYourOffers) / 2) * 100)
}
