import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    specialist: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    headlineLocked: {
      type: Boolean,
      default: false,
    },
    about: {
      type: String,
      default: '',
      trim: true,
      maxlength: 600,
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
      // Keep legacy roles for compatibility with existing users/admin bootstrap.
      enum: ['teacher', 'learner', 'both', 'admin', 'user'],
      default: 'learner',
    },
    isApproved: {
      type: Boolean,
      default: true,
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
