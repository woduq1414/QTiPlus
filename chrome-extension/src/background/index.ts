import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import { convertDoubleConsonantToSingle, convertKoreanCharToChoseong } from './utils/korean';
import { hashSHA256 } from './utils/hash';
import { DEFAULT_USER_CONFIG, DEFAULT_REPLACE_WORD_DATA } from './constants/storage';
import ConSearch from './ConSearch';
import { convertQwertyToHangul } from 'es-hangul';

import { v4 as uuidv4 } from 'uuid';

import { ConLabelList, CustomConList, DoubleConPreset } from '@extension/shared/lib/models/CustomConList';
import { DetailData, DetailDataSingle, DetailDataDouble } from '@extension/shared/lib/models/DetailData';
import { UserPackageConData } from '@extension/shared/lib/models/UserPackageData';
import { FavoriteConList } from '@extension/shared/lib/models/FavoriteConList';

const userAgent = navigator.userAgent as any;

Storage.init();

// 브라우저 정보와 OS 정보 추출
const browserInfo = {
  userAgent,
};

console.log(browserInfo, 'info');
console.log(process.env['CEB_EXTENSION_VERSION'], 'version');

const AMPLITUDE_KEY = process.env['CEB_AMPLITUDE_KEY'] as string;

// ConSearchManager 클래스 정의
class ConSearchManager {
  private conSearch: ConSearch;
  private conSearchChoseong: ConSearch;
  private detailIdxDict: { [key: string]: DetailData };
  private cachedSearchResult: { [key: string]: string[] };

  constructor() {
    this.conSearch = new ConSearch();
    this.conSearchChoseong = new ConSearch();
    this.detailIdxDict = {};
    this.cachedSearchResult = {};
  }

  public getConSearch(): ConSearch {
    return this.conSearch;
  }

  public getConSearchChoseong(): ConSearch {
    return this.conSearchChoseong;
  }

  public getDetailIdxDict(): { [key: string]: DetailData } {
    return this.detailIdxDict;
  }

  public setConSearch(conSearch: ConSearch): void {
    this.conSearch = conSearch;
  }

  public setConSearchChoseong(conSearchChoseong: ConSearch): void {
    this.conSearchChoseong = conSearchChoseong;
  }

  public setDetailIdxDict(detailIdxDict: { [key: string]: DetailData }): void {
    this.detailIdxDict = detailIdxDict;
  }

  public searchTrie(query: string): Set<string> {
    return this.conSearch.searchTrie(query);
  }

  public searchChoseongTrie(query: string): Set<string> {
    return this.conSearchChoseong.searchTrie(query);
  }

  public getDetailData(key: string): DetailData | undefined {
    return this.detailIdxDict[key];
  }

  public getCachedSearchResult(query: string): string[] | undefined {
    return this.cachedSearchResult[query];
  }

  public setCachedSearchResult(query: string, result: string[]): void {
    this.cachedSearchResult[query] = result;
  }

  public clearCache(): void {
    this.cachedSearchResult = {};
  }
}

// 전역 변수로 ConSearchManager 인스턴스 생성
let conSearchManager: ConSearchManager = new ConSearchManager();

async function loadJSON() {
  try {
    const response = await fetch(chrome.runtime.getURL('data.json'));
    if (!response.ok) throw new Error('Failed to load JSON');
    const data = await response.json();
    console.log('Loaded JSON:', data);

    return data;
  } catch (error) {
    console.error('Error loading JSON:', error);
  }
}

async function getConInfoData() {
  const prevCustomConList: CustomConList | null = await Storage.getCustomConList(false);

  if (prevCustomConList === null || prevCustomConList === undefined) {
    const conInfoData = await loadJSON();

    await Storage.setCustomConList(conInfoData);

    return conInfoData;
  } else {
    const conInfoData = prevCustomConList;

    return conInfoData;
  }
}

