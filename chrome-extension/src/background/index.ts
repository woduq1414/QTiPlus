import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';

import ConSearch from './ConSearch';

import * as amplitude from '@amplitude/analytics-browser';

// console.log(process.env['CEB_EXAMPLE'], 'ceb_example');
// console.log(process.env["CEB_GA_MEASUREMENT_ID"], "ceb_ga_measurement_id");

import { convertQwertyToHangul } from 'es-hangul';
// import mixpanel from "mixpanel-browser";
// import { track } from 'mixpanel-browser';
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'crypto';
import { ConLabelList, CustomConList, DoubleConPreset } from '@extension/shared/lib/models/CustomConList';
import { DetailData, DetailDataSingle } from '@extension/shared/lib/models/DetailData';
import { UserPackageConData } from '@extension/shared/lib/models/UserPackageData';

const userAgent = navigator.userAgent as any;

// 브라우저 정보와 OS 정보 추출
const browserInfo = {
  userAgent,
};

console.log(browserInfo, 'info');
console.log(process.env['CEB_EXTENSION_VERSION'], 'version');

const AMPLITUDE_KEY = process.env['CEB_AMPLITUDE_KEY'] as string;

let cachedSearchResult: any = {};

console.log('Background loaded');

function convertDoubleConsonantToSingle(str: string) {
  const doubleConsonant = {
    ㄳ: 'ㄱㅅ',
    ㄵ: 'ㄴㅈ',
    ㄶ: 'ㄴㅎ',
    ㄺ: 'ㄹㄱ',
    ㄻ: 'ㄹㅁ',
    ㄼ: 'ㄹㅂ',
    ㄽ: 'ㄹㅅ',
    ㄾ: 'ㄹㅌ',
    ㄿ: 'ㄹㅍ',
    ㅀ: 'ㄹㅎ',
    ㅄ: 'ㅂㅅ',
  } as { [key: string]: string };

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (doubleConsonant[char] !== undefined) {
      result += doubleConsonant[char];
    } else {
      result += char;
    }
  }
  // console.log(result);
  return result;
}

function convertKoreanCharToChoseong(str: string) {
  const choseong = [
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
  ] as string[];

  const result = [];

  const doubleChoseong = {
    ㄳ: ['ㄱ', 'ㅅ'],
    ㄵ: ['ㄴ', 'ㅈ'],
    ㄶ: ['ㄴ', 'ㅎ'],
    ㄺ: ['ㄹ', 'ㄱ'],
    ㄻ: ['ㄹ', 'ㅁ'],
    ㄼ: ['ㄹ', 'ㅂ'],
    ㄽ: ['ㄹ', 'ㅅ'],
    ㄾ: ['ㄹ', 'ㅌ'],
    ㄿ: ['ㄹ', 'ㅍ'],
    ㅀ: ['ㄹ', 'ㅎ'],
    ㅄ: ['ㅂ', 'ㅅ'],
  } as { [key: string]: string[] };

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code >= 44032 && code <= 55203) {
      const choseongIndex = Math.floor((code - 44032) / 588);
      result.push(choseong[choseongIndex]);
    } else {
      // ㄳ, ㅄ과 같은 겹자음일 경우 두 개 초성으로 분리하여 추가

      const char = str[i];
      if (doubleChoseong[char] !== undefined) {
        result.push(...doubleChoseong[char]);
      }
    }
  }

  return result.join('');
}

let tmpRes: any = undefined;

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

  tmpRes = { conSearchTmp, conSearchChoseongTmp, detailIdxDictTmp };

  const endT = performance.now();

  console.log('Execution time: ~', endT - startT, 'ms');

  return { conSearchTmp, conSearchChoseongTmp, detailIdxDictTmp };
}

