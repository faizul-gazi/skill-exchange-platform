import mongoose from 'mongoose'
import { Course } from '../models/Course.js'
import { Enrollment } from '../models/Enrollment.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function normalizeSkills(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
}

function normalizeClassDays(value) {
  const allowed = new Set(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  if (!Array.isArray(value)) return []
  const out = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const day = item.trim()
    if (allowed.has(day) && !out.includes(day)) out.push(day)
  }
  return out
}

function stripRecordingFields(payload) {
  return { ...payload, recordings: [], videoLink: '' }
}

async function viewerMayAccessCompletedCourseRecordings(viewerUserId, courseLeanDoc) {
  const teacherOid = courseLeanDoc.teacherId?._id ?? courseLeanDoc.teacherId
  if (viewerUserId && teacherOid != null && String(teacherOid) === String(viewerUserId)) {
    return true
  }
  if (!viewerUserId) return false
  const enrollment = await Enrollment.findOne({
    userId: viewerUserId,
    courseId: courseLeanDoc._id,
  })
    .select('_id')
    .lean()
  return Boolean(enrollment)
}

function toCourseResponse(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    price: doc.price,
    teacherId: doc.teacherId?._id?.toString() ?? doc.teacherId?.toString(),
    teacherName:
      doc.teacherId && typeof doc.teacherId === 'object' && 'name' in doc.teacherId ? doc.teacherId.name : '',
    schedule: doc.schedule ?? '',
    meetingLink: doc.meetingLink ?? '',
    videoLink: doc.videoLink ?? '',
    recordings: Array.isArray(doc.recordings)
      ? doc.recordings
          .map((r) => ({
            date: r?.date ?? null,
            videoLink: r?.videoLink ?? '',
          }))
          .filter((r) => r.date && r.videoLink)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      : [],
    classDays: Array.isArray(doc.classDays) ? doc.classDays : [],
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    lifecycleStatus:
      doc.lifecycleStatus === 'completion_pending' || doc.lifecycleStatus === 'completed'
        ? doc.lifecycleStatus
        : 'active',
    reviewCount: typeof doc.reviewCount === 'number' ? doc.reviewCount : 0,
    reviewAverage:
      doc.reviewAverage != null && Number.isFinite(Number(doc.reviewAverage)) ? Number(doc.reviewAverage) : null,
    createdAt: doc.createdAt,
  }
}

function normalizeOptionalUrl(value) {
  if (typeof value !== 'string') return ''
  const v = value.trim()
  if (!v) return ''
  try {
    const parsed = new URL(v)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    return parsed.toString()
  } catch {
    return ''
  }
}

export async function createCourse(req, res, next) {
  try {
    const { title, description, price, schedule, meetingLink, videoLink, classDays, skills } = req.body ?? {}

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' })
    }
    const parsedPrice = Number(price ?? 0)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' })
    }
    const parsedSchedule = new Date(schedule)
    if (Number.isNaN(parsedSchedule.getTime())) {
      return res.status(400).json({ error: 'A valid schedule date/time is required' })
    }

    const existingAtSameTime = await Course.findOne({
      teacherId: req.user.id,
      schedule: parsedSchedule,
    })
      .select('_id')
      .lean()
    if (existingAtSameTime) {
      return res.status(409).json({ error: 'You already have a course scheduled at this time' })
    }

    const doc = await Course.create({
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      teacherId: req.user.id,
      schedule: parsedSchedule,
      meetingLink: normalizeOptionalUrl(meetingLink),
      videoLink: normalizeOptionalUrl(videoLink),
      classDays: normalizeClassDays(classDays),
      skills: normalizeSkills(skills),
    })

    const populated = await Course.findById(doc._id).populate({ path: 'teacherId', select: 'name' }).lean()
    return res.status(201).json({ course: toCourseResponse(populated) })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'You already have a course scheduled at this time' })
    }
    return next(err)
  }
}

export async function listCourses(_req, res, next) {
  try {
    const rows = await Course.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'teacherId', select: 'name' })
      .lean()
    return res.json({ data: rows.map(toCourseResponse), meta: { count: rows.length } })
  } catch (err) {
    return next(err)
  }
}

export async function getCoursesByTeacher(req, res, next) {
  try {
    const { teacherId } = req.params
    if (!isValidObjectId(teacherId)) {
      return res.status(400).json({ error: 'Invalid teacher id' })
    }
    const rows = await Course.find({ teacherId })
      .sort({ createdAt: -1 })
      .populate({ path: 'teacherId', select: 'name' })
      .lean()
    return res.json({ data: rows.map(toCourseResponse), meta: { count: rows.length } })
  } catch (err) {
    return next(err)
  }
}

