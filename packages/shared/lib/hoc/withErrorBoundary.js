import { jsx as _jsx } from 'react/jsx-runtime';
import { Component } from 'react';
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
export function withErrorBoundary(Component, ErrorComponent) {
  return function WithErrorBoundary(props) {
    return _jsx(ErrorBoundary, { fallback: ErrorComponent, children: _jsx(Component, { ...props }) });
  };
}
