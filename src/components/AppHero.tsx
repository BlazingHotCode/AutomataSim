import type { FC } from 'react'

interface AppHeroProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const AppHero: FC<AppHeroProps> = ({ theme, onToggleTheme }) => {
  return (
    <section className="hero">
      <div className="hero-top-row">
        <p className="eyebrow">AutomataSim</p>
        <button className="theme-toggle" type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>
      <h1>Text-to-Automaton Renderer</h1>
      <p className="subtitle">
        Define a Deterministic Finite Automaton as text, and the diagram is
        rendered automatically.
      </p>
    </section>
  )
}

export default AppHero
