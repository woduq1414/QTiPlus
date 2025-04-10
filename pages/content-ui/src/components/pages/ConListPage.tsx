import React, { useState, useCallback } from 'react';
import parseCookies from '@src/functions/cookies';
import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useRef } from 'react';
import Switch from 'react-switch';
import { Cog6ToothIcon } from '@heroicons/react/16/solid';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import { Page } from '@src/enums/Page';
import ImportModal from '@src/components/modals/ImportModal';
import ExportModal from '@src/components/modals/ExportModal';
import { useConList } from '@src/hooks/useConList';
import ConListItem from '@src/components/ConListItem';

const ConListPage: React.FC = () => {
  const {
    userPackageData,
    userId,
    setUserPackageData,
    setCurrentPage,
    setCurrentPackageIdx,
    isEditMode,
    setIsEditMode,
  } = useGlobalStore();

  const {
    isSyncing,
    syncProgress,
    conLabelList,
    doubleConPreset,
    isHideState,
    setIsHideState,
    toggleIsHide,
    syncConList,
    saveHideState,
    setConLabelList,
    setDoubleConPreset,
  } = useConList(userId, setUserPackageData);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedFileData, setImportedFileData] = useState<any>(null);

  const handleFileImport = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const content = e.target?.result as string;
      const data = JSON.parse(content);
      setImportedFileData(data);
    };
    reader.readAsText(file);
  }, []);

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

  const handleSave = useCallback(async () => {
    await saveHideState(isHideState);
    setIsEditMode(false);
  }, [isHideState, saveHideState, setIsEditMode]);

  const sortedPackageKeys = userPackageData
    ? Object.keys(userPackageData).sort((a, b) => {
        const hideA = userPackageData[a].isHide ? 1 : 0;
        const hideB = userPackageData[b].isHide ? 1 : 0;
        if (hideA !== hideB) return hideA - hideB;
        return userPackageData[a].title
          .replaceAll(' ', '')
          .localeCompare(userPackageData[b].title.replaceAll(' ', ''), 'ko');
      })
    : [];

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[899999999]">
        <div
          className="bg-[rgba(246,246,246,0.75)] pl-6 pr-6 pt-6 pb-3 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 w-[480px]
            text-black dark:bg-[rgba(46,46,46,0.75)] dark:text-white/90"
          style={{ backdropFilter: 'blur(15px)' }}>
          <div className="flex flex-row">
            {!isEditMode ? (
              <div className="w-[90px] cursor-pointer font-semibold" onClick={() => setCurrentPage(Page.SEARCH)}>
                이전
              </div>
            ) : (
              <div className="w-[90px]" />
            )}
            <div className="flex-grow text-center font-semibold">
              <h1>콘 목록</h1>
            </div>
            {isEditMode ? (
              <div className="w-[90px] cursor-pointer text-right font-semibold" onClick={handleSave}>
                저장
              </div>
            ) : userPackageData ? (
              <div className="w-[90px] cursor-pointer text-right font-semibold" onClick={() => setIsEditMode(true)}>
                편집
              </div>
            ) : (
              <div className="w-[90px]" />
            )}
          </div>

          <div className="flex flex-col gap-2 overflow-auto scrollbar max-h-[50dvh] px-1">
            {userPackageData ? (
              sortedPackageKeys.map(key => {
                if (userPackageData[key].isHide && !isEditMode) return null;

                const packageData = userPackageData[key];
                const customConData = conLabelList ? conLabelList[packageData.packageIdx] : null;

                return (
                  <ConListItem
                    key={key}
                    packageData={packageData}
                    customConData={customConData}
                    isEditMode={isEditMode}
                    isHideState={isHideState}
                    onToggleHide={toggleIsHide}
                    onClick={() => {
                      if (!isEditMode) return;
                      setCurrentPackageIdx(packageData.packageIdx);
                      setCurrentPage(Page.CON_INFO_EDIT);
                    }}
                  />
                );
              })
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center w-full py-8 border-gray-200 border-dashed border-2 rounded-lg">
                <div className="text-center">디시인사이드에 로그인 후 구매한 콘을 동기화해보세요!</div>
                <img
                  src="//dcimg5.dcinside.com/dccon.php?no=62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2276b35d2653f6c3ff31ff9090d8a40bc9e99620a21f56df7a621b47ce41ed0c8b20dcd847caedf3e62efe7c02ba1e"
                  className="w-[80px] h-[80px] rounded-lg"
                  alt="부탁드려요"
                />
              </div>
            )}
          </div>

          {conLabelList &&
            userPackageData &&
            Object.keys(conLabelList).filter(key => !userPackageData[key]).length > 0 && (
              <div className="flex w-full text-sm gap-x-2 gap-y-1 flex-wrap overflow-y-auto overflow-auto scrollbar items-center text-gray-700 dark:text-gray-300 max-h-[100px] sm:max-h-[50px]">
                <span>보유하지 않은 콘 :</span>
                {Object.keys(conLabelList)
                  .filter(key => !userPackageData[key])
                  .map(key => (
                    <span
                      key={key}
                      className="cursor-pointer px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
                      onClick={() => window.open(`https://dccon.dcinside.com/hot/1/title/QWER#${key}`)}>
                      {conLabelList[key].title}
                    </span>
                  ))}
              </div>
            )}

          {isEditMode ? (
            <div className="flex flex-row gap-2">
              <div
                className="cursor-pointer flex-grow text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
                  focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 
                  dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-full"
                onClick={() => setIsImportModalOpen(true)}>
                불러오기
              </div>
              <div
                className="cursor-pointer flex-grow text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
                  focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 
                  dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-full"
                onClick={() => setIsExportModalOpen(true)}>
                내보내기
              </div>
            </div>
          ) : (
            <div
              className={`cursor-pointer text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
                focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 dark:bg-blue-600 
                dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-full
                ${isSyncing ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={syncConList}>
              {isSyncing ? `동기화 중...${syncProgress}` : '동기화 하기'}
            </div>
          )}

          <div
            className="cursor-pointer text-center hover:text-blue-700 text-gray-600 dark:text-gray-400 
              dark:hover:text-blue-400 flex flex-row gap-0.5 justify-center items-center font-semibold text-sm"
            onClick={() => setCurrentPage(Page.SETTING)}>
            <Cog6ToothIcon className="inline-block" style={{ width: '1em', height: '1em' }} />
            설정
          </div>
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportedFileData(null);
        }}
        importedFileData={importedFileData}
        setConLabelList={setConLabelList}
        setDoubleConPreset={setDoubleConPreset}
        onFileSelect={handleFileImport}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        userPackageData={userPackageData}
        isHideState={isHideState}
        userId={userId}
      />
    </>
  );
};

export default ConListPage;
