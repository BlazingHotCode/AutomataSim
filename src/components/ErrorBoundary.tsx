import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep a lightweight crash log for debugging in production builds.
    console.error('UI crash captured by ErrorBoundary', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '1.5rem',
            background: '#f5f9ff',
            color: '#10284a',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <section
            style={{
              maxWidth: 560,
              width: '100%',
              background: '#ffffff',
              border: '1px solid #d6e2f1',
              borderRadius: 14,
              padding: '1rem',
              boxSizing: 'border-box',
            }}
          >
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem' }}>
              Something went wrong
            </h1>
            <p style={{ margin: 0 }}>
              The app hit an unexpected runtime error. Reload to recover.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '0.8rem',
                border: '1px solid #163a6a',
                borderRadius: 8,
                padding: '0.45rem 0.7rem',
                font: 'inherit',
                fontWeight: 600,
                color: '#ffffff',
                background: '#1e4f8d',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
