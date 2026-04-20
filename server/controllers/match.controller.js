import { User } from '../models/User.js'
import { computeMatchScorePercent } from '../utils/matchScore.js'

export async function getMatches(req, res, next) {
  try {
    const me = await User.findById(req.user.id).select('-password').lean()
    if (!me) {
      return res.status(404).json({ error: 'User not found' })
    }

    const others = await User.find({ _id: { $ne: me._id } })
      .select('-password')
      .lean()

    const rows = others.map((u) => ({
      matchScore: computeMatchScorePercent(me, u),
      id: u._id.toString(),
      name: u.name,
      headline: u.headline ?? '',
      about: u.about ?? '',
      email: u.email,
      role: u.role,
      skillsOffered: u.skillsOffered ?? [],
      skillsWanted: u.skillsWanted ?? [],
      availability: u.availability ?? [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))

    rows.sort((a, b) => b.matchScore - a.matchScore)

    return res.json({
      data: rows,
      meta: {
        skillsOffered: me.skillsOffered ?? [],
        skillsWanted: me.skillsWanted ?? [],
      },
    })
  } catch (err) {
    return next(err)
  }
}
