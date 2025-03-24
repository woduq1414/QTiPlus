import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

import EmojiSearch from './EmojiSearch';
import { Analytics } from '@extension/shared';

import * as amplitude from '@amplitude/analytics-browser';
// console.log(process.env['CEB_EXAMPLE'], 'ceb_example');
// console.log(process.env["CEB_GA_MEASUREMENT_ID"], "ceb_ga_measurement_id");

let storageData: any = {};
const readLocalStorage = async (key: any) => {
  return new Promise((resolve, reject) => {
    if (storageData[key] !== undefined) {
      // console.log("cached")
      resolve(storageData[key]);
      return;
    }

    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        // reject();
        resolve(null);
      } else {
        resolve(result[key]);
      }
    });
  });
};

amplitude.init(process.env['CEB_AMPLITUDE_KEY'] as string, { autocapture: true });

amplitude.setGroup('version', '1.0.0');

readLocalStorage('UnicroId').then((data: any) => {
  if (data) {
    amplitude.setUserId(data);
  }
});

// register user id

// get cookie

// const cookies = parseCookies();

// amplitude.setUserId('test-user-id');

// let GA = new Analytics();

// addEventListener('unhandledrejection', async (event) => {
//   GA.fireErrorEvent(event.reason);
// });

// chrome.runtime.onInstalled.addListener(() => {
//   GA.fireEvent('install');
// });

// // Throw an exception after a timeout to trigger an exception analytics event
// setTimeout(throwAnException, 2000);

// async function throwAnException() {
//   throw new Error("👋 I'm an error");
// }

// import JSZip from 'jszip';
// import saveAs from 'file-saver';

console.log('Background loaded');
// console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

let tabId = 0;
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
  console.log(result);
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

chrome.storage.local.get(null, function (items) {
  storageData = items;
  // console.log(storageData);
});

let cachedSearchResult: any = {};

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'local' && changes) {
    // myKey의 값이 변경되었을 때 myVariable 업데이트

    for (let key in changes) {
      const storageChange = changes[key];
      if (
        key.startsWith('CustomConList') ||
        key.startsWith('UserPackageData') ||
        key === 'UserConfig' ||
        key === 'ReplaceWordData'
      ) {
        cachedSearchResult = {};
      }

      if (key === 'UnicroId') {
        amplitude.setUserId(storageChange.newValue);
      }

      storageData[key] = JSON.parse(JSON.stringify(storageChange.newValue));

      // console.log(storageChange);
    }
  }
});

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

