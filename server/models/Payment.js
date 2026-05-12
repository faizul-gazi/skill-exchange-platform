import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
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
    paymentMethod: {
      type: String,
      enum: ['Bkash', 'Nagad', 'Rocket'],
      required: true,
    },
    trxId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
)

paymentSchema.index({ userId: 1, courseId: 1, status: 1 })

paymentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
})

export const Payment = mongoose.models.Payment ?? mongoose.model('Payment', paymentSchema)

