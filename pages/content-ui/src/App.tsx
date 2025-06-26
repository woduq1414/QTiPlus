import { useEffect, useState, useRef } from 'react';

import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { Page } from './enums/Page';
import { refreshLabeling } from './functions/refreshLabeling';

import SearchPage from './components/pages/SearchPage';
import ConListPage from './components/pages/ConListPage';
import useGlobalStore from './store/globalStore';
import parseCookies from './functions/cookies';
import Storage from '@extension/shared/lib/storage';
import ConInfoEditPage from './components/pages/ConInfoEditPage';

import { Toaster } from 'react-hot-toast';
import { ChatBubbleBottomCenterIcon, XMarkIcon } from '@heroicons/react/24/solid';
import SettingPage from './components/pages/SettingPage';
import ReplaceWordEditPage from './components/pages/ReplaceWordEditPage';
import { hash } from 'crypto';
import DoubleConPresetEditPage from './components/pages/DoubleConPresetEditPage';
import { Message } from '@extension/shared/lib/enums/Message';
import { Z_INDEX } from '../../../src/constants/zIndex';
import { useConList } from './hooks/useConList';
import getQueryValue from './functions/query';

// import "../public/style.css";

function Router() {
  const { setting, setSetting } = useGlobalStore();

  useEffect(() => {
    // 자동 업데이트 체크
    const checkAutoUpdate = async () => {
      const now = Math.floor(Date.now() / 1000);
      // const twelveHoursInSeconds = 12 * 60 * 60;
      const twelveHoursInSeconds = 12 * 60 * 60;
      const prevSetting = await Storage.getUserConfig();

      if (!prevSetting) return;
      if (!prevSetting.isAutoLabelingUpdate) return;
      if (
        !prevSetting.lastUpdateTime ||
        prevSetting.lastUpdateTime === -1 ||
        now - prevSetting.lastUpdateTime > twelveHoursInSeconds
      ) {
        // alert('refresh labeling');
        const success = await refreshLabeling(false);

        // console.log(prevSetting, 'prevSetting');
        // console.log(success, 'success');
        if (success) {
          Storage.setUserConfig({ ...prevSetting, lastUpdateTime: Math.floor(Date.now() / 1000) });
          setSetting({ ...prevSetting, lastUpdateTime: Math.floor(Date.now() / 1000) });
        }
      }
    };

    checkAutoUpdate();
    // 1시간마다 체크
  }, [setting.isAutoLabelingUpdate]);

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
    userPackageData,
    userId,
  } = useGlobalStore();

  const {
    setConLabelList,

    setDoubleConPreset,
  } = useConList(userId, setUserPackageData);

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

    setInterval(() => {
      chrome.runtime.sendMessage({ type: Message.KEEP_ALIVE });
    }, 1000 * 20); // 20초마다 ping
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
    // 운영체제 감지
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.indexOf('Mac') !== -1;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + Q 단축키 (key 값과 keyCode 값 모두 체크)
      const isToggleShortcut = event.altKey && (
        event.key === 'q' || event.key === 'Q' || event.key === 'ㅂ' ||
        event.keyCode === 81
      );


      const isQuickWrite = event.altKey && (
        event.key === 'w' || event.key === 'W' || event.key === 'ㅇ' ||
        event.keyCode === 87
      );

      if (isQuickWrite) {
        event.preventDefault(); // 기본 동작 방지
        console.log('quick write');

        async function func(){
          const raw = "token_verify=dc_check2";

          const isMobile = location.href.includes('m.dcinside.com/board/');
          let galleryId = '';
          if(isMobile){
            const splitted = location.href.split('m.dcinside.com/board/')[1].split('/');
            if(splitted.length >= 2){
              return;
            }else{
              galleryId = splitted[0];
              console.log(galleryId, 'galleryId');
              
            }

          }else{
            return;
          }



          // const res = await fetchWithRetry('https://m.dcinside.com/ajax/access', raw, 5, {
          //   referer: 'https://m.dcinside.com/write/freewrite',
          //   origin: 'https://m.dcinside.com',
          // }, 'https://m.dcinside.com/write/freewrite');
          // console.log(res, 'res');
  
          const myHeaders2 = new Headers();
          myHeaders2.append("Connection", "keep-alive");
          myHeaders2.append("Origin", "https://m.dcinside.com");
          myHeaders2.append("Sec-Fetch-Dest", "empty");
          myHeaders2.append("Sec-Fetch-Mode", "cors");
          myHeaders2.append("Sec-Fetch-Site", "none");
          myHeaders2.append("Sec-Fetch-Storage-Access", "active");
          myHeaders2.append("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36");
          myHeaders2.append("accept", "*/*");
          myHeaders2.append("accept-language", "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6");
          myHeaders2.append("content-type", "application/x-www-form-urlencoded; charset=UTF-8");
          myHeaders2.append("x-requested-with", "XMLHttpRequest");
          // myHeaders2.append("Cookie", "PHPSESSID=5df0380660c3756a3c76029cb6023289; __utmc=118540316; csid=067cac2881e529abb320a42a3101da9871dc1631ee55953687293ade51ef4d5a16a9ad55b71b5f; PHPSESSKEY=a3f030126a9375997f55df1c29fb09c2; dc_pw_change=1; ck_img_view_cnt=4; _ga_7S65CSW42Y=GS2.1.s1750700469$o1$g1$t1750700499$j30$l0$h0; _ga_5LCEQ86W65=GS2.1.s1750700469$o1$g1$t1750700499$j30$l0$h0; ci_c=9c05a44b02c2b0ca15de8bbcdb07c0bd; _gid=GA1.2.424927942.1750859426; __utmz=118540316.1750859789.4.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); ssl=Y; gallRecom=MjAyNS0wNi0yNSAyMzoxNjoyOC8zMDg5Y2Y2ZmYzODMwOTcwYjYxYTA1Y2RkODBhNmMyNzg3MGRlMGM2MGZlZjUyMWViNjdkNjE3N2Q3YjQ4M2I1; service_code=21ac6d96ad152e8f15a05b7350a2475909d19bcedeba9d4face8115e9bc0fa4a780aac766b2cfcd42860b2f5e62a4e2188892856444b19305b5c92410feae33239e58d400bcb6be78a8edbc8748667a223f407d1574fe5ec428c8eacc5a9eb8999c36bf0fbffff3bb0707830daab3767ee6797d4898f2925307526ef9c86fff1ebb97e2d5a02021dd57dd9185f183e3f7b8763c5d7f10076e1843a31310af42bbbc691c1f023d057d3cde348bf6d196907669052db1fb736e1c6b0d726a4ad18f0d9cc2f497127; __utma=118540316.1035009874.1750696310.1750863048.1750866716.6; gn78b9d=78b9d676b68a68f038efd5e64184723cc092ab06bae2970ee98b5cd6c25ef8a8; mc_enc=23b2c22be4de34bf38ed83e0; unicro_id=bm9ybWFsbHk2MjU1XjcwNjg3Nzk%3D; _ga_45WM05PS9D=GS2.1.s1750866716$o3$g1$t1750866727$j49$l0$h0; ck_l_f=l; ci_session=a%3A5%3A%7Bs%3A10%3A%22session_id%22%3Bs%3A32%3A%228834e4a4ff6af715802ae6be4162e8cc%22%3Bs%3A10%3A%22ip_address%22%3Bs%3A12%3A%2258.234.33.74%22%3Bs%3A10%3A%22user_agent%22%3Bs%3A117%3A%22Mozilla%2F5.0+%28Macintosh%3B+Intel+Mac+OS+X+10_15_7%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F137.0.0.0+Safari%2F537.36%22%3Bs%3A13%3A%22last_activity%22%3Bi%3A1750866750%3Bs%3A9%3A%22user_data%22%3Bs%3A0%3A%22%22%3B%7D2d8ad846ba40efa737c643c08f1ba8cd; _fwb=158cm0BaQUkiEg73txYqLAa.1750868241338; find_ab=ok; nickname_tipbox_view_new=1; _ga_V46B0SHSY7=GS2.1.s1750866727$o1$g1$t1750868904$j60$l0$h0; ck_lately_gall=f4B%7CdjU%7CdcS; __utmt=1; 19b5c577b2846af03aeb84e34083726daf=7cea8576bd8461f03dec; last_alarm=1750869679; _ga_8LH47K4LPZ=GS2.1.s1750866729$o4$g1$t1750869721$j60$l0$h0; _gat_mgall_web=1; _ga_HNDXQK2FQ7=GS2.1.s1750866729$o4$g1$t1750869721$j60$l0$h0; wcs_bt=19821364650de50:1750869730; _ga_0BVX4Z8MJC=GS2.1.s1750868241$o1$g1$t1750869730$j51$l0$h0; __utmb=118540316.84.10.1750866716; _ga_NJF9PXZD5K=GS2.1.s1750866716$o4$g1$t1750869730$j51$l0$h0; _ga=GA1.1.1660094278.1750696310; _ga_7PTFKFKYG4=GS2.1.s1750868241$o1$g1$t1750869730$j51$l0$h0; _ga_NWM777QSMB=GS2.1.s1750866729$o4$g1$t1750869730$j51$l0$h0; _ga_03JSGF9S2P=GS2.1.s1750866729$o4$g1$t1750869730$j51$l0$h0");
          myHeaders2.append("Referer", `https://m.dcinside.com/write/${galleryId}`);
  
  
          const requestOptions2 = {
            method: "POST",
            headers: myHeaders2,
            body: raw,
            redirect: "follow" as RequestRedirect
          };
  
          const res = await fetch("https://m.dcinside.com/ajax/access", requestOptions2)
  
          const text = await res.text();
  
          console.log(text, 'res');
  
          const blockKey = JSON.parse(text)["Block_key"];
  
      
          console.log(blockKey, 'blockKey');
          
          chrome.runtime.sendMessage({ type: Message.QUICK_WRITE, data: { quickWriteData: { title: 't11qqq1131', content: 't21zzzz' }, blockKey: blockKey, galleryId: galleryId } });
        }

        func();
      }

      if (isToggleShortcut) {
        event.preventDefault(); // 기본 동작 방지
        setIsModalOpen((prev: any) => !prev);
        setCurrentPage(Page.SEARCH);
      }

      // 다크모드 토글 단축키 - 맥에서는 Cmd + Shift + D, 윈도우에서는 Alt + Shift + D
      const isDarkModeToggle = isMac ?
        (event.metaKey && event.shiftKey && (
          event.key === 'd' || event.key === 'D' || event.key === 'ㅇ' ||
          event.keyCode === 68
        )) :
        (event.altKey && event.shiftKey && (
          event.key === 'd' || event.key === 'D' || event.key === 'ㅇ' ||
          event.keyCode === 68
        ));

      if (isDarkModeToggle) {
        event.preventDefault(); // 기본 동작 방지

        let prevSetting = useGlobalStore.getState().setting;
        let newSetting = { ...useGlobalStore.getState().setting, isDarkMode: !prevSetting.isDarkMode };

        Storage.setUserConfig(newSetting);
        setSetting(newSetting);

        console.log(`다크모드 토글: ${isMac ? 'Cmd' : 'Alt'} + Shift + D`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === Message.CHANGED_DATA) {
        // 데이터가 변경되었을 때 Storage에서 최신 데이터를 가져와 UI 업데이트
        Storage.getCustomConList().then(customConList => {
          if (customConList) {
            setConLabelList(customConList.conLabelList);
            setDoubleConPreset(customConList.doubleConPreset);
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [setConLabelList, setDoubleConPreset]);

  return (
    <div className={`${setting.isDarkMode === undefined ? 'hidden' : setting.isDarkMode ? 'dark' : 'light'}`}>
      <div className={`${isModalOpen ? 'unset' : 'hidden'}`} style={{ zIndex: Z_INDEX.MODAL }}>
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
          className={` bg-gradient-to-b from-blue-400 to-blue-600 fixed right-[20px] bottom-[20px] flex px-3 py-3 rounded-[19px] cursor-pointer shadow-xl
            dark:from-gray-800 dark:to-gray-900 dark:border-2 dark:border-blue-600/50 dark:px-[0.58rem] dark:py-[0.58rem] 
            sm:right-[13px] sm:bottom-[13px] 
            `}
          style={{ zIndex: Z_INDEX.FLOATING_BUTTON }}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
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
  useEffect(() => {
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js'); // 확장 프로그램 내부의 inject.js 로드
    script.onload = function () {
      script.remove(); // 스크립트 실행 후 제거 (DOM 오염 방지)
    };
    (document.head || document.documentElement).appendChild(script);
  }, []);

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
