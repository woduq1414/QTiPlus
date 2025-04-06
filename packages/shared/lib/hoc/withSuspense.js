import { jsx as _jsx } from 'react/jsx-runtime';
import { Suspense } from 'react';
export function withSuspense(Component, SuspenseComponent) {
  return function WithSuspense(props) {
    return _jsx(Suspense, { fallback: SuspenseComponent, children: _jsx(Component, { ...props }) });
  };
}
