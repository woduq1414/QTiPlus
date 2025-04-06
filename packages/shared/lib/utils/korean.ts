/**
 * 한글 자음을 단일 자음으로 변환하는 함수
 * 예: 'ㄲ' -> 'ㄱ', 'ㄸ' -> 'ㄷ', 'ㅃ' -> 'ㅂ', 'ㅆ' -> 'ㅅ', 'ㅉ' -> 'ㅈ'
 */
export function convertDoubleConsonantToSingle(char: string): string {
  const doubleConsonantMap: { [key: string]: string } = {
    ㄲ: 'ㄱ',
    ㄸ: 'ㄷ',
    ㅃ: 'ㅂ',
    ㅆ: 'ㅅ',
    ㅉ: 'ㅈ',
  };
  return doubleConsonantMap[char] || char;
}

/**
 * 한글 문자를 초성으로 변환하는 함수
 * 예: '가' -> 'ㄱ', '나' -> 'ㄴ', '다' -> 'ㄷ'
 */
export function convertKoreanCharToChoseong(char: string): string {
  const cho = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];
  const code = char.charCodeAt(0) - 0xac00;
  if (code > -1 && code < 11172) {
    return cho[Math.floor(code / 588)];
  }
  return char;
}
