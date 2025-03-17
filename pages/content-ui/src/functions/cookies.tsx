function parseCookies(): Record<string, string> {
  return document.cookie.split('; ').reduce<Record<string, string>>((cookies, cookie) => {
    const [key, value] = cookie.split('=');
    if (key) {
      cookies[key] = decodeURIComponent(value || '');
    }
    return cookies;
  }, {});
}

export default parseCookies;
