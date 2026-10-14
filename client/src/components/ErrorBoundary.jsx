import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark-bg text-center px-4">
        <h1 className="text-2xl font-bold text-dark-primary">Something went wrong</h1>
        <p className="text-dark-secondary max-w-md">
          An unexpected error occurred. Try going back to the homepage.
        </p>
        <button
          onClick={this.handleReload}
          className="rounded-lg bg-lime-accent px-4 py-2 font-semibold text-dark-bg transition hover:opacity-90"
        >
          Back to Home
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
