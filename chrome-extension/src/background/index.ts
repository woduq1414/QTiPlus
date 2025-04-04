import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import Storage from '@extension/shared/lib/storage';

import ConSearch from './ConSearch';

import * as amplitude from '@amplitude/analytics-browser';

// console.log(process.env['CEB_EXAMPLE'], 'ceb_example');
// console.log(process.env["CEB_GA_MEASUREMENT_ID"], "ceb_ga_measurement_id");

import { convertQwertyToHangul } from 'es-hangul';
// import mixpanel from "mixpanel-browser";
// import { track } from 'mixpanel-browser';
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'crypto';

const userAgent = navigator.userAgent as any;

const os = (() => {
  if (userAgent.indexOf('Windows') !== -1) return 'Windows';
  if (userAgent.indexOf('Mac OS X') !== -1) return 'macOS';
  if (userAgent.indexOf('Linux') !== -1) return 'Linux';
  if (userAgent.indexOf('X11') !== -1) return 'Unix';
  if (userAgent.indexOf('Android') !== -1) return 'Android';
  if (userAgent.indexOf('iPhone') !== -1) return 'iPhone';
  if (userAgent.indexOf('iPad') !== -1) return 'iPad';
  return 'Unknown OS';
})();

const browser = (() => {
  if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
  if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
  if (userAgent.indexOf('Safari') !== -1) return 'Safari';
  if (userAgent.indexOf('Opera') !== -1) return 'Opera';
  if (userAgent.indexOf('Edg') !== -1) return 'Edge';
  return 'Unknown Browser';
})();

const browserVersion = (() => {
  const match = userAgent.match(/(Chrome|Firefox|Safari|Opera|Edg)[\/\s](\d+)/);
  return match ? match[2] : 'Unknown Version';
})();

// 브라우저 정보와 OS 정보 추출
const browserInfo = {
  userAgent,
  os,
  browser,
  browserVersion,
};

console.log(browserInfo, 'info');
console.log(process.env['CEB_EXTENSION_VERSION'], 'version');

// const MIXPANEL_KEY = process.env['CEB_MIXPANEL_KEY'] as string;

const AMPLITUDE_KEY = process.env['CEB_AMPLITUDE_KEY'] as string;

let storageData: any = {};
let cachedSearchResult: any = {};

// Storage 클래스의 메서드를 직접 사용하도록 수정
// const readLocalStorage = async (key: string, isUseCache: boolean = true) => {
//   // 키에 따라 적절한 Storage 메서드 호출
//   switch (key) {
//     case 'UserId':
//       return await Storage.getUserId(isUseCache);
//     case 'DeviceId':
//       return await Storage.getDeviceId(isUseCache);
//     case 'UserConfig':
//       return await Storage.getUserConfig(isUseCache);
//     case 'ReplaceWordData':
//       return await Storage.getReplaceWordData(isUseCache);
//     case 'CustomConList':
//       return await Storage.getCustomConList(isUseCache);
//     default:
//       if (key.startsWith('UserPackageData_')) {
//         return await Storage.getUserPackageData(isUseCache);
//       } else if (key.startsWith('FavoriteConList_')) {
//         return await Storage.getFavoriteConList(isUseCache);
//       } else if (key.startsWith('BigConExpire_')) {
//         return await Storage.getBigConExpire(isUseCache);
//       } else {
//         // 기본적인 경우 - 직접 chrome.storage API 사용
//         return new Promise((resolve) => {
//           chrome.storage.local.get([key], function (result) {
//             if (result[key] === undefined) {
//               resolve(null);
//             } else {
//               resolve(result[key]);
//             }
//           });
//         });
//       }
//   }
// };

console.log('Background loaded');
// console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

function removeSpecialChar(str: string) {
  return str;
  // return str.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎ]/g, '').toUpperCase();
}

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
  } as any;

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
  ];

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
  } as any;

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

// init storageData from local storage

// chrome.storage.local.get(null, function (items) {
//   storageData = items;
//   // console.log(storageData);
// });

// chrome.storage.onChanged.addListener(function (changes, areaName) {
//   if (areaName === 'local' && changes) {
//     // myKey의 값이 변경되었을 때 myVariable 업데이트

//     for (let key in changes) {
//       const storageChange = changes[key];
//       if (
//         key.startsWith('CustomConList') ||
//         key.startsWith('UserPackageData') ||
//         key === 'UserConfig' ||
//         key === 'ReplaceWordData'
//       ) {
//         cachedSearchResult = {};
//       }

//       console.log(key, storageChange.newValue, changes, areaName);

//       try {
//         storageData[key] = JSON.parse(JSON.stringify(storageChange.newValue));
//       } catch (e) {
//         // storageData[key] = storageChange.newValue;
//       }

