import parseCookies from '@src/functions/cookies';

import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import Switch from 'react-switch';
import Modal from './Modal';
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/16/solid';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';

const ConListPage: React.FC = () => {
  const {
    userPackageData,
    userId,
    setUserPackageData,
    setCurrentPage,
    setCurrentPackageIdx,
    setDetailIdxDict,
    isEditMode,
    setIsEditMode,
  } = useGlobalStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isExportHidePackageInclude, setIsExportHidePackageInclude] = useState(true);
  const [isExportNotHavePackageInclude, setIsExportNotHavePackageInclude] = useState(true);

  const [isExportIncludeDoubleConPreset, setIsExportIncludeDoubleConPreset] = useState(true);

  const [isImportIncludeDoubleConPreset, setIsImportIncludeDoubleConPreset] = useState(true);

  const [importedFileData, setImportedFileData] = useState<any>(null);

  const [isImportOverwrite, setIsImportOverwrite] = useState(true);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === 'SYNC_PROGRESS') {
        setSyncProgress(` (${request.data.page + 1}/${request.data.maxPage + 1})`);
      }
    });

    async function func() {
      // setConLabelList();
      const storageConLabelList = await Storage.getCustomConList();
      // console.log(storageConLabelList, "!!!");
      if (storageConLabelList) {
        setConLabelList(storageConLabelList['conLabelList']);
        setDoubleConPreset(storageConLabelList['doubleConPreset']);
      }
    }

    func();
  }, []);

  const [conLabelList, setConLabelList] = useState<any>(null);
  const [doubleConPreset, setDoubleConPreset] = useState<any>(null);

  const [isHideState, setIsHideState] = useState<{ [key: string]: boolean }>({});
  useEffect(() => {
    setIsHideState(prevState => {
      const updatedState = { ...prevState };

      // data의 key마다 state를 동기화 (새로운 key만 추가)
      if (!userPackageData) return updatedState;

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
      className={`fixed inset-0 flex items-center justify-center pointer-events-none  z-[899999999]
        `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] pl-6 pr-6 pt-6 pb-3 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 w-[480px]
        text-black
      dark:bg-[rgba(46,46,46,0.75)] dark:text-white/90
      "
        style={{
          backdropFilter: 'blur(15px)',
        }}>
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
                      hideState: isHideState,
                    },
                  },
                  function (response) {
                    setUserPackageData(response.data);

                    console.log(isHideState, response.data);

                    chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, response => {
                      // const conSearchTmp = new ConSearch();
                      // conSearchTmp.deserialize(response.conSearch);

                      // setConSearch(conSearchTmp);

                      makeToast('저장 완료!');
                    });
                  },
                );

                setIsEditMode(false);
              }}>
              저장
            </div>
          ) : userPackageData ? (
            <div
              className="w-[90px] cursor-pointer text-right font-semibold"
              onClick={() => {
                // setUserPackageData(null);
                setIsEditMode(true);
              }}>
              편집
            </div>
          ) : (
            <div className="w-[90px] "></div>
          )}
        </div>
        <div className="flex flex-col gap-2 overflow-auto  scrollbar max-h-[50dvh] px-1">
          {userPackageData &&
            Object.keys(userPackageData)
              .sort((a, b) => {
                const hideA = userPackageData[a].isHide ? 1 : 0;
                const hideB = userPackageData[b].isHide ? 1 : 0;

                // isHide 값이 false인 항목을 위로 정렬
                if (hideA !== hideB) {
                  return hideA - hideB;
                }

                // isHide 값이 같으면 title을 기준으로 정렬
                return userPackageData[a].title
                  .replaceAll(' ', '')
                  .localeCompare(userPackageData[b].title.replaceAll(' ', ''), 'ko');
              })
              .map(key => {
                if (userPackageData[key].isHide && !isEditMode) {
                  return null;
                }

                const packageData = userPackageData[key];

                const customConData = conLabelList ? conLabelList[packageData.packageIdx] : null;
                let cnt = 0;
                if (!customConData) {
                } else {
                  // console.log(packageData.conList);

                  for (let conKey of Object.keys(customConData.conList)) {
                    // console.log(customConData.conList[conKey]);
                    if (customConData.conList[conKey].title !== '' || customConData.conList[conKey].tag !== '') {
                      cnt += 1;
                    }
                  }
                }

                // console.log(cnt, Object.keys(customConData.conList).length);

                return (
                  <div className="flex flex-row  w-full items-center" key={key}>
                    {isEditMode ? (
                      <div className="mr-1 ml-1">
                        <Switch
                          checked={!isHideState[packageData.packageIdx]}
                          onChange={async () => {
                            toggleIsHide(packageData.packageIdx);
                          }}
                          onColor="#a7b4db"
                          onHandleColor="#456bd8"
                          handleDiameter={20}
                          uncheckedIcon={false}
                          checkedIcon={false}
                          boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                          // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                          height={15}
                          width={36}
                        />
                      </div>
                    ) : null}
                    <div
                      className={`flex flex-row gap-2 items-center justify-between flex-grow
                                        ${!isEditMode ? '' : 'cursor-pointer '}
                                        `}
                      key={key}
                      onClick={async () => {
                        if (!isEditMode) return;

                        setCurrentPackageIdx(packageData.packageIdx);
                        setCurrentPage(2);
                      }}>
                      <div className="w-[65px]">
                        <img
                          src={packageData.mainImg}
                          alt={packageData.title}
                          className="w-[3em] h-[3em] rounded-lg border-2 border-gray-600 dark:border-gray-400"
                        />
                      </div>
                      <div
                        className={` font-semibold
                                                    ${
                                                      isHideState[packageData.packageIdx]
                                                        ? 'text-gray-400 dark:text-gray-500'
                                                        : 'text-black dark:text-white/90'
                                                    }
                          
                                                    `}
                        key={key}>
                        <h1>{packageData.title}</h1>
                      </div>

                      <div className="w-[65px] text-sm text-gray-600 dark:text-gray-400 text-right">
                        ({cnt}/{Object.keys(userPackageData[packageData.packageIdx].conList).length})
                      </div>
                    </div>
                  </div>
                );
              })}
          {!userPackageData && (
            <div className="flex flex-col gap-2 items-center justify-center w-full py-8 border-gray-200 border-dashed border-2 rounded-lg">
              <div className="text-center">디시인사이드에 로그인 후 구매한 콘을 동기화해보세요!</div>
              <img
                src="//dcimg5.dcinside.com/dccon.php?no=62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2276b35d2653f6c3ff31ff9090d8a40bc9e99620a21f56df7a621b47ce41ed0c8b20dcd847caedf3e62efe7c02ba1e"
                className="w-[80px] h-[80px] rounded-lg"
                alt={'부탁드려요'}
              />
            </div>
          )}
        </div>
        {conLabelList &&
        userPackageData &&
        Object.keys(conLabelList).filter(key => !userPackageData[key]).length > 0 ? (
          <div className="flex w-full text-sm gap-x-2 gap-y-1 flex-wrap overflow-y-auto overflow-auto scrollbar items-center  text-gray-700 dark:text-gray-300 max-h-[100px] sm:max-h-[50px] ">
            <span>보유하지 않은 콘 :</span>
            {Object.keys(conLabelList)
              .filter(key => !userPackageData[key])
              .map(key => {
                return (
                  <span
                    className="cursor-pointer px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
                    key={key}
                    onClick={() => {
                      // open new tab by js

                      window.open(`https://dccon.dcinside.com/hot/1/title/QWER#${key}`);
                    }}>
                    {conLabelList[key].title}
                  </span>
                );
              })}
          </div>
        ) : null}

        {isEditMode ? (
          <div className="flex flex-row gap-2">
            <div
              className="cursor-pointer flex-grow    text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full"
              onClick={async () => {
                // open file upload dialog

                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async e => {
                  const file = (e.target as HTMLInputElement).files?.[0];

                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async e => {
                      const content = e.target?.result as string;
                      const data = JSON.parse(content);

                      setImportedFileData(data);
                      setIsImportModalOpen(true);

                      setIsImportOverwrite(true);
                      setIsImportIncludeDoubleConPreset(true);
                      // setConLabelList(data);
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}>
              불러오기
            </div>
            <div
              className="cursor-pointer flex-grow    text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full"
              onClick={async () => {
                setIsExportModalOpen(true);

                setIsExportHidePackageInclude(true);
                setIsExportNotHavePackageInclude(true);
                setIsExportIncludeDoubleConPreset(true);
              }}>
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
                    userId: userId,
                  },
                },
                function (response) {
                  if (response.error) {
                    makeToast(response.error);
                    setIsSyncing(false);

                    return;
                  }

                  setUserPackageData(response.data);
                  makeToast('동기화 성공!');

                  chrome.runtime.sendMessage({
                    type: 'TRIGGER_EVENT',
                    action: 'SYNC_CON_LIST',
                    data: {
                      dataLength: Object.keys(response.data).length,
                    },
                  });

                  setIsSyncing(false);
                },
              );
            }}>
            {isSyncing ? `동기화 중...${syncProgress}` : '동기화 하기'}
          </div>
        )}
        {/* <div>unicro_id : {userId}</div> */}
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
          <div className="flex flex-col gap-2 items-start">
            <div className="flex flex-row justify-between items-center w-full mb-3">
              <div className="w-[50px]"></div>
              <div className="font-bold text-center w-full ">불러오기</div>
              <div className="w-[50px] flex justify-end">
                <XMarkIcon className="w-6 h-6 cursor-pointer" onClick={() => setIsImportModalOpen(false)} />
              </div>
            </div>
            <div className="font-bold">이미 라벨링이 있는 콘에 대해</div>
            <div className="flex flex-row gap-2 justify-between w-full font-bold">
              <div
                className={`py-3 flex-grow cursor-pointer text-center rounded-xl
                                        ${isImportOverwrite ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                                        `}
                onClick={() => {
                  setIsImportOverwrite(true);
                }}>
                덮어쓰기
              </div>
              <div
                className={`py-3 flex-grow cursor-pointer text-center rounded-xl
                                         ${!isImportOverwrite ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                                        `}
                onClick={() => {
                  setIsImportOverwrite(false);
                }}>
                건너뛰기
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-2 justify-between w-full font-bold mt-3">
            <span>더블콘 프리셋 포함</span>
            <Switch
              checked={isImportIncludeDoubleConPreset}
              onChange={async () => {
                setIsImportIncludeDoubleConPreset(!isImportIncludeDoubleConPreset);
              }}
              onColor="#a7b4db"
              onHandleColor="#456bd8"
              handleDiameter={20}
              uncheckedIcon={false}
              checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              height={15}
              width={36}
            />
          </div>

          <div
            className="
                                mt-8
                                cursor-pointer flex-grow    text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full"
            onClick={async () => {
              const customConList = (await Storage.getCustomConList()) as any;

              if (!customConList) {
                makeToast('콘 목록을 불러오지 못했습니다.');

                return;
              }

              const conLabelList = customConList['conLabelList'];
              const doubleConPreset = customConList['doubleConPreset'];

              // console.log(Object.keys(conLabelList).length);
              let importedConLabelList = importedFileData['conLabelList'];

              if (!importedConLabelList) {
                makeToast('콘 목록을 불러오지 못했습니다.');

                return;
              }

              for (let key of Object.keys(importedConLabelList)) {
                // console.log(key);

                if (!conLabelList[key]) {
                  conLabelList[key] = JSON.parse(JSON.stringify(importedFileData[key]));
                  conLabelList[key].conList = {};

                  // alert("!!!");
                }

                for (let conKey of Object.keys(importedConLabelList[key].conList)) {
                  // console.log(ke

                  if (isImportOverwrite) {
                    conLabelList[key].conList[conKey] = importedConLabelList[key].conList[conKey];

                    // console.log(conLabelList[key].conList[conKey], importedFileData[key].conList[conKey], "!!!!!!!!!!!", conKey, key);
                  } else {
                    if (
                      conLabelList[key] !== undefined &&
                      conLabelList[key].conList[conKey] !== undefined &&
                      (conLabelList[key].conList[conKey].title !== '' || conLabelList[key].conList[conKey].tag !== '')
                    ) {
                      continue;
                    } else {
                      conLabelList[key].conList[conKey] = importedConLabelList[key].conList[conKey];
                    }

                    // if (isImportOverwrite || !conLabelList[conKey]) {
                    //     conLabelList[conKey] = importedFileData[key].conList[conKey];
                    // }
                  }
                }
              }

              if (doubleConPreset && isImportIncludeDoubleConPreset && importedFileData['doubleConPreset']) {
                // 딕셔너리 형태로 처리
                if (isImportOverwrite) {
                  // 덮어쓰기 모드: 모든 항목을 덮어씁니다
                  for (const key in importedFileData['doubleConPreset']) {
                    doubleConPreset[key] = importedFileData['doubleConPreset'][key];
                  }
                } else {
                  // 건너뛰기 모드: 기존 항목은 유지하고 새로운 항목만 추가합니다
                  for (const key in importedFileData['doubleConPreset']) {
                    if (!(key in doubleConPreset)) {
                      doubleConPreset[key] = importedFileData['doubleConPreset'][key];
                    }
                  }
                }
              }

              setConLabelList(conLabelList);
              setDoubleConPreset(doubleConPreset);

              console.log(conLabelList, doubleConPreset);

              Storage.setCustomConList({
                conLabelList,
                doubleConPreset,
              }).then(() => {
                console.log('setCustomConList');

                chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, response => {
                  // const conSearchTmp = new ConSearch();
                  // conSearchTmp.deserialize(response.conSearch);

                  // setConSearch(conSearchTmp);
                  // setDetailIdxDict(response.detailIdxDict);

                  makeToast('저장 완료!');

                  setIsImportModalOpen(false);
                });
              });
            }}>
            확인
          </div>
        </Modal>
        <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex flex-row justify-between items-center w-full mb-3">
              <div className="w-[50px]"></div>
              <div className="font-bold text-center w-full ">내보내기</div>
              <div className="w-[50px] flex justify-end">
                <XMarkIcon className="w-6 h-6 cursor-pointer" onClick={() => setIsExportModalOpen(false)} />
              </div>
            </div>
            <div className="flex flex-row gap-2 justify-between w-full font-bold">
              <span>숨긴 콘도 포함</span>
              <Switch
                checked={isExportHidePackageInclude}
                onChange={async () => {
                  setIsExportHidePackageInclude(!isExportHidePackageInclude);
                }}
                onColor="#a7b4db"
                onHandleColor="#456bd8"
                handleDiameter={20}
                uncheckedIcon={false}
                checkedIcon={false}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                height={15}
                width={36}
              />
            </div>
            <div className="flex flex-row gap-2 justify-between w-full font-bold">
              <span>미보유 콘도 포함</span>
              <Switch
                checked={isExportNotHavePackageInclude}
                onChange={async () => {
                  setIsExportNotHavePackageInclude(!isExportNotHavePackageInclude);
                }}
                onColor="#a7b4db"
                onHandleColor="#456bd8"
                handleDiameter={20}
                uncheckedIcon={false}
                checkedIcon={false}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                height={15}
                width={36}
              />
            </div>
            <div className="flex flex-row gap-2 justify-between w-full font-bold">
              <span>더블콘 프리셋 포함</span>
              <Switch
                checked={isExportIncludeDoubleConPreset}
                onChange={async () => {
                  setIsExportIncludeDoubleConPreset(!isExportIncludeDoubleConPreset);
                }}
                onColor="#a7b4db"
                onHandleColor="#456bd8"
                handleDiameter={20}
                uncheckedIcon={false}
                checkedIcon={false}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                height={15}
                width={36}
              />
            </div>

            <div
              className="
                                mt-4
                                cursor-pointer flex-grow    text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-full"
              onClick={async () => {
                const customConList = (await Storage.getCustomConList()) as any;

                if (!customConList) {
                  makeToast('콘 목록을 불러오지 못했습니다.');
                  return;
                }

                let conLabelList = customConList['conLabelList'];
                let doubleConPreset = customConList['doubleConPreset'];

                if (!conLabelList) {
                  conLabelList = {};
                }

                const element = document.createElement('a');

                for (let key of Object.keys(conLabelList)) {
                  if (!isExportHidePackageInclude && userPackageData[key] && isHideState[key]) {
                    delete conLabelList[key];
                    continue;
                  }
                  if (!isExportNotHavePackageInclude && !userPackageData[key]) {
                    delete conLabelList[key];
                    continue;
                  }

                  for (let conKey of Object.keys(conLabelList[key].conList)) {
                    if (
                      conLabelList[key].conList[conKey].title === '' &&
                      conLabelList[key].conList[conKey].tag === ''
                    ) {
                      delete conLabelList[key].conList[conKey];
                    }
                  }
                }

                if (doubleConPreset !== undefined) {
                  // 딕셔너리 형태로 필터링
                  const filteredDoubleConPreset: { [key: string]: any } = {};

                  for (const key in doubleConPreset) {
                    const item = doubleConPreset[key];

                    if (
                      !isExportHidePackageInclude &&
                      ((userPackageData[item.firstDoubleCon?.packageIdx] &&
                        isHideState[item.firstDoubleCon?.packageIdx]) ||
                        (userPackageData[item.secondDoubleCon?.packageIdx] &&
                          isHideState[item.secondDoubleCon?.packageIdx]))
                    ) {
                      continue;
                    }

                    if (
                      !isExportNotHavePackageInclude &&
                      (!userPackageData[item.firstDoubleCon?.packageIdx] ||
                        !userPackageData[item.secondDoubleCon?.packageIdx])
                    ) {
                      continue;
                    }

                    filteredDoubleConPreset[key] = item;
                  }

                  doubleConPreset = filteredDoubleConPreset;
                }

                if (!isExportIncludeDoubleConPreset || doubleConPreset === undefined) {
                  doubleConPreset = {};
                }

                const file = new Blob([JSON.stringify({ conLabelList, doubleConPreset })], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);

                element.download = `ConLabelList_${userId.slice(0, 3)}_${new Date().getTime()}.json`;
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();

                setIsExportModalOpen(false);
              }}>
              확인
            </div>
          </div>
        </Modal>
        <div
          className="cursor-pointer
          text-center
         hover:text-blue-700
         text-gray-600
        dark:text-gray-400
         dark:hover:text-blue-400
 
          
          flex flex-row gap-0.5 justify-center items-center

          font-semibold text-sm
          "
          onClick={async () => {
            // return;
            setCurrentPage(3);

            return;
          }}>
          {/* <Cog6ToothIcon
            className=" inline-block"
            style={{
              width: '1em',
              height: '1em',
            }}
          /> */}
          <Cog6ToothIcon
            className="inline-block "
            style={{
              width: '1em',
              height: '1em',
            }}
          />
          설정
        </div>
      </div>
    </div>
  );
};

export default ConListPage;
