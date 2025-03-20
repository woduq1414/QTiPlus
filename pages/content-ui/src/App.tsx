import { useEffect, useState, useRef } from 'react';
import { ToggleButton } from '@extension/ui';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';

import sampleConInfoData from '../public/data.json';
import SearchPage from './components/SearchPage';
import ConListPage from './components/ConListPage';
import useGlobalStore from './store/globalStore';
import parseCookies from './functions/cookies';
import readLocalStorage from './functions/storage';
import ConInfoEditPage from './components/ConInfoEditPage';

import { Toaster } from 'react-hot-toast';

// import "../public/style.css";

function Router() {
  useEffect(() => {
    console.log('content ui loaded');

    // conTreeInit();
    // alert('content ui loaded');
    chrome.runtime.sendMessage({ type: 'GET_INIT_DATA' }, response => {
      console.log(response, 'get_init_data');
      // const emojiSearchTmp = new EmojiSearch();
      // emojiSearchTmp.deserialize(response.emojiSearch);

      // setEmojiSearch(emojiSearchTmp);
      setDetailIdxDict(response.detailIdxDict);
    });
  }, []);

  const {
    currentPage,
    setUnicroId,
    setUserPackageData,
    currentPackageIdx,
    setCurrentPage,
    setCurrentPackageIdx,
    emojiSearch,
    setEmojiSearch,
    detailIdxDict,
    setDetailIdxDict,
    isModalOpen,
    setIsModalOpen,
  } = useGlobalStore();

  useEffect(() => {
    const cookies = parseCookies();

    const unicroId = cookies['unicro_id'];
    console.log(unicroId);

    setUnicroId(unicroId);
    const storageKey = `UserPackageData_${unicroId}`;
    readLocalStorage(storageKey).then(data => {
      console.log(data);
      setUserPackageData(data);
    });
  }, []);

  useEffect(() => {
    // setCurrentPage(1);
    // setCurrentPackageIdx(151346);
    // setCurrentPage(0);
    // setIsModalOpen(true);
    // setCurrentPackageIdx(151346);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: { altKey: any; key: string; preventDefault: () => void }) => {
      if (event.altKey && (event.key === 'q' || event.key === 'Q')) {
        event.preventDefault(); // 기본 동작 방지
        setIsModalOpen((prev: any) => !prev);
        setCurrentPage(0);

        console.log('alt + q');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  return (
    <div>
      <div
        className={`z-[999999999]
      ${isModalOpen ? 'unset' : 'hidden'}
    `}>
        {currentPage === 0 ? (
          <SearchPage detailIdxDict={detailIdxDict} />
        ) : currentPage === 1 ? (
          <ConListPage detailIdxDict={detailIdxDict} />
        ) : currentPage === 2 ? (
          <ConInfoEditPage packageIdx={currentPackageIdx} />
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  console.log('App');
  return (
    <div
      className="App"
      style={{
        fontSize: '15px',
      }}>
      <Toaster />
      <Router />
    </div>
  );
}
