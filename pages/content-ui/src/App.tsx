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
import EmojiSearch from './class/Trie';

export default function App() {
  useEffect(() => {
    console.log('content ui loaded');

    async function conTreeInit() {
      const emojiSearchTmp = new EmojiSearch();

      let detailIdxDictTmp = {} as any;

      let conInfoData;
      const prevCustomConList: any = await readLocalStorage('CustomConList');
      if (prevCustomConList === null || prevCustomConList === undefined) {
        conInfoData = sampleConInfoData;
      } else {
        conInfoData = prevCustomConList;
      }
      conInfoData = sampleConInfoData;
      console.log(conInfoData);

      for (let packageIdx in conInfoData) {
        const conList = conInfoData[packageIdx as keyof typeof conInfoData].conList;
        for (let sort in conList) {
          const con = conList[sort as keyof typeof conList];
          console.log(con.title);

          const key = packageIdx + '-' + sort;
          emojiSearchTmp.addEmoji(key, con.title, [con.title]);

          detailIdxDictTmp[key] = {
            // detailIdx: con.detailIdx,
            title: con.title,
            packageIdx: packageIdx,
            sort: sort,
            imgPath: con.imgPath,
          };
        }
      }

      setEmojiSearch(emojiSearchTmp);
      setDetailIdxDict(detailIdxDictTmp);
    }

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
    // setCurrentPage(2);
    // setCurrentPackageIdx(151346);
    setCurrentPage(0);
    setIsModalOpen(false);
    // setCurrentPackageIdx(151346);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: { altKey: any; key: string; preventDefault: () => void }) => {
      if (event.altKey && event.key === 'q') {
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
  );
}
