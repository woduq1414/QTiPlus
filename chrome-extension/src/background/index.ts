import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

// import JSZip from 'jszip';
// import saveAs from 'file-saver';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded11');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

let tabId = 0;

class SuffixTrieNode {
  children: Record<string, SuffixTrieNode>;
  emojis: Set<string>;

  constructor() {
    this.children = {};
    this.emojis = new Set();
  }
}

class EmojiSearch {
  private root: SuffixTrieNode;
  private invertedIndex: Record<string, Set<string>>;

  constructor() {
    this.root = new SuffixTrieNode();
    this.invertedIndex = {};
  }

  // 📌 접미사 트라이에 단어 삽입
  private insertSuffixes(word: string, emoji: string): void {
    for (let i = 0; i < word.length; i++) {
      let node = this.root;
      for (const char of word.slice(i)) {
        // 모든 접미사 저장
        if (!node.children[char]) {
          node.children[char] = new SuffixTrieNode();
        }
        node = node.children[char];
        node.emojis.add(emoji);
      }
    }
  }

  // 📌 이모티콘 추가 (접미사 트라이 + 역색인)
  addEmoji(emoji: string, name: string, tags: string[]): void {
    this.insertSuffixes(name, emoji);
    tags.forEach(tag => this.insertSuffixes(tag, emoji));

    // 역색인 저장
    if (!this.invertedIndex[name]) this.invertedIndex[name] = new Set();
    this.invertedIndex[name].add(emoji);

    tags.forEach(tag => {
      if (!this.invertedIndex[tag]) this.invertedIndex[tag] = new Set();
      this.invertedIndex[tag].add(emoji);
    });
  }

  // 📌 접미사 트라이 검색 (부분 문자열 검색 가능)
  searchTrie(substring: string): Set<string> {
    let node = this.root;
    for (const char of substring) {
      if (!node.children[char]) return new Set();
      node = node.children[char];
    }
    return node.emojis;
  }

  // 📌 역색인 검색
  searchIndex(keyword: string): Set<string> {
    return this.invertedIndex[keyword] || new Set();
  }

  // 📌 TrieNode를 JSON으로 변환하는 함수
  private serializeTrie(node: SuffixTrieNode): any {
    return {
      c: Object.fromEntries(Object.entries(node.children).map(([char, child]) => [char, this.serializeTrie(child)])),
      e: Array.from(node.emojis),
    };
  }

  // 📌 JSON을 TrieNode로 변환하는 함수
  private deserializeTrie(data: any): SuffixTrieNode {
    const node = new SuffixTrieNode();
    node.children = Object.fromEntries(
      Object.entries(data.c).map(([char, child]) => [char, this.deserializeTrie(child)]),
    );
    node.emojis = new Set(data.e);
    return node;
  }

  // 📌 전체 SuffixTrie 클래스를 JSON으로 직렬화
  serialize(): string {
    return JSON.stringify({
      trieRoot: this.serializeTrie(this.root),
      // invertedIndex: Object.fromEntries(
      //   Object.entries(this.invertedIndex).map(([key, emojis]) => [key, Array.from(emojis)]),
      // ),
    });
  }

  // 📌 JSON을 SuffixTrie 객체로 역직렬화
  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.root = this.deserializeTrie(data.trieRoot);
    // this.invertedIndex = Object.fromEntries(
    //   Object.entries(data.invertedIndex).map(([key, emojis]) => [key, new Set(emojis as any)]),
    // );
  }
}
const emojiTrie = new EmojiSearch();
emojiTrie.addEmoji('😀', 'happy', ['joy', 'smile']);
emojiTrie.addEmoji('😂', 'laugh', ['funny', 'lol']);
emojiTrie.addEmoji('🥲', 'tears', ['sad', 'cry']);

console.log(emojiTrie.searchTrie('py')); // "happy"에 포함됨 → { "😀" }
console.log(emojiTrie.searchTrie('un')); // "funny"에 포함됨 → { "😂" }
console.log(emojiTrie.searchTrie('ea')); // "tears"에 포함됨 → { "🥲" }
let tmpRes: any = undefined;

