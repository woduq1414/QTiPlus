import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, MouseEventHandler } from 'react';

import parseCookies from '@src/functions/cookies';

import getQueryValue from '@src/functions/query';
import useDebounce from '@src/hooks/useDebounce';
import ImageWithSkeleton from '@src/components/ImageWithSkeleton';
import SingleConItem from '@src/components/SingleConItem';
import DoubleConItem from '@src/components/DoubleConItem';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  Square2StackIcon,
  StarIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import { CheckCircleIcon as CheckCircleIconOutline } from '@heroicons/react/24/outline';
import { title } from 'process';
import makeToast from '@src/functions/toast';
import { on } from 'events';
import Modal from '@src/components/Modal';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import { Page } from '@src/enums/Page';
import DoubleConPresetEditModal from '@src/components/modals/DoubleConPresetEditModal';
import { DetailDataDouble, DetailDataSingle } from '@extension/shared/lib/models/DetailData';
import { RecentUsedCon } from '@extension/shared/lib/models/RecentUsedCon';
import { RecentUsedDoubleCon } from '@extension/shared/lib/models/RecentUsedDoubleCon';
import { FavoriteConList } from '@extension/shared/lib/models/FavoriteConList';

interface SearchResultItem extends DetailDataSingle {
  key: string;
}

interface SearchResultDoubleItem extends DetailDataDouble {
  key: string;
}

type SearchResult = SearchResultItem | SearchResultDoubleItem;

