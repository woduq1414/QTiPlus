export const Z_INDEX = {
  // 기본 레이어
  BASE: 9999999,

  // 모달 및 오버레이 레이어
  MODAL: 999999999,
  MODAL_OVERLAY: 899999999,

  // 포커스된 아이템 레이어
  FOCUSED_ITEM: 9999999999,

  // 플로팅 버튼 레이어
  FLOATING_BUTTON: 1999999990,
} as const;

// 사용 예시:
// style={{ zIndex: Z_INDEX.MODAL }}
// style={{ zIndex: Z_INDEX.FOCUSED_ITEM }}
