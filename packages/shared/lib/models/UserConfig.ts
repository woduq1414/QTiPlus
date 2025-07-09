export enum BaseSortMethod {
  OLDEST_FIRST = 'oldest_first',
  NEWEST_FIRST = 'newest_first',
  RANDOM = 'random'
}

export interface UserConfig {
  isDarkMode: boolean;
  isShowRightBottomButton: boolean;
  isDefaultBigCon: boolean;
  isChoseongSearch: boolean;
  lastUpdateTime: number | null;
  isAutoLabelingUpdate: boolean;
  isRecentUsedFirst: boolean;
  baseSortMethod: BaseSortMethod;
}
