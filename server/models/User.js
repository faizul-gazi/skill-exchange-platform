import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    skillsOffered: {
      type: [String],
      default: [],
    },
    skillsWanted: {
      type: [String],
      default: [],
    },
    availability: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret.password
    return ret
  },
})

export const User = mongoose.models.User ?? mongoose.model('User', userSchema)
