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
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    completionConfirmedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    schedule: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

requestSchema.index({ senderId: 1, receiverId: 1 })

export const Request = mongoose.models.Request ?? mongoose.model('Request', requestSchema)
