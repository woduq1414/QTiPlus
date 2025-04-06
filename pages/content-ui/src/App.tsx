import { useEffect, useState, useRef } from 'react';
import { ToggleButton } from '@extension/ui';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { Page } from './enums/Page';

import SearchPage from './components/pages/SearchPage';
import ConListPage from './components/pages/ConListPage';
import useGlobalStore from './store/globalStore';
import parseCookies from './functions/cookies';
import Storage from '@extension/shared/lib/storage';
import ConInfoEditPage from './components/pages/ConInfoEditPage';

import { Toaster } from 'react-hot-toast';
import { ChatBubbleBottomCenterIcon, XMarkIcon } from '@heroicons/react/16/solid';
import SettingPage from './components/pages/SettingPage';
import ReplaceWordEditPage from './components/pages/ReplaceWordEditPage';
import { hash } from 'crypto';
import DoubleConPresetEditPage from './components/pages/DoubleConPresetEditPage';
import { Message } from '@extension/shared/lib/enums/Message';

// import "../public/style.css";

function Router() {
  useEffect(() => {
    Storage.init();

    // console.log('content ui loaded');

    // conTreeInit();
    // alert('content ui loaded');
    chrome.runtime.sendMessage({ type: Message.GET_INIT_DATA }, response => {
      // console.log(response, 'get_init_data');
      // const conSearchTmp = new ConSearch();
      // conSearchTmp.deserialize(response.conSearch);
      // setConSearch(conSearchTmp);
    });
  }, []);

  const {
    currentPage,
    setUserId,
    setUserPackageData,
    currentPackageIdx,
    setCurrentPage,
    setCurrentPackageIdx,
    conSearch,
    setConSearch,
    detailIdxDict,
    setDetailIdxDict,
    isModalOpen,
    setIsModalOpen,
    setting,
    setSetting,
    userPackageData,
  } = useGlobalStore();

  useEffect(() => {
    chrome.runtime.sendMessage({ type: Message.GET_ID_COOKIE }, response => {
      // console.log(response, 'get_id_cookie');

      const userId = response.userId;
      setUserId(userId);

      Storage.saveCurrentUserId(userId);

      Storage.getUserPackageData().then(data => {
        setUserPackageData(data);
      });
    });

    chrome.runtime.sendMessage;
  }, []);

  useEffect(() => {
    Storage.getUserConfig().then(data => {
      if (data) {
        setSetting(data);
      } else {
        const defaultSetting = {
          isDarkMode: false,
          isShowRightBottomButton: true,
          isDefaultBigCon: true,
          isChoseongSearch: true,
        };
        setSetting(defaultSetting);
        Storage.setUserConfig(defaultSetting);
      }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: { altKey: any; shiftKey: any; key: string; preventDefault: () => void }) => {
      if (event.altKey && (event.key === 'q' || event.key === 'Q' || event.key === 'ㅂ')) {
        event.preventDefault(); // 기본 동작 방지
        setIsModalOpen((prev: any) => !prev);
        setCurrentPage(Page.SEARCH);

        // console.log('alt + q');
      }

      // detect alt + shift + d

      if (event.altKey && event.shiftKey && (event.key === 'd' || event.key === 'D' || event.key === 'ㅇ')) {
        event.preventDefault(); // 기본 동작 방지

        let prevSetting = useGlobalStore.getState().setting;
        let newSetting = { ...useGlobalStore.getState().setting, isDarkMode: !prevSetting.isDarkMode };

        Storage.setUserConfig(newSetting);

        setSetting(newSetting);

        // console.log('alt + shift + d');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`${setting.isDarkMode ? 'dark' : 'light'}`}>
      <div
        className={`z-[999999999]
      ${isModalOpen ? 'unset' : 'hidden'}
    `}>
        {currentPage === Page.SEARCH ? (
          <SearchPage />
        ) : currentPage === Page.CON_LIST ? (
          <ConListPage />
        ) : currentPage === Page.CON_INFO_EDIT ? (
          <ConInfoEditPage packageIdx={String(currentPackageIdx)} />
        ) : currentPage === Page.SETTING ? (
          <SettingPage />
        ) : currentPage === Page.REPLACE_WORD_EDIT ? (
          <ReplaceWordEditPage />
        ) : currentPage === Page.DOUBLE_CON_PRESET_EDIT ? (
          <DoubleConPresetEditPage />
        ) : null}
      </div>
      {!setting.isShowRightBottomButton ? null : (
        <div
          className=" bg-gradient-to-b from-blue-400 to-blue-600 fixed right-[20px] bottom-[20px] flex px-3 py-3 rounded-[19px] cursor-pointer shadow-xl
            dark:from-gray-800 dark:to-gray-900 dark:border-2 dark:border-blue-600/50 dark:px-[0.58rem] dark:py-[0.58rem] 
            z-[1999999990] sm:right-[13px] sm:bottom-[13px] 
            "
          onClick={() => {
            setIsModalOpen((prev: any) => !prev);
            setCurrentPage(Page.SEARCH);
          }}>
          {isModalOpen ? (
            <XMarkIcon strokeWidth={0.5} width={35} height={35} fill="#ffffff" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="none" viewBox="0 0 24 24">
              <path
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="1.5"
                d="M8.913 15.934c1.258.315 2.685.315 4.122-.07s2.673-1.099 3.605-2.001"></path>
              <ellipse
                cx="14.509"
                cy="9.774"
                fill="#ffffff"
                rx="1"
                ry="1.5"
                transform="rotate(-15 14.51 9.774)"></ellipse>
              <ellipse
                cx="8.714"
                cy="11.328"
                fill="#ffffff"
                rx="1"
                ry="1.5"
                transform="rotate(-15 8.714 11.328)"></ellipse>
              <path
                stroke="#ffffff"
                strokeWidth="1.5"
                d="M3.204 14.357c-1.112-4.147-1.667-6.22-.724-7.853s3.016-2.19 7.163-3.3c4.147-1.112 6.22-1.667 7.853-.724s2.19 3.016 3.3 7.163c1.111 4.147 1.667 6.22.724 7.853s-3.016 2.19-7.163 3.3c-4.147 1.111-6.22 1.667-7.853.724s-2.19-3.016-3.3-7.163Z"></path>
              <path stroke="#ffffff" strokeWidth="1.5" d="m13 16 .478.974a1.5 1.5 0 1 0 2.693-1.322l-.46-.935"></path>
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // console.log('App');
  return (
    <div
      className={`App

        `}
      style={{
        fontSize: '15px',
      }}>
      <Toaster />
      <Router />
    </div>
  );
}
