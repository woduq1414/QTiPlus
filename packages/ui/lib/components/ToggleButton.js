import { jsx as _jsx } from 'react/jsx-runtime';
import { exampleThemeStorage } from '@extension/storage';
import { useStorage } from '@extension/shared';
import { cn } from '../utils';
export const ToggleButton = ({ className, children, ...props }) => {
  const theme = useStorage(exampleThemeStorage);
  return _jsx('button', {
    className: cn(
      className,
      'py-1 px-4 rounded shadow hover:scale-105',
      theme === 'light' ? 'bg-white text-black' : 'bg-black text-white',
      theme === 'light' ? 'border-black' : 'border-white',
      'mt-4 border-2 font-bold',
    ),
    onClick: exampleThemeStorage.toggle,
    ...props,
    children: children,
  });
};
