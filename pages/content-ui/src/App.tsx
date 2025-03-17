import { useEffect, useState, useRef } from 'react';
import { ToggleButton } from '@extension/ui';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';

import conInfoData from '../public/data.json';
import SearchPage from './components/SearchPage';
import ConListPage from './components/ConListPage';
import useGlobalStore from './store/globalStore';
import parseCookies from './functions/cookies';
import readLocalStorage from './functions/storage';
import ConInfoEditPage from './components/ConInfoEditPage';

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
}

// 사용 예시

const emojiSearch = new EmojiSearch();

let detailIdxDict = {} as any;

console.log(conInfoData);

for (let packageIdx in conInfoData) {
  const conList = conInfoData[packageIdx as keyof typeof conInfoData].conList;
  for (let sort in conList) {
    const con = conList[sort as keyof typeof conList];
    console.log(con.title);

    const key = packageIdx + '-' + sort;
    emojiSearch.addEmoji(key, con.title, [con.title]);

    detailIdxDict[key] = {
      // detailIdx: con.detailIdx,
      title: con.title,
      packageIdx: packageIdx,
      sort: sort,
      imgPath: con.imgPath,
    };
  }
}

export default function App() {
  useEffect(() => {
    console.log('content ui loaded');
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(true);

  const { currentPage, setUnicroId, setUserPackageData, currentPackageIdx, setCurrentPage } = useGlobalStore();

  useEffect(() => {
    const cookies = parseCookies();

    const unicroId = cookies['unicro_id'];
    console.log(unicroId);

    setUnicroId(unicroId);
    const storageKey = `UserPackageData_${unicroId}`;
    readLocalStorage(storageKey).then(data => {
      console.log(data);
      setUserPackageData(data);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: { altKey: any; key: string; preventDefault: () => void }) => {
      if (event.altKey && event.key === 'q') {
        event.preventDefault(); // 기본 동작 방지
        setIsModalOpen(isModalOpen => !isModalOpen);
        setCurrentPage(0);
        console.log('alt + q');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  return (
    <div
      className={`z-[999999999]
      ${isModalOpen ? 'unset' : 'hidden'}
    `}>
      {currentPage === 0 ? (
        <SearchPage emojiSearch={emojiSearch} detailIdxDict={detailIdxDict} />
      ) : currentPage === 1 ? (
        <ConListPage emojiSearch={emojiSearch} detailIdxDict={detailIdxDict} />
      ) : currentPage === 2 ? (
        <ConInfoEditPage packageIdx={currentPackageIdx} />
      ) : null}
    </div>
  );
}
