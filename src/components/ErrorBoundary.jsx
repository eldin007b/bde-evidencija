import React from 'react';
import FallbackApp from './FallbackApp.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Catch React Hook errors and critical React errors
    const isReactHookError = error.message.includes('useState') || 
                            error.message.includes('Invalid hook call') || 
                            error.message.includes('Cannot read properties of null') ||
                            error.message.includes('reading \'useState\'') ||
                            error.stack.includes('useSimpleAuth');
    
    if (isReactHookError) {
      console.error('🚨 ErrorBoundary: React Hook error detected', error.message);
      return { hasError: true, error };
    }
    
    // Let other errors pass through to normal React error handling
    return { hasError: false, error: null };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('🚨 React Error Boundary caught an error:', error, errorInfo);
    
    // Check if it's a React Hook error
    if (error.message.includes('useState') || error.message.includes('Invalid hook call')) {
      console.warn('🔧 React Hook error detected - loading fallback app');
    }
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Render the full FallbackApp with restart capability
      return <FallbackApp onRestart={this.handleRestart} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;