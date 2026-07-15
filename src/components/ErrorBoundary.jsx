import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary capturou:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '1rem',
          background: '#fff', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', margin: 0 }}>Algo deu errado</h2>
          <p style={{ color: '#64748b', maxWidth: 400, margin: 0, fontSize: '0.9rem' }}>
            {this.state.error?.message || 'Ocorreu um erro inesperado na aplicação.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              marginTop: '0.5rem', padding: '0.6rem 1.5rem',
              background: '#E30613', color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
