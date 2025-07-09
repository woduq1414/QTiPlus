import { create } from 'zustand';
import { Page } from '../enums/Page';
import { BaseSortMethod } from '@extension/shared/lib/models/UserConfig';

import Storage from '@extension/shared/lib/storage';

interface GlobalStore {
  currentPage: Page;
  setCurrentPage: (currentPage: Page) => void;

  userId: string;
  setUserId: (userId: string) => void;

  userPackageData: any;
  setUserPackageData: (userPackageData: any) => void;

  currentPackageIdx: number;
  setCurrentPackageIdx: (currentPackageIdx: number) => void;

  conSearch: any;
  setConSearch: (conSearch: any) => void;

  detailIdxDict: any;
  setDetailIdxDict: (detailIdxDict: any) => void;

  isModalOpen: boolean;
  setIsModalOpen: (toggle?: boolean | ((prev: boolean) => boolean)) => void;

  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;

  setting: {
    isDarkMode: boolean | undefined;
    isShowRightBottomButton: boolean;
    isDefaultBigCon: boolean;
    isChoseongSearch: boolean;
    isAutoLabelingUpdate: boolean;
    lastUpdateTime: number | null;
    isRecentUsedFirst: boolean;
    baseSortMethod: BaseSortMethod;
  };
  setSetting: (newSettings: any) => void;
}

const useGlobalStore = create<GlobalStore>(set => {
  const setting = Storage.getUserConfig();
  return {
    currentPage: Page.SEARCH,
    setCurrentPage: currentPage => set({ currentPage }),

    userId: '',
    setUserId: userId => set({ userId: userId }),

    userPackageData: null,
    setUserPackageData: userPackageData => set({ userPackageData }),

    currentPackageIdx: 0,
    setCurrentPackageIdx: currentPackageIdx => set({ currentPackageIdx }),

    conSearch: null,
    setConSearch: conSearch => set({ conSearch }),

    detailIdxDict: null,
    setDetailIdxDict: detailIdxDict => set({ detailIdxDict }),

    isModalOpen: false,
    setIsModalOpen: toggle =>
      set(state => ({
        isModalOpen: typeof toggle === 'function' ? toggle(state.isModalOpen) : !!toggle,
      })),

    isEditMode: false,
    setIsEditMode: isEditMode => set({ isEditMode }),

    setting: {
      isDarkMode: undefined,
      isShowRightBottomButton: true,
      isDefaultBigCon: true,
      isChoseongSearch: true,
      isAutoLabelingUpdate: true,
      lastUpdateTime: -1,
      isRecentUsedFirst: true,
      baseSortMethod: BaseSortMethod.NEWEST_FIRST,
    },
    setSetting: newSettings =>
      set(state => ({
        setting: { ...state.setting, ...newSettings },
      })),
  };
});

export default useGlobalStore;