async function conTreeInit() {
  const startT = performance.now();

  const conSearchTmp = new ConSearch();
  const conSearchChoseongTmp = new ConSearch();
  let detailIdxDictTmp = {} as { [key: string]: DetailData };

  const conInfoData = await getConInfoData();

  console.log(conInfoData);

  const conLabelList = conInfoData['conLabelList'] as ConLabelList;

  for (let packageIdx in conLabelList) {
    const conList = conLabelList[packageIdx].conList;
    for (let sort in conList) {
      const con = conList[sort as keyof typeof conList];
      // console.log(con.title);

      const key = packageIdx + '-' + sort;

      conSearchTmp.addCon(key, con.title, con.tag.split(' '));

      conSearchChoseongTmp.addCon(
        key,
        convertKoreanCharToChoseong(con.title),
        con.tag.split(' ').map((tag: string) => convertKoreanCharToChoseong(tag)),
      );

      detailIdxDictTmp[key] = {
        // detailIdx: con.detailIdx,
        title: con.title,
        packageIdx: packageIdx,
        sort: sort,
        imgPath: con.imgPath,
        who: con.who,
      };
    }
  }

  if (conInfoData['doubleConPreset'] !== undefined) {
    const doubleConPresetDict = conInfoData['doubleConPreset'] as DoubleConPreset;

    // 딕셔너리 형태로 처리
    for (const presetKey in doubleConPresetDict) {
      const preset = doubleConPresetDict[presetKey];
      let firstConInfo = preset.firstDoubleCon;
      let secondConInfo = preset.secondDoubleCon;

      const firstCon = conLabelList[firstConInfo.packageIdx]?.conList?.[firstConInfo.sort];
      const secondCon = conLabelList[secondConInfo.packageIdx]?.conList?.[secondConInfo.sort];

      if (firstCon === undefined || secondCon === undefined) {
        continue;
      }

      conSearchTmp.addCon(presetKey, '', preset.tag.split(' '));

      conSearchChoseongTmp.addCon(
        presetKey,
        '',
        preset.tag.split(' ').map((tag: string) => convertKoreanCharToChoseong(tag)),
      );

      detailIdxDictTmp[presetKey] = {
        isDoubleCon: true,
        presetKey: presetKey,
        firstDoubleCon: {
          packageIdx: firstConInfo.packageIdx,
          sort: firstConInfo.sort,
          ...firstCon,
        },
        secondDoubleCon: {
          packageIdx: secondConInfo.packageIdx,
          sort: secondConInfo.sort,
          ...secondCon,
        },
        tag: preset.tag,
        who: firstCon.who.concat(secondCon.who),
      };
    }
  }

  // ConSearchManager 인스턴스에 데이터 설정
  conSearchManager.setConSearch(conSearchTmp);
  conSearchManager.setConSearchChoseong(conSearchChoseongTmp);
  conSearchManager.setDetailIdxDict(detailIdxDictTmp);

  const endT = performance.now();

  console.log('Execution time: ~', endT - startT, 'ms');

  return { conSearchTmp, conSearchChoseongTmp, detailIdxDictTmp };
}

// 메시지 이벤트 핸들러 함수들
async function handleGetInitData(message: any, sender: any, sendResponse: any): Promise<boolean> {
  getConInfoData();
  initUserConfigStorage();
  initReplaceWordDataStorage();
  return true;
}

async function handleChangedData(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const res2 = await conTreeInit();
  sendResponse({
    status: 'success',
  });
  return true;
}