const SearchPage: React.FC = () => {
  const pageSize = 16;
  const { currentPage, setCurrentPage, userPackageData, setIsModalOpen, isModalOpen, userId, setIsEditMode, setting } =
    useGlobalStore();

  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [queryResult, setQueryResult] = useState<Set<SearchResult>>();

  const debouncedSearchText = useDebounce(searchInput, 250);

  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [isDoubleCon, setIsDoubleCon] = useState<boolean>(false);

  const [isBigCon, setIsBigCon] = useState<boolean>(false);

  const [firstDoubleCon, setFirstDoubleCon] = useState<DetailDataSingle | null>(null);

  const [recentUsedConList, setRecentUsedConList] = useState<RecentUsedCon[]>([]);

  const [recentUsedDoubleConList, setRecentUsedDoubleConList] = useState<RecentUsedDoubleCon[]>([]);

  const [queryPage, setQueryPage] = useState<number>(1);
  const [queryMaxPage, setQueryMaxPage] = useState<number>(1);

  const [originalQueryResult, setOriginalQueryResult] = useState<SearchResult[]>();

  const [queryDoubleConCount, setQueryDoubleConCount] = useState<number>(0);

  const [favoriteConList, setFavoriteConList] = useState<FavoriteConList>({});

  const [bigConExpire, setBigConExpire] = useState<number>(0);

  const [isDoubleConPresetEditModalOpen, setIsDoubleConPresetEditModalOpen] = useState(false);

  const [doubleConPresetEditData, setDoubleConPresetEditData] = useState<DetailDataDouble>({
    firstDoubleCon: null,
    secondDoubleCon: null,
    tag: '',
    presetKey: '',
  });

  const handleImageKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
    detailData: any,
    horizontalItemCount?: number,
  ) => {
    if (isDoubleConPresetEditModalOpen) return;

    if (!horizontalItemCount) horizontalItemCount = 4;
    let targetResultSize = undefined;
    if (queryResult === undefined) {
      if (isDoubleCon && !firstDoubleCon) {
        targetResultSize = recentUsedDoubleConList.length;
      } else {
        targetResultSize = recentUsedConList.length;
      }
    } else {
      targetResultSize = queryResult.size;
    }

    targetResultSize = Math.min(targetResultSize, horizontalItemCount * 4);

    // detect if ctrl key is pressed

    if (e.ctrlKey) {
      if (e.key === 'Enter') {
        if (isDoubleCon && !firstDoubleCon && detailData.firstDoubleCon) {
          onConClick({
            detailData: detailData.secondDoubleCon,
            e,
            manualFirstDoubleCon: detailData.firstDoubleCon,
          });
        } else {
          onConClick({ detailData, e });
        }

        return;
      } else {
        return;
      }
    }

    if (e.key === 'ArrowRight' && index < targetResultSize - 1) {
      e.preventDefault();

      setFocusedIndex(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev !== null ? Math.min(prev + horizontalItemCount, targetResultSize - 1) : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev !== null ? Math.max(prev - horizontalItemCount, 0) : 0));
    } else if (e.key === 'Enter') {
      if (isDoubleCon && !firstDoubleCon && detailData.firstDoubleCon) {
        onConClick({
          detailData: detailData.secondDoubleCon,
          e,
          manualFirstDoubleCon: detailData.firstDoubleCon,
        });
      } else {
        onConClick({ detailData, e });
      }
    } else if (e.key === 'Tab') {
      if (index === targetResultSize - 1) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else {
      }
    } else if (e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'ㄴ')) {
      e.preventDefault(); // 기본 동작 방지

      if (isDoubleCon && !firstDoubleCon && detailData.firstDoubleCon) {
        onConRightClick({
          detailData: detailData,
          e,
        });
      } else {
        onConRightClick({ detailData, e });
      }
    }
  };

  useEffect(() => {
    if (debouncedSearchText) {
      let t = new Date();
      chrome.runtime.sendMessage({ type: Message.SEARCH_CON, query: debouncedSearchText, userId: userId }, response => {
        const res = JSON.parse(response.detailRes);

        let length = 0;
        let tmpDoubleConCount = 0;
        for (let i = 0; i < res.length; i++) {
          if (res[i].key.includes('/')) {
            length += 2;
            tmpDoubleConCount += 1;
          } else {
            length += 1;
          }
        }

        setQueryDoubleConCount(tmpDoubleConCount);

        setQueryMaxPage(Math.ceil(length / pageSize));
        setQueryPage(1);

        if (isDoubleCon && !firstDoubleCon) {
          setOriginalQueryResult(res);
        } else {
          setOriginalQueryResult(
            res.filter((con: { key: string }) => {
              return !con.key.includes('/');
            }),
          );
        }

        setFocusedIndex(-1);
      });
    } else {
      setQueryResult(undefined);
    }
  }, [debouncedSearchText, isDoubleCon, firstDoubleCon]);

  useEffect(() => {
    // double con 은 2만큼 길이 차지

    const doubleConMaxPerPage = Math.floor(pageSize / 2);

    let startIdx, endIdx;

    if (isDoubleCon && !firstDoubleCon) {
      startIdx = (queryPage - 1) * pageSize - Math.min(queryDoubleConCount, (queryPage - 1) * doubleConMaxPerPage);
      endIdx = queryPage * pageSize - Math.min(queryDoubleConCount, queryPage * doubleConMaxPerPage);
    } else {
      startIdx = (queryPage - 1) * pageSize;
      endIdx = queryPage * pageSize;
    }

    if (originalQueryResult === undefined) return;
    const slicedRes = originalQueryResult.slice(startIdx, endIdx);

    setQueryResult(new Set(slicedRes));
  }, [queryPage, originalQueryResult, queryDoubleConCount, isDoubleCon, firstDoubleCon]);

  useEffect(() => {
    if (isModalOpen) {
      searchInputRef.current?.focus();

      setIsDoubleCon(false);

      setFirstDoubleCon(null);
      Storage.getRecentUsedConList(true).then(data => {
        if (data === null) {
          setRecentUsedConList([]);
        } else {
          setRecentUsedConList(data);
        }
      });

      Storage.getRecentUsedDoubleConList(true).then(data => {
        if (data === null) {
          setRecentUsedDoubleConList([]);
        } else {
          setRecentUsedDoubleConList(data);
        }
      });

      Storage.getFavoriteConList(false).then(data => {
        if (data === null) {
          setFavoriteConList({});
        } else {
          setFavoriteConList(data);
        }
      });

      Storage.getBigConExpire(false).then(data => {
        if (data === null) {
          setBigConExpire(0);
          setIsBigCon(false);
        } else {
          setBigConExpire(data);
          setIsBigCon(data > Date.now() / 1000);
        }
      });

      return () => {
        setSearchInput('');
        setQueryResult(undefined);
        setIsDoubleCon(false);
        setFirstDoubleCon(null);

        setFocusedIndex(null);
      };
    }

    return () => {};
  }, [isModalOpen]);

  const queryPageRef = useRef(queryPage);
  const queryMaxPageRef = useRef(queryMaxPage);

  useEffect(() => {
    if (focusedIndex != null)
      if (focusedIndex !== null && imageRefs.current[focusedIndex]) {
        imageRefs.current[focusedIndex]?.focus();
      }
  }, [focusedIndex, imageRefs.current[focusedIndex as number], queryPageRef.current]);

  useEffect(() => {
    if (debouncedSearchText === '') {
      setFocusedIndex(null);
      searchInputRef.current?.focus();
    } else {
    }
  }, [isDoubleCon]);

  useEffect(() => {
    queryPageRef.current = queryPage;
    queryMaxPageRef.current = queryMaxPage;
  }, [queryPage, queryMaxPage]);

  useEffect(() => {
    const handleKeyDown = (event: { altKey: any; shiftKey: any; key: string; preventDefault: () => void }) => {
      if (event.altKey && event.key === '2') {
        event.preventDefault(); // 기본 동작 방지
        toggleDoubleCon();
      } else if (event.altKey && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault(); // 기본 동작 방지

        setIsBigCon(prev => !prev);
      } else if (event.shiftKey && event.key === 'ArrowRight') {
        event.preventDefault(); // 기본 동작 방지

        const queryPage = queryPageRef.current;
        const queryMaxPage = queryMaxPageRef.current;

        if (queryPage < queryMaxPage) {
          setQueryPage(prev => prev + 1);
          setFocusedIndex(0);
        }
        // console.log('alt + ArrowRight');
      } else if (event.shiftKey && event.key === 'ArrowLeft') {
        event.preventDefault(); // 기본 동작 방지

        const queryPage = queryPageRef.current;

        if (queryPage > 1) {
          setQueryPage(prev => prev - 1);
          setFocusedIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function toggleDoubleCon() {
    setIsDoubleCon(prev => !prev);
    setFirstDoubleCon(null);
  }

  async function onConRightClick({ detailData, e }: { detailData: any; e: any }) {
    e.preventDefault();
    e.stopPropagation();

    if (detailData.isDoubleCon) {
      const firstDoubleCon = detailData.firstDoubleCon;
      const secondDoubleCon = detailData.secondDoubleCon;

      const presetKey = `${firstDoubleCon.packageIdx}-${firstDoubleCon.sort}/${secondDoubleCon.packageIdx}-${secondDoubleCon.sort}`;

      if (focusedIndex !== null) {
        imageRefs.current[focusedIndex]?.blur();
      }

      const prevCustomConList = (await Storage.getCustomConList()) as any;

      if (prevCustomConList === null || prevCustomConList === undefined) {
        return;
      }

      if (prevCustomConList?.['doubleConPreset'] === undefined) {
        prevCustomConList['doubleConPreset'] = {};
      }

      const prevTag = prevCustomConList['doubleConPreset'][presetKey]?.tag || '';

      setDoubleConPresetEditData({
        firstDoubleCon: firstDoubleCon,
        secondDoubleCon: secondDoubleCon,
        tag: prevTag,
        presetKey: presetKey,
      });

      setIsDoubleConPresetEditModalOpen(true);
    } else {
      const detailIdx = userPackageData[detailData.packageIdx].conList[detailData.sort].detailIdx;

      let prevfavoriteConList = (await Storage.getFavoriteConList()) as FavoriteConList;

      if (prevfavoriteConList === null) {
        prevfavoriteConList = {};
      }

      if (prevfavoriteConList[detailIdx] === undefined) {
        prevfavoriteConList[detailIdx] = true;
      } else {
        delete prevfavoriteConList[detailIdx];
      }

      // background script로 메시지 전송
      chrome.runtime.sendMessage(
        {
          type: Message.UPDATE_FAVORITE_CON_LIST,
          data: { favoriteConList: prevfavoriteConList },
        },
        response => {
          if (response && response.success) {
            setFavoriteConList(prevfavoriteConList);
          }
        },
      );
    }
  }

  // 최근 사용한 콘 목록 업데이트 함수
  async function updateRecentUsedConList(detailData: any, firstDoubleCon2: any, isDoubleCon: boolean) {
    let recentUsedConList = await Storage.getRecentUsedConList();
    if (recentUsedConList === null) {
      recentUsedConList = [];
    }

    let recentUsedDoubleConList = await Storage.getRecentUsedDoubleConList();
    if (recentUsedDoubleConList === null) {
      recentUsedDoubleConList = [];
    }

    let packageIdx = detailData.packageIdx;
    let detailIdx = userPackageData[packageIdx].conList[detailData.sort].detailIdx;

    let originalDetailIdx = detailIdx;

    if (isDoubleCon) {
      if (firstDoubleCon2 === null) {
        recentUsedConList = recentUsedConList.filter((con: any) => {
          return con.detailIdx !== detailIdx;
        });
        recentUsedConList.push({
          packageIdx: packageIdx,
          detailIdx: detailIdx,
          imgPath: detailData.imgPath,
          title: detailData.title,
          sort: detailData.sort,
        });
        await Storage.setRecentUsedConList(recentUsedConList);

        setFirstDoubleCon({
          packageIdx: packageIdx,
          detailIdx: detailIdx,
          imgPath: detailData.imgPath,
          title: detailData.title,
          sort: detailData.sort,
        });
        return { shouldReturn: true };
      } else {
        packageIdx = `${firstDoubleCon2.packageIdx}, ${packageIdx}`;
        detailIdx = `${firstDoubleCon2.detailIdx}, ${detailIdx}`;

        recentUsedDoubleConList = recentUsedDoubleConList.filter((con: any) => {
          return con.detailIdx !== detailIdx;
        });

        recentUsedDoubleConList.push({
          detailIdx: detailIdx,
          firstDoubleCon: {
            packageIdx: firstDoubleCon2.packageIdx,
            detailIdx: firstDoubleCon2.detailIdx,
            imgPath: firstDoubleCon2.imgPath,
            title: firstDoubleCon2.title,
            sort: firstDoubleCon2.sort,
          },
          secondDoubleCon: {
            packageIdx: packageIdx.split(', ')[1],
            detailIdx: detailIdx.split(', ')[1],
            imgPath: detailData.imgPath,
            title: detailData.title,
            sort: detailData.sort,
          },
        });

        recentUsedDoubleConList = recentUsedDoubleConList.slice(-10);
        await Storage.setRecentUsedDoubleConList(recentUsedDoubleConList);
      }
    }

    // 일반 콘 목록 업데이트
    recentUsedConList = recentUsedConList.filter((con: any) => {
      return con.detailIdx !== detailIdx;
    });

    if (isDoubleCon) {
      recentUsedConList = recentUsedConList.filter((con: any) => {
        return con.detailIdx !== detailIdx.split(', ')[1];
      });
      recentUsedConList.push({
        packageIdx: packageIdx.split(', ')[1],
        detailIdx: detailIdx.split(', ')[1],
        imgPath: detailData.imgPath,
        sort: detailData.sort,
        title: detailData.title,
      });

      if (firstDoubleCon2) {
        recentUsedConList = recentUsedConList.filter((con: any) => {
          return con.detailIdx !== firstDoubleCon2.detailIdx;
        });
        recentUsedConList.push({
          packageIdx: firstDoubleCon2.packageIdx,
          detailIdx: firstDoubleCon2.detailIdx,
          imgPath: firstDoubleCon2.imgPath,
          sort: firstDoubleCon2.sort,
          title: firstDoubleCon2.title,
        });
      }
    } else {
      recentUsedConList = recentUsedConList.filter((con: any) => {
        return con.detailIdx !== detailIdx;
      });
      recentUsedConList.push({
        packageIdx: packageIdx,
        detailIdx: detailIdx,
        imgPath: detailData.imgPath,
        sort: detailData.sort,
        title: detailData.title,
      });
    }

    recentUsedConList = recentUsedConList.slice(-20);
    await Storage.setRecentUsedConList(recentUsedConList);

    return {
      shouldReturn: false,
      packageIdx,
      detailIdx,
      originalDetailIdx: originalDetailIdx,
    };
  }

  // 에디터에 콘 삽입 함수
  function insertConToEditor(
    detailData: any,
    firstDoubleCon2: any,
    isDoubleCon: boolean,
    isBigCon: boolean,
    originalDetailIdx: string,
  ) {
    const noteEditableDom = document.getElementsByClassName('note-editable')[0];
    if (!noteEditableDom) return false;

    const memo = document.getElementById('memo');
    if (!memo) return false;

    const prevSelection = window.getSelection();
    let savedRange;
    if (prevSelection && prevSelection.rangeCount > 0) {
      savedRange = prevSelection.getRangeAt(0); // 현재 커서 위치 저장
    }

    // 현재 선택된 위치에 HTML 삽입
    (noteEditableDom as HTMLElement).focus();
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(noteEditableDom); // 전체 내용을 범위로 설정
    range.collapse(false); // 범위를 끝으로 이동

    if (selection) {
      selection.removeAllRanges(); // 기존 선택 해제
      selection.addRange(range); // 새로운 범위 설정
    }

    const isMobileVersion = window.location.host === 'm.dcinside.com';

    if (isMobileVersion) {
      if (isDoubleCon) {
        document.execCommand(
          'insertHTML',
          false,
          `
            <div class="block dccon" contenteditable="false"><span class="cont dccon"><span class="cont-inr"><button type="button"
            class="sp-imgclose con-close"><span class="blind">삭제</span></button><img class="written_dccon dccon-img ${isBigCon ? 'bigdccon' : ''}"
            src="https:${firstDoubleCon2.imgPath}"
            alt="1" detail="${firstDoubleCon2.detailIdx}"></span><span class="cont-inr"><span class="pos"><span
                class="order-handle"></span></span><img class="written_dccon dccon-img ${isBigCon ? 'bigdccon' : ''}"
            src="https:${detailData.imgPath}"
            alt="2" detail="${originalDetailIdx}"></span></span></div>
               <p><br></p>
          `,
        );
      } else {
        document.execCommand(
          'insertHTML',
          false,
          `
            <div class="block dccon" contenteditable="false"><span class="cont dccon"><span class="cont-inr"><button type="button"
            class="sp-imgclose con-close"><span class="blind">삭제</span></button><img class="written_dccon dccon-img ${isBigCon ? 'bigdccon' : ''}"
            src="https:${detailData.imgPath}"
            alt="0" detail="${originalDetailIdx}"></span></span></div>

            <p><br></p>
          `,
        );
      }
    } else {
      if (isDoubleCon) {
        document.execCommand(
          'insertHTML',
          false,
          `<img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${firstDoubleCon2.imgPath}" conalt="0" alt="0" con_alt="0" title="0" detail="${firstDoubleCon2.detailIdx}">
         
          `,
        );
      }
      document.execCommand(
        'insertHTML',
        false,
        `<img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${detailData.imgPath}" conalt="0" alt="0" con_alt="0" title=0" detail="${originalDetailIdx}">`,
      );
    }

    return true;
  }

  // 대왕콘 체크 함수
  async function checkBigCon(galleryId: string, ci_t: string, isMobileVersion: boolean) {
    if (!isBigCon) return;

    if (isMobileVersion) {
      await fetch('https://m.dcinside.com/ajax/chk_bigdccon', {
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          'accept-language': 'ko',
          'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-csrf-token': document.getElementsByName('csrf-token')[0]?.getAttribute('content') as string,
          'x-requested-with': 'XMLHttpRequest',
        },
        referrer: `https://m.dcinside.com/board/${galleryId}/${document.getElementById('no')?.getAttribute('value')}`,
        referrerPolicy: 'unsafe-url',
        body: null,
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
      });
    } else {
      await fetch('https://gall.dcinside.com/dccon/lists', {
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
        body: `ci_t=${ci_t}&target=icon&page=${0}`,
        method: 'POST',
        mode: 'cors',
        credentials: 'same-origin',
      });
    }
  }

  // 모바일 댓글 작성 함수
  async function writeMobileComment(
    detailData: any,
    firstDoubleCon2: any,
    isDoubleCon: boolean,
    isBigCon: boolean,
    originalDetailIdx: string,
    packageIdx: string,
    detailIdx: string,
  ) {
    const hiddenValueInput = document.getElementsByClassName('hide-robot')[0] as HTMLInputElement;
    const hiddenValue = hiddenValueInput ? hiddenValueInput.getAttribute('name') : undefined;
    const pathname = window.location.pathname;
    let galleryId = undefined;

    if (pathname.includes('board')) {
      galleryId = pathname.split('/')[2];
    }

    if (packageIdx === undefined || detailIdx === undefined || hiddenValue === undefined || galleryId === undefined) {
      setIsModalOpen(false);

      if (isDoubleCon) {
        let gifUrl = `https:${firstDoubleCon2.imgPath}`;
        window.open(gifUrl, '_blank');

        gifUrl = `https:${detailData.imgPath}`;
        window.open(gifUrl, '_blank');
      } else {
        let gifUrl = `https:${detailData.imgPath}`;
        window.open(gifUrl, '_blank');
      }

      makeToast(`다운로드 성공!`);
      return;
    }

    const isReply = document.getElementById('comment_memo_reple') ? true : false;
    const no = document.getElementById('no')?.getAttribute('value');
    const subject = document.getElementById('subject')?.getAttribute('value');
    const comment_no = document.getElementById('comment_no')?.getAttribute('value');
    const csrfToken = document.getElementsByName('csrf-token')[0]?.getAttribute('content') as string;

    const accessResponse = await fetch('https://m.dcinside.com/ajax/access', {
      headers: {
        accept: '*/*',
        'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-csrf-token': csrfToken,
        'x-requested-with': 'XMLHttpRequest',
      },
      referrer: `https://m.dcinside.com/board/${galleryId}/${no}`,
      referrerPolicy: 'unsafe-url',
      body: 'token_verify=com_submit',
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });

    const accessResponseJson = await accessResponse.json();
    const blockKey = accessResponseJson.Block_key;

    let commentMemo = `<img src='https:${detailData.imgPath}' class='written_dccon' alt='8' conalt='8' title='8' detail='${originalDetailIdx}'>`;
    if (isDoubleCon) {
      commentMemo =
        `<img src='https:${firstDoubleCon2.imgPath}' class='written_dccon' alt='8' conalt='8' title='8' detail='${firstDoubleCon2.detailIdx}'>` +
        commentMemo;
    }

    let newDetailIdx = detailIdx;
    if (isDoubleCon) {
      newDetailIdx = `${firstDoubleCon2.detailIdx}|dccon|${originalDetailIdx}`;
    }

    setIsModalOpen(false);

    const writeCommentResponse = await fetch('https://m.dcinside.com/ajax/comment-write', {
      headers: {
        accept: '*/*',
        'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-csrf-token': csrfToken,
        'x-requested-with': 'XMLHttpRequest',
      },
      referrer: `https://m.dcinside.com/board/${galleryId}/${no}`,
      referrerPolicy: 'unsafe-url',
      body: `comment_memo=${encodeURIComponent(commentMemo)}&comment_nick=&comment_pw=&mode=${
        isReply ? 'com_reple' : 'com_write'
      }&comment_no=${comment_no}&detail_idx=${newDetailIdx}&id=${galleryId}&no=${no}&best_chk=&subject=${subject}&board_id=1&reple_id=&con_key=${blockKey}&${hiddenValue}=1&use_gall_nickname=&${
        isBigCon ? 'use_bigdccon=1' : ''
      }`,
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });

    const writeCommentResponseJson = await writeCommentResponse.json();

    if (writeCommentResponseJson.result === true) {
      makeToast('등록 성공!');

      const el = document.getElementsByClassName('sp-reload')[0] as HTMLElement;
      el.setAttribute('href', '');
      el.setAttribute('onclick', 'comment_list(0)');
      el.click();

      if (isDoubleCon) {
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'DCCON_INSERT',
          data: {
            packageIdx: firstDoubleCon2.packageIdx,
            sort: firstDoubleCon2.sort,
            doubleCon: 1,
            env: 'mobile',
          },
        });
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'DCCON_INSERT',
          data: {
            packageIdx: packageIdx.split(', ')[1],
            sort: detailData.sort,
            doubleCon: 2,
            env: 'mobile',
          },
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'DCCON_INSERT',
          data: {
            packageIdx: packageIdx,
            sort: detailData.sort,
            doubleCon: -1,
            env: 'mobile',
          },
        });
      }
    } else {
      chrome.runtime.sendMessage({
        type: 'TRIGGER_EVENT',
        action: 'DCCON_INSERT',
        data: {
          packageIdx: packageIdx,
          sort: detailData.sort,
          doubleCon: -1,
          env: 'mobile',
          error: JSON.stringify(writeCommentResponseJson),
        },
      });
    }
  }

  // PC 댓글 작성 함수
  async function writePCComment(
    detailData: any,
    firstDoubleCon2: any,
    isDoubleCon: boolean,
    isBigCon: boolean,
    packageIdx: string,
    detailIdx: string,
    galleryId: string,
    postNumber: string,
    ci_t: string,
    check6Value: string,
    check7Value: string,
    check8Value: string,
  ) {
    if (
      packageIdx === undefined ||
      detailIdx === undefined ||
      ci_t === undefined ||
      check6Value === undefined ||
      check7Value === undefined ||
      check8Value === undefined
    ) {
      setIsModalOpen(false);

      if (isDoubleCon) {
        let gifUrl = `https:${firstDoubleCon2.imgPath}`;
        window.open(gifUrl, '_blank');

        gifUrl = `https:${detailData.imgPath}`;
        window.open(gifUrl, '_blank');
      } else {
        let gifUrl = `https:${detailData.imgPath}`;
        window.open(gifUrl, '_blank');
      }

      makeToast(`다운로드 성공!`);
      return;
    }

    const name = document.getElementsByClassName('user_info_input')[0].children[0].textContent;
    const replyBox = document.querySelectorAll('.reply_box #cmt_write_box')[0];
    let replyTarget: string | null = '';

    if (replyBox) {
      replyTarget = replyBox.getAttribute('data-no');
    }
    if (replyTarget === null) {
      replyTarget = '';
    }

    setIsModalOpen(false);

    if (isBigCon) {
      await fetch('https://gall.dcinside.com/dccon/lists', {
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
        body: `ci_t=${ci_t}&target=icon&page=${0}`,
        method: 'POST',
        mode: 'cors',
        credentials: 'same-origin',
      });
    }

    const response = await fetch('https://gall.dcinside.com/dccon/insert_icon', {
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
      referrer: `https://gall.dcinside.com/mgallery/board/view/?id=${galleryId}&no=${postNumber}&page=1`,
      referrerPolicy: 'unsafe-url',
      body: `id=${galleryId}&no=${postNumber}&package_idx=${packageIdx}&detail_idx=${detailIdx}&double_con_chk=${isDoubleCon ? '1' : ''}&name=${name}&ci_t=${ci_t}&input_type=comment&t_vch2=&t_vch2_chk=&c_gall_id=${galleryId}&c_gall_no=${postNumber}&g-recaptcha-response=&check_6=${check6Value}&check_7=${check7Value}&check_8=${check8Value}&_GALLTYPE_=M&${replyTarget ? 'c_no=' + replyTarget : ''}&${isBigCon ? 'bigdccon=1' : ''}`,
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    });

    const refreshButton = document.getElementsByClassName('btn_cmt_refresh')[0] as HTMLButtonElement;
    refreshButton?.click();

    const responseText = await response.text();
    if (responseText === 'ok') {
      makeToast('등록 성공!');

      if (isDoubleCon) {
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'DCCON_INSERT',
          data: {
            packageIdx: firstDoubleCon2.packageIdx,
            sort: firstDoubleCon2.sort,
            doubleCon: 1,
            env: 'pc',
          },
        });
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'DCCON_INSERT',
          data: {
            packageIdx: packageIdx.split(', ')[1],
            sort: detailData.sort,
            doubleCon: 2,
            env: 'pc',
          },
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'DCCON_INSERT',
          data: {
            packageIdx: packageIdx,
            sort: detailData.sort,
            doubleCon: -1,
            env: 'pc',
          },
        });
      }
    } else {
      makeToast('등록 실패..(로그인 되었는지 확인 OR 재동기화 필요)');

      chrome.runtime.sendMessage({
        type: 'TRIGGER_EVENT',
        action: 'DCCON_INSERT',
        data: {
          packageIdx: packageIdx,
          sort: detailData.sort,
          error: responseText,
        },
      });
    }
  }

  // 메인 콘 클릭 함수
  async function onConClick({
    detailData,
    e,
    manualFirstDoubleCon,
  }: {
    detailData: any;
    e?: React.KeyboardEvent<HTMLDivElement> | any;
    manualFirstDoubleCon?: any;
  }) {
    let firstDoubleCon2 = null;
    if (manualFirstDoubleCon) {
      firstDoubleCon2 = manualFirstDoubleCon;
      let packageIdx = firstDoubleCon2.packageIdx;
      let detailIdx = userPackageData[packageIdx].conList[firstDoubleCon2.sort].detailIdx;

      firstDoubleCon2.detailIdx = detailIdx;
    } else {
      firstDoubleCon2 = firstDoubleCon;
    }

    const isMobileVersion = window.location.host === 'm.dcinside.com';

    // 최근 사용한 콘 목록 업데이트
    const { shouldReturn, packageIdx, detailIdx, originalDetailIdx } = await updateRecentUsedConList(
      detailData,
      firstDoubleCon2,
      isDoubleCon,
    );

    if (shouldReturn) {
      if (!e.ctrlKey) {
        // setQueryResult(undefined);
        // setOriginalQueryResult(undefined);
        setSearchInput('');
        searchInputRef.current?.focus();
      }
      return;
    }

    setQueryResult(undefined);

    // 필요한 값들 가져오기
    const postNumber = getQueryValue('no');
    const galleryId = getQueryValue('id');
    const check6Value = document.getElementById('check_6')?.getAttribute('value');
    const check7Value = document.getElementById('check_7')?.getAttribute('value');
    const check8Value = document.getElementById('check_8')?.getAttribute('value');
    const cookies = parseCookies();
    const ci_t = cookies['ci_c'];

    // 에디터에 콘 삽입
    const noteEditableDom = document.getElementsByClassName('note-editable')[0];
    if (noteEditableDom) {
      if (packageIdx === undefined || detailIdx === undefined) {
        setIsModalOpen(false);
        return;
      }

      const insertSuccess = insertConToEditor(detailData, firstDoubleCon2, isDoubleCon, isBigCon, originalDetailIdx);
      if (!insertSuccess) return;
      setIsModalOpen(false);
      if (galleryId && ci_t) {
        await checkBigCon(galleryId, ci_t, isMobileVersion);
      }
    } else {
      // 댓글 작성
      if (isMobileVersion) {
        await writeMobileComment(
          detailData,
          firstDoubleCon2,
          isDoubleCon,
          isBigCon,
          originalDetailIdx,
          packageIdx,
          detailIdx,
        );
      } else {
        await writePCComment(
          detailData,
          firstDoubleCon2,
          isDoubleCon,
          isBigCon,
          packageIdx!,
          detailIdx!,
          galleryId!,
          postNumber!,
          ci_t!,
          check6Value!,
          check7Value!,
          check8Value!,
        );
      }
    }
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none  z-[999999999]
            `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] pl-6 pr-6 pt-6 pb-3 rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.3)] pointer-events-auto flex flex-col gap-1 
        text-black
      dark:bg-[rgba(46,46,46,0.75)] dark:text-white/90
      "
        style={{
          backdropFilter: 'blur(15px)',
        }}>
        <div className="flex flex-row w-full justify-between items-end">
          <div className="flex flex-row gap-3">
            <div className="flex flex-row gap-[0.2em] items-center cursor-pointer" onClick={toggleDoubleCon}>
              {isDoubleCon ? (
                <CheckCircleIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <CheckCircleIconOutline className="h-4 w-4 text-gray-400" />
              )}
              <span
                className={`text-sm font-semibold
                    ${isDoubleCon ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}
                        `}>
                더블콘
              </span>
            </div>
            {bigConExpire > new Date().getTime() / 1000 && (
              <div
                className="flex flex-row gap-[0.2em] items-center cursor-pointer"
                onClick={() => {
                  setIsBigCon(prev => !prev);

                  // makeToast('대왕콘 설정이 변경되었습니다.');
                }}>
                {isBigCon ? (
                  <CheckCircleIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <CheckCircleIconOutline className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={`text-sm font-semibold
                    ${isBigCon ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}
                        `}>
                  대왕콘
                </span>
              </div>
            )}
          </div>

          {isDoubleCon &&
            (firstDoubleCon ? (
              <div
                className="relative group w-[60px] h-[60px] cursor-pointer "
                onClick={() => {
                  setFirstDoubleCon(null);
                }}>
                {/* 이미지 */}
                <img src={firstDoubleCon.imgPath} className="w-full h-full rounded-md object-cover" alt="thumbnail" />

                {/* 호버 시 오버레이 & 아이콘 표시 */}
                <div className="absolute inset-0 bg-gray-600/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrashIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-[60px] h-[60px] border-2 border-dashed border-gray-300 rounded-md"></div>
            ))}
        </div>
        <input
          onChange={e => {
            setSearchInput(e.target.value);
          }}
          ref={searchInputRef}
          type="text"
          placeholder="검색어를 입력하세요"
          className="border border-gray-300 rounded-md p-2 bg-white/20 mb-2"
          value={searchInput}
          spellCheck="false"
          onKeyDown={e => {
            // }
          }}></input>

        {!userPackageData && <div>아래 [콘 목록]에서 동기화를 먼저 해주세요!</div>}

        {debouncedSearchText === '' &&
          (isDoubleCon && !firstDoubleCon
            ? recentUsedDoubleConList && recentUsedDoubleConList.length > 0
              ? true
              : false
            : recentUsedConList && recentUsedConList.length > 0
              ? true
              : false) && (
            <span className="text-md font-semibold mb-1 text-gray-800 dark:text-gray-200">최근 사용한 콘</span>
          )}

        {
          <div className="flex flex-wrap w-[350px] gap-1 ">
            {debouncedSearchText !== '' &&
              queryResult &&
              Array.from(queryResult).map((detailData, index) => {
                const divKey = detailData.key;

                if (detailData.isDoubleCon === true) {
                  let horizontalItemCount = 3;
                  const nextItem = Array.from(queryResult)[index + 1];
                  if (nextItem && nextItem.key.includes('/') === true) {
                    horizontalItemCount = 2;
                  }

                  return (
                    <DoubleConItem
                      key={divKey}
                      detailData={detailData}
                      index={index}
                      focusedIndex={focusedIndex}
                      imageRefs={imageRefs}
                      handleImageKeyDown={handleImageKeyDown}
                      onConClick={onConClick}
                      onConRightClick={onConRightClick}
                      horizontalItemCount={horizontalItemCount}
                      onFocus={() => {
                        setFocusedIndex(index);
                      }}
                      onBlur={() => {
                        if (focusedIndex === index) {
                          setFocusedIndex(null);
                        }
                      }}
                    />
                  );
                } else {
                  return (
                    <SingleConItem
                      key={divKey}
                      detailData={detailData}
                      index={index}
                      focusedIndex={focusedIndex}
                      imageRefs={imageRefs}
                      handleImageKeyDown={handleImageKeyDown}
                      onConClick={onConClick}
                      onConRightClick={onConRightClick}
                      favoriteConList={favoriteConList}
                      userPackageData={userPackageData}
                      onFocus={() => {
                        setFocusedIndex(index);
                      }}
                      onBlur={() => {
                        if (focusedIndex === index) {
                          setFocusedIndex(null);
                        }
                      }}
                    />
                  );
                }
              })}

            {debouncedSearchText === '' &&
              // !queryResult &&
              (!(isDoubleCon && !firstDoubleCon)
                ? Array.from(recentUsedConList)
                    .reverse()
                    .slice(0, 16)
                    .map((detailData, index) => {
                      const detailIdx = detailData.detailIdx;

                      return (
                        <SingleConItem
                          key={detailIdx}
                          detailData={detailData}
                          index={index}
                          focusedIndex={focusedIndex}
                          imageRefs={imageRefs}
                          handleImageKeyDown={handleImageKeyDown}
                          onConClick={onConClick}
                          onConRightClick={onConRightClick}
                          favoriteConList={favoriteConList}
                          userPackageData={userPackageData}
                          onFocus={() => {
                            setFocusedIndex(index);
                          }}
                          onBlur={() => {
                            if (focusedIndex === index) {
                              setFocusedIndex(null);
                            }
                          }}
                        />
                      );
                    })
                : Array.from(recentUsedDoubleConList)
                    .reverse()
                    .slice(0, 8)
                    .map((detailData, index) => {
                      // console.log(detailData, 'detailData212');

                      const detailIdx = detailData.detailIdx;
                      detailData.isDoubleCon = true;

                      return (
                        <DoubleConItem
                          key={detailIdx}
                          detailData={detailData}
                          index={index}
                          focusedIndex={focusedIndex}
                          imageRefs={imageRefs}
                          handleImageKeyDown={handleImageKeyDown}
                          onConClick={onConClick}
                          onConRightClick={onConRightClick}
                          tabIndex={isDoubleConPresetEditModalOpen ? -1 : 0}
                          horizontalItemCount={2}
                          onFocus={() => {
                            setFocusedIndex(index);
                          }}
                          onBlur={() => {
                            if (focusedIndex === index) {
                              setFocusedIndex(null);
                            }
                          }}
                        />
                      );
                    }))}
          </div>
        }
        {debouncedSearchText !== '' && queryResult && queryMaxPageRef.current > 1 && (
          <div className="flex flex-row gap-2 justify-center items-center">
            <div
              className={`cursor-pointer
          text-center
         hover:text-blue-700
         text-gray-600 dark:text-gray-400
         pl-5
         ${queryPage === 1 ? 'opacity-50 dark:opacity-25' : ''}
          `}
              onClick={async () => {
                if (queryPage === 1) return;
                setQueryPage(prev => prev - 1);
              }}>
              <ChevronLeftIcon className="h-6 w-6" />
            </div>
            <div
              className={`cursor-pointer
          text-center
         hover:text-blue-700
         text-gray-600 dark:text-gray-400
         pr-5
         ${queryPage === queryMaxPage ? 'opacity-50 dark:opacity-25' : ''}
          `}
              onClick={async () => {
                if (queryPage === queryMaxPage) return;
                setQueryPage(prev => prev + 1);
              }}>
              <ChevronRightIcon className="h-6 w-6" />
            </div>
          </div>
        )}

        <div
          className="cursor-pointer
          text-center
         hover:text-blue-700
         text-gray-600 
         dark:text-gray-400
         dark:hover:text-blue-400
        
 
          mt-5
          flex flex-row gap-0.5 justify-center items-center

          font-semibold text-sm
          "
          onClick={async () => {
            // return;
            setCurrentPage(Page.CON_LIST);
            setIsEditMode(false);

            return;
          }}>
          <ListBulletIcon
            className="inline-block "
            style={{
              width: '1em',
              height: '1em',
            }}
          />
          콘 목록
        </div>
        <DoubleConPresetEditModal
          isOpen={isDoubleConPresetEditModalOpen}
          onClose={() => setIsDoubleConPresetEditModalOpen(false)}
          doubleConPresetEditData={doubleConPresetEditData}
          setDoubleConPresetEditData={setDoubleConPresetEditData}
          setIsDoubleConPresetEditModalOpen={setIsDoubleConPresetEditModalOpen}
        />
      </div>
    </div>
  );
};

export default SearchPage;