async function conTreeInit() {
  const startT = performance.now();
  // const userPackageData = await readLocalStorage('UserPackageData');

  // sleep 3s
  // await new Promise(resolve => setTimeout(resolve, 3000));

  const emojiSearchTmp = new EmojiSearch();

  const emojiSearchChoseongTmp = new EmojiSearch();

  let detailIdxDictTmp = {} as any;

  let conInfoData: { [x: string]: { conList: any } };
  const prevCustomConList: any = await readLocalStorage('CustomConList');
  if (prevCustomConList === null || prevCustomConList === undefined) {
    conInfoData = await loadJSON();

    const storageKey = 'CustomConList';
    chrome.storage.local.set({ [storageKey]: conInfoData }, async function () {
      console.log('Value is set to ', conInfoData);
    });
  } else {
    conInfoData = prevCustomConList;
  }

  console.log(conInfoData);

  for (let packageIdx in conInfoData) {
    const conList = conInfoData[packageIdx as keyof typeof conInfoData].conList;
    for (let sort in conList) {
      const con = conList[sort as keyof typeof conList];
      // console.log(con.title);

      const key = packageIdx + '-' + sort;

      emojiSearchTmp.addEmoji(key, con.title, con.tag.split(' '));

      emojiSearchChoseongTmp.addEmoji(
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
  tmpRes = { emojiSearchTmp, emojiSearchChoseongTmp, detailIdxDictTmp };

  const endT = performance.now();

  console.log('Execution time: ~', endT - startT, 'ms');

  return { emojiSearchTmp, emojiSearchChoseongTmp, detailIdxDictTmp };
}

conTreeInit().then(res => {
  console.log(res);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_INIT_DATA') {
      sendResponse({
        detailIdxDict: tmpRes?.detailIdxDictTmp,
        // emojiSearch: tmpRes?.emojiSearchTmp.serialize(),
      }); // JSON으로 변환하여 보냄
      return true;
    } else if (message.type === 'CHANGED_DATA') {
      async function func() {
        const res2 = await conTreeInit();

        sendResponse({
          detailIdxDict: res2?.detailIdxDictTmp,
          // emojiSearch: res2?.emojiSearchTmp.serialize(),
        });
      }

      func();

      return true;
    } else if (message.type === 'SEARCH_CON') {
      async function func() {
        let query = message.query as string;
        const unicroId = message.unicroId as string;

        query = query.replaceAll(' ', '');

        let finalResult = new Set();
        const detailIdxDict = tmpRes?.detailIdxDictTmp;

        const userPackageData = (await readLocalStorage(`UserPackageData_${unicroId}`)) as any;

        if (userPackageData === null) {
          sendResponse({
            res: JSON.stringify([]),
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
            query = query.split('#')[0];
          }
          query = removeSpecialChar(query);

          function includesAny(query: string, list: string[]): boolean {
            return list.some(q => query.includes(q));
          }
          let additionalCategoryList = [];

          let replaceWordData = (await readLocalStorage('ReplaceWordData')) as any;

          if (replaceWordData === null) {
            replaceWordData = {
              웃음: ['ㅋㅋ'],
              슬픔: ['ㅠ'],
              하이: ['ㅎㅇ', '안녕'],
              바이: ['잘가'],
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
            };
          }
          // console.log(replaceWordData);

          for (let key in replaceWordData) {
            if (includesAny(query, [key, ...replaceWordData[key]])) {
              additionalCategoryList.push(key);
            }
          }

          // console.log(additionalCategoryList);

          const result = tmpRes?.emojiSearchTmp.searchTrie(query);

          let result2 = new Set();
          for (let additionalCategory of additionalCategoryList) {
            result2 = new Set([
              ...Array.from(result2),
              ...Array.from(tmpRes?.emojiSearchTmp.searchTrie(additionalCategory)),
            ]);
          }
          // const result2 = tmpRes?.emojiSearchTmp.searchTrie(additionalCategory);

          let result3 = new Set();

          // console.log(storageData['UserConfig'], '!!');
          if (storageData['UserConfig']?.isChoseongSearch) {
            result3 = tmpRes?.emojiSearchChoseongTmp.searchTrie(convertDoubleConsonantToSingle(query));
          } else {
          }

          finalResult = new Set([...Array.from(result), ...Array.from(result2), ...Array.from(result3)]);

          if (who !== '') {
            for (let key of Array.from(finalResult)) {
              let f = false;
              for (let i = 0; i < who.length; i++) {
                if (detailIdxDict[key as string].who.includes(who[i])) {
                  f = true;
                  break;
                }
              }
              if (!f) {
                finalResult.delete(key);
              }
            }
          }
          for (let key of Array.from(finalResult)) {
            const packageIdx = detailIdxDict[key as string].packageIdx;

            if (userPackageData[packageIdx] === undefined) {
              finalResult.delete(key);
            } else {
              if (userPackageData[packageIdx].isHide) {
                finalResult.delete(key);
              }
            }
          }
        }

        // for(let key of Array.from(finalResult)){
        //   if(
        //   }
        // }
        cachedSearchResult[query] = Array.from(finalResult);

        const favoriteConList = (await readLocalStorage(`FavoriteConList_${unicroId}`)) as any;

        // move favorite to top

        let favoriteList = new Set();
        let otherList = new Set();

        for (let key of Array.from(finalResult)) {
          const detailData = detailIdxDict[key as string];

          const detailIdx = userPackageData[detailData.packageIdx].conList[detailData.sort].detailIdx;

          if (favoriteConList !== null && favoriteConList[detailIdx] !== undefined) {
            favoriteList.add(key);
          } else {
            otherList.add(key);
          }
        }

        finalResult.clear();

        finalResult = new Set([...Array.from(favoriteList), ...Array.from(otherList)]);

        sendResponse({
          res: JSON.stringify(Array.from(finalResult)),
        });
        return true;
      }

      func();
    }
    return true;
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'SYNC_CON_LIST') {
    async function func() {
      const unicroId = message.data.unicroId;
      const ci_t = message.data.ci_t;

      const storageKey = `UserPackageData_${unicroId}`;

      const oldUserPackageData = (await chrome.storage.local.get([storageKey]))[storageKey];

      async function fetchList(page: number) {
        // document.cookie = cookies;
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
          body: `ci_t=${ci_t}&target=icon&page=${page}`,
          method: 'POST',
          mode: 'cors',
          credentials: 'same-origin',
          // credentials: 'include',
        });
        const data = await response.json();

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
        chrome.storage.local.set({ ['BigConExpire_' + unicroId]: bigConExpire }, async function () {
          // console.log('Value is set to ', {});
        });
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

      chrome.storage.local.set({ [storageKey]: allResult }, async function () {
        // console.log('Value is set to ', allResult);

        // refresh page

        // setUserPackageData(allResult);

        // makeToast('동기화 성공!');

        sendResponse({ data: allResult });
      });
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
      const unicroId = message.data.unicroId;
      const hideState = message.data.hideState;

      const storageKey = `UserPackageData_${unicroId}`;

      let oldUserPackageData = (await chrome.storage.local.get([storageKey]))[storageKey];

      for (let packageIdx in oldUserPackageData) {
        oldUserPackageData[packageIdx].isHide = hideState[packageIdx];
      }

      chrome.storage.local.set({ [storageKey]: oldUserPackageData }, async function () {
        sendResponse({ data: oldUserPackageData });
      });
    }

    func();
  } else if (message.type == 'TRIGGER_EVENT') {
    const action = message.action;
    const data = message.data;
    // GA.fireEvent(action, data);

    amplitude.logEvent(action, data);

    sendResponse({ data: 'success' });
  }

  return true;
});

const storageKey = `UserConfig`;
readLocalStorage(storageKey).then((data: any) => {
  // console.log(data);
  if (data) {
  } else {
    chrome.storage.local.set({
      UserConfig: {
        isDarkMode: false,
        isShowRightBottomButton: true,
        isDefaultBigCon: true,
        isChoseongSearch: true,
      },
    });
  }
});

const storageKey2 = `ReplaceWordData`;
readLocalStorage(storageKey2).then((data: any) => {
  // console.log(data);
  if (data) {
  } else {
    chrome.storage.local.set({
      ReplaceWordData: {
        웃음: ['ㅋㅋ'],
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
      },
    });
  }
});

// chrome.downloads.onChanged.addListener((downloadDelta) => {
//   if (downloadDelta.state && downloadDelta.state.current === "complete") {
//     console.log("다운로드 완료:", downloadDelta, tabId);
//     // chrome.runtime.sendMessage({ action: "downloadComplete", id: downloadDelta.id });

//     chrome.tabs.remove(tabId);
//   }
// });
