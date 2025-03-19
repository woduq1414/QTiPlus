import parseCookies from '@src/functions/cookies';
import readLocalStorage from '@src/functions/storage';
import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import Switch from 'react-switch';

interface SearchPageProps {
  detailIdxDict: Record<string, any>;
}

const ConListPage: React.FC<SearchPageProps> = props => {
  const { userPackageData, unicroId, setUserPackageData, setCurrentPage, setCurrentPackageIdx, setDetailIdxDict } =
    useGlobalStore();

  console.log(userPackageData);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === 'SYNC_PROGRESS') {
        console.log(request.data);

        setSyncProgress(` (${request.data.page + 1}/${request.data.maxPage + 1})`);
      }
    });

    async function func() {
      setCustomConList(await readLocalStorage('CustomConList'));
      // console.log(await readLocalStorage('CustomConList'), "!@#!#!@#")
    }

    func();
  }, []);

  const [customConList, setCustomConList] = useState<any>(null);

  const [isHideState, setIsHideState] = useState<{ [key: string]: boolean }>({});
  useEffect(() => {
    setIsHideState(prevState => {
      const updatedState = { ...prevState };

      // data의 key마다 state를 동기화 (새로운 key만 추가)
      Object.entries(userPackageData).forEach(([key, value]) => {
        if (!(key in updatedState)) {
          updatedState[key] = (value as { isHide: boolean }).isHide;
        }
      });

      return updatedState;
    });
  }, [userPackageData]); // data가 변경될 때 실행

  // 특정 key의 상태를 토글
  const toggleIsHide = (key: string) => {
    setIsHideState(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none  z-[999999999]
        `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4 w-[480px]">
        <div className="flex flex-row ">
          {isEditMode ? (
            <div className="w-[90px] cursor-pointer font-semibold"></div>
          ) : (
            <div
              className="w-[90px] cursor-pointer font-semibold"
              onClick={() => {
                // setUserPackageData(null);
                setCurrentPage(0);
              }}>
              이전
            </div>
          )}
          <div className="flex-grow text-center font-semibold">
            <h1>콘 목록</h1>
          </div>
          {isEditMode ? (
            <div
              className="w-[90px] cursor-pointer text-right font-semibold"
              onClick={() => {
                // setUserPackageData(null);

                chrome.runtime.sendMessage(
                  {
                    type: 'UPDATE_HIDE_STATE',
                    data: {
                      unicroId: unicroId,
                      hideState: isHideState,
                    },
                  },
                  function (response) {
                    console.log(response);
                    setUserPackageData(response.data);

                    chrome.runtime.sendMessage({ type: 'CHANGED_DATA' }, response => {
                      console.log(response);
                      // const emojiSearchTmp = new EmojiSearch();
                      // emojiSearchTmp.deserialize(response.emojiSearch);

                      // setEmojiSearch(emojiSearchTmp);
                      setDetailIdxDict(response.detailIdxDict);

                      makeToast('저장 완료!');
                    });
                  },
                );

                setIsEditMode(false);
              }}>
              저장
            </div>
          ) : (
            <div
              className="w-[90px] cursor-pointer text-right font-semibold"
              onClick={() => {
                // setUserPackageData(null);
                setIsEditMode(true);
              }}>
              편집
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 overflow-auto max-h-[65vh]">
          {userPackageData &&
            Object.keys(userPackageData)
              .sort((a, b) => userPackageData[a].title.localeCompare(userPackageData[b].title, 'ko'))
              .map(key => {
                const packageData = userPackageData[key];

                const customConData = customConList ? customConList[packageData.packageIdx] : null;

                if (!customConData) {
                  return null;
                }
                // console.log(packageData.conList);
                let cnt = 0;
                for (let conKey of Object.keys(customConData.conList)) {
                  // console.log(customConData.conList[conKey]);
                  if (customConData.conList[conKey].title !== '' || customConData.conList[conKey].tag !== '') {
                    cnt += 1;
                  }
                }
                // console.log(cnt, Object.keys(customConData.conList).length);

                return (
                  <div className="flex flex-row  w-full items-center" key={key}>
                    {isEditMode ? (
                      <div className="w-[65px] ">
                        <Switch
                          checked={!isHideState[packageData.packageIdx]}
                          onChange={async () => {
                            toggleIsHide(packageData.packageIdx);
                          }}
                          onColor="#a7b4db"
                          onHandleColor="#456bd8"
                          handleDiameter={30}
                          uncheckedIcon={false}
                          checkedIcon={false}
                          boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                          // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                          height={20}
                          width={48}
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-row gap-2 items-center justify-between flex-grow" key={key}>
                      <div className="w-[65px]">
                        <img
                          src={packageData.mainImg}
                          alt={packageData.title}
                          className="w-[3em] h-[3em] rounded-lg border-2 border-gray-600"
                        />
                      </div>
                      <div
                        className="cursor-pointer font-semibold"
                        key={key}
                        onClick={async () => {
                          setCurrentPackageIdx(packageData.packageIdx);
                          setCurrentPage(2);
                        }}>
                        <h1>{packageData.title}</h1>
                      </div>

                      <div className="w-[65px] text-sm text-gray-600 text-right">
                        ({cnt}/{Object.keys(customConData.conList).length})
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
        {isEditMode ? (
          <div className="flex flex-row gap-2">
            <div
              className="cursor-pointer flex-grow    text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full">
              불러오기
            </div>
            <div
              className="cursor-pointer flex-grow    text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full">
              내보내기
            </div>
          </div>
        ) : (
          <div
            className={`cursor-pointer
          text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full

            ${isSyncing ? 'opacity-50 pointer-events-none' : ''}
          `}
            onClick={async () => {
              if (isSyncing) return;

              const cookies = parseCookies();
              const ci_t = cookies['ci_c'];

              setIsSyncing(true);
              setSyncProgress('');

              chrome.runtime.sendMessage(
                {
                  type: 'SYNC_CON_LIST',
                  data: {
                    ci_t: ci_t,
                    unicroId: unicroId,
                  },
                },
                function (response) {
                  console.log(response);

                  setUserPackageData(response.data);
                  makeToast('동기화 성공!');

                  setIsSyncing(false);
                },
              );
            }}>
            {isSyncing ? `동기화 중...${syncProgress}` : '동기화 하기'}
          </div>
        )}
        {/* <div>unicro_id : {unicroId}</div> */}
      </div>
    </div>
  );
};

export default ConListPage;
