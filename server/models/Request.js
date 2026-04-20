import mongoose from 'mongoose'

const requestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

requestSchema.index({ senderId: 1, receiverId: 1 })

export const Request = mongoose.models.Request ?? mongoose.model('Request', requestSchema)
