import parseCookies from '@src/functions/cookies';

import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import Switch from 'react-switch';
import Modal from '@src/components/Modal';
import { Cog6ToothIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';
import SettingItem from '@src/components/SettingItem';
import SortMethodEditModal from '@src/components/modals/SortMethodEditModal';

import Storage from '@extension/shared/lib/storage';
import { Page } from '@src/enums/Page';
import { time } from 'console';
import { refreshLabeling } from '@src/functions/refreshLabeling';
import { Message } from '@extension/shared/lib/enums/Message';
import { SortMethod } from '@extension/shared/lib/models/UserConfig';

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
  const [isSortMethodModalOpen, setIsSortMethodModalOpen] = useState(false);

  useEffect(() => { }, [setting]);

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

  const getSortMethodLabel = (method: SortMethod) => {
    switch (method) {
      case SortMethod.RECENT_USED:
        return '최근 사용한 콘 우선';
      case SortMethod.OLDEST_FIRST:
        return '과거 콘 우선';
      case SortMethod.NEWEST_FIRST:
        return '최신 콘 우선';
      case SortMethod.RANDOM:
        return '랜덤 정렬';
      default:
        return '최근 사용한 콘 우선';
    }
  };

  const handleSortMethodSave = (sortMethod: SortMethod) => {
    setSetting({
      ...setting,
      sortMethod: sortMethod,
    });
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

        <div className="flex flex-col gap-1 py-1 max-h-[85dvh] sm:max-h-[70dvh] overflow-auto scrollbar">
          {/* 표시 설정 */}
          <div className="mb-1">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">표시 설정</h3>
            <div className="flex flex-col gap-2.5">
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
                title="우측 하단 버튼 표시"
                isChecked={setting.isShowRightBottomButton}
                onChange={() => {
                  setSetting({
                    ...setting,
                    isShowRightBottomButton: !setting.isShowRightBottomButton,
                  });
                }}
              />
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

          {/* 검색 및 등록 설정 */}
          <div className="mb-1">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">검색 및 등록 설정</h3>
            <div className="flex flex-col gap-2.5">
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
                title="검색어 자동 추가"
                description="검색어가 B 중에 하나를 포함 시, A도 검색쿼리에 추가"
                isChecked={false}
                onChange={() => { }}
                showEditButton={true}
                onEditClick={() => {
                  setCurrentPage(Page.REPLACE_WORD_EDIT);
                }}
              />

              <SettingItem
                title="정렬 방식"
                description={getSortMethodLabel(setting.sortMethod)}
                isChecked={false}
                onChange={() => {
                  setIsSortMethodModalOpen(true);
                }}
                showEditButton={true}
                onEditClick={() => {
                  setIsSortMethodModalOpen(true);
                }}
              />



              <SettingItem
                title="더블콘 프리셋"
                description="자주 쓰는 더블콘의 태그 수정"
                isChecked={false}
                onChange={() => { }}
                showEditButton={true}
                onEditClick={() => {
                  setCurrentPage(Page.DOUBLE_CON_PRESET_EDIT);
                }}
              />
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

          {/* 데이터 관리 */}
          <div className="mb-1">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">데이터 관리</h3>
            <div className="flex flex-col gap-2.5">
              <SettingItem
                title="자동 라벨링 업데이트"
                description={`최근 : ${setting.lastUpdateTime
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
                title="라벨링 데이터 삭제"
                isChecked={false}
                onChange={() => { }}
                showEditButton={true}
                buttonText="삭제"
                buttonType="red"
                onEditClick={() => {
                  setIsResetModalOpen(true);
                }}
              />
            </div>
          </div>

          <div
            className="mb-2 text-lg flex flex-row cursor-pointer text-gray-900  dark:text-gray-100 hover:text-blue-500 dark:hover:text-blue-400 items-center mx-auto"
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
              큐티플 - 디시콘 검색기 v{process.env['CEB_EXTENSION_VERSION']} <br />
              qwer.shrimp@gmail.com
            </div>
          </div>

          {/* 초기화 확인 모달 */}
          <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)}>
            <div className="flex flex-col gap-4 items-center">
              <div className="font-bold text-lg  text-center">
                정말로 모든 라벨링 데이터를
                <br />
                삭제하시나요?
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center">이 작업은 되돌릴 수 없어요.</div>
              <img
                src="//dcimg5.dcinside.com/dccon.php?no=62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2276b35d2653f6c3ff31ff9090d8a40bc9e99621a21e55df7a621b47ce41ed038a2c9dc30017ae5c361d65a131fa0b"
                className="w-[80px] h-[80px] rounded-lg"
                alt="부탁드려요"
              />

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
                  삭제
                </button>
              </div>
            </div>
          </Modal>

          {/* 정렬 방식 설정 모달 */}
          <SortMethodEditModal
            isOpen={isSortMethodModalOpen}
            onClose={() => setIsSortMethodModalOpen(false)}
            currentSortMethod={setting.sortMethod}
            onSave={handleSortMethodSave}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
