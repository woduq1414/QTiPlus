import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, MouseEventHandler } from 'react';

import parseCookies from '@src/functions/cookies';
import readLocalStorage from '@src/functions/storage';
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
  StarIcon,
  TrashIcon,
} from '@heroicons/react/16/solid';
import { CheckCircleIcon as CheckCircleIconOutline } from '@heroicons/react/24/outline';
import { title } from 'process';
import makeToast from '@src/functions/toast';

interface SearchPageProps {
  detailIdxDict: Record<string, any>;
}

const SearchPage: React.FC<SearchPageProps> = props => {
  const pageSize = 16;
  const {
    currentPage,
    setCurrentPage,
    userPackageData,
    setIsModalOpen,
    isModalOpen,
    unicroId,
    setIsEditMode,
    setting,
  } = useGlobalStore();

  const detailIdxDict = props.detailIdxDict;

  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [queryResult, setQueryResult] = useState<Set<string>>();

  const debouncedSearchText = useDebounce(searchInput, 250);

  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [isDoubleCon, setIsDoubleCon] = useState<boolean>(false);

  const [isBigCon, setIsBigCon] = useState<boolean>(false);

  const [firstDoubleCon, setFirstDoubleCon] = useState<any>(null);

  const [recentUsedConList, setRecentUsedConList] = useState<any[]>([]);

  const [queryPage, setQueryPage] = useState<number>(1);
  const [queryMaxPage, setQueryMaxPage] = useState<number>(1);

  const [originalQueryResult, setOriginalQueryResult] = useState<any>();

  const [favoriteConList, setFavoriteConList] = useState<any>({});

  const [bigConExpire, setBigConExpire] = useState<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && queryResult !== undefined && queryResult.size > 0) {
      e.preventDefault(); // 기본 Tab 동작 방지
      setFocusedIndex(0);
    }
  };

  const handleImageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number, detailData: any) => {
    let targetResultSize = undefined;
    if (queryResult === undefined) {
      targetResultSize = recentUsedConList.length;
    } else {
      targetResultSize = queryResult.size;
    }

    // detect if ctrl key is pressed

    if (e.ctrlKey) {
      if (e.key === 'Enter') {
        onConClick({ detailData, e });

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
      setFocusedIndex(prev => (prev !== null ? Math.min(prev + 4, targetResultSize - 1) : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev !== null ? Math.max(prev - 4, 0) : 0));
    } else if (e.key === 'Enter') {
      onConClick({ detailData, e });
      // imageRefs.current[index]?.click();
    } else if (e.key === 'Tab') {
      if (index === targetResultSize - 1) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    } else if (e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'ㄴ')) {
      e.preventDefault(); // 기본 동작 방지

      onConRightClick({ detailData: detailData, e });

      console.log('alt + s');
    }
  };

  useEffect(() => {
    if (debouncedSearchText) {
      let t = new Date();
      chrome.runtime.sendMessage({ type: 'SEARCH_CON', query: debouncedSearchText, unicroId: unicroId }, response => {
        const res = JSON.parse(response.res);

        //
        // setQueryResult(new Set(res));

        // one page is 16

        setQueryMaxPage(Math.ceil(res.length / pageSize));
        setQueryPage(1);

        setOriginalQueryResult(res);

        setFocusedIndex(-1);

        console.log(`Query : ${debouncedSearchText} took ${new Date().getTime() - t.getTime()}ms`);
      });
    } else {
      setQueryResult(undefined);
    }
  }, [debouncedSearchText]);

  useEffect(() => {
    const startIdx = (queryPage - 1) * pageSize;
    const endIdx = queryPage * pageSize;
    if (originalQueryResult === undefined) return;
    const slicedRes = originalQueryResult.slice(startIdx, endIdx);

    setQueryResult(new Set(slicedRes));
  }, [queryPage, originalQueryResult]);

  useEffect(() => {
    if (isModalOpen) {
      searchInputRef.current?.focus();

      setIsDoubleCon(false);

      setFirstDoubleCon(null);
      const recentUsedConListKey = `RecentUsedConList_${unicroId}`;
      readLocalStorage(recentUsedConListKey).then(data => {
        if (data === null) {
          setRecentUsedConList([]);
        } else {
          if (data === undefined) {
            setRecentUsedConList([]);
          } else {
            setRecentUsedConList(data as any);
          }
        }
      });

      const favoriteConListKey = `FavoriteConList_${unicroId}`;
      readLocalStorage(favoriteConListKey).then(data => {
        if (data === null) {
          setFavoriteConList({});

          chrome.storage.local.set({ [favoriteConListKey]: {} }, async function () {
            // console.log('Value is set to ', {});
          });
        } else {
          if (data === undefined) {
            setFavoriteConList({});
          } else {
            setFavoriteConList(data as any);
          }
        }
      });

      const bigConExpireKey = `BigConExpire_${unicroId}`;
      readLocalStorage(bigConExpireKey).then(data => {
        if (data === null) {
          setBigConExpire(0);
          setIsBigCon(false);
        }
        if (data === undefined) {
          setBigConExpire(0);
          setIsBigCon(false);
        } else {
          setBigConExpire(data as number);

          if ((data as number) > new Date().getTime() / 1000) {
            if (setting.isDefaultBigCon) {
              setIsBigCon(true);
            } else {
              setIsBigCon(false);
            }
          } else {
            setIsBigCon(false);
          }
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
    queryPageRef.current = queryPage;
    queryMaxPageRef.current = queryMaxPage;
  }, [queryPage, queryMaxPage]);

  useEffect(() => {
    const handleKeyDown = (event: { altKey: any; shiftKey: any; key: string; preventDefault: () => void }) => {
      if (event.altKey && event.key === '2') {
        event.preventDefault(); // 기본 동작 방지
        toggleDoubleCon();
        console.log('alt + 2');
      } else if (event.altKey && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault(); // 기본 동작 방지

        setIsBigCon(prev => !prev);
        console.log('alt + B');
      } else if (event.shiftKey && event.key === 'ArrowRight') {
        event.preventDefault(); // 기본 동작 방지

        // get current state of queryMaxPage
        const queryPage = queryPageRef.current;
        const queryMaxPage = queryMaxPageRef.current;

        if (queryPage < queryMaxPage) {
          setQueryPage(prev => prev + 1);
          setFocusedIndex(0);
        }
        console.log('alt + ArrowRight');
      } else if (event.shiftKey && event.key === 'ArrowLeft') {
        event.preventDefault(); // 기본 동작 방지

        // get current state of queryMaxPage
        const queryPage = queryPageRef.current;

        if (queryPage > 1) {
          setQueryPage(prev => prev - 1);
          setFocusedIndex(0);
        }
        console.log('alt + ArrowLeft');
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
    console.log('right click', detailData);

    const detailIdx = userPackageData[detailData.packageIdx].conList[detailData.sort].detailIdx;

    const favoriteConListKey = `FavoriteConList_${unicroId}`;

    let prevfavoriteConList = (await readLocalStorage(favoriteConListKey)) as any;

    if (prevfavoriteConList === null) {
      prevfavoriteConList = {};
    }

    if (prevfavoriteConList[detailIdx] === undefined) {
      prevfavoriteConList[detailIdx] = true;
    } else {
      delete prevfavoriteConList[detailIdx];
    }

    chrome.storage.local.set({ [favoriteConListKey]: prevfavoriteConList }, async function () {
      // console.log('Value is set to ', prevfavoriteConList);
    });

    setFavoriteConList(prevfavoriteConList);
  }

  async function onConClick({ detailData, e }: { detailData: any; e?: React.KeyboardEvent<HTMLDivElement> | any }) {
    {
      // console.log(e);

      const isMobileVersion = window.location.host === 'm.dcinside.com';

      const recentUsedConListKey = `RecentUsedConList_${unicroId}`;

      let recentUsedConList = (await readLocalStorage(recentUsedConListKey)) as any[];
      if (recentUsedConList === null) {
        recentUsedConList = [];
      }

      // return;

      let packageIdx = detailData.packageIdx;

      let detailIdx = userPackageData[packageIdx].conList[detailData.sort].detailIdx;

      if (isDoubleCon) {
        if (firstDoubleCon === null) {
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
          chrome.storage.local.set({ [recentUsedConListKey]: recentUsedConList }, async function () {
            // console.log('Value is set to ', recentUsedConList);
          });

          setRecentUsedConList(recentUsedConList);

          if (!e.ctrlKey) {
            setQueryResult(undefined);
            setSearchInput('');

            searchInputRef.current?.focus();
          }

          return;
        } else {
          packageIdx = `${firstDoubleCon.packageIdx}, ${packageIdx}`;
          detailIdx = `${firstDoubleCon.detailIdx}, ${detailIdx}`;
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

        if (firstDoubleCon) {
          recentUsedConList = recentUsedConList.filter((con: any) => {
            return con.detailIdx !== firstDoubleCon.detailIdx;
          });
          recentUsedConList.push({
            packageIdx: firstDoubleCon.packageIdx,
            detailIdx: firstDoubleCon.detailIdx,
            imgPath: firstDoubleCon.imgPath,
            sort: firstDoubleCon.sort,
            title: firstDoubleCon.title,
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

      recentUsedConList = recentUsedConList.slice(-12);

      chrome.storage.local.set({ [recentUsedConListKey]: recentUsedConList }, async function () {
        // console.log('Value is set to ', recentUsedConList);
      });

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
                src="https:${firstDoubleCon.imgPath}"
                alt="1" detail="${firstDoubleCon.detailIdx}"></span><span class="cont-inr"><span class="pos"><span
                    class="order-handle"></span></span><img class="written_dccon dccon-img ${isBigCon ? 'bigdccon' : ''}"
                src="https:${detailData.imgPath}"
                alt="2" detail="${detailData.detailIdx}"></span></span></div>
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
                alt="0" detail="${detailData.detailIdx}"></span></span></div>

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
              `<img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${firstDoubleCon.imgPath}" conalt="0" alt="0" con_alt="0" title="0" detail="${firstDoubleCon.detailIdx}">
             
              `,
            );
          }
          document.execCommand(
            'insertHTML',
            false,
            `<img class="written_dccon ${isBigCon ? 'bigdccon' : ''}" src="https:${detailData.imgPath}" conalt="0" alt="0" con_alt="0" title=0" detail="${detailData.detailIdx}">`,
          );
        }

        setIsModalOpen(false);

        if (isBigCon) {
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
      } else {
        if (isMobileVersion) {
          const hiddenValueInput = document.getElementsByClassName('hide-robot')[0] as HTMLInputElement;

          const hiddenValue = hiddenValueInput ? hiddenValueInput.getAttribute('name') : undefined;
          if (packageIdx === undefined || detailIdx === undefined || ci_t === undefined || hiddenValue === undefined) {
            console.log(packageIdx, detailIdx, ci_t, check6Value, check7Value, check8Value);

            setIsModalOpen(false);

            if (isDoubleCon) {
              let gifUrl = `https:${firstDoubleCon.imgPath}`;
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
          const accessResponse = await fetch('https://m.dcinside.com/ajax/access', {
            headers: {
              accept: '*/*',
              'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6',
              'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'x-csrf-token': '582d8e4b515ca5b04e7c9bcd9ec7b3ee',
              'x-requested-with': 'XMLHttpRequest',
            },
            referrer: 'https://m.dcinside.com/board/freewrite/4906',
            referrerPolicy: 'unsafe-url',
            body: 'token_verify=com_submit',
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          });

          const accessResponseJson = await accessResponse.json();
          console.log(accessResponseJson);
          const blockKey = accessResponseJson.Block_key;

          const isReply = document.getElementById('comment_memo_reple') ? true : false;

          const no = document.getElementById('no')?.getAttribute('value');
          const subject = document.getElementById('subject')?.getAttribute('value');

          const comment_no = document.getElementById('comment_no')?.getAttribute('value');

          let commentMemo = `<img src='https:${detailData.imgPath}' class='written_dccon' alt='8' conalt='8' title='8' detail='${detailIdx}'>`;
          if (isDoubleCon) {
            commentMemo =
              `<img src='https:${firstDoubleCon.imgPath}' class='written_dccon' alt='8' conalt='8' title='8' detail='${firstDoubleCon.detailIdx}'>` +
              commentMemo;
          }

          let newDetailIdx = detailIdx;

          if (isDoubleCon) {
            newDetailIdx = `${firstDoubleCon.detailIdx}|dccon|${detailIdx}`;
          }

          const writeCommentResponse = await fetch('https://m.dcinside.com/ajax/comment-write', {
            headers: {
              accept: '*/*',
              'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,de;q=0.6',
              'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'x-csrf-token': '582d8e4b515ca5b04e7c9bcd9ec7b3ee',
              'x-requested-with': 'XMLHttpRequest',
            },
            referrer: `https://m.dcinside.com/board/freewrite/${no}`,
            referrerPolicy: 'unsafe-url',
            body: `comment_memo=${encodeURIComponent(commentMemo)}&comment_nick=&comment_pw=&mode=${
              isReply ? 'com_reple' : 'com_write'
            }&comment_no=${comment_no}&detail_idx=${newDetailIdx}&id=freewrite&no=${no}&best_chk=&subject=${subject}&board_id=1&reple_id=&con_key=${blockKey}&${hiddenValue}=1&use_gall_nickname=&${
              isBigCon ? 'use_bigdccon=1' : ''
            }`,
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          });

          const writeCommentResponseJson = await writeCommentResponse.json();

          console.log(writeCommentResponseJson);

          if (writeCommentResponseJson.result === true) {
            // alert("SDFD");
            makeToast('등록 성공!');

            const el = document.getElementsByClassName('sp-reload')[0] as HTMLElement;
            el.setAttribute('href', '');
            el.setAttribute('onclick', 'comment_list(0)');
            el.click();

            setIsModalOpen(false);

            if (isDoubleCon) {
              chrome.runtime.sendMessage({
                type: 'TRIGGER_EVENT',
                action: 'DCCON_INSERT',
                data: {
                  packageIdx: firstDoubleCon.packageIdx,
                  sort: firstDoubleCon.sort,
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
            console.log(packageIdx, detailIdx, ci_t, check6Value, check7Value, check8Value);

            setIsModalOpen(false);

            if (isDoubleCon) {
              let gifUrl = `https:${firstDoubleCon.imgPath}`;
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
            referrer: `https://gall.dcinside.com/mgallery/board/view/?id=qwer_fan&no=${postNumber}&page=1`,
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
                    packageIdx: firstDoubleCon.packageIdx,
                    sort: firstDoubleCon.sort,
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
                onClick={() => setIsBigCon(prev => !prev)}>
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

        {debouncedSearchText === '' && !queryResult && recentUsedConList && recentUsedConList.length > 0 && (
          <span className="text-md font-semibold mb-1 text-gray-800 dark:text-gray-200">최근 사용한 콘</span>
        )}

        {
          <div className="flex flex-wrap w-[350px] gap-1">
            {queryResult &&
              Array.from(queryResult).map((detailIdx, index) => {
                const detailData = detailIdxDict[detailIdx];

                // console.log(detailData, detailIdxDict, detailIdx, "detailData");

                return (
                  <div
                    key={detailIdx}
                    className={`flex cursor-pointer w-[calc(25%-0.2em)] rounded-md
                                            ${
                                              focusedIndex === index
                                                ? ' border-4 scale-125 transition-all duration-200 z-[9999999999] '
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
                    <ImageWithSkeleton src={detailData.imgPath} alt={detailData.title} />
                    {favoriteConList &&
                      favoriteConList[userPackageData[detailData.packageIdx].conList[detailData.sort].detailIdx] && (
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
              })}

            {debouncedSearchText === '' &&
              !queryResult &&
              Array.from(recentUsedConList)
                .reverse()
                .map((detailData, index) => {
                  const detailIdx = detailData.detailIdx;

                  return (
                    <div
                      key={detailIdx}
                      className={`flex cursor-pointer w-[calc(25%-0.2em)] rounded-md
                                            ${
                                              focusedIndex === index
                                                ? ' border-4 scale-125 transition-all duration-200 z-[9999999999] '
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
                      <ImageWithSkeleton src={detailData.imgPath} alt={detailData.title} />

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
                })}
          </div>
        }
        {queryResult && queryMaxPageRef.current > 1 && (
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

        {/* <div className="flex flex-col gap-2">
                  {userPackageData &&
                    Object.keys(userPackageData).map(key => {
                      const packageData = userPackageData[key];
                      return (
                        <div
                          key={key}
                          onClick={async () => {
                            console.log(packageData);
                            console.log(chrome, chrome.tabs);
        
                            chrome.runtime.sendMessage({
                              action: 'openTab',
                              url: 'https://dcimg5.dcinside.com/',
                              data: packageData,
                            });
        
                          }}>
                          <h1>{packageData.title}</h1>
                        </div>
                      );
                    })}
                </div> */}

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
      </div>
    </div>
  );
};

export default SearchPage;