conTreeInit().then(res => {
  console.log(res);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === Message.GET_INIT_DATA) {
      getConInfoData();
      initUserConfigStorage();
      initReplaceWordDataStorage();

      // JSON으로 변환하여 보냄
      return true;
    } else if (message.type === Message.CHANGED_DATA) {
      async function func() {
        const res2 = await conTreeInit();

        sendResponse({
          status: 'success',
          // conSearch: res2?.conSearchTmp.serialize(),
        });
      }

      func();

      return true;
    } else if (message.type === Message.SEARCH_CON) {
      async function func() {
        let query = message.query as string;
        const userId = message.userId as string;

        query = query.replaceAll(' ', '');

        let finalResult = new Set();
        const detailIdxDict = tmpRes?.detailIdxDictTmp;

        const userPackageData = await Storage.getUserPackageData(true);

        if (userPackageData === null) {
          sendResponse({
            res: JSON.stringify([]),
            detailRes: JSON.stringify([]),
          });
          return true;
        }

        if (cachedSearchResult[query] !== undefined) {
          finalResult = new Set(cachedSearchResult[query]);
        } else {
          // console.log(query, '@@');
          let who = '';

          if (query.includes('#')) {
            who = query.split('#')[1].toUpperCase();
            who = who.replaceAll('ㅂ', 'Q').replaceAll('ㅈ', 'W').replaceAll('ㄷ', 'E').replaceAll('ㄱ', 'R');
            who = who.replaceAll('ㅃ', 'Q').replaceAll('ㅉ', 'W').replaceAll('ㄸ', 'E').replaceAll('ㄲ', 'R');

            query = query.split('#')[0];
          }

          // 만약 query가 영어로만 구성되어 있다면
          let queryList = [];

          // console.log(/^[a-zA-Z]+$/.test(query), query ,)
          console.log(/^[a-zA-Z]+$/.test(query), query);
          let koQuery = convertQwertyToHangul(query);

          // console.log(koQuery, '!!');

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
          // console.log(replaceWordData);

          for (let i = 0; i < queryList.length; i++) {
            const query = queryList[i] as string;

            // console.log(query, '!!!');

            for (let key in replaceWordData) {
              if (includesAny(query, [key, ...replaceWordData[key]])) {
                additionalCategoryList.push(key);
              }
            }

            // console.log(additionalCategoryList);

            const result = tmpRes?.conSearchTmp.searchTrie(query);

            // console.log(result);

            let result2 = new Set();
            for (let additionalCategory of additionalCategoryList) {
              result2 = new Set([
                ...Array.from(result2),
                ...Array.from(tmpRes?.conSearchTmp.searchTrie(additionalCategory)),
              ]);
            }
            // const result2 = tmpRes?.conSearchTmp.searchTrie(additionalCategory);

            let result3 = new Set();

            // console.log(storageData['UserConfig'], '!!');
            const userConfig = await Storage.getUserConfig(true);
            if (userConfig?.isChoseongSearch) {
              result3 = tmpRes?.conSearchChoseongTmp.searchTrie(convertDoubleConsonantToSingle(query));
            } else {
            }

            let queryResult = new Set([...Array.from(result), ...Array.from(result2), ...Array.from(result3)]);

            if (who !== '') {
              for (let key of Array.from(queryResult)) {
                let f = false;
                for (let i = 0; i < who.length; i++) {
                  if (detailIdxDict[key as string].who.includes(who[i])) {
                    f = true;
                    break;
                  }
                }
                if (!f) {
                  queryResult.delete(key);
                }
              }
            }

            for (let key of Array.from(queryResult)) {
              const packageIdx = detailIdxDict[key as string].packageIdx;
              const detailData = detailIdxDict[key as string];

              if (detailData.isDoubleCon == true) {
                const firstCon = detailData.firstDoubleCon;
                const secondCon = detailData.secondDoubleCon;

                const firstConPackageIdx = firstCon.packageIdx;
                const secondConPackageIdx = secondCon.packageIdx;

                console.log(firstCon, secondCon, '!!');

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

        // for(let key of Array.from(finalResult)){
        //   if(
        //   }
        // }
        cachedSearchResult[query] = Array.from(finalResult);

        const favoriteConList = await Storage.getFavoriteConList(true);

        // move favorite to top

        let doubleConList = new Set();
        let favoriteList = new Set();
        let otherList = new Set();

        for (let key of Array.from(finalResult)) {
          const detailData = detailIdxDict[key as string];

          if (detailData.isDoubleCon == true) {
            doubleConList.add(key);
          } else {
            const detailIdx = userPackageData[detailData.packageIdx].conList[detailData.sort].detailIdx;

            if (favoriteConList !== null && favoriteConList[detailIdx] !== undefined) {
              favoriteList.add(key);
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

        console.log(finalResult, 'finalResult');

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

      func();
    }
    return true;
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === Message.GET_ID_COOKIE) {
    chrome.cookies.get({ url: 'https://gall.dcinside.com', name: 'mc_enc' }, function (cookie) {
      if (cookie) {
        const userId = cookie.value;
        const hashSHA256 = async (message: string) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(message);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          return hashHex;
        };

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
  } else if (message.type === Message.SYNC_CON_LIST) {
    async function func() {
      const ci_t = message.data.ci_t;

      const oldUserPackageData = await Storage.getUserPackageData(false);

      async function fetchList(page: number) {
        // document.cookie = cookies;
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
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기 후 재시도
              continue;
            }

            return responseText; // 정상 응답 반환
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

        // 500 밀리 초 후에 리턴
        await new Promise(resolve => setTimeout(resolve, 500));
        return data;
      }

      let data = await fetchList(0);

      if (data.bigcon === undefined) {
        sendResponse({ data: {}, error: '로그인이 필요합니다.' });
        return;
      }

      if (data.bigcon.status == 'enabled') {
        const bigConExpire = data.bigcon.expire;
        await Storage.setBigConExpire(bigConExpire);
      }

      const maxPage = data.max_page + 1;
      // const maxPage = 1;

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
    }

    func();
  } else if (message.type === Message.UPDATE_HIDE_STATE) {
    async function func() {
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
    }

    func();
  } else if (message.type === Message.TRIGGER_EVENT) {
    const action = message.action;
    const data = message.data;

    // amplitude.logEvent(action, data);

    // console.log('trigger event', action, data);

    const hashSHA256 = async (message: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    };

    Storage.getUserId(true).then(async (userId: any) => {
      if (userId) {
        const hashedInsertId = (await hashSHA256(`${JSON.stringify(data)}${action}${userId}`)).slice(0, 10);

        Storage.getDeviceId(true).then(async (deviceId: any) => {
          if (deviceId === null || deviceId === undefined) {
            // set new deviceId

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
            // "client_upload_time": now.toString(),
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

        // let trackData = [
        //   {
        //     event: action,
        //     properties: {
        //       ...data,
        //       $browser_version: browserInfo.userAgent,

        //       extensionVersion: process.env['CEB_EXTENSION_VERSION'] as string,
        //       $screen_height: 0,
        //       $screen_width: 0,
        //       mp_lib: 'web',
        //       $lib_version: '2.62.0',
        //       $insert_id: hashedInsertId,
        //       time: new Date().getTime() / 1000,
        //       distinct_id: userId,
        //       $device_id: deviceId,
        //       $initial_referrer: '$direct',
        //       $initial_referring_domain: '$direct',
        //       $user_id: userId,
        //       token: MIXPANEL_KEY,
        //     },
        //   },
        // ];

        // fetch('https://api.mixpanel.com/import', {
        //   method: 'POST',
        //   // mode: "no-cors",
        //   body: JSON.stringify(trackData),

        //   // 인증 정보는 Authorization 헤더를 통해 전달
        //   headers: {
        //     Authorization: 'Basic ' + btoa(MIXPANEL_KEY + ':'),
        //     'Content-Type': 'application/json',
        //     priority: 'u=1, i',
        //     'sec-fetch-dest': 'empty',
        //     'sec-fetch-mode': 'cors',
        //     'sec-fetch-site': 'none',
        //     'sec-fetch-storage-access': 'active',
        //     accept: '*/*',
        //   },
        //   mode: 'cors',
        //   credentials: 'include',
        //   referrerPolicy: 'strict-origin-when-cross-origin',
        // })
        //   .then(response => response.json())
        //   .then(data => console.log('Success:', data))
        //   .catch(error => console.error('Error:', error));

        sendResponse({ data: 'success' });
      }
    });
  }

  return true;
});

function initUserConfigStorage() {
  const storageKey = `UserConfig`;
  Storage.getUserConfig().then((data: any) => {
    // console.log(data);
    if (data) {
    } else {
      Storage.setUserConfig({
        isDarkMode: false,
        isShowRightBottomButton: true,
        isDefaultBigCon: true,
        isChoseongSearch: true,
      });
    }
  });
}

function initReplaceWordDataStorage() {
  const storageKey2 = `ReplaceWordData`;
  Storage.getReplaceWordData().then((data: any) => {
    // console.log(data);
    if (data) {
    } else {
      Storage.setReplaceWordData({
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
      });
    }
  });
}

initUserConfigStorage();
initReplaceWordDataStorage();

// chrome.downloads.onChanged.addListener((downloadDelta) => {
//   if (downloadDelta.state && downloadDelta.state.current === "complete") {
//     console.log("다운로드 완료:", downloadDelta, tabId);
//     // chrome.runtime.sendMessage({ action: "downloadComplete", id: downloadDelta.id });

//     chrome.tabs.remove(tabId);
//   }
// });
