import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import IconField, { LockIcon, MailIcon } from '../components/auth/IconField.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { validateEmail, validatePassword } from '../auth/validation.js'
import { getApiErrorMessage } from '../lib/apiError.js'

const initial = { email: '', password: '' }

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const runValidators = (next) => {
    const e = {}
    const em = validateEmail(next.email)
    const pw = validatePassword(next.password)
    if (em) e.email = em
    if (pw) e.password = pw
    return e
  }

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors(runValidators(values))
  }

  const handleChange = (field) => (ev) => {
    const next = { ...values, [field]: ev.target.value }
    setValues(next)
    if (touched[field]) {
      setErrors(runValidators(next))
    }
    setFormError('')
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setTouched({ email: true, password: true })
    const e = runValidators(values)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setLoading(true)
    setFormError('')
    try {
      const data = await login(values.email.trim(), values.password)
      const name = data?.user?.name?.trim()
      toast.success(name ? `Welcome back, ${name}!` : 'Signed in successfully.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Sign in failed. Check your email and password.')
      setFormError(msg)
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
              Welcome back
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to SkillX
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Enter your credentials to access matches, chat, and your profile.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <AlertMessage variant="error" className="text-sm">
                {formError}
              </AlertMessage>
            ) : null}
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={touched.password ? errors.password : ''}
              icon={<LockIcon />}
            />

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                />
                Remember me
              </label>
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              loading={loading}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              state={location.state}
              className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              Create one
            </Link>
          </p>
        </Card.Body>
      </Card>
    </AuthShell>
  )
}
