import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const articles = [
  {
    title: 'How to run better 30-minute learning sessions',
    blurb: 'A practical format for short peer-learning calls that keeps both people engaged.',
  },
  {
    title: 'Create a profile that attracts the right matches',
    blurb: 'Tips for describing your skills and goals clearly so people can connect faster.',
  },
  {
    title: 'From first message to first session',
    blurb: 'A checklist to reduce no-shows and make your first skill exchange smooth.',
  },
]

export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Articles"
        title="Tips from the SkillX community"
        description="Quick reads to help you teach better, learn faster, and build strong exchange habits."
      />
      <div className="space-y-4">
        {articles.map((article) => (
          <Card key={article.title} variant="elevated">
            <Card.Body className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{article.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{article.blurb}</p>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  )
}
