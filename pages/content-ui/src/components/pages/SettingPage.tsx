import parseCookies from '@src/functions/cookies';

import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import Switch from 'react-switch';
import Modal from '@src/components/Modal';
import { Cog6ToothIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';
import SettingItem from '@src/components/SettingItem';

import Storage from '@extension/shared/lib/storage';
import { Page } from '@src/enums/Page';
import { time } from 'console';
import { refreshLabeling } from '@src/functions/refreshLabeling';
import { Message } from '@extension/shared/lib/enums/Message';

const SettingPage: React.FC = () => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {}, [setting]);

  const handleRefreshLabeling = async () => {
    setIsLoading(true);
    const success = await refreshLabeling();

    if (success) {
      setSetting({
        ...setting,
        lastUpdateTime: Math.floor(Date.now() / 1000),
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    Storage.setUserConfig(setting);
  }, [setting]);

  // 라벨링 데이터 초기화 함수
  const handleResetLabelingData = async () => {
    setIsLoading(true);
    try {
      await Storage.setCustomConList({
        conLabelList: {},
        doubleConPreset: {},
      }); // 라벨링 데이터 초기화

      chrome.runtime.sendMessage(
        {
          type: Message.CHANGED_DATA,
          data: {},
        },
        () => {
          makeToast('라벨링 데이터가 초기화되었습니다.');
        },
      );
    } catch (e) {
      makeToast('초기화 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
    setIsResetModalOpen(false);
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
          <div
            className="w-[90px] cursor-pointer font-semibold"
            onClick={() => {
              setCurrentPage(Page.CON_LIST);
            }}>
            이전
          </div>
          <div className="flex-grow text-center font-semibold">
            <h1>설정</h1>
          </div>
          <div className="w-[90px] "></div>
        </div>

        <div className="flex flex-col gap-4 py-3 max-h-[85dvh] sm:max-h-[70dvh] overflow-auto scrollbar">
          <SettingItem
            title="다크 모드"
            isChecked={setting.isDarkMode}
            onChange={() => {
              setSetting({
                ...setting,
                isDarkMode: !setting.isDarkMode,
              });
            }}
          />

          <SettingItem
            title="초성 검색"
            isChecked={setting.isChoseongSearch}
            onChange={() => {
              setSetting({
                ...setting,
                isChoseongSearch: !setting.isChoseongSearch,
              });
            }}
          />

          <SettingItem
            title="우측 하단 버튼 표시"
            isChecked={setting.isShowRightBottomButton}
            onChange={() => {
              setSetting({
                ...setting,
                isShowRightBottomButton: !setting.isShowRightBottomButton,
              });
            }}
          />

          <SettingItem
            title="대왕콘 기본으로 사용"
            description="대왕콘 사용 가능 상태일 때 대왕콘 옵션 기본으로 체크"
            isChecked={setting.isDefaultBigCon}
            onChange={() => {
              setSetting({
                ...setting,
                isDefaultBigCon: !setting.isDefaultBigCon,
              });
            }}
          />

          <SettingItem
            title="자동 라벨링 업데이트"
            description={`최근 : ${
              setting.lastUpdateTime
                ? new Date(setting.lastUpdateTime * 1000).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'
            }`}
            isChecked={setting.isAutoLabelingUpdate}
            onChange={() => {
              setSetting({
                ...setting,
                isAutoLabelingUpdate: !setting.isAutoLabelingUpdate,
              });
            }}
            showRefreshButton={true}
            onRefreshClick={handleRefreshLabeling}
          />

          <SettingItem
            title="검색어 자동 추가"
            description="검색어가 B 중에 하나를 포함 시, A도 검색쿼리에 추가"
            isChecked={false}
            onChange={() => {}}
            showEditButton={true}
            onEditClick={() => {
              setCurrentPage(Page.REPLACE_WORD_EDIT);
            }}
          />

          <SettingItem
            title="더블콘 프리셋"
            description="자주 쓰는 더블콘의 태그 수정"
            isChecked={false}
            onChange={() => {}}
            showEditButton={true}
            onEditClick={() => {
              setCurrentPage(Page.DOUBLE_CON_PRESET_EDIT);
            }}
          />

          <SettingItem
            title="라벨링 데이터 초기화"
            description="모든 라벨링 데이터 삭제"
            isChecked={false}
            onChange={() => {}}
            showEditButton={true}
            buttonText="삭제"
            buttonType="red"
            onEditClick={() => {
              setIsResetModalOpen(true);
            }}
          />

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
              qwer.shrimp@gmail.com
            </div>
          </div>

          {/* 초기화 확인 모달 */}
          <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)}>
            <div className="flex flex-col gap-4 items-center">
              <div className="font-bold text-lg text-red-600">정말로 라벨링 데이터를 초기화하시겠습니까?</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center">이 작업은 되돌릴 수 없습니다.</div>
              <div className="flex flex-row gap-2 mt-2 w-full">
                <button
                  className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setIsResetModalOpen(false)}>
                  취소
                </button>
                <button
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  onClick={handleResetLabelingData}
                  disabled={isLoading}>
                  초기화
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
