import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';
  return null;
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
