/**
 * Chrome Extension Background와 Content Script 간 통신에 사용되는 메시지 타입을 정의하는 Enum
 */
export var Message;
(function (Message) {
  // 초기화 관련 메시지
  Message['GET_INIT_DATA'] = 'GET_INIT_DATA';
  Message['CHANGED_DATA'] = 'CHANGED_DATA';
  // 검색 관련 메시지
  Message['SEARCH_CON'] = 'SEARCH_CON';
  // 사용자 인증 관련 메시지
  Message['GET_ID_COOKIE'] = 'GET_ID_COOKIE';
  // 콘 리스트 관련 메시지
  Message['SYNC_CON_LIST'] = 'SYNC_CON_LIST';
  Message['UPDATE_HIDE_STATE'] = 'UPDATE_HIDE_STATE';
  Message['UPDATE_FAVORITE_CON_LIST'] = 'UPDATE_FAVORITE_CON_LIST';
  // 이벤트 관련 메시지
  Message['TRIGGER_EVENT'] = 'TRIGGER_EVENT';
  // 동기화 진행 상황 메시지
  Message['SYNC_PROGRESS'] = 'SYNC_PROGRESS';
})(Message || (Message = {}));
