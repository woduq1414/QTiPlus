import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import parseCookies from '@src/functions/cookies';
import readLocalStorage from '@src/functions/storage';
import getQueryValue from '@src/functions/query';

interface SearchPageProps {
  emojiSearch: {
    addEmoji: (emoji: string, name: string, keywords: string[]) => void;
    searchTrie: (query: string) => Set<string>;
    searchIndex: (keyword: string) => Set<string>;
  };

  detailIdxDict: Record<string, any>;
}

const SearchPage: React.FC<SearchPageProps> = props => {
  const { currentPage, setCurrentPage, userPackageData } = useGlobalStore();

  const emojiSearch = props.emojiSearch;
  const detailIdxDict = props.detailIdxDict;

  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [queryResult, setQueryResult] = useState<Set<string>>();

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none 
            `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4">
        <input
          onChange={e => {
            setSearchInput(e.target.value);
          }}
          ref={searchInputRef}
          type="text"
          placeholder="검색어를 입력하세요"
          className="border border-gray-300 rounded-md p-2"
          value={searchInput}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              console.log(searchInput);

              setQueryResult(emojiSearch.searchTrie(searchInput as string));

              setSearchInput('');
            }
          }}></input>

        {
          <div className="flex flex-wrap w-[350px]">
            {queryResult &&
              Array.from(queryResult).map(detailIdx => {
                const detailData = detailIdxDict[detailIdx];

                return (
                  <div
                    key={detailIdx}
                    className="flex cursor-pointer "
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
                      const name = document.getElementsByClassName('user_info_input')[0].children[0].textContent;

                      const cookies = parseCookies();
                      const ci_t = cookies['ci_c'];

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
                    <img src={detailData.imgPath} alt={detailData.title} className="w-[90px] h-[90px]" />
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
          className="cursor-pointer bg-red-400"
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
