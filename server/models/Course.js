import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    schedule: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    videoLink: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    recordings: {
      type: [
        {
          date: { type: Date, required: true },
          videoLink: { type: String, required: true, trim: true, maxlength: 500 },
        },
      ],
      default: [],
    },
    classDays: {
      type: [String],
      enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    lifecycleStatus: {
      type: String,
      enum: ['active', 'completion_pending', 'completed'],
      default: 'active',
      index: true,
    },
    /** Denormalized from CourseReview aggregates */
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewAverage: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
)

courseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
})

courseSchema.index({ teacherId: 1, schedule: 1 }, { unique: true })

export const Course = mongoose.models.Course ?? mongoose.model('Course', courseSchema)

