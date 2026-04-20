/** Decorative hero illustration — abstract exchange / connection motif */
export default function HeroArt({ className = '' }) {
  return (
    <div
      className={`relative mx-auto aspect-square max-w-[min(100%,420px)] lg:max-w-none ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 400"
        className="motion-safe:animate-float-slow h-full w-full drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="hero-grad-b" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="hero-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <circle cx="200" cy="200" r="168" fill="url(#hero-grad-a)" opacity="0.1" />
        <circle cx="200" cy="200" r="130" fill="url(#hero-grad-a)" opacity="0.15" filter="url(#hero-blur)" />
        <circle cx="128" cy="168" r="52" fill="url(#hero-grad-a)" />
        <circle cx="272" cy="232" r="52" fill="url(#hero-grad-b)" />
        <path
          d="M168 168 L232 232 M232 168 L168 232"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.95"
        />
        <ellipse
          cx="200"
          cy="200"
          rx="140"
          ry="56"
          stroke="url(#hero-grad-a)"
          strokeWidth="3"
          opacity="0.25"
          transform="rotate(-28 200 200)"
        />
      </svg>
      <div className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-pink-400/20 blur-2xl motion-safe:animate-float" />
      <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/35 to-blue-400/25 blur-2xl motion-safe:animate-float animation-delay-300" />
    </div>
  )
}
