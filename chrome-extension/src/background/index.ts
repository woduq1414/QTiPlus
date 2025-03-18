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
  const emojiSearchTmp = new EmojiSearch();

  let detailIdxDictTmp = {} as any;

  let conInfoData;
  const prevCustomConList: any = await readLocalStorage('CustomConList');
  if (prevCustomConList === null || prevCustomConList === undefined) {
    conInfoData = await loadJSON();
  } else {
    conInfoData = prevCustomConList;
  }

  console.log(conInfoData);

  for (let packageIdx in conInfoData) {
    const conList = conInfoData[packageIdx as keyof typeof conInfoData].conList;
    for (let sort in conList) {
      const con = conList[sort as keyof typeof conList];
      console.log(con.title);

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
      let query = message.query as string;

      query = query.replaceAll(' ', '');
      console.log(query, '@@');
      let who = '';

      if (query.includes('#')) {
        who = query.split('#')[1].toUpperCase();
        query = query.split('#')[0];
      }

      let additionalCategory = '';
      if (query.includes('ㅠ')) {
        additionalCategory = '슬픔';
      } else if (query.includes('ㅋ')) {
        additionalCategory = '웃음';
      } else if (['ㅎㅇ', '하이'].includes(query)) {
        additionalCategory = '안녕';
      } else if (['ㅂㅇ', '잘가'].includes(query)) {
        additionalCategory = '바이';
      } else if (['ㅈㅅ', '죄송'].includes(query)) {
        additionalCategory = '미안';
      } else if (['ㄴㅇㄱ', '헉'].includes(query)) {
        additionalCategory = '놀람';
      } else if (['ㄳ', 'ㄱㅅ'].includes(query)) {
        additionalCategory = '감사';
      } else if (['ㄷㄷ', 'ㅎㄷㄷ', '후덜덜', '두렵', '무섭', '무서', '두려'].includes(query)) {
        additionalCategory = '덜덜';
      } else if (['웃겨'].includes(query)) {
        additionalCategory = '웃음';
      } else if (['울었', '울고', '슬퍼', '슬프'].includes(query)) {
        additionalCategory = '슬픔';
      } else if (['행복', '신나', '기뻐', '신났'].includes(query)) {
        additionalCategory = '신남';
      } else if (['화남', '화났', '화나', '분노'].includes(query)) {
        additionalCategory = '화남';
      } else if (['커여', '커엽', '귀여', '귀엽'].includes(query)) {
        additionalCategory = '커';
      } else if (['섹시', '떽띠'].includes(query)) {
        additionalCategory = '떽';
      } else if (['따봉', '좋'].includes(query)) {
        additionalCategory = '굿';
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

      sendResponse({
        res: JSON.stringify(Array.from(finalResult)),
      });
      return true;
    }
    return true;
  });
});

// chrome.downloads.onChanged.addListener((downloadDelta) => {
//   if (downloadDelta.state && downloadDelta.state.current === "complete") {
//     console.log("다운로드 완료:", downloadDelta, tabId);
//     // chrome.runtime.sendMessage({ action: "downloadComplete", id: downloadDelta.id });

//     chrome.tabs.remove(tabId);
//   }
// });
