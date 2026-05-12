import mongoose from 'mongoose'

const courseReviewSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1200,
    },
  },
  { timestamps: true },
)

courseReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true })

courseReviewSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
})

export const CourseReview = mongoose.models.CourseReview ?? mongoose.model('CourseReview', courseReviewSchema)
