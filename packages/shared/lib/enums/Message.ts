/**
 * Chrome Extension Background와 Content Script 간 통신에 사용되는 메시지 타입을 정의하는 Enum
 */
export enum Message {
  // 초기화 관련 메시지
  GET_INIT_DATA = 'GET_INIT_DATA',
  CHANGED_DATA = 'CHANGED_DATA',

  // 검색 관련 메시지
  SEARCH_CON = 'SEARCH_CON',

  // 사용자 인증 관련 메시지
  GET_ID_COOKIE = 'GET_ID_COOKIE',

  // 콘 리스트 관련 메시지
  SYNC_CON_LIST = 'SYNC_CON_LIST',
  UPDATE_HIDE_STATE = 'UPDATE_HIDE_STATE',
  UPDATE_FAVORITE_CON_LIST = 'UPDATE_FAVORITE_CON_LIST',

  // 설정 관련 메시지
  UPDATE_STORAGE = 'UPDATE_STORAGE',

  // 이벤트 관련 메시지
  TRIGGER_EVENT = 'TRIGGER_EVENT',

  // 동기화 진행 상황 메시지
  SYNC_PROGRESS = 'SYNC_PROGRESS',

  // 살아있게 유지하는 메시지
  KEEP_ALIVE = 'KEEP_ALIVE',
}
