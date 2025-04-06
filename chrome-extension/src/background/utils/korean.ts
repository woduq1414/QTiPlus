import { DOUBLE_CONSONANT_MAP, CHOSEONG_LIST, DOUBLE_CHOSEONG_MAP, HANGUL_UNICODE } from '../constants/korean';

/**
 * 겹자음을 단일 자음으로 변환하는 함수
 * @param str 변환할 문자열
 * @returns 변환된 문자열
 */
export function convertDoubleConsonantToSingle(str: string) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (DOUBLE_CONSONANT_MAP[char as keyof typeof DOUBLE_CONSONANT_MAP] !== undefined) {
      result += DOUBLE_CONSONANT_MAP[char as keyof typeof DOUBLE_CONSONANT_MAP];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * 한글 문자를 초성으로 변환하는 함수
 * @param str 변환할 문자열
 * @returns 변환된 초성 문자열
 */
export function convertKoreanCharToChoseong(str: string) {
  const result = [];

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code >= HANGUL_UNICODE.START && code <= HANGUL_UNICODE.END) {
      const choseongIndex = Math.floor((code - HANGUL_UNICODE.START) / HANGUL_UNICODE.BLOCK_SIZE);
      result.push(CHOSEONG_LIST[choseongIndex]);
    } else {
      const char = str[i];
      if (DOUBLE_CHOSEONG_MAP[char as keyof typeof DOUBLE_CHOSEONG_MAP] !== undefined) {
        result.push(...DOUBLE_CHOSEONG_MAP[char as keyof typeof DOUBLE_CHOSEONG_MAP]);
      }
    }
  }

  return result.join('');
}
