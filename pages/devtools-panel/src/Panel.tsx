import '@src/Panel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import type { ComponentPropsWithoutRef } from 'react';
import { t } from '@extension/i18n';

const Panel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'devtools-panel/logo_horizontal.svg' : 'devtools-panel/logo_horizontal_dark.svg';

  return null;
};

const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorage(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black' : 'bg-black text-white')
      }
      onClick={exampleThemeStorage.toggle}>
      {props.children}
    </button>
  );
};

export default withErrorBoundary(withSuspense(Panel, <div> Loading ... </div>), <div> Error Occur </div>);
