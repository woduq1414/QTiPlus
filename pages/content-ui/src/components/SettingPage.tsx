import parseCookies from '@src/functions/cookies';
import readLocalStorage from '@src/functions/storage';
import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import Switch from 'react-switch';
import Modal from './Modal';
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/16/solid';

interface SearchPageProps {
  detailIdxDict: Record<string, any>;
}

const SettingPage: React.FC<SearchPageProps> = props => {
  const {
    userPackageData,
    unicroId,
    setUserPackageData,
    setCurrentPage,
    setCurrentPackageIdx,
    setDetailIdxDict,
    isEditMode,
    setIsEditMode,
    setting,
    setSetting,
  } = useGlobalStore();

  useEffect(() => {
    const cookies = parseCookies();
    const unicroId = cookies['unicro_id'];
    console.log(unicroId);

    const storageKey = `UserConfig`;
    readLocalStorage(storageKey).then((data: any) => {
      console.log(data);
      if (data) {
        setSetting(data);
      } else {
        setSetting({
          isDarkMode: false,
          isShowRightBottomButton: false,
          isDefaultBigCon: true,
        });

        chrome.storage.local.set({
          UserConfig: {
            isDarkMode: false,
            isShowRightBottomButton: false,
            isDefaultBigCon: true,
          },
        });
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({
      UserConfig: setting,
    });
  }, [setting.isDarkMode, setting.isShowRightBottomButton, setting.isDefaultBigCon]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none  z-[899999999]
        `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] pl-6 pr-6 pt-6 pb-3 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 w-[480px]
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
                setCurrentPage(1);
              }}>
              이전
            </div>
          )}
          <div className="flex-grow text-center font-semibold">
            <h1>설정</h1>
          </div>
          <div className="w-[90px] "></div>
        </div>

        <div className="flex flex-col gap-4 py-3">
          <div className="flex flex-row gap-4 items-center">
            <div className="flex-grow font-semibold text-lg">다크 모드</div>
            <div>
              <Switch
                checked={setting.isDarkMode}
                onChange={async () => {
                  setSetting({
                    ...setting,
                    isDarkMode: !setting.isDarkMode,
                  });
                }}
                onColor="#a7b4db"
                onHandleColor="#456bd8"
                handleDiameter={25}
                uncheckedIcon={false}
                checkedIcon={false}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                height={25}
                width={45}
              />
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center">
            <div className="flex-grow font-semibold text-lg">우측 하단 버튼 표시</div>
            <div>
              <Switch
                checked={setting.isShowRightBottomButton}
                onChange={async () => {
                  setSetting({
                    ...setting,
                    isShowRightBottomButton: !setting.isShowRightBottomButton,
                  });
                }}
                onColor="#a7b4db"
                onHandleColor="#456bd8"
                handleDiameter={25}
                uncheckedIcon={false}
                checkedIcon={false}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                height={25}
                width={45}
              />
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center">
            <div className="flex-grow font-semibold text-lg">
              <div>대왕콘 기본으로 사용</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                대왕콘 사용 가능 상태일 때 대왕콘 옵션 기본으로 체크
              </div>
            </div>
            <div>
              <Switch
                checked={setting.isDefaultBigCon}
                onChange={async () => {
                  setSetting({
                    ...setting,
                    isDefaultBigCon: !setting.isDefaultBigCon,
                  });
                }}
                onColor="#a7b4db"
                onHandleColor="#456bd8"
                handleDiameter={25}
                uncheckedIcon={false}
                checkedIcon={false}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                // activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                height={25}
                width={45}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