async function handleSearchCon(message: any, sender: any, sendResponse: any): Promise<boolean> {
  let query = message.query as string;

  const userId = message.userId as string;

  query = query.replaceAll(' ', '');

  let finalResult = new Set();
  const detailIdxDict = conSearchManager.getDetailIdxDict();

  const userPackageData = await Storage.getUserPackageData(true);

  if (userPackageData === null) {
    sendResponse({
      res: JSON.stringify([]),
      detailRes: JSON.stringify([]),
    });
    return true;
  }

  const cachedResult = conSearchManager.getCachedSearchResult(query);
  if (cachedResult !== undefined) {
    finalResult = new Set(cachedResult);
  } else {
    let who = '';

    if (query.includes('#')) {
      who = query.split('#')[1].toUpperCase();
      who = who.replaceAll('ㅂ', 'Q').replaceAll('ㅈ', 'W').replaceAll('ㄷ', 'E').replaceAll('ㄱ', 'R');
      who = who.replaceAll('ㅃ', 'Q').replaceAll('ㅉ', 'W').replaceAll('ㄸ', 'E').replaceAll('ㄲ', 'R');

      query = query.split('#')[0];
    }

    let queryList = [];

    let koQuery;

    try {
      koQuery = convertQwertyToHangul(query);
    } catch (error) {
      koQuery = query;
    }

    if (query === koQuery) {
      queryList = [query];
    } else {
      queryList = [query, koQuery];
    }

    function includesAny(query: string, list: string[]): boolean {
      return list.some(q => query.includes(q));
    }
    let additionalCategoryList = [];

    let replaceWordData = await Storage.getReplaceWordData(true);

    if (replaceWordData === null) {
      replaceWordData = {};
    }

    for (let i = 0; i < queryList.length; i++) {
      const query = queryList[i] as string;

      for (let key in replaceWordData) {
        if (includesAny(query, [key, ...replaceWordData[key]])) {
          additionalCategoryList.push(key);
        }
      }

      const result = conSearchManager.searchTrie(query);

      let result2 = new Set();
      for (let additionalCategory of additionalCategoryList) {
        result2 = new Set([...Array.from(result2), ...Array.from(conSearchManager.searchTrie(additionalCategory))]);
      }

      let result3 = new Set();

      const userConfig = await Storage.getUserConfig(true);
      if (userConfig?.isChoseongSearch) {
        result3 = conSearchManager.searchChoseongTrie(convertDoubleConsonantToSingle(query));
      }
      // console.log(userConfig, 'result3');

      let queryResult = new Set([...Array.from(result), ...Array.from(result2), ...Array.from(result3)]);

      if (who !== '') {
        for (let key of Array.from(queryResult)) {
          let f = false;
          const detailData = detailIdxDict[key as string];
          if (detailData && detailData.who) {
            for (let i = 0; i < who.length; i++) {
              if (detailData.who.includes(who[i])) {
                f = true;
                break;
              }
            }
          }
          if (!f) {
            queryResult.delete(key);
          }
        }
      }

      for (let key of Array.from(queryResult)) {
        const detailData = detailIdxDict[key as string];
        if (!detailData) continue;

        if (detailData.isDoubleCon === true) {
          // DetailDataDouble 타입으로 처리
          const doubleData = detailData as DetailDataDouble;
          if (!doubleData.firstDoubleCon || !doubleData.secondDoubleCon) continue;

          const firstCon = doubleData.firstDoubleCon;
          const secondCon = doubleData.secondDoubleCon;

          const firstConPackageIdx = firstCon.packageIdx;
          const secondConPackageIdx = secondCon.packageIdx;

          if (userPackageData[firstConPackageIdx] === undefined) {
            queryResult.delete(key);
            continue;
          } else {
            if (userPackageData[firstConPackageIdx].isHide) {
              queryResult.delete(key);
              continue;
            }
          }

          if (userPackageData[secondConPackageIdx] === undefined) {
            queryResult.delete(key);
            continue;
          } else {
            if (userPackageData[secondConPackageIdx].isHide) {
              queryResult.delete(key);
              continue;
            }
          }
        } else {
          // DetailDataSingle 타입으로 처리
          const singleData = detailData as DetailDataSingle;
          const packageIdx = singleData.packageIdx;

          if (userPackageData[packageIdx] === undefined) {
            queryResult.delete(key);
            continue;
          } else {
            if (userPackageData[packageIdx].isHide) {
              queryResult.delete(key);
              continue;
            }
          }
        }
      }

      finalResult = new Set([...Array.from(finalResult), ...Array.from(queryResult)]);
    }
  }

  const resultArray = Array.from(finalResult) as string[];
  conSearchManager.setCachedSearchResult(query, resultArray);

  const favoriteConList = (await Storage.getFavoriteConList(true)) as FavoriteConList;

  let doubleConList = new Set();
  let favoriteList = new Set();
  let otherList = new Set();

  for (let key of Array.from(finalResult)) {
    const detailData = detailIdxDict[key as string];
    if (!detailData) continue;

    if (detailData.isDoubleCon === true) {
      doubleConList.add(key);
    } else {
      // DetailDataSingle 타입으로 처리
      const singleData = detailData as DetailDataSingle;
      const packageIdx = singleData.packageIdx;
      const sort = singleData.sort;

      if (
        userPackageData[packageIdx] &&
        userPackageData[packageIdx].conList &&
        userPackageData[packageIdx].conList[sort] &&
        userPackageData[packageIdx].conList[sort].detailIdx
      ) {
        const detailIdx = userPackageData[packageIdx].conList[sort].detailIdx;

        if (favoriteConList !== null && favoriteConList[detailIdx] !== undefined) {
          favoriteList.add(key);
        } else {
          otherList.add(key);
        }
      } else {
        otherList.add(key);
      }
    }
  }

  finalResult.clear();

  finalResult = new Set([
    ...Array.from(doubleConList),
    ...Array.from(favoriteList),
    ...Array.from(otherList),
  ]) as Set<string>;

  sendResponse({
    res: JSON.stringify(Array.from(finalResult)),
    detailRes: JSON.stringify(
      (Array.from(finalResult) as string[]).map((key: string) => {
        return {
          key: key,
          ...detailIdxDict[key],
        };
      }),
    ),
  });
  return true;
}

