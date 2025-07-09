import { BaseSortMethod } from '@extension/shared/lib/models/UserConfig';

/**
 * 스토리지 키 상수
 */
export const STORAGE_KEYS = {
  USER_CONFIG: 'UserConfig',
  REPLACE_WORD_DATA: 'ReplaceWordData',
  USER_PACKAGE_DATA: 'UserPackageData',
  FAVORITE_CON_LIST: 'FavoriteConList',
  BIG_CON_EXPIRE: 'BigConExpire',
  USER_ID: 'UserId',
  DEVICE_ID: 'DeviceId',
} as const;

/**
 * 기본 사용자 설정
 */
export const DEFAULT_USER_CONFIG = {
  isDarkMode: false,
  isShowRightBottomButton: true,
  isDefaultBigCon: true,
  isChoseongSearch: true,
  isAutoLabelingUpdate: true,
  lastUpdateTime: -1,
  isRecentUsedFirst: true,
  baseSortMethod: BaseSortMethod.NEWEST_FIRST,
} as const;

/**
 * 기본 대체어 데이터
 */
export const DEFAULT_REPLACE_WORD_DATA = {
  웃음: ['ㅋㅋ', '웃겨', '낄낄'],
  슬픔: ['ㅠ', '슬퍼', '슬프', '울었'],
  하이: ['ㅎㅇ', '안녕'],
  바이: ['잘가', '빠이'],
  미안: ['ㅈㅅ', '죄송'],
  놀람: ['ㄴㅇㄱ', '헉'],
  감사: ['ㄳ', 'ㄱㅅ'],
  덜덜: ['ㄷㄷ', 'ㅎㄷㄷ', '후덜덜', '두렵', '무섭', '무서', '두려'],
  신남: ['행복', '신나', '기뻐', '신났'],
  화남: ['화났', '화나', '분노'],
  커: ['커여', '커엽', '귀여', '귀엽'],
  떽: ['섹시', '떽띠'],
  굿: ['따봉', '좋'],
  크아악: ['크아', '완장'],
  댄스: ['춤'],
  개추: ['추천', '게추', '따봉'],
  비추: ['붐따'],
  짝짝: ['박수'],
  충성: ['경례', '^^7'],
} as const;
