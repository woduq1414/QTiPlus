import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import parseCookies from '@src/functions/cookies';
import readLocalStorage from '@src/functions/storage';
import getQueryValue from '@src/functions/query';
import useDebounce from '@src/hook/useDebounce';
import ImageWithSkeleton from './ImageWithSkeleton';
import toast from 'react-hot-toast';

interface SearchPageProps {
  detailIdxDict: Record<string, any>;
}

const SearchPage: React.FC<SearchPageProps> = props => {
  const { currentPage, setCurrentPage, userPackageData, setIsModalOpen, isModalOpen } = useGlobalStore();

  const detailIdxDict = props.detailIdxDict;

  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [queryResult, setQueryResult] = useState<Set<string>>();

  const debouncedSearchText = useDebounce(searchInput, 250);

  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (focusedIndex !== null && imageRefs.current[focusedIndex]) {
      imageRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && queryResult !== undefined && queryResult.size > 0) {
      e.preventDefault(); // 기본 Tab 동작 방지
      setFocusedIndex(0);
    }
  };

  const handleImageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (queryResult === undefined) {
      return;
    }

    if (e.key === 'ArrowRight' && index < queryResult.size - 1) {
      setFocusedIndex(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowDown') {
      setFocusedIndex(prev => (prev !== null ? Math.min(prev + 4, queryResult.size - 1) : 0));
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex(prev => (prev !== null ? Math.max(prev - 4, 0) : 0));
    } else if (e.key === 'Enter') {
      imageRefs.current[index]?.click();
    } else if (e.key === 'Tab') {
      if (index === queryResult.size - 1) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
  };

  useEffect(() => {
    if (debouncedSearchText) {
      let t = new Date();
      chrome.runtime.sendMessage({ type: 'SEARCH_CON', query: debouncedSearchText }, response => {
        const res = JSON.parse(response.res);
        setQueryResult(new Set(res));
        setFocusedIndex(-1);

        console.log('Time:', new Date().getTime() - t.getTime());
      });
    } else {
      setQueryResult(undefined);
    }
  }, [debouncedSearchText]);

  useEffect(() => {
    if (isModalOpen) {
      searchInputRef.current?.focus();

      return () => {
        setSearchInput('');
        setQueryResult(undefined);
      };
    }

    return () => {};
  }, [isModalOpen]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none  z-[999999999]
            `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-lg shadow-2xl pointer-events-auto flex flex-col gap-1 
      
      "
        style={{
          backdropFilter: 'blur(15px)',
        }}>
        <input
          onChange={e => {
            setSearchInput(e.target.value);
          }}
          ref={searchInputRef}
          type="text"
          placeholder="검색어를 입력하세요"
          className="border border-gray-300 rounded-md p-2 bg-white/20"
          value={searchInput}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (searchInput === debouncedSearchText) {
                return;
              }
              console.log(searchInput);

              let t = new Date();

              chrome.runtime.sendMessage({ type: 'SEARCH_CON', query: searchInput }, response => {
                const res = JSON.parse(response.res);
                setQueryResult(new Set(res));

                console.log('Time:', new Date().getTime() - t.getTime());
              });

              setSearchInput('');
            }
          }}></input>

        {/* <div>
                    검색어 : {
                        debouncedSearchText
                    }
                </div> */}

        {
          <div className="flex flex-wrap w-[350px] gap-1">
            {queryResult &&
              Array.from(queryResult).map((detailIdx, index) => {
                const detailData = detailIdxDict[detailIdx];

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
                    onKeyDown={e => handleImageKeyDown(e, index)}
                    onFocus={() => {
                      setFocusedIndex(index);
                    }}
                    onBlur={() => {
                      if (focusedIndex === index) {
                        setFocusedIndex(null);
                      }
                    }}
                    tabIndex={0}
                    onClick={async () => {
                      console.log(userPackageData);
                      // return;

                      const packageIdx = detailData.packageIdx;

                      const detailIdx = userPackageData[packageIdx].conList[detailData.sort].detailIdx;
                      console.log(packageIdx, detailIdx);

                      setQueryResult(undefined);

                      //   return;

                      // 사용 예시
                      const postNumber = getQueryValue('no');
                      const galleryId = getQueryValue('id');

                      const check6Value = document.getElementById('check_6')?.getAttribute('value');
                      const check7Value = document.getElementById('check_7')?.getAttribute('value');
                      const check8Value = document.getElementById('check_8')?.getAttribute('value');

                      console.log(postNumber, galleryId, check6Value, check7Value, check8Value);

                      // 사용 예시

                      // const packageIdx = 151346;
                      // const detailIdx = 1241690924;

                      const cookies = parseCookies();
                      const ci_t = cookies['ci_c'];

                      if (
                        packageIdx === undefined ||
                        detailIdx === undefined ||
                        ci_t === undefined ||
                        check6Value === undefined ||
                        check7Value === undefined ||
                        check8Value === undefined
                      ) {
                        return;
                      }
                      const name = document.getElementsByClassName('user_info_input')[0].children[0].textContent;

                      setIsModalOpen(false);

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
                        body: `id=${galleryId}&no=${postNumber}&package_idx=${packageIdx}&detail_idx=${detailIdx}&double_con_chk=&name=${name}&ci_t=${ci_t}&input_type=comment&t_vch2=&t_vch2_chk=&c_gall_id=qwer_fan&c_gall_no=${postNumber}&g-recaptcha-response=&check_6=${check6Value}&check_7=${check7Value}&check_8=${check8Value}&_GALLTYPE_=M`,
                        method: 'POST',
                        mode: 'cors',
                        credentials: 'include',
                      }).then(response => {
                        console.log(response);
                        const refreshButton = document.getElementsByClassName(
                          'btn_cmt_refresh',
                        )[0] as HTMLButtonElement;
                        refreshButton?.click();
                      });
                    }}>
                    <ImageWithSkeleton src={detailData.imgPath} alt={detailData.title} />
                    {/* <span>{detailData.title}</span> */}
                  </div>
                );
              })}
          </div>
        }

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
         underline
          w-full
          mt-2
          "
          onClick={async () => {
            setCurrentPage(1);

            return;

            const cookies = parseCookies();
            const ci_t = cookies['ci_c'];

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

              // 500 밀리 초 후에 리턴
              await new Promise(resolve => setTimeout(resolve, 500));
              return data;
            }

            let data = await fetchList(0);

            const maxPage = data.max_page + 1;
            // const maxPage = 1;

            function processData(data: any) {
              const list = data.list;

              const result: { [key: number]: { packageIdx: number; conList: { [key: string]: any }; title: string } } =
                {};
              list.forEach((item: any) => {
                const detailList = item.detail;

                if (detailList.length === 0) {
                  return;
                }

                const packageIdx = detailList[0].package_idx;
                let packageResult: { packageIdx: number; conList: { [key: string]: any }; title: string } = {
                  packageIdx: packageIdx,
                  conList: {},
                  title: item.title,
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

            const storageKey = `UserPackageData_${ci_t}`;

            chrome.storage.local.set({ [storageKey]: allResult }, async function () {
              console.log('Value is set to ', allResult);
            });
          }}>
          콘 목록
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
