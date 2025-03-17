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

class TrieNode {
  children: Record<string, TrieNode>;
  emojis: Set<string>;

  constructor() {
    this.children = {};
    this.emojis = new Set();
  }
}

class EmojiSearch {
  private trieRoot: TrieNode;
  private invertedIndex: Record<string, Set<string>>;

  constructor() {
    this.trieRoot = new TrieNode();
    this.invertedIndex = {};
  }

  // Trie에 단어 삽입
  private insertToTrie(word: string, emoji: any): void {
    let node = this.trieRoot;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      node.emojis.add(emoji);
    }
  }

  // 이모티콘 추가 (트라이 + 역색인)
  addEmoji(emoji: any, name: string, tags: string[]): void {
    // Trie에 이름과 태그 삽입
    this.insertToTrie(name, emoji);
    tags.forEach(tag => this.insertToTrie(tag, emoji));

    // 역색인 저장
    if (!this.invertedIndex[name]) this.invertedIndex[name] = new Set();
    this.invertedIndex[name].add(emoji);

    tags.forEach(tag => {
      if (!this.invertedIndex[tag]) this.invertedIndex[tag] = new Set();
      this.invertedIndex[tag].add(emoji);
    });
  }

  // Trie에서 자동완성 검색
  searchTrie(prefix: string): Set<string> {
    let node = this.trieRoot;
    for (const char of prefix) {
      if (!node.children[char]) return new Set();
      node = node.children[char];
    }
    return node.emojis;
  }

  // 역색인 검색
  searchIndex(keyword: string): Set<string> {
    return this.invertedIndex[keyword] || new Set();
  }

  // 📌 TrieNode를 JSON으로 변환하는 함수
  private serializeTrie(node: TrieNode): any {
    return {
      children: Object.fromEntries(
        Object.entries(node.children).map(([char, child]) => [char, this.serializeTrie(child)]),
      ),
      emojis: Array.from(node.emojis), // Set을 배열로 변환
    };
  }

  // 📌 JSON을 TrieNode로 변환하는 함수
  private deserializeTrie(data: any): TrieNode {
    const node = new TrieNode();
    node.children = Object.fromEntries(
      Object.entries(data.children).map(([char, child]) => [char, this.deserializeTrie(child)]),
    );
    node.emojis = new Set(data.emojis); // 배열을 Set으로 변환
    return node;
  }

  // 📌 전체 EmojiSearch 클래스를 JSON으로 직렬화
  serialize(): string {
    return JSON.stringify({
      trieRoot: this.serializeTrie(this.trieRoot),
      invertedIndex: Object.fromEntries(
        Object.entries(this.invertedIndex).map(([key, emojis]) => [key, Array.from(emojis)]),
      ),
    });
  }

  // 📌 JSON을 EmojiSearch 객체로 역직렬화
  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.trieRoot = this.deserializeTrie(data.trieRoot);
    this.invertedIndex = Object.fromEntries(
      Object.entries(data.invertedIndex).map(([key, emojis]) => [key, new Set(emojis as any)]),
    );
  }
}

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
      emojiSearchTmp.addEmoji(key, con.title, [con.title]);

      detailIdxDictTmp[key] = {
        // detailIdx: con.detailIdx,
        title: con.title,
        packageIdx: packageIdx,
        sort: sort,
        imgPath: con.imgPath,
      };
    }
  }

  return { emojiSearchTmp, detailIdxDictTmp };
}

conTreeInit().then(res => {
  console.log(res);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.type === 'GET_INIT_DATA') {
      sendResponse({
        detailIdxDict: res?.detailIdxDictTmp,
        emojiSearch: res?.emojiSearchTmp.serialize(),
      }); // JSON으로 변환하여 보냄
      return true;
    } else if (message.type === 'CHANGED_DATA') {
      console.log('CHANGED_DATA!!');
      conTreeInit().then(res2 => {
        console.log(res2, '@@@@@');
        sendResponse({
          detailIdxDict: res2?.detailIdxDictTmp,
          emojiSearch: res2?.emojiSearchTmp.serialize(),
        });
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