async function handleGetIdCookie(message: any, sender: any, sendResponse: any): Promise<boolean> {
  chrome.cookies.get({ url: 'https://gall.dcinside.com', name: 'mc_enc' }, function (cookie) {
    if (cookie) {
      const userId = cookie.value;
      hashSHA256(userId).then(hashedUserId => {
        Storage.setUserId(hashedUserId);
        Storage.saveCurrentUserId(hashedUserId);

        sendResponse({ userId: hashedUserId });
      });
    } else {
      sendResponse({ userId: null });
    }
  });
  return true;
}

async function handleSyncConList(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const ci_t = message.data.ci_t;
  const oldUserPackageData = await Storage.getUserPackageData(false);

  async function fetchList(page: number) {
    async function fetchWithRetry(ci_t: string, page: number, maxRetries = 5) {
      let attempts = 0;

      while (attempts < maxRetries) {
        const response = await fetch('https://gall.dcinside.com/dccon/lists', {
          headers: {
            accept: '*/*',
            'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'x-requested-with': 'XMLHttpRequest',
          },
          referrer: 'https://gall.dcinside.com/mgallery/board/view',
          referrerPolicy: 'unsafe-url',
          body: `&target=icon&page=${page}`,
          method: 'POST',
          mode: 'cors',
          credentials: 'same-origin',
        });

        const responseText = await response.text();

        function IsJsonString(str: string) {
          try {
            var json = JSON.parse(str);
            return typeof json === 'object';
          } catch (e) {
            return false;
          }
        }

        if (response.status === 302 || IsJsonString(responseText) === false) {
          console.warn(`Request redirected (302), retrying... (${attempts + 1}/${maxRetries})`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        return responseText;
      }

      throw new Error('Max retries reached for fetching data.');
    }

    const response = await fetchWithRetry(ci_t, page);
    const data = JSON.parse(response);

    if (sender.tab) {
      if (sender.tab?.id !== undefined) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'SYNC_PROGRESS',
          data: {
            page: page,
            maxPage: data.max_page,
          },
        });
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    return data;
  }

  let data = await fetchList(0);

  if (data.bigcon === undefined) {
    sendResponse({ data: {}, error: '로그인이 필요합니다.' });
    return true;
  }

  if (data.bigcon.status == 'enabled') {
    const bigConExpire = data.bigcon.expire;
    await Storage.setBigConExpire(bigConExpire);
  }

  const maxPage = data.max_page + 1;

  function processData(data: any) {
    const list = data.list;

    const result: {
      [key: number]: { packageIdx: number; conList: { [key: string]: any }; title: string; mainImg: string };
    } = {};
    list.forEach((item: any) => {
      const detailList = item.detail;

      if (detailList.length === 0) {
        return;
      }

      const packageIdx = detailList[0].package_idx;

      let isHide = false;

      if (oldUserPackageData !== null && oldUserPackageData[packageIdx] !== undefined) {
        if (oldUserPackageData[packageIdx].isHide) {
          isHide = true;
        }
      }

      let packageResult: {
        packageIdx: number;
        conList: { [key: string]: UserPackageConData };
        title: string;
        mainImg: string;
        isHide: boolean;
      } = {
        packageIdx: packageIdx,
        conList: {},
        title: item.title,
        mainImg: item.main_img_url,
        isHide: isHide,
      };
      detailList.forEach((detailItem: any) => {
        const detailIdx = detailItem.detail_idx;
        const sort = detailItem.sort;
        packageResult.conList[sort] = {
          detailIdx: detailIdx,
          title: detailItem.title,
          imgPath: detailItem.list_img,
        };
      });

      result[packageIdx] = packageResult;
    });

    return result;
  }

  let allResult = {} as any;

  for (let i = 0; i < maxPage; i++) {
    if (i === 0) {
      Object.assign(allResult, processData(data));
    } else {
      data = await fetchList(i);
      Object.assign(allResult, processData(data));
    }
  }

  await Storage.setUserPackageData(allResult);

  sendResponse({ data: allResult });
  return true;
}

async function handleUpdateHideState(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const userId = Storage.getUserId(true);
  const hideState = message.data.hideState;

  const storageKey = `UserPackageData_${userId}`;

  console.log(await Storage.getUserId(true), 'userId');

  let oldUserPackageData = await Storage.getUserPackageData(false);

  for (let packageIdx in oldUserPackageData) {
    oldUserPackageData[packageIdx].isHide = hideState[packageIdx];
  }

  await Storage.setUserPackageData(oldUserPackageData);

  console.log(oldUserPackageData, 'oldUserPackageData');

  sendResponse({ data: oldUserPackageData });
  return true;
}

async function handleUpdateFavoriteConList(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const favoriteConList = message.data.favoriteConList;

  await Storage.setFavoriteConList(favoriteConList);

  sendResponse({ success: true });
  return true;
}

async function handleTriggerEvent(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const action = message.action;
  const data = message.data;

  Storage.getUserId(true).then(async (userId: any) => {
    if (userId) {
      const hashedInsertId = (await hashSHA256(`${JSON.stringify(data)}${action}${userId}`)).slice(0, 10);

      Storage.getDeviceId(true).then(async (deviceId: any) => {
        if (deviceId === null || deviceId === undefined) {
          const newDeviceId = uuidv4();
          await Storage.setDeviceId(newDeviceId);
          deviceId = newDeviceId;
        }

        let now = Date.now();
        let trackData = {
          api_key: AMPLITUDE_KEY,
          events: [
            {
              user_id: userId,
              device_id: `${deviceId}`,
              session_id: now,
              time: now,
              platform: 'Web',
              language: 'ko',
              insert_id: hashedInsertId,
              event_type: action,
              event_properties: {
                ...data,
                extensionVersion: process.env['CEB_EXTENSION_VERSION'] as string,
              },
              library: 'amplitude-ts/2.9.2',
              user_agent: browserInfo.userAgent,
            },
          ],
          options: {},
        };

        fetch('https://api2.amplitude.com/2/httpapi', {
          method: 'POST',
          body: JSON.stringify(trackData),
          headers: {
            accept: '*/*',
            'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6',
            'content-type': 'application/json',
            priority: 'u=1, i',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
          },
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'strict-origin-when-cross-origin',
        })
          .then(response => response.json())
          .then(data => console.log('Success:', data))
          .catch(error => console.error('Error:', error));
      });

      sendResponse({ data: 'success' });
    }
  });
  return true;
}

async function handleUpdateStorage(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const key = message.data.key;
  const value = message.data.value;
  await Storage.updateCache(key, value);

  conSearchManager.clearCache();

  sendResponse({ success: true });
  return true;
}

// 메시지 이벤트 핸들러 매핑
const messageHandlers: { [key: string]: (message: any, sender: any, sendResponse: any) => Promise<boolean> } = {
  [Message.GET_INIT_DATA]: handleGetInitData,
  [Message.CHANGED_DATA]: handleChangedData,
  [Message.SEARCH_CON]: handleSearchCon,
  [Message.GET_ID_COOKIE]: handleGetIdCookie,
  [Message.SYNC_CON_LIST]: handleSyncConList,
  [Message.UPDATE_HIDE_STATE]: handleUpdateHideState,
  [Message.UPDATE_FAVORITE_CON_LIST]: handleUpdateFavoriteConList,
  [Message.UPDATE_STORAGE]: handleUpdateStorage,
  [Message.TRIGGER_EVENT]: handleTriggerEvent,
};

conTreeInit().then(res => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  console.log('Message received:', message);
  if (handler) {
    handler(message, sender, sendResponse);
    return true;
  }
  return true;
});

function initUserConfigStorage() {
  Storage.getUserConfig().then((data: any) => {
    if (data) {
    } else {
      Storage.setUserConfig(DEFAULT_USER_CONFIG);
    }
  });
}

function initReplaceWordDataStorage() {
  Storage.getReplaceWordData().then((data: any) => {
    if (data) {
    } else {
      Storage.setReplaceWordData(DEFAULT_REPLACE_WORD_DATA);
    }
  });
}

initUserConfigStorage();
initReplaceWordDataStorage();
