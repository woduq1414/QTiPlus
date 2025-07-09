export enum SortMethod {
  RECENT_USED = 'recent_used',
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
  sortMethod: SortMethod;
}
