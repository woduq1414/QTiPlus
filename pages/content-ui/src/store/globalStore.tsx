import { create } from 'zustand';

interface GlobalStore {
  currentPage: number;
  setCurrentPage: (currentPage: number) => void;

  unicroId: string;
  setUnicroId: (unicroId: string) => void;

  userPackageData: any;
  setUserPackageData: (userPackageData: any) => void;
}

const useGlobalStore = create<GlobalStore>(set => ({
  currentPage: 0,
  setCurrentPage: currentPage => set({ currentPage }),

  unicroId: '',
  setUnicroId: unicroId => set({ unicroId: unicroId }),

  userPackageData: null,
  setUserPackageData: userPackageData => set({ userPackageData }),
}));

export default useGlobalStore;
