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

// 사용 예시

export default EmojiSearch;
