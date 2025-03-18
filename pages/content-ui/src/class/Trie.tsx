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
      children: Object.fromEntries(
        Object.entries(node.children).map(([char, child]) => [char, this.serializeTrie(child)]),
      ),
      emojis: Array.from(node.emojis),
    };
  }

  // 📌 JSON을 TrieNode로 변환하는 함수
  private deserializeTrie(data: any): SuffixTrieNode {
    const node = new SuffixTrieNode();
    node.children = Object.fromEntries(
      Object.entries(data.children).map(([char, child]) => [char, this.deserializeTrie(child)]),
    );
    node.emojis = new Set(data.emojis);
    return node;
  }

  // 📌 전체 SuffixTrie 클래스를 JSON으로 직렬화
  serialize(): string {
    return JSON.stringify({
      trieRoot: this.serializeTrie(this.root),
      invertedIndex: Object.fromEntries(
        Object.entries(this.invertedIndex).map(([key, emojis]) => [key, Array.from(emojis)]),
      ),
    });
  }

  // 📌 JSON을 SuffixTrie 객체로 역직렬화
  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.root = this.deserializeTrie(data.trieRoot);
    this.invertedIndex = Object.fromEntries(
      Object.entries(data.invertedIndex).map(([key, emojis]) => [key, new Set(emojis as any)]),
    );
  }
}

// 사용 예시

export default EmojiSearch;
