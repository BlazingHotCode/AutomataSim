import type { FC } from 'react'

interface AppHeroProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const AppHero: FC<AppHeroProps> = ({ theme, onToggleTheme }) => {
  return (
    <section className="hero">
      <div className="hero-top-row">
        <img
          className="site-logo"
          src="/site-logo.svg"
          alt="AutomataSim"
          width={108}
          height={81}
        />
        <button className="theme-toggle" type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>
    </section>
  )
}

export default AppHero
