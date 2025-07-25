import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import { convertDoubleConsonantToSingle, convertKoreanCharToChoseong } from './utils/korean';
import { hashSHA256 } from './utils/hash';
import { DEFAULT_USER_CONFIG, DEFAULT_REPLACE_WORD_DATA } from './constants/storage';
import ConSearch from './ConSearch';
import { convertQwertyToHangul } from 'es-hangul';

import { unserialize } from 'php-serialize';

import { v4 as uuidv4 } from 'uuid';

import { ConLabelList, CustomConList, DoubleConPreset } from '@extension/shared/lib/models/CustomConList';
import { DetailData, DetailDataSingle, DetailDataDouble } from '@extension/shared/lib/models/DetailData';
import { UserPackageConData } from '@extension/shared/lib/models/UserPackageData';
import { FavoriteConList } from '@extension/shared/lib/models/FavoriteConList';
import { BaseSortMethod } from '@extension/shared/lib/models/UserConfig';

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

    // '#' 또는 '/' 기호로 멤버 검색 지원
    if (query.includes('#') || query.includes('/')) {
      const separator = query.includes('#') ? '#' : '/';
      who = query.split(separator)[1].toUpperCase();
      who = who.replaceAll('ㅂ', 'Q').replaceAll('ㅈ', 'W').replaceAll('ㄷ', 'E').replaceAll('ㄱ', 'R');
      who = who.replaceAll('ㅃ', 'Q').replaceAll('ㅉ', 'W').replaceAll('ㄸ', 'E').replaceAll('ㄲ', 'R');

      query = query.split(separator)[0];
    }

    let queryList = [];

    // 검색어가 빈 문자열인 경우 (예: "#r"로 검색했을 때)
    if (query === '') {
      queryList = [''];
    } else {
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

      let queryResult = new Set();

      // 검색어가 빈 문자열인 경우 모든 콘을 대상으로 함
      if (query === '') {
        queryResult = new Set(Object.keys(detailIdxDict));
      } else {
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

        queryResult = new Set([...Array.from(result), ...Array.from(result2), ...Array.from(result3)]);
      }

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

  // 사용자 설정에 따른 정렬 적용
  const userConfig = await Storage.getUserConfig(true);
  const isRecentUsedFirst = userConfig?.isRecentUsedFirst ?? true;
  const baseSortMethod = userConfig?.baseSortMethod ?? BaseSortMethod.NEWEST_FIRST;

  // 정렬 함수 정의
  const applySorting = async (list: string[], useRecentUsed: boolean, baseMethod: BaseSortMethod): Promise<string[]> => {
    const array = Array.from(list) as string[];
    
    if (useRecentUsed) {
      // 최근 사용 우선 정렬
      const recentUsedConList = await Storage.getRecentUsedConList(true) || [];
      const recentUsedDoubleConList = await Storage.getRecentUsedDoubleConList(true) || [];

      // 최근 사용된 콘과 그렇지 않은 콘으로 분리
      const recentUsedKeys: string[] = [];
      const notRecentUsedKeys: string[] = [];
      
      array.forEach(key => {
        const detail = detailIdxDict[key];
        if (!detail) {
          notRecentUsedKeys.push(key);
          return;
        }
        
        let isRecentUsed = false;
        
        if (detail.isDoubleCon) {
          // 더블콘의 경우 더블콘 리스트에서 찾기
          const doubleData = detail as DetailDataDouble;
          for (let i = recentUsedDoubleConList.length - 1; i >= 0; i--) {
            const recent = recentUsedDoubleConList[i];
            if (recent.firstDoubleCon?.packageIdx === doubleData.firstDoubleCon?.packageIdx &&
                recent.firstDoubleCon?.sort === doubleData.firstDoubleCon?.sort &&
                recent.secondDoubleCon?.packageIdx === doubleData.secondDoubleCon?.packageIdx &&
                recent.secondDoubleCon?.sort === doubleData.secondDoubleCon?.sort) {
              isRecentUsed = true;
              break;
            }
          }
        } else {
          // 단일콘의 경우 단일콘 리스트에서 찾기
          const singleData = detail as DetailDataSingle;
          const detailIdx = userPackageData[singleData.packageIdx]?.conList?.[singleData.sort]?.detailIdx;
          if (detailIdx) {
            for (let i = recentUsedConList.length - 1; i >= 0; i--) {
              if (recentUsedConList[i].detailIdx === detailIdx) {
                isRecentUsed = true;
                break;
              }
            }
          }
        }
        
        if (isRecentUsed) {
          recentUsedKeys.push(key);
        } else {
          notRecentUsedKeys.push(key);
        }
      });

      // 최근 사용된 콘들을 사용 순서대로 정렬
      recentUsedKeys.sort((a, b) => {
        const aDetail = detailIdxDict[a];
        const bDetail = detailIdxDict[b];
        
        if (!aDetail || !bDetail) return 0;
        
        let aRecentIndex = -1;
        let bRecentIndex = -1;
        
        if (aDetail.isDoubleCon) {
          const aDoubleData = aDetail as DetailDataDouble;
          for (let i = recentUsedDoubleConList.length - 1; i >= 0; i--) {
            const recent = recentUsedDoubleConList[i];
            if (recent.firstDoubleCon?.packageIdx === aDoubleData.firstDoubleCon?.packageIdx &&
                recent.firstDoubleCon?.sort === aDoubleData.firstDoubleCon?.sort &&
                recent.secondDoubleCon?.packageIdx === aDoubleData.secondDoubleCon?.packageIdx &&
                recent.secondDoubleCon?.sort === aDoubleData.secondDoubleCon?.sort) {
              aRecentIndex = i;
              break;
            }
          }
        } else {
          const aData = aDetail as DetailDataSingle;
          const aDetailIdx = userPackageData[aData.packageIdx]?.conList?.[aData.sort]?.detailIdx;
          if (aDetailIdx) {
            for (let i = recentUsedConList.length - 1; i >= 0; i--) {
              if (recentUsedConList[i].detailIdx === aDetailIdx) {
                aRecentIndex = i;
                break;
              }
            }
          }
        }
        
        if (bDetail.isDoubleCon) {
          const bDoubleData = bDetail as DetailDataDouble;
          for (let i = recentUsedDoubleConList.length - 1; i >= 0; i--) {
            const recent = recentUsedDoubleConList[i];
            if (recent.firstDoubleCon?.packageIdx === bDoubleData.firstDoubleCon?.packageIdx &&
                recent.firstDoubleCon?.sort === bDoubleData.firstDoubleCon?.sort &&
                recent.secondDoubleCon?.packageIdx === bDoubleData.secondDoubleCon?.packageIdx &&
                recent.secondDoubleCon?.sort === bDoubleData.secondDoubleCon?.sort) {
              bRecentIndex = i;
              break;
            }
          }
        } else {
          const bData = bDetail as DetailDataSingle;
          const bDetailIdx = userPackageData[bData.packageIdx]?.conList?.[bData.sort]?.detailIdx;
          if (bDetailIdx) {
            for (let i = recentUsedConList.length - 1; i >= 0; i--) {
              if (recentUsedConList[i].detailIdx === bDetailIdx) {
                bRecentIndex = i;
                break;
              }
            }
          }
        }
        
        // 높은 인덱스가 더 최근 (최근이 먼저 오도록)
        return bRecentIndex - aRecentIndex;
      });
      
      // 최근 사용되지 않은 콘들은 기본 정렬 방식으로 정렬
      const sortedNotRecentUsed = await applySortingByMethod(notRecentUsedKeys, baseMethod);
      
      return [...recentUsedKeys, ...sortedNotRecentUsed];
    } else {
      // 최근 사용 무시, 기본 정렬 방식만 적용
      return await applySortingByMethod(array, baseMethod);
    }
  };

  // 기본 정렬 방식 적용 함수
  const applySortingByMethod = async (list: string[], method: BaseSortMethod): Promise<string[]> => {
    // 패키지별로 그룹화
    const packageGroups: { [packageIdx: string]: string[] } = {};
    
    list.forEach(key => {
      const detail = detailIdxDict[key];
      if (!detail) return;
      
      let packageIdx: string;
      if (detail.isDoubleCon) {
        const doubleData = detail as DetailDataDouble;
        // 더블콘의 경우 첫 번째 콘의 패키지를 기준으로 함
        packageIdx = doubleData.firstDoubleCon?.packageIdx || '0';
      } else {
        const singleData = detail as DetailDataSingle;
        packageIdx = singleData.packageIdx;
      }
      
      if (!packageGroups[packageIdx]) {
        packageGroups[packageIdx] = [];
      }
      packageGroups[packageIdx].push(key);
    });
    
    // 각 패키지 내에서 sort 순으로 정렬
    Object.keys(packageGroups).forEach(packageIdx => {
      packageGroups[packageIdx].sort((a, b) => {
        const aDetail = detailIdxDict[a];
        const bDetail = detailIdxDict[b];
        
        if (!aDetail || !bDetail) return 0;
        
        const getSort = (detail: DetailData): number => {
          if (detail.isDoubleCon) {
            const doubleData = detail as DetailDataDouble;
            return parseInt(doubleData.firstDoubleCon?.sort || '0');
          } else {
            return parseInt((detail as DetailDataSingle).sort || '0');
          }
        };
        
        return getSort(aDetail) - getSort(bDetail);
      });
    });
    
    // 패키지 순서 결정
    const packageIndices = Object.keys(packageGroups).map(idx => parseInt(idx)).sort((a, b) => {
      if (method === BaseSortMethod.OLDEST_FIRST) {
        return a - b; // 과거 콘 우선 (작은 packageIdx부터)
      } else if (method === BaseSortMethod.NEWEST_FIRST) {
        return b - a; // 최신 콘 우선 (큰 packageIdx부터)
      } else {
        // 랜덤 정렬
        return Math.random() - 0.5;
      }
    });
    
    // 최종 결과 배열 생성
    const result: string[] = [];
    packageIndices.forEach(packageIdx => {
      const packageIdxStr = packageIdx.toString();
      if (packageGroups[packageIdxStr]) {
        result.push(...packageGroups[packageIdxStr]);
      }
    });
    
    return result;
  };

  // 각 카테고리별로 정렬 적용
  const sortedDoubleConList = await applySorting(Array.from(doubleConList) as string[], isRecentUsedFirst, baseSortMethod);
  const sortedFavoriteList = await applySorting(Array.from(favoriteList) as string[], isRecentUsedFirst, baseSortMethod);
  const sortedOtherList = await applySorting(Array.from(otherList) as string[], isRecentUsedFirst, baseSortMethod);

  // 정렬된 결과에서 원본 쿼리와 replace_word 쿼리로 분리하여 재배치
  const separateAndReorder = (sortedList: string[], originalQuery: string, replaceWordDict: any, userConf: any) => {
    const originalResults: string[] = [];
    const replaceWordResults: string[] = [];
    
    let originalQuerySet = new Set<string>();
    let replaceWordQuerySet = new Set<string>();
    
    if (originalQuery === '') {
      // 빈 검색어의 경우 모든 결과를 원본으로 처리
      originalQuerySet = new Set(Object.keys(detailIdxDict));
    } else {
      // 원본 쿼리 결과
      originalQuerySet = conSearchManager.searchTrie(originalQuery);
      
      // 초성 검색 결과도 원본에 포함
      if (userConf?.isChoseongSearch) {
        const choseongResult = conSearchManager.searchChoseongTrie(convertDoubleConsonantToSingle(originalQuery));
        choseongResult.forEach(key => originalQuerySet.add(key));
      }
      
      // replace_word 쿼리 결과
      if (replaceWordDict) {
        for (let key in replaceWordDict) {
          if (originalQuery.includes(key) || replaceWordDict[key].some((word: string) => originalQuery.includes(word))) {
            const replaceResult = conSearchManager.searchTrie(key);
            replaceResult.forEach(resultKey => {
              if (!originalQuerySet.has(resultKey)) {
                replaceWordQuerySet.add(resultKey);
              }
            });
          }
        }
      }
    }

    // 정렬된 리스트를 원본/replace_word로 분리
    sortedList.forEach(key => {
      if (originalQuerySet.has(key)) {
        originalResults.push(key);
      } else if (replaceWordQuerySet.has(key)) {
        replaceWordResults.push(key);
      } else {
        // 예외적인 경우 원본에 추가
        originalResults.push(key);
      }
    });
    
    return [...originalResults, ...replaceWordResults];
  };

  // 원본 쿼리 가져오기 (query는 함수 시작 부분에서 정의됨)
  let originalQueryForReorder = query;
  
  // replace_word 데이터 가져오기
  let replaceWordDataForReorder = await Storage.getReplaceWordData(true);
  if (replaceWordDataForReorder === null) {
    replaceWordDataForReorder = {};
  }
  
  // 각 카테고리별로 원본 쿼리 먼저, replace_word 쿼리 나중에 재배치
  const reorderedDoubleConList = separateAndReorder(sortedDoubleConList, originalQueryForReorder, replaceWordDataForReorder, userConfig);
  const reorderedFavoriteList = separateAndReorder(sortedFavoriteList, originalQueryForReorder, replaceWordDataForReorder, userConfig);
  const reorderedOtherList = separateAndReorder(sortedOtherList, originalQueryForReorder, replaceWordDataForReorder, userConfig);

  finalResult = new Set([
    ...reorderedDoubleConList,
    ...reorderedFavoriteList,
    ...reorderedOtherList,
  ]);

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


async function fetchWithRetry(url: string, body: string | FormData, maxRetries = 5
  , additionalHeaders: any = {}, referer: string = 'https://gall.dcinside.com/mgallery/board/view') {
  let attempts = 0;

  while (attempts < maxRetries) {
    const response = await fetch(url, {
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
        ...additionalHeaders,
        host: 'm.dcinside.com',

      },
      referrer: referer,

      referrerPolicy: 'unsafe-url',
      body: body,
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
async function handleSyncConList(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const ci_t = message.data.ci_t;
  let oldUserPackageData = await Storage.getUserPackageData(false);

  if (oldUserPackageData === null) {
    oldUserPackageData = {};
  }


  async function fetchList(page: number, maxPage: number, idx: number) {
    const response = await fetchWithRetry('https://gall.dcinside.com/dccon/lists', `&target=icon&page=${page}`);
    const data = JSON.parse(response);

    if (sender.tab) {
      if (sender.tab?.id !== undefined) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'SYNC_PROGRESS',
          data: {
            page: idx,
            maxPage: maxPage,
          },
        });
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    return data;
  }

  async function fetchAllList() {
    const response = await fetchWithRetry('https://gall.dcinside.com/dccon/lists', `&target=all`);
    const data = JSON.parse(response);
    return data;
  }

  let data = await fetchAllList();

  // let data = await fetchList(0);

  if (data.bigcon === undefined) {
    sendResponse({ data: {}, error: '로그인이 필요합니다.' });
    return true;
  }

  if (data.bigcon.status == 'enabled') {
    const bigConExpire = data.bigcon.expire;
    await Storage.setBigConExpire(bigConExpire);
  }

  let object = data['list'].replace(/\\/g, '');

  let jsonObject = unserialize(object);
  if (!jsonObject.package_sort) {
    sendResponse({ data: {}, error: '로그인이 필요합니다.' });
    return true;
  }

  const maxPage = Math.ceil(jsonObject.package_sort.length / 5);

  const packageIdxList = jsonObject.package_sort.map((item: any) => item.package_idx);

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

  let isNeedFetchList = [];
  for (let i = 0; i < maxPage; i++) {
    let isNeedFetch = false;
    for (let j = 0; j < 5; j++) {
      if (packageIdxList[i * 5 + j] === undefined) {
        break;
      }
      if (oldUserPackageData[packageIdxList[i * 5 + j]] === undefined) {
        isNeedFetch = true;
        break;
      }
    }

    if (isNeedFetch) {
      isNeedFetchList.push(i);
    }
  }

  for (let page of isNeedFetchList) {
    let idx = isNeedFetchList.indexOf(page);
    let data = await fetchList(page, isNeedFetchList.length, idx);
    Object.assign(oldUserPackageData, processData(data));
  }

  await Storage.setUserPackageData(oldUserPackageData);

  sendResponse({ data: oldUserPackageData });
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
        }).then(response => response.json());
        // .then(data => console.log('Success:', data))
        // .catch(error => console.error('Error:', error));
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

async function handleImportData(message: any, sender: any, sendResponse: any): Promise<boolean> {
  try {
    const { importedFileData, isImportOverwrite, isImportIncludeDoubleConPreset } = message.data;

    const customConList = await Storage.getCustomConList();

    if (!customConList) {
      sendResponse({ success: false, error: '콘 목록을 불러오지 못했습니다.' });
      return true;
    }

    const conLabelList = customConList['conLabelList'];
    const doubleConPreset = customConList['doubleConPreset'];

    let importedConLabelList = importedFileData['conLabelList'];

    if (!importedConLabelList) {
      sendResponse({ success: false, error: '콘 목록을 불러오지 못했습니다.' });
      return true;
    }

    for (let key of Object.keys(importedConLabelList)) {
      if (!conLabelList[key]) {
        conLabelList[key] = JSON.parse(JSON.stringify(importedConLabelList[key]));
        conLabelList[key].conList = {};
      }

      for (let conKey of Object.keys(importedConLabelList[key].conList)) {
        if (isImportOverwrite) {
          conLabelList[key].conList[conKey] = importedConLabelList[key].conList[conKey];
        } else {
          if (
            conLabelList[key] !== undefined &&
            conLabelList[key].conList[conKey] !== undefined &&
            (conLabelList[key].conList[conKey].title !== '' || conLabelList[key].conList[conKey].tag !== '')
          ) {
            continue;
          } else {
            conLabelList[key].conList[conKey] = importedConLabelList[key].conList[conKey];
          }
        }
      }
    }

    if (doubleConPreset && isImportIncludeDoubleConPreset && importedFileData['doubleConPreset']) {
      if (isImportOverwrite) {
        for (const key in importedFileData['doubleConPreset']) {
          doubleConPreset[key] = importedFileData['doubleConPreset'][key];
        }
      } else {
        for (const key in importedFileData['doubleConPreset']) {
          if (!(key in doubleConPreset)) {
            doubleConPreset[key] = importedFileData['doubleConPreset'][key];
          }
        }
      }
    }

    await Storage.setCustomConList({
      conLabelList,
      doubleConPreset,
    });

    // sender에게만 데이터 변경 알림 메시지 전송
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, { type: Message.CHANGED_DATA });
    }

    await conTreeInit();

    sendResponse({ success: true });
    return true;
  } catch (error) {
    console.error('데이터 임포트 중 오류 발생:', error);
    sendResponse({ success: false, error: '데이터 임포트 중 오류가 발생했습니다.' });
    return true;
  }
  return true;
}

async function handleUpdateReplaceWordData(message: any, sender: any, sendResponse: any): Promise<boolean> {
  const replaceWordData = message.data.replaceWordData;
  await Storage.setReplaceWordData(replaceWordData);

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
  [Message.UPDATE_REPLACE_WORD_DATA]: handleUpdateReplaceWordData,
  [Message.UPDATE_STORAGE]: handleUpdateStorage,
  [Message.TRIGGER_EVENT]: handleTriggerEvent,
  [Message.IMPORT_DATA]: handleImportData
};

conTreeInit().then(res => { });

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
      console.log('setUserConfig', DEFAULT_USER_CONFIG);
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
