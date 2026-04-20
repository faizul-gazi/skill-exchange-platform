import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const features = [
  'Smart matching based on skills offered and wanted',
  'Built-in requests and scheduling workflow',
  'Direct chat for planning sessions',
  'Profile and availability management',
]

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Features"
        title="Everything needed for skill exchange"
        description="A focused toolkit to discover matches, connect, and keep learning momentum."
      />
      <Card variant="elevated">
        <Card.Body>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {features.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                {item}
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </div>
  )
}
