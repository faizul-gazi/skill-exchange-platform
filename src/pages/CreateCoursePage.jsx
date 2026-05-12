import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatBDT } from '../lib/currency.js'

const initialValues = {
  title: '',
  description: '',
  price: '0',
  scheduleDate: '',
  scheduleTime: '',
  classDays: [],
}

const WEEK_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (ev) => {
    setValues((prev) => ({ ...prev, [field]: ev.target.value }))
    setError('')
  }

  const toggleDay = (day) => {
    setValues((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(day)
        ? prev.classDays.filter((d) => d !== day)
        : [...prev.classDays, day],
    }))
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!values.scheduleDate || !values.scheduleTime) {
      setError('Please select both schedule date and time.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const scheduleIso = new Date(`${values.scheduleDate}T${values.scheduleTime}`).toISOString()
      await api.post('/courses', {
        title: values.title.trim(),
        description: values.description.trim(),
        price: Number(values.price || 0),
        schedule: scheduleIso,
        classDays: values.classDays,
      })
      navigate('/my-courses', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create course.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create Course</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Publish a new course for learners in your community.
        </p>
      </header>

      <Card variant="elevated">
        <Card.Body>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
              <input
                type="text"
                required
                value={values.title}
                onChange={handleChange('title')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Description
              </label>
              <textarea
                required
                rows={5}
                value={values.description}
                onChange={handleChange('description')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Price (BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={values.price}
                  onChange={handleChange('price')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Preview: {formatBDT(values.price)}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Start date
                </label>
                <input
                  type="date"
                  required
                  value={values.scheduleDate}
                  onChange={handleChange('scheduleDate')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Start time
                </label>
                <input
                  type="time"
                  required
                  value={values.scheduleTime}
                  onChange={handleChange('scheduleTime')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Class days (weekly)
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const selected = values.classDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
            <Button type="submit" variant="accent" loading={loading}>
              Create course
            </Button>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}

