import parseCookies from '@src/functions/cookies';
import readLocalStorage from '@src/functions/storage';
import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import Switch from 'react-switch';
import Modal from './Modal';
import { Cog6ToothIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface SearchPageProps {
  detailIdxDict: Record<string, any>;
}

const SettingPage: React.FC<SearchPageProps> = props => {
  const {
    userPackageData,
    userId,
    setUserPackageData,
    setCurrentPage,
    setCurrentPackageIdx,
    setDetailIdxDict,
    isEditMode,
    setIsEditMode,
    setting,
    setSetting,
  } = useGlobalStore();

  const [replaceWordData, setReplaceWordData] = useState<any>(null);

  useEffect(() => {
    chrome.storage.local.set({
      UserConfig: setting,
    });
  }, [setting]);

  useEffect(() => {
    readLocalStorage('ReplaceWordData').then((data: any) => {
      console.log(data);
      if (data === null) {
        // setReplaceWordData(data);
      } else {
        setReplaceWordData(data);
      }
    });
  }, []);

  const [isReplaceWordModalOpen, setIsReplaceWordModalOpen] = useState(false);

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
          <div
            className="w-[90px] cursor-pointer font-semibold"
            onClick={() => {
              // setUserPackageData(null);
              setCurrentPage(1);
            }}>
            이전
          </div>
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
            <div className="flex-grow font-semibold text-lg">초성 검색</div>
            <div>
              <Switch
                checked={setting.isChoseongSearch}
                onChange={async () => {
                  setSetting({
                    ...setting,
                    isChoseongSearch: !setting.isChoseongSearch,
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

          <div className="flex flex-row gap-4 items-center">
            <div className="flex-grow font-semibold text-lg">
              <div>검색어 자동 추가</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                검색어가 B 중에 하나를 포함 시, A도 검색쿼리에 추가
              </div>
            </div>
            <div
              className="
              bg-blue-500
              text-white
              rounded-lg
              px-3
              py-2
              text-md
              font-semibold
              cursor-pointer
              hover:bg-blue-600
              dark:hover:bg-blue-400
            "
              onClick={() => {
                setCurrentPage(4);
              }}>
              수정
            </div>
          </div>
        </div>
        <div
          className="mb-4 text-lg flex flex-row cursor-pointer text-gray-900  dark:text-gray-100 hover:text-blue-500 dark:hover:text-blue-400 items-center mx-auto"
          onClick={() => {
            window.open('https://adaptive-bovid-12e.notion.site/1beee4e2dbd98077996fdececf9c0b9a?pvs=73', '_blank');
          }}>
          <PaperClipIcon strokeWidth={1} className="mr-0.5 w-[1em] h-[1em]" />
          사용 설명서
        </div>
        <div className="flex flex-col gap-1 mt-1 items-center w-full">
          <img
            src={chrome.runtime.getURL('iconOriginal.png')}
            alt=""
            className="rounded-lg w-[50px] h-[50px] opacity-80"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            큐티플 - QWER(큐떱이알)콘 검색기 v{process.env['CEB_EXTENSION_VERSION']} <br />
            By 깔깔새우 (qwer.shrimp@gmail.com)
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
