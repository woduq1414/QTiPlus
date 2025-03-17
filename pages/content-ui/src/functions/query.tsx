function getQueryValue(paramName: string) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName);
}

export default getQueryValue;
