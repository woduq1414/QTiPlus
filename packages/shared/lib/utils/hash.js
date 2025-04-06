/**
 * 문자열을 SHA-256 해시로 변환하는 함수
 * @param text 해시할 문자열
 * @returns Promise<string> 해시된 문자열
 */
export async function hashSHA256(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
