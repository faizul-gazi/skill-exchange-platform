import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'

export function BothDashboardContent({ loading, summarySection, activitySection }) {
  if (loading) return null
  return (
    <>
      {summarySection}
      {activitySection}
    </>
  )
}

export function SingleRoleDashboardContent({
  isTeacherRole,
  isLearnerRole,
  isApproved,
  createdCoursesCount,
  enrolledCoursesCount,
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card variant="elevated">
        <Card.Body className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isTeacherRole ? 'Teacher dashboard' : 'Learner dashboard'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isTeacherRole
              ? isApproved
                ? 'You can manage teaching-related actions from your teacher workspace.'
                : 'Your teacher account is pending admin approval before teacher-only features unlock.'
              : 'Use learner tools to browse courses and manage your enrollments.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {isTeacherRole ? (
              <Link to="/teaching-courses" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                Go to My Teaching
              </Link>
            ) : null}
            {isLearnerRole ? (
              <Link to="/my-courses" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                My Enrolled Courses
              </Link>
            ) : null}
            <Link to="/courses" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
              Browse Courses
            </Link>
          </div>
        </Card.Body>
      </Card>

      {isTeacherRole ? (
        <Card variant="elevated">
          <Card.Body className="p-6">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Created Courses</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{createdCoursesCount}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isApproved ? 'Your teaching catalog is active.' : 'Waiting for admin approval to teach.'}
            </p>
          </Card.Body>
        </Card>
      ) : null}

      {isLearnerRole ? (
        <Card variant="elevated">
          <Card.Body className="p-6">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Enrolled Courses</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{enrolledCoursesCount}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Keep learning from your active classes.</p>
          </Card.Body>
        </Card>
      ) : null}

      <Card variant="elevated">
        <Card.Body className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isTeacherRole || isLearnerRole ? 'Upgrade to Both' : 'Role setup'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Switch your role to <strong>Both</strong> to access full teaching, learning, and skill exchange tools.
          </p>
        </Card.Body>
      </Card>
    </section>
  )
}

