import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="About SkillX"
        title="Learn faster by teaching others"
        description="SkillX connects people who want to exchange real skills through short, focused sessions."
      />
      <Card variant="elevated">
        <Card.Body className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            We believe everyone has something to teach. SkillX helps you find a match quickly so you can share
            practical knowledge and grow together.
          </p>
          <p>
            From coding and design to languages and music, our community is built around clear goals, fair exchanges,
            and respectful collaboration.
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
