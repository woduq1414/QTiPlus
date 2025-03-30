import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { ToggleButton } from '@extension/ui';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon32.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  return (
    <div className={`App bg-gray-800 text-white`}>
      <div className="flex flex-col items-center justify-center h-full">
        <img src={chrome.runtime.getURL('iconOriginal.png')} alt="logo" className="w-24 h-24 mb-4" />
        <span>큐티플 - QWER(큐떱이알)콘 검색기</span>
        <span>v1.0.3</span>
        <span>By 깔깔새우(qwer.shrimp@gmail.com)</span>

        <span
          onClick={() =>
            window.open('https://adaptive-bovid-12e.notion.site/1beee4e2dbd98077996fdececf9c0b9a?pvs=73', '_blank')
          }
          className="mt-4 cursor-pointer underline">
          사용 설명서
        </span>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
