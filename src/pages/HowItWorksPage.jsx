import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const steps = [
  { title: 'Create your profile', description: 'Add skills you can teach, skills you want to learn, and your availability.' },
  { title: 'Find a match', description: 'Explore suggested matches and send a request with a topic or meeting link.' },
  { title: 'Start exchanging', description: 'Use chat to coordinate and run short sessions that help both sides grow.' },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="How It Works"
        title="Three simple steps"
        description="SkillX keeps the flow lightweight so you can move from signup to your first session quickly."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, idx) => (
          <Card key={step.title} variant="elevated">
            <Card.Body className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Step {idx + 1}</p>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{step.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  )
}
