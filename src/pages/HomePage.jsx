import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import HeroArt from '../components/landing/HeroArt.jsx'
import { cn } from '../lib/cn.js'

const iconTiles = [
  {
    title: 'Smart matches',
    desc: 'Pair by skill, level, and availability.',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Requests',
    desc: 'Ask for what you need—clear and polite.',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Chat',
    desc: 'Coordinate sessions without leaving the app.',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    title: 'Your profile',
    desc: 'Showcase teach & learn goals in one place.',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const features = [
  {
    title: 'Balanced exchanges',
    body: 'Set expectations for time and topic so every swap feels fair.',
    accent: 'from-indigo-500 to-blue-500',
  },
  {
    title: 'Trust-first',
    body: 'Profiles, reviews, and clear requests build confidence fast.',
    accent: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Flexible formats',
    body: 'Online or in person—choose what works for your schedule.',
    accent: 'from-fuchsia-500 to-pink-500',
  },
]

const steps = [
  {
    n: '1',
    title: 'Build your profile',
    body: 'List what you teach, what you want to learn, and your availability.',
  },
  {
    n: '2',
    title: 'Match & request',
    body: 'Discover people, send requests, and agree on a session in chat.',
  },
  {
    n: '3',
    title: 'Exchange & grow',
    body: 'Meet, trade knowledge, then leave feedback for the next match.',
  },
]

function SectionHeading({ eyebrow, title, id, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p
          id={id ? `${id}-eyebrow` : undefined}
          className="motion-safe:animate-fade-in-up text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300"
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="motion-safe:animate-fade-in-up animation-delay-100 mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="motion-safe:animate-fade-in-up animation-delay-200 mt-3 text-lg text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export default function HomePage() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const el = document.getElementById(id)
    if (!el) return
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [location.hash])

  return (
    <div className="flex flex-col gap-16 pb-4 md:gap-24 lg:gap-28">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/90 via-indigo-50/80 to-blue-50/70 p-8 shadow-soft-lg backdrop-blur-xl dark:border-white/[0.08] dark:from-slate-900/90 dark:via-indigo-950/50 dark:to-slate-950/80 sm:p-10 lg:p-14"
      >
        <div className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400/40 to-fuchsia-400/30 blur-3xl motion-safe:animate-pulse-soft" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-400/35 to-cyan-300/25 blur-3xl motion-safe:animate-pulse-soft animation-delay-300" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="motion-safe:animate-fade-in-up inline-flex rounded-full border border-indigo-200/80 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 backdrop-blur dark:border-indigo-500/30 dark:bg-white/5 dark:text-indigo-200">
              Peer learning, reimagined
            </p>
            <h1
              id="hero-heading"
              className="motion-safe:animate-fade-in-up animation-delay-100 mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span className="motion-safe:animate-gradient bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-blue-300 dark:to-fuchsia-300">
                Trade skills.
              </span>
              <br />
              <span className="text-slate-900 dark:text-white">Build connections.</span>
            </h1>
            <p className="motion-safe:animate-fade-in-up animation-delay-200 mt-6 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              SkillX matches people who want to teach with people who want to learn—so every session
              is a real exchange, not a one-way scroll.
            </p>
            <div className="motion-safe:animate-fade-in-up animation-delay-300 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button to="/register" variant="accent" size="lg" className="min-w-[200px] justify-center">
                Get started free
              </Button>
              <Button
                href="#how-it-works"
                variant="secondary"
                size="lg"
                className="min-w-[200px] justify-center"
              >
                How it works
              </Button>
            </div>
            <p className="motion-safe:animate-fade-in animation-delay-400 mt-6 text-sm text-slate-500 dark:text-slate-500">
              No credit card required · Join thousands learning together
            </p>
          </div>
          <HeroArt className="lg:justify-self-end" />
        </div>
      </section>

      {/* Icon / illustration band */}
      <section id="about" aria-labelledby="discover-heading" className="relative scroll-mt-24">
        <SectionHeading
          id="discover-heading"
          eyebrow="Discover"
          title="Everything you need in one flow"
          subtitle="From first hello to your next skill swap—tools that stay out of the way."
        />
        <ul
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
        >
          {iconTiles.map((tile, i) => (
            <li
              key={tile.title}
              className={cn(
                'motion-safe:animate-fade-in-up group rounded-2xl border border-white/60 bg-white/50 p-6 shadow-soft backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-indigo-200/80 hover:shadow-soft-lg dark:border-white/[0.08] dark:bg-white/[0.04]',
                i === 1 && 'animation-delay-100',
                i === 2 && 'animation-delay-200',
                i === 3 && 'animation-delay-300',
              )}
            >
              <div
                className={cn(
                  'inline-flex rounded-xl bg-gradient-to-br p-3 text-white shadow-soft',
                  i % 2 === 0
                    ? 'from-indigo-500 to-blue-500'
                    : 'from-fuchsia-500 to-pink-500',
                )}
              >
                {tile.icon}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{tile.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {tile.desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="articles" aria-labelledby="articles-heading" className="scroll-mt-24">
        <SectionHeading
          id="articles-heading"
          eyebrow="Articles"
          title="Learn from quick practical guides"
          subtitle="Short reads from the community to help you run better sessions and get stronger matches."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            'How to structure a 30-minute skill swap',
            'Profile tips that attract better matches',
            'First-session checklist to avoid no-shows',
          ].map((article) => (
            <Card key={article} variant="glass" className="h-full">
              <Card.Body className="p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{article}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Read practical tips and adapt them to your next learning exchange.
                </p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-heading" className="relative scroll-mt-24">
        <SectionHeading
          id="features-heading"
          eyebrow="Why SkillX"
          title="Built for meaningful exchanges"
          subtitle="Polished cards, soft shadows, and gradients that feel alive—without the noise."
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-3" role="list">
          {features.map((f, i) => (
            <li
              key={f.title}
              className={cn(
                'motion-safe:animate-fade-in-up',
                i === 1 && 'animation-delay-150',
                i === 2 && 'animation-delay-300',
              )}
            >
              <Card
                variant="glass"
                className="group h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <Card.Body className="relative p-6 sm:p-8">
                  <div
                    className={cn(
                      'h-1.5 w-14 rounded-full bg-gradient-to-r shadow-sm',
                      f.accent,
                    )}
                  />
                  <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.body}
                  </p>
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/25 opacity-30 blur-2xl transition group-hover:opacity-50 dark:from-indigo-400/20 dark:to-fuchsia-500/20" />
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24">
        <SectionHeading
          id="how-heading"
          eyebrow="Simple"
          title="How it works"
          subtitle="Three steps from signup to your first exchange."
        />
        <div className="relative mt-14">
          <div
            className="pointer-events-none absolute left-[12%] right-[12%] top-10 hidden h-0.5 md:block"
            aria-hidden
            style={{
              background:
                'linear-gradient(90deg, rgb(99 102 241 / 0.35), rgb(217 70 239 / 0.35), rgb(59 130 246 / 0.35))',
            }}
          />
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <li
              key={step.n}
              className={cn(
                'relative flex flex-col items-center text-center',
                'motion-safe:animate-fade-in-up',
                i === 1 && 'animation-delay-150',
                i === 2 && 'animation-delay-300',
              )}
            >
              <span
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-soft',
                  i === 0 && 'from-indigo-600 to-blue-500',
                  i === 1 && 'from-violet-600 to-fuchsia-500',
                  i === 2 && 'from-fuchsia-500 to-pink-500',
                )}
              >
                {step.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.body}
              </p>
            </li>
          ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA — complements global site footer below */}
      <section
        aria-labelledby="cta-heading"
        className="motion-safe:animate-fade-in relative overflow-hidden rounded-[2rem] border border-white/30 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-10 text-center shadow-soft-lg sm:p-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/_0.15),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgb(236_72_153/_0.2),transparent_45%)]" />
        <div className="relative">
          <h2 id="cta-heading" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to swap your first skill?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-indigo-100">
            Create a free account, say what you teach and what you want to learn—we will handle the
            rest.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              to="/register"
              variant="secondary"
              size="lg"
              className="min-w-[200px] !border-0 !bg-white !text-indigo-700 shadow-soft hover:!bg-indigo-50"
            >
              Create account
            </Button>
            <Button
              to="/login"
              variant="outline"
              size="lg"
              className="min-w-[200px] !border-white/60 !bg-white/10 !text-white backdrop-blur hover:!bg-white/25 dark:!border-white/50 dark:!text-white"
            >
              I already have an account
            </Button>
          </div>
        </div>
      </section>

      {/* Site footer is rendered by MainLayout (Footer.jsx) */}
    </div>
  )
}
