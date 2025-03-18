import parseCookies from '@src/functions/cookies';
import makeToast from '@src/functions/toast';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface SearchPageProps {
  detailIdxDict: Record<string, any>;
}

const ConListPage: React.FC<SearchPageProps> = props => {
  const { userPackageData, unicroId, setUserPackageData, setCurrentPage, setCurrentPackageIdx } = useGlobalStore();

  console.log(userPackageData);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none 
        `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {userPackageData &&
            Object.keys(userPackageData)
              .sort((a, b) => userPackageData[a].title.localeCompare(userPackageData[b].title, 'ko'))
              .map(key => {
                const packageData = userPackageData[key];
                return (
                  <div
                    className="cursor-pointer"
                    key={key}
                    onClick={async () => {
                      setCurrentPackageIdx(packageData.packageIdx);
                      setCurrentPage(2);
                    }}>
                    <h1>{packageData.title}</h1>
                  </div>
                );
              })}
        </div>
        <div
          className="cursor-pointer
          text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
         "
          onClick={async () => {
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

            const storageKey = `UserPackageData_${unicroId}`;

            chrome.storage.local.set({ [storageKey]: allResult }, async function () {
              console.log('Value is set to ', allResult);

              // refresh page

              setUserPackageData(allResult);

              makeToast('동기화 성공!');
            });
          }}>
          동기화 하기
        </div>
        {/* <div>unicro_id : {unicroId}</div> */}
      </div>
    </div>
  );
};

export default ConListPage;