//       // console.log(storageChange);
//     }
//   }
// });

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
  const prevCustomConList: any = await Storage.getCustomConList(false);
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
  // const userPackageData = await readLocalStorage('UserPackageData');

  // sleep 3s
  // await new Promise(resolve => setTimeout(resolve, 3000));

  const conSearchTmp = new ConSearch();

  const conSearchChoseongTmp = new ConSearch();

  let detailIdxDictTmp = {} as any;

  const conInfoData = await getConInfoData();

  console.log(conInfoData);

  for (let packageIdx in conInfoData) {
    if (packageIdx === 'doubleConPreset') {
      continue;
    } else {
      const conList = conInfoData[packageIdx as keyof typeof conInfoData].conList;
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
  }

  if (conInfoData['doubleConPreset'] !== undefined) {
    const doubleConPresetList = conInfoData['doubleConPreset'];

    for (let i = 0; i < doubleConPresetList.length; i++) {
      let firstConInfo = doubleConPresetList[i].firstDoubleCon;
      let secondConInfo = doubleConPresetList[i].secondDoubleCon;

      let firstConKey = firstConInfo.packageIdx + '-' + firstConInfo.sort;
      let secondConKey = secondConInfo.packageIdx + '-' + secondConInfo.sort;

      const firstCon = conInfoData[firstConInfo.packageIdx]?.conList?.[firstConInfo.sort];
      const secondCon = conInfoData[secondConInfo.packageIdx]?.conList?.[secondConInfo.sort];

      if (firstCon === undefined || secondCon === undefined) {
        // console.log('firstCon or secondCon is undefined');
        continue;
      }

      conSearchTmp.addCon(doubleConPresetList[i].presetKey, '', doubleConPresetList[i].tag.split(' '));

      conSearchChoseongTmp.addCon(
        doubleConPresetList[i].presetKey,
        '',
        doubleConPresetList[i].tag.split(' ').map((tag: string) => convertKoreanCharToChoseong(tag)),
      );

      detailIdxDictTmp[doubleConPresetList[i].presetKey] = {
        isDoubleCon: true,
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
        tag: doubleConPresetList[i].tag,
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
    if (message.type === 'GET_INIT_DATA') {
      getConInfoData();
      initUserConfigStorage();
      initReplaceWordDataStorage();

      sendResponse({
        detailIdxDict: tmpRes?.detailIdxDictTmp,
        // conSearch: tmpRes?.conSearchTmp.serialize(),
      }); // JSON으로 변환하여 보냄
      return true;
    } else if (message.type === 'CHANGED_DATA') {
      async function func() {
        const res2 = await conTreeInit();

        sendResponse({
          detailIdxDict: res2?.detailIdxDictTmp,
          // conSearch: res2?.conSearchTmp.serialize(),
        });
      }

      func();

      return true;
    } else if (message.type === 'SEARCH_CON') {
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

            console.log(result);

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

        finalResult = new Set([...Array.from(doubleConList), ...Array.from(favoriteList), ...Array.from(otherList)]);

        console.log(finalResult, 'finalResult');

        sendResponse({
          res: JSON.stringify(Array.from(finalResult)),
          detailRes: JSON.stringify(
            Array.from(finalResult).map((key: any) => {
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
  if (message.type === 'GET_ID_COOKIE') {
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

          sendResponse({ userId: hashedUserId });
        });
      } else {
        sendResponse({ userId: null });
      }
    });

    return true;
  } else if (message.type == 'SYNC_CON_LIST') {
    async function func() {
      const userId = message.data.userId;
      const ci_t = message.data.ci_t;

      const storageKey = `UserPackageData_${userId}`;

      const oldUserPackageData = await Storage.getUserPackageData(true);

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

          if (oldUserPackageData !== undefined && oldUserPackageData[packageIdx] !== undefined) {
            if (oldUserPackageData[packageIdx].isHide) {
              isHide = true;
            }
          }

          let packageResult: {
            packageIdx: number;
            conList: { [key: string]: any };
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

        // readLocalStorage('CustomConList').then((customConList: any) => {
        //   if (customConList) {
        //     for(let packageIdx in result){
        //       console.log(packageIdx);
        //       // if (customConList[packageIdx] === undefined) {
        //       //   customConList[packageIdx] = {
        //       //     conList: result[packageIdx]["conList"].reduce((acc: any, cur: any) => {
        //       //       acc[cur.sort] = {

        //       //         title: cur.title,
        //       //         imgPath: cur.list_img,
        //       //         who: [],
        //       //         tag: "",

        //       //       };
        //       //       return acc;
        //       //     }, {}),
        //       //     title: item.title,
        //       //     packageIdx: packageIdx,
        //       //   };

        //       //   console.log(customConList);
        //       // };
        //     }

        //   }
        // });

        return result;
      }

      let allResult = {} as any;

      for (let i = 0; i < maxPage; i++) {
        if (i === 0) {
          Object.assign(allResult, await processData(data));
        } else {
          data = await fetchList(i);
          Object.assign(allResult, await processData(data));
        }
      }

      await Storage.setUserPackageData(allResult);

      sendResponse({ data: allResult });
    }

    func();
    // fetch("https://gall.dcinside.com/dccon/lists", {
    //   "headers": {
    //     "accept": "*/*", "accept-language": "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6",
    //     "cache-control": "no-cache", "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "pragma": "no-cache",
    //     "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"", "sec-ch-ua-mobile": "?0",
    //     "sec-ch-ua-platform": "\"Windows\"", "sec-fetch-dest": "empty", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin", "x-requested-with": "XMLHttpRequest"
    //   },
    //   "referrer": "https://gall.dcinside.com/mgallery/board/view/?id=qwer_fan",
    //   "referrerPolicy": "unsafe-url",
    //   "body": "ci_t=8cf266840e18664a8ce9eb37750d0e65&target=icon&page=1", "method": "POST", "mode": "cors", "credentials": "include"
    // }).then(response => response.json()).then(data => {
    //   console.log(data);

    //   sendResponse({ data });
    // }
    // );
  } else if (message.type == 'UPDATE_HIDE_STATE') {
    async function func() {
      const userId = message.data.userId;
      const hideState = message.data.hideState;

      const storageKey = `UserPackageData_${userId}`;

      let oldUserPackageData = await Storage.getUserPackageData(true);

      for (let packageIdx in oldUserPackageData) {
        oldUserPackageData[packageIdx].isHide = hideState[packageIdx];
      }

      await Storage.setUserPackageData(oldUserPackageData);
      sendResponse({ data: oldUserPackageData });
    }

    func();
  } else if (message.type == 'TRIGGER_EVENT') {
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
