import { create } from 'zustand';

interface GlobalStore {
  currentPage: number;
  setCurrentPage: (currentPage: number) => void;

  unicroId: string;
  setUnicroId: (unicroId: string) => void;

  userPackageData: any;
  setUserPackageData: (userPackageData: any) => void;

  currentPackageIdx: number;
  setCurrentPackageIdx: (currentPackageIdx: number) => void;

  emojiSearch: any;
  setEmojiSearch: (emojiSearch: any) => void;

  detailIdxDict: any;
  setDetailIdxDict: (detailIdxDict: any) => void;

  isModalOpen: boolean;
  setIsModalOpen: (toggle?: boolean | ((prev: boolean) => boolean)) => void;
}

const useGlobalStore = create<GlobalStore>(set => ({
  currentPage: 0,
  setCurrentPage: currentPage => set({ currentPage }),

  unicroId: '',
  setUnicroId: unicroId => set({ unicroId: unicroId }),

  userPackageData: null,
  setUserPackageData: userPackageData => set({ userPackageData }),

  currentPackageIdx: 0,
  setCurrentPackageIdx: currentPackageIdx => set({ currentPackageIdx }),

  emojiSearch: null,
  setEmojiSearch: emojiSearch => set({ emojiSearch }),

  detailIdxDict: null,
  setDetailIdxDict: detailIdxDict => set({ detailIdxDict }),

  isModalOpen: false,
  setIsModalOpen: toggle =>
    set(state => ({
      isModalOpen: typeof toggle === 'function' ? toggle(state.isModalOpen) : !!toggle,
    })),
}));

export default useGlobalStore;