// Backward-compatible alias
export const listCoursesByTeacher = getCoursesByTeacher

export async function getCourseById(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }
    const row = await Course.findById(id).populate({ path: 'teacherId', select: 'name' }).lean()
    if (!row) {
      return res.status(404).json({ error: 'Course not found' })
    }
    let course = toCourseResponse(row)
    const lifecycle =
      row.lifecycleStatus === 'completion_pending' || row.lifecycleStatus === 'completed'
        ? row.lifecycleStatus
        : 'active'
    if (lifecycle === 'completed') {
      const viewerId = req.user?.id
      const mayViewRecordings = await viewerMayAccessCompletedCourseRecordings(viewerId, row)
      if (!mayViewRecordings) {
        course = stripRecordingFields(course)
      }
    }
    return res.json({ course })
  } catch (err) {
    return next(err)
  }
}

export async function requestCourseCompletion(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }
    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (String(course.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the course owner can request to end this course' })
    }
    if (course.lifecycleStatus === 'completion_pending') {
      const populated = await Course.findById(id).populate({ path: 'teacherId', select: 'name' }).lean()
      return res.json({
        ok: true,
        course: toCourseResponse(populated),
        message: 'End request already submitted; waiting for admin approval',
      })
    }
    if (course.lifecycleStatus === 'completed') {
      return res.status(400).json({ error: 'Course is already completed' })
    }
    course.lifecycleStatus = 'completion_pending'
    await course.save()
    const updated = await Course.findById(course._id).populate({ path: 'teacherId', select: 'name' }).lean()
    return res.json({
      ok: true,
      course: toCourseResponse(updated),
      message: 'Course end requested. New enrollments are closed until admin approves completion.',
    })
  } catch (err) {
    return next(err)
  }
}

export async function getEnrolledStudentsForCourse(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }

    const course = await Course.findById(id).select('teacherId').lean()
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (String(course.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the course owner can view enrolled students' })
    }

    const rows = await Enrollment.find({ courseId: id })
      .populate({ path: 'userId', select: 'name email' })
      .sort({ enrolledAt: -1 })
      .lean()

    const data = rows.map((row) => ({
      id: row._id.toString(),
      enrolledAt: row.enrolledAt,
      paymentStatus: row.paymentStatus,
      user: row.userId && typeof row.userId === 'object'
        ? {
            id: row.userId._id.toString(),
            name: row.userId.name,
            email: row.userId.email,
          }
        : null,
    }))
    return res.json({ data, meta: { count: data.length } })
  } catch (err) {
    return next(err)
  }
}

export async function updateCourseLinks(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (String(course.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the course owner can edit class links' })
    }
    if (course.lifecycleStatus === 'completed') {
      return res.status(400).json({ error: 'Cannot edit links on a completed course' })
    }

    const { meetingLink, videoLink } = req.body ?? {}
    if (meetingLink !== undefined) {
      const normalizedMeeting = normalizeOptionalUrl(meetingLink)
      if (typeof meetingLink === 'string' && meetingLink.trim() && !normalizedMeeting) {
        return res.status(400).json({ error: 'Please provide a valid meeting link URL' })
      }
      course.meetingLink = normalizedMeeting
    }
    if (videoLink !== undefined) {
      const normalizedVideo = normalizeOptionalUrl(videoLink)
      if (typeof videoLink === 'string' && videoLink.trim() && !normalizedVideo) {
        return res.status(400).json({ error: 'Please provide a valid video link URL' })
      }
      course.videoLink = normalizedVideo
    }

    await course.save()
    const updated = await Course.findById(course._id).populate({ path: 'teacherId', select: 'name' }).lean()
    return res.json({ course: toCourseResponse(updated) })
  } catch (err) {
    return next(err)
  }
}

export async function addCourseRecording(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }
    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (String(course.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only course owner can add recordings' })
    }
    if (course.lifecycleStatus === 'completed') {
      return res.status(400).json({ error: 'Cannot add recordings on a completed course' })
    }

    const { date, videoLink } = req.body ?? {}
    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Valid recording date is required' })
    }
    const normalizedVideo = normalizeOptionalUrl(videoLink)
    if (!normalizedVideo) {
      return res.status(400).json({ error: 'Valid video link is required' })
    }

    course.recordings.push({ date: parsedDate, videoLink: normalizedVideo })
    course.recordings.sort((a, b) => new Date(a.date) - new Date(b.date))
    await course.save()

    const updated = await Course.findById(course._id).populate({ path: 'teacherId', select: 'name' }).lean()
    return res.json({ course: toCourseResponse(updated) })
  } catch (err) {
    return next(err)
  }
}

