import '@src/NewTab.css';
import '@src/NewTab.scss';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'new-tab/logo_horizontal.svg' : 'new-tab/logo_horizontal_dark.svg';

  console.log(t('hello', 'World'));
  return null;
};

export default withErrorBoundary(withSuspense(NewTab, <div>{t('loading')}</div>), <div> Error Occur </div>);
