import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, MouseEventHandler } from 'react';

import parseCookies from '@src/functions/cookies';

import getQueryValue from '@src/functions/query';
import useDebounce from '@src/hook/useDebounce';
import ImageWithSkeleton from './ImageWithSkeleton';
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
import Modal from './Modal';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';

const SearchPage: React.FC = () => {
  const pageSize = 16;
  const { currentPage, setCurrentPage, userPackageData, setIsModalOpen, isModalOpen, userId, setIsEditMode, setting } =
    useGlobalStore();

  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [queryResult, setQueryResult] = useState<Set<any>>();

  const debouncedSearchText = useDebounce(searchInput, 250);

  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [isDoubleCon, setIsDoubleCon] = useState<boolean>(false);

  const [isBigCon, setIsBigCon] = useState<boolean>(false);

  const [firstDoubleCon, setFirstDoubleCon] = useState<any>(null);

  const [recentUsedConList, setRecentUsedConList] = useState<any[]>([]);

  const [recentUsedDoubleConList, setRecentUsedDoubleConList] = useState<any[]>([]);

  const [queryPage, setQueryPage] = useState<number>(1);
  const [queryMaxPage, setQueryMaxPage] = useState<number>(1);

  const [originalQueryResult, setOriginalQueryResult] = useState<any>();

  const [queryDoubleConCount, setQueryDoubleConCount] = useState<number>(0);

  const [favoriteConList, setFavoriteConList] = useState<any>({});

  const [bigConExpire, setBigConExpire] = useState<number>(0);

  const [isDoubleConPresetEditModalOpen, setIsDoubleConPresetEditModalOpen] = useState(false);

  const [doubleConPresetEditData, setDoubleConPresetEditData] = useState<any>({
    firstDoubleCon: null,
    secondDoubleCon: null,
    tag: '',
    presetKey: '',
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && queryResult !== undefined && queryResult.size > 0) {
      e.preventDefault(); // 기본 Tab 동작 방지
      setFocusedIndex(0);
    }
  };

  const handleImageKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
    detailData: any,
    horizontalItemCount?: number,
  ) => {
    // e.preventDefault();
    // e.stopPropagation();
    // console.log(e.key, index, detailData, isDoubleConPresetEditModalOpen);
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
      // imageRefs.current[index]?.click();
    } else if (e.key === 'Tab') {
      if (index === targetResultSize - 1) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else {
        // setFocusedIndex(index + 1);
      }
    } else if (e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'ㄴ')) {
      e.preventDefault(); // 기본 동작 방지

      if (isDoubleCon && !firstDoubleCon && detailData.firstDoubleCon) {
        onConRightClick({
          detailData: detailData,
          e,
          // firstDoubleCon: detailData.firstDoubleCon,
        });
      } else {
        onConRightClick({ detailData, e });
      }

      // console.log('alt + s');
    }
  };

  useEffect(() => {
    if (debouncedSearchText) {
      let t = new Date();
      chrome.runtime.sendMessage({ type: Message.SEARCH_CON, query: debouncedSearchText, userId: userId }, response => {
        const res = JSON.parse(response.detailRes);

        //
        // setQueryResult(new Set(res));

        // one page is 16

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
            res.filter((con: any) => {
              return !con.key.includes('/');
            }),
          );
        }

        setFocusedIndex(-1);

        // console.log(`Query : ${debouncedSearchText} took ${new Date().getTime() - t.getTime()}ms`);
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

    // console.log(startIdx, endIdx);

    // const startIdx = (queryPage - 1) * pageSize;
    // const endIdx = queryPage * pageSize;
    if (originalQueryResult === undefined) return;
    const slicedRes = originalQueryResult.slice(startIdx, endIdx);

    setQueryResult(new Set(slicedRes));
  }, [queryPage, originalQueryResult, queryDoubleConCount, isDoubleCon, firstDoubleCon]);

  useEffect(() => {
    if (isModalOpen) {
      searchInputRef.current?.focus();

      setIsDoubleCon(false);

      setFirstDoubleCon(null);
      Storage.getRecentUsedConList().then(data => {
        if (data === null) {
          setRecentUsedConList([]);
        } else {
          setRecentUsedConList(data);
        }
      });

      Storage.getRecentUsedDoubleConList().then(data => {
        if (data === null) {
          setRecentUsedDoubleConList([]);
        } else {
          setRecentUsedDoubleConList(data);
        }
      });

      Storage.getFavoriteConList().then(data => {
        if (data === null) {
          setFavoriteConList({});
        } else {
          setFavoriteConList(data);
        }
      });

      Storage.getBigConExpire().then(data => {
        if (data === null) {
          setBigConExpire(0);
          setIsBigCon(false);
        } else {
          setBigConExpire(data);
          setIsBigCon(data > Date.now());
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
        // console.log('alt + 2');
      } else if (event.altKey && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault(); // 기본 동작 방지

        setIsBigCon(prev => !prev);
        // console.log('alt + B');
      } else if (event.shiftKey && event.key === 'ArrowRight') {
        event.preventDefault(); // 기본 동작 방지

        // get current state of queryMaxPage
        const queryPage = queryPageRef.current;
        const queryMaxPage = queryMaxPageRef.current;

        if (queryPage < queryMaxPage) {
          setQueryPage(prev => prev + 1);
          setFocusedIndex(0);
        }
        // console.log('alt + ArrowRight');
      } else if (event.shiftKey && event.key === 'ArrowLeft') {
        event.preventDefault(); // 기본 동작 방지

        // get current state of queryMaxPage
        const queryPage = queryPageRef.current;

        if (queryPage > 1) {
          setQueryPage(prev => prev - 1);
          setFocusedIndex(0);
        }
        // console.log('alt + ArrowLeft');
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
    // console.log('right click', detailData);

    if (detailData.isDoubleCon) {
      const firstDoubleCon = detailData.firstDoubleCon;
      const secondDoubleCon = detailData.secondDoubleCon;

      const presetKey =
        firstDoubleCon.packageIdx +
        '-' +
        firstDoubleCon.sort +
        '/' +
        secondDoubleCon.packageIdx +
        '-' +
        secondDoubleCon.sort;

      if (focusedIndex !== null) {
        imageRefs.current[focusedIndex]?.blur();
      }

      // console.log(detailData, '!!!!!!!!!!!!');

      const prevCustomConList = (await Storage.getCustomConList()) as any;

      if (prevCustomConList === null || prevCustomConList === undefined) {
        return;
      }

      if (prevCustomConList?.['doubleConPreset'] === undefined) {
        prevCustomConList['doubleConPreset'] = {};
      }

      const prevTag = prevCustomConList['doubleConPreset'][presetKey]?.tag || '';

      console.log(
        {
          firstDoubleCon: firstDoubleCon,
          secondDoubleCon: secondDoubleCon,
          tag: prevTag,
          presetKey: presetKey,
        },
        'prevCustomConList',
        prevCustomConList['doubleConPreset'][presetKey],
      );

      setDoubleConPresetEditData({
        firstDoubleCon: firstDoubleCon,
        secondDoubleCon: secondDoubleCon,
        tag: prevTag,
        presetKey: presetKey,
      });

      setIsDoubleConPresetEditModalOpen(true);
    } else {
      const detailIdx = userPackageData[detailData.packageIdx].conList[detailData.sort].detailIdx;

      let prevfavoriteConList = await Storage.getFavoriteConList();

      if (prevfavoriteConList === null) {
        prevfavoriteConList = {};
      }

      if (prevfavoriteConList[detailIdx] === undefined) {
        prevfavoriteConList[detailIdx] = true;
      } else {
        delete prevfavoriteConList[detailIdx];
      }

      await Storage.setFavoriteConList(prevfavoriteConList);

      setFavoriteConList(prevfavoriteConList);
    }
  }

  async function onConClick({
    detailData,
    e,
    manualFirstDoubleCon,
  }: {
    detailData: any;
    e?: React.KeyboardEvent<HTMLDivElement> | any;
    manualFirstDoubleCon?: any;
  }) {
    {
      // console.log(detailData, manualFirstDoubleCon, 'sdfadf');
      let firstDoubleCon2 = null;
      if (manualFirstDoubleCon) {
        firstDoubleCon2 = manualFirstDoubleCon;
      } else {
        firstDoubleCon2 = firstDoubleCon;
      }

      const isMobileVersion = window.location.host === 'm.dcinside.com';

      let recentUsedConList = await Storage.getRecentUsedConList();
      if (recentUsedConList === null) {
        recentUsedConList = [];
      }

      let recentUsedDoubleConList = await Storage.getRecentUsedDoubleConList();
      if (recentUsedDoubleConList === null) {
        recentUsedDoubleConList = [];
      }

      // return;

      let packageIdx = detailData.packageIdx;

      let detailIdx = userPackageData[packageIdx].conList[detailData.sort].detailIdx;
      let originalDetailIdx = detailIdx;

      let firstConDetailIdx;

      if (firstDoubleCon2) {
        firstConDetailIdx = userPackageData[firstDoubleCon2.packageIdx].conList[firstDoubleCon2.sort].detailIdx;

        firstDoubleCon2.detailIdx = firstConDetailIdx;
      }

      if (isDoubleCon) {
        if (firstDoubleCon2 === null) {
          setFirstDoubleCon({
            packageIdx: packageIdx,
            detailIdx: detailIdx,
            imgPath: detailData.imgPath,
            title: detailData.title,
            sort: detailData.sort,
          });

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

          if (!e.ctrlKey) {
            setQueryResult(undefined);
            setSearchInput('');

            searchInputRef.current?.focus();
          }

          return;
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

      setQueryResult(undefined);

      //   return;

      // 사용 예시
      const postNumber = getQueryValue('no');
      const galleryId = getQueryValue('id');

      const check6Value = document.getElementById('check_6')?.getAttribute('value');
      const check7Value = document.getElementById('check_7')?.getAttribute('value');
      const check8Value = document.getElementById('check_8')?.getAttribute('value');

      // 사용 예시

      // const packageIdx = 151346;
      // const detailIdx = 1241690924;

      const cookies = parseCookies();
      const ci_t = cookies['ci_c'];

      // check if the con is already in the list and remove it

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

      const noteEditableDom = document.getElementsByClassName('note-editable')[0];
      if (noteEditableDom) {
        if (packageIdx === undefined || detailIdx === undefined) {
          setIsModalOpen(false);

          // copy img to clipboard

          // makeToast(
          //   `등록 실패 ㅠㅠ ${JSON.stringify({
          //     packageIdx,
          //     detailIdx,
          //   })}`,
          // );
          return;
        }

        const memo = document.getElementById('memo');
        if (!memo) return;

        const prevSelection = window.getSelection();
        let savedRange;
        if (prevSelection) {
          if (prevSelection.rangeCount > 0) {
            savedRange = prevSelection.getRangeAt(0); // 현재 커서 위치 저장
          }
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

          // alert("!!");
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

        setIsModalOpen(false);

        if (isBigCon) {
          if (isMobileVersion) {
            fetch('https://m.dcinside.com/ajax/chk_bigdccon', {
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
            fetch('https://gall.dcinside.com/dccon/lists', {
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
              // credentials: 'include',
            });
          }
        }
      } else {
        if (isMobileVersion) {
          const hiddenValueInput = document.getElementsByClassName('hide-robot')[0] as HTMLInputElement;

          const hiddenValue = hiddenValueInput ? hiddenValueInput.getAttribute('name') : undefined;

          const pathname = window.location.pathname;

          let galleryId = undefined;
          if (pathname.includes('board')) {
            galleryId = pathname.split('/')[2];
          }

          if (
            packageIdx === undefined ||
            detailIdx === undefined ||
            hiddenValue === undefined ||
            galleryId === undefined
          ) {
            // console.log(packageIdx, detailIdx, ci_t, hiddenValue, galleryId);

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
          // console.log(accessResponseJson);
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

          // console.log(writeCommentResponseJson);

          if (writeCommentResponseJson.result === true) {
            // alert("SDFD");
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
        } else {
          if (
            packageIdx === undefined ||
            detailIdx === undefined ||
            ci_t === undefined ||
            check6Value === undefined ||
            check7Value === undefined ||
            check8Value === undefined
          ) {
            // console.log(packageIdx, detailIdx, ci_t, check6Value, check7Value, check8Value);

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
              body: `ci_t=${ci_t}&target=icon&page=${0}`,
              method: 'POST',
              mode: 'cors',
              credentials: 'same-origin',
              // credentials: 'include',
            });
          }

          fetch('https://gall.dcinside.com/dccon/insert_icon', {
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
          }).then(async response => {
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
          });
        }
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
            // if (e.key === 'Enter') {
            //   if (searchInput === debouncedSearchText) {
            //     return;
            //   }
            //   console.log(searchInput);
            //   let t = new Date();
            //   chrome.runtime.sendMessage({ type: 'SEARCH_CON', query: searchInput }, response => {
            //     const res = JSON.parse(response.res);
            //     setQueryResult(new Set(res));
            //     console.log('Time:', new Date().getTime() - t.getTime());
            //   });
            //   setSearchInput('');
            // }
          }}></input>

        {/* <div>
                    검색어 : {
                        debouncedSearchText
                    }
                </div> */}

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

        {/* {debouncedSearchText} */}

        {
          <div className="flex flex-wrap w-[350px] gap-1">
            {debouncedSearchText !== '' &&
              queryResult &&
              Array.from(queryResult).map((detailData, index) => {
                // console.log(queryResult, detailIdxDict, "!@#!@2213#")
                const detailIdx = detailData.detailIdx;

                const divKey = detailData.key;

                // const detailData =

                // console.log(detailData, detailIdxDict, detailIdx, "detailData");

                if (detailData.isDoubleCon === true) {
                  const firstDoubleCon = detailData.firstDoubleCon;
                  const secondDoubleCon = detailData.secondDoubleCon;

                  // console.log(firstDoubleCon, secondDoubleCon, detailData, '!!!!!');

                  // const horizontalItemCount = detailData[]

                  let horizontalItemCount = 3;

                  const nextItem = Array.from(queryResult)[index + 1];
                  // console.log(nextItem);
                  if (nextItem && nextItem.key.includes('/') === true) {
                    horizontalItemCount = 2;
                  }

                  return (
                    <div
                      key={divKey}
                      className={`flex cursor-pointer w-[calc(50%-0.2em)] rounded-md
                        transition-all duration-200
                                          ${
                                            focusedIndex === index
                                              ? ' border-0 scale-[125%]  z-[9999999999] '
                                              : 'scale-100 z-[9999999]'
                                          }
                                          `}
                      ref={el => {
                        imageRefs.current[index] = el;
                      }}
                      onKeyDown={e => handleImageKeyDown(e, index, detailData, horizontalItemCount)}
                      onFocus={() => {
                        setFocusedIndex(index);
                      }}
                      onBlur={() => {
                        if (focusedIndex === index) {
                          setFocusedIndex(null);
                        }
                      }}
                      tabIndex={0}
                      onClick={e => {
                        onConClick({
                          detailData: secondDoubleCon,
                          e: e,
                          manualFirstDoubleCon: firstDoubleCon,
                        });
                      }}
                      onContextMenu={e => {
                        onConRightClick({
                          detailData: detailData,
                          e: e,
                        });
                      }}>
                      <div className="flex flex-row gap-[0em]">
                        <ImageWithSkeleton src={firstDoubleCon.imgPath} alt={firstDoubleCon.title} doubleConType={0} />
                        <ImageWithSkeleton
                          src={secondDoubleCon.imgPath}
                          alt={secondDoubleCon.title}
                          doubleConType={1}
                        />
                      </div>

                      {true && (
                        <div className="absolute top-0 right-0">
                          <Square2StackIcon className="w-5 h-5 text-white stroke-[0.9] stroke-gray-300" />
                        </div>
                      )}
                      {/* <span>{detailData.title}</span> */}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={divKey}
                      className={`flex cursor-pointer w-[calc(25%-0.2em)] rounded-md
                        transition-all duration-200
                                              ${
                                                focusedIndex === index
                                                  ? ' border-0 scale-125  z-[9999999999]'
                                                  : 'scale-100 z-[9999999]'
                                              }
                                              `}
                      ref={el => {
                        imageRefs.current[index] = el;
                      }}
                      onKeyDown={e => handleImageKeyDown(e, index, detailData)}
                      onFocus={() => {
                        setFocusedIndex(index);
                      }}
                      onBlur={() => {
                        if (focusedIndex === index) {
                          setFocusedIndex(null);
                        }
                      }}
                      tabIndex={0}
                      onClick={e => {
                        onConClick({ detailData, e });
                      }}
                      onContextMenu={e => {
                        onConRightClick({ detailData, e });
                      }}>
                      <ImageWithSkeleton src={detailData.imgPath} alt={detailData.title} doubleConType={-1} />
                      {favoriteConList &&
                        favoriteConList[
                          userPackageData[detailData.packageIdx]?.conList?.[detailData.sort]?.detailIdx
                        ] && (
                          <div className="absolute top-0 right-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="rgb(240,177,0)"
                              className="w-5 h-5"
                              stroke="white"
                              strokeWidth={1.3}
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <path
                                fillRule="evenodd"
                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      {/* <span>{detailData.title}</span> */}
                    </div>
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
                        <div
                          key={detailIdx}
                          className={`flex cursor-pointer w-[calc(25%-0.2em)] rounded-md
                           transition-all duration-200
                                            ${
                                              focusedIndex === index
                                                ? ' border-0 scale-125  z-[9999999999] '
                                                : 'scale-100 z-[9999999]'
                                            }
                                            `}
                          ref={el => {
                            imageRefs.current[index] = el;
                          }}
                          onKeyDown={e => handleImageKeyDown(e, index, detailData)}
                          onFocus={() => {
                            setFocusedIndex(index);
                          }}
                          onBlur={() => {
                            if (focusedIndex === index) {
                              setFocusedIndex(null);
                            }
                          }}
                          tabIndex={0}
                          onClick={e => {
                            onConClick({ detailData, e });
                          }}
                          onContextMenu={e => {
                            onConRightClick({ detailData, e });
                          }}>
                          <ImageWithSkeleton src={detailData.imgPath} alt={detailData.title} doubleConType={-1} />

                          {favoriteConList && favoriteConList[detailData.detailIdx] && (
                            <div className="absolute top-0 right-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="rgb(240,177,0)"
                                className="w-5 h-5"
                                stroke="white"
                                strokeWidth={1.3}
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <path
                                  fillRule="evenodd"
                                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                          {/* <span>{detailData.title}</span> */}
                        </div>
                      );
                    })
                : Array.from(recentUsedDoubleConList)
                    .reverse()
                    .slice(0, 8)
                    .map((detailData, index) => {
                      // console.log(detailData, 'detailData212');

                      const detailIdx = detailData.detailIdx;

                      const firstDoubleCon = detailData.firstDoubleCon;
                      const secondDoubleCon = detailData.secondDoubleCon as any;

                      detailData.isDoubleCon = true;

                      return (
                        <div
                          tabIndex={isDoubleConPresetEditModalOpen ? -1 : 0}
                          key={detailIdx}
                          className={`flex cursor-pointer w-[calc(50%-0.2em)] rounded-md
                          transition-all duration-200
                                            ${
                                              focusedIndex === index
                                                ? ' border-0 scale-[125%]  z-[9999999999] '
                                                : 'scale-100 z-[9999999]'
                                            }
                                            `}
                          ref={el => {
                            imageRefs.current[index] = el;
                          }}
                          onKeyDown={e => handleImageKeyDown(e, index, detailData, 2)}
                          onFocus={() => {
                            setFocusedIndex(index);
                          }}
                          onBlur={() => {
                            if (focusedIndex === index) {
                              setFocusedIndex(null);
                            }
                          }}
                          onClick={e => {
                            onConClick({
                              detailData: secondDoubleCon,
                              e: e,
                              manualFirstDoubleCon: firstDoubleCon,
                            });
                          }}
                          onContextMenu={e => {
                            // onConRightClick({ detailData, e });
                            onConRightClick({
                              detailData: detailData,
                              e: e,
                              // firstDoubleCon: firstDoubleCon,
                            });
                          }}>
                          <div className="flex flex-row gap-[0em]">
                            <ImageWithSkeleton
                              src={firstDoubleCon.imgPath}
                              alt={firstDoubleCon.title}
                              doubleConType={0}
                            />
                            <ImageWithSkeleton
                              src={secondDoubleCon.imgPath}
                              alt={secondDoubleCon.title}
                              doubleConType={1}
                            />
                          </div>

                          {true && (
                            <div className="absolute top-0 right-0">
                              <Square2StackIcon className="w-5 h-5 text-white stroke-[0.9] stroke-gray-300" />
                            </div>
                          )}
                          {/* <span>{detailData.title}</span> */}
                        </div>
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
            setCurrentPage(1);
            setIsEditMode(false);

            return;
          }}>
          {/* <Cog6ToothIcon
            className=" inline-block"
            style={{
              width: '1em',
              height: '1em',
            }}
          /> */}
          <ListBulletIcon
            className="inline-block "
            style={{
              width: '1em',
              height: '1em',
            }}
          />
          콘 목록
        </div>
        {(() => {
          async function saveDoubleConPreset() {
            doubleConPresetEditData.tag = doubleConPresetEditData.tag
              .split(' ')
              .filter((word: string) => word.length > 0)
              .join(' ');

            if (doubleConPresetEditData.tag === '') {
              makeToast('태그를 입력해주세요!');
              return;
            }

            const prevCustomConList = (await Storage.getCustomConList()) as any;

            if (prevCustomConList === null || prevCustomConList === undefined) {
              return;
            }

            if (prevCustomConList?.['doubleConPreset'] === undefined) {
              prevCustomConList['doubleConPreset'] = {};
            }

            // 딕셔너리 형태로 처리
            const presetKey = doubleConPresetEditData.presetKey;

            // 이미 존재하는 경우 업데이트, 없는 경우 추가
            prevCustomConList['doubleConPreset'][presetKey] = {
              presetKey: doubleConPresetEditData.presetKey,
              tag: doubleConPresetEditData.tag,
              firstDoubleCon: {
                packageIdx: doubleConPresetEditData.firstDoubleCon.packageIdx,
                sort: doubleConPresetEditData.firstDoubleCon.sort,
              },
              secondDoubleCon: {
                packageIdx: doubleConPresetEditData.secondDoubleCon.packageIdx,
                sort: doubleConPresetEditData.secondDoubleCon.sort,
              },
            };

            await Storage.setCustomConList(prevCustomConList);

            chrome.runtime.sendMessage(
              {
                type: 'CHANGED_DATA',
              },
              response => {
                // console.log(response);
                // const conSearchTmp = new ConSearch();
                // conSearchTmp.deserialize(response.conSearch);

                // setConSearch(conSearchTmp);
                makeToast('저장 완료!');
              },
            );

            setIsDoubleConPresetEditModalOpen(false);
          }

          return (
            <Modal isOpen={isDoubleConPresetEditModalOpen} onClose={() => setIsDoubleConPresetEditModalOpen(false)}>
              <div className="flex flex-col gap-2 items-center">
                <div className="flex flex-row justify-between items-center w-full mb-3">
                  <div className="w-[50px]"></div>
                  <div className="font-bold text-center w-full ">더블콘 프리셋 수정</div>
                  <div className="w-[50px] flex justify-end">
                    <XMarkIcon
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => setIsDoubleConPresetEditModalOpen(false)}
                      // tabIndex={2}
                    />
                  </div>
                </div>

                {/* {
                    doubleConPresetEditData.presetKey
                  } */}

                {doubleConPresetEditData.firstDoubleCon && (
                  <div className="flex flex-row w-[200px]">
                    <ImageWithSkeleton
                      src={doubleConPresetEditData.firstDoubleCon.imgPath}
                      alt={doubleConPresetEditData.firstDoubleCon.title}
                      doubleConType={0}
                    />
                    <ImageWithSkeleton
                      src={doubleConPresetEditData.secondDoubleCon.imgPath}
                      alt={doubleConPresetEditData.secondDoubleCon.title}
                      doubleConType={1}
                    />
                  </div>
                )}

                <div className="flex flex-row gap-2 items-center">
                  <div className="flex-grow font-semibold text-lg sm:text-sm">태그</div>
                  <input
                    type="text"
                    className="border px-2 py-2 rounded-lg
                      bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
                      w-[220px] sm:max-w-[80%]
                      "
                    spellCheck="false"
                    tabIndex={0}
                    value={doubleConPresetEditData.tag}
                    onChange={e => {
                      setDoubleConPresetEditData({
                        ...doubleConPresetEditData,
                        tag: e.target.value,
                      });
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        saveDoubleConPreset();
                      }
                    }}></input>
                </div>

                <div
                  className="
                                      mt-4
                                      cursor-pointer flex-grow    text-center
                text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5   dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                                  w-full"
                  tabIndex={1}
                  onClick={saveDoubleConPreset}>
                  확인
                </div>
              </div>
            </Modal>
          );
        })()}
      </div>
    </div>
  );
};

export default SearchPage;
