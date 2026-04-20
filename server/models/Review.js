import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    /** User being reviewed */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** User who wrote the review */
    reviewerId: {
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
      maxlength: 4000,
    },
  },
  { timestamps: true },
)

reviewSchema.index({ userId: 1, reviewerId: 1 }, { unique: true })

export const Review = mongoose.models.Review ?? mongoose.model('Review', reviewSchema)
