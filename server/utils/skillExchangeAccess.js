import { computeMatchScorePercent } from './matchScore.js'

function normalizeUser(user) {
  return {
    skillsOffered: Array.isArray(user?.skillsOffered) ? user.skillsOffered : [],
    skillsWanted: Array.isArray(user?.skillsWanted) ? user.skillsWanted : [],
  }
}

export function areUsersMatched(userA, userB) {
  const score = computeMatchScorePercent(normalizeUser(userA), normalizeUser(userB))
  return score > 0
}