const readLocalStorage = async (key: any) => {
  return new Promise((resolve, reject) => {
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
  // const userPackageData = await readLocalStorage('UserPackageData');

  const emojiSearchTmp = new EmojiSearch();

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
  tmpRes = { emojiSearchTmp, detailIdxDictTmp };
  return { emojiSearchTmp, detailIdxDictTmp };
}

conTreeInit().then(res => {
  console.log(res);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.type === 'GET_INIT_DATA') {
      sendResponse({
        detailIdxDict: tmpRes?.detailIdxDictTmp,
        // emojiSearch: tmpRes?.emojiSearchTmp.serialize(),
      }); // JSON으로 변환하여 보냄
      return true;
    } else if (message.type === 'CHANGED_DATA') {
      console.log('CHANGED_DATA!!');
      conTreeInit().then(res2 => {
        console.log(res2, '@@@@@');
        sendResponse({
          detailIdxDict: res2?.detailIdxDictTmp,
          // emojiSearch: res2?.emojiSearchTmp.serialize(),
        });
      });
      return true;
    } else if (message.type === 'SEARCH_CON') {
      async function func() {
        let query = message.query as string;
        const unicroId = message.unicroId as string;

        query = query.replaceAll(' ', '');
        // console.log(query, '@@');
        let who = '';

        if (query.includes('#')) {
          who = query.split('#')[1].toUpperCase();
          query = query.split('#')[0];
        }

        function includesAny(query: string, list: string[]): boolean {
          return list.some(q => query.includes(q));
        }

        let additionalCategory = '';

        if (query.includes('ㅠ')) {
          additionalCategory = '슬픔';
        } else if (query.includes('ㅋ')) {
          additionalCategory = '웃음';
        } else if (includesAny(query, ['ㅎㅇ', '하이'])) {
          additionalCategory = '안녕';
        } else if (includesAny(query, ['ㅂㅇ', '바이'])) {
          additionalCategory = '바이';
        } else if (includesAny(query, ['ㅈㅅ', '죄송'])) {
          additionalCategory = '미안';
        } else if (includesAny(query, ['ㄴㅇㄱ', '헉'])) {
          additionalCategory = '놀람';
        } else if (includesAny(query, ['ㄳ', 'ㄱㅅ'])) {
          additionalCategory = '감사';
        } else if (includesAny(query, ['ㄷㄷ', 'ㅎㄷㄷ', '후덜덜', '두렵', '무섭', '무서', '두려'])) {
          additionalCategory = '덜덜';
        } else if (includesAny(query, ['웃겨'])) {
          additionalCategory = '웃음';
        } else if (includesAny(query, ['울었', '울고', '슬퍼', '슬프'])) {
          additionalCategory = '슬픔';
        } else if (includesAny(query, ['행복', '신나', '기뻐', '신났'])) {
          additionalCategory = '신남';
        } else if (includesAny(query, ['화남', '화났', '화나', '분노'])) {
          additionalCategory = '화남';
        } else if (includesAny(query, ['커여', '커엽', '귀여', '귀엽'])) {
          additionalCategory = '커';
        } else if (includesAny(query, ['섹시', '떽띠'])) {
          additionalCategory = '떽';
        } else if (includesAny(query, ['따봉', '좋'])) {
          additionalCategory = '굿';
        } else if (includesAny(query, ['크아'])) {
          additionalCategory = '크아악';
        } else if (includesAny(query, ['완장'])) {
          additionalCategory = '크아악';
        } else if (includesAny(query, ['춤'])) {
          additionalCategory = '댄스';
        }

        const detailIdxDict = tmpRes?.detailIdxDictTmp;

        const result = tmpRes?.emojiSearchTmp.searchTrie(query);

        const result2 = tmpRes?.emojiSearchTmp.searchTrie(additionalCategory);

        const finalResult = new Set([...Array.from(result), ...Array.from(result2)]);

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
        console.log(finalResult, 'finalResult');

        const userPackageData = (await readLocalStorage(`UserPackageData_${unicroId}`)) as any;

        if (userPackageData === null) {
          sendResponse({
            res: JSON.stringify([]),
          });
          return true;
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

        // for(let key of Array.from(finalResult)){
        //   if(
        //   }
        // }

        if (finalResult.size >= 20 && query.length == 1) {
          sendResponse({
            res: JSON.stringify(Array.from(finalResult).slice(0, 20)),
          });
          return true;
        } else {
          sendResponse({
            res: JSON.stringify(Array.from(finalResult)),
          });
          return true;
        }
      }

      func();
    }
    return true;
  });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type == 'SYNC_CON_LIST') {
    const unicroId = message.data.unicroId;
    const ci_t = message.data.ci_t;

    const storageKey = `UserPackageData_${unicroId}`;

    const oldUserPackageData = (await chrome.storage.local.get([storageKey]))[storageKey];

    console.log(oldUserPackageData, 'oldUserPackageData');

    async function func() {
      async function fetchList(page: number) {
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
          credentials: 'include',
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
          if (oldUserPackageData[packageIdx] !== undefined) {
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

      chrome.storage.local.set({ [storageKey]: allResult }, async function () {
        console.log('Value is set to ', allResult);

        // refresh page

        // setUserPackageData(allResult);

        // makeToast('동기화 성공!');

        sendResponse({ data: allResult });
      });
    }

    await func();
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
    const unicroId = message.data.unicroId;
    const hideState = message.data.hideState;

    const storageKey = `UserPackageData_${unicroId}`;

    let oldUserPackageData = (await chrome.storage.local.get([storageKey]))[storageKey];

    console.log(oldUserPackageData, 'oldUserPackageData');

    for (let packageIdx in oldUserPackageData) {
      oldUserPackageData[packageIdx].isHide = hideState[packageIdx];
    }

    chrome.storage.local.set({ [storageKey]: oldUserPackageData }, async function () {
      console.log('Value is set to ', oldUserPackageData);

      sendResponse({ data: oldUserPackageData });
    });
  }

  return true;
});

// chrome.downloads.onChanged.addListener((downloadDelta) => {
//   if (downloadDelta.state && downloadDelta.state.current === "complete") {
//     console.log("다운로드 완료:", downloadDelta, tabId);
//     // chrome.runtime.sendMessage({ action: "downloadComplete", id: downloadDelta.id });

//     chrome.tabs.remove(tabId);
//   }
// });
