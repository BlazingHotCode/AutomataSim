import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">AutomataSim</p>
        <h1>Finite Automata Playground</h1>
        <p className="subtitle">
          Build deterministic machines, run input strings, and inspect each
          transition step.
        </p>
      </section>

      <section className="panel">
        <h2>Current Status</h2>
        <ul>
          <li>Project foundation is in place.</li>
          <li>DFA editor and simulator are the next implementation target.</li>
          <li>Deployment is configured for GitHub Pages.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Next Build Steps</h2>
        <ol>
          <li>Create TypeScript types for automata models.</li>
          <li>Implement and test a pure DFA simulation engine.</li>
          <li>Connect UI form inputs to simulation results.</li>
        </ol>
      </section>
    </main>
  )
}

export default App
