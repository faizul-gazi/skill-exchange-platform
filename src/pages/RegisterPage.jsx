import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import IconField, { LockIcon, MailIcon, UserIcon } from '../components/auth/IconField.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '../auth/validation.js'
import { getApiErrorMessage } from '../lib/apiError.js'

const initial = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'learner',
  specialist: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
  const toast = useToast()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const runValidators = (next) => {
    const e = {}
    const n = validateName(next.name)
    const em = validateEmail(next.email)
    const pw = validatePassword(next.password)
    const cf = validateConfirmPassword(next.password, next.confirmPassword)
    if (!['teacher', 'learner', 'both'].includes(next.role)) {
      e.role = 'Please select a valid role'
    }
    if ((next.role === 'teacher' || next.role === 'both') && !next.specialist.trim()) {
      e.specialist = 'Specialist is required for teacher or both role'
    }
    if (n) e.name = n
    if (em) e.email = em
    if (pw) e.password = pw
    if (cf) e.confirmPassword = cf
    return e
  }

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors(runValidators(values))
  }

  const handleChange = (field) => (ev) => {
    const next = { ...values, [field]: ev.target.value }
    setValues(next)
    const shouldValidate =
      touched[field] ||
      (field === 'password' && touched.confirmPassword) ||
      (field === 'confirmPassword' && touched.confirmPassword)
    if (shouldValidate) {
      setErrors(runValidators(next))
    }
    setFormError('')
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true,
      specialist: true,
    })
    const e = runValidators(values)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setLoading(true)
    setFormError('')
    try {
      const data = await register(
        values.name.trim(),
        values.email.trim(),
        values.password,
        values.role,
        values.specialist.trim(),
      )
      const name = data?.user?.name?.trim()
      if (values.role === 'teacher' || values.role === 'both') {
        toast.info(
          `Your account is under review. A confirmation has been sent to faizul@gmail.com for interview scheduling. Please check your email.`,
        )
      } else {
        toast.success(name ? `Account created for ${name}. Please sign in.` : 'Account created. Please sign in.')
      }
      navigate('/login', { replace: true, state: { from: location.state?.from } })
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not create your account. Try a different email.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card variant="glass" className="overflow-hidden shadow-soft-lg">
        <Card.Body className="p-8 sm:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              Join SkillX
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Set up your profile and start trading skills with your community.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <AlertMessage variant="error" className="text-sm">
                {formError}
              </AlertMessage>
            ) : null}
            <IconField
              label="Full name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Faizul Islam"
              value={values.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name ? errors.name : ''}
              icon={<UserIcon />}
            />
            <IconField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={touched.email ? errors.email : ''}
              icon={<MailIcon />}
            />
            <IconField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={touched.password ? errors.password : ''}
              icon={<LockIcon />}
            />
            <IconField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              icon={<LockIcon />}
            />
            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                I want to join as
              </label>
              <select
                id="role"
                name="role"
                value={values.role}
                onChange={handleChange('role')}
                onBlur={handleBlur('role')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="learner">Learner</option>
                <option value="teacher">Teacher</option>
                <option value="both">Both</option>
              </select>
              {touched.role && errors.role ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.role}</p>
              ) : null}
            </div>
            {(values.role === 'teacher' || values.role === 'both') ? (
              <div>
                <label
                  htmlFor="specialist"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Specialist
                </label>
                <input
                  id="specialist"
                  name="specialist"
                  type="text"
                  value={values.specialist}
                  onChange={handleChange('specialist')}
                  onBlur={handleBlur('specialist')}
                  placeholder="e.g. MERN Stack, Spoken English, Data Science"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {touched.specialist && errors.specialist ? (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.specialist}</p>
                ) : null}
              </div>
            ) : null}

            <p className="text-xs text-slate-500 dark:text-slate-500">
              By signing up you agree to our{' '}
              <a href="#" className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
                Privacy Policy
              </a>
              .
            </p>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full justify-center"
              loading={loading}
            >
              Create account
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              state={location.state}
              className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </Card.Body>
      </Card>
    </AuthShell>
  )
}
