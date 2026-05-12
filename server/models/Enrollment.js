import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['free', 'paid'],
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true })

enrollmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
})

export const Enrollment = mongoose.models.Enrollment ?? mongoose.model('Enrollment', enrollmentSchema)

