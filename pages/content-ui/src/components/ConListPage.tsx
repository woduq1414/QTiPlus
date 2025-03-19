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

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');

  useEffect(() => {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === 'SYNC_PROGRESS') {
        console.log(request.data);

        setSyncProgress(` (${request.data.page + 1}/${request.data.maxPage + 1})`);
      }
    });
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none  z-[999999999]
        `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4">
        <div className="flex flex-col gap-2 overflow-auto max-h-[65vh]">
          {userPackageData &&
            Object.keys(userPackageData)
              .sort((a, b) => userPackageData[a].title.localeCompare(userPackageData[b].title, 'ko'))
              .map(key => {
                const packageData = userPackageData[key];
                return (
                  <div className="flex flex-row gap-2 items-center" key={key}>
                    <img
                      src={packageData.mainImg}
                      alt={packageData.title}
                      className="w-[3em] h-[3em] rounded-lg border-2 border-gray-600"
                    />
                    <div
                      className="cursor-pointer"
                      key={key}
                      onClick={async () => {
                        setCurrentPackageIdx(packageData.packageIdx);
                        setCurrentPage(2);
                      }}>
                      <h1>{packageData.title}</h1>
                    </div>
                  </div>
                );
              })}
        </div>
        <div
          className={`cursor-pointer
          text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                            w-[350px]

            ${isSyncing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={async () => {
            if (isSyncing) return;

            const cookies = parseCookies();
            const ci_t = cookies['ci_c'];

            setIsSyncing(true);
            setSyncProgress('');

            chrome.runtime.sendMessage(
              {
                type: 'SYNC_CON_LIST',
                data: {
                  ci_t: ci_t,
                  unicroId: unicroId,
                },
              },
              function (response) {
                console.log(response);

                setUserPackageData(response.data);
                makeToast('동기화 성공!');

                setIsSyncing(false);
              },
            );
          }}>
          {isSyncing ? `동기화 중...${syncProgress}` : '동기화 하기'}
        </div>
        {/* <div>unicro_id : {unicroId}</div> */}
      </div>
    </div>
  );
};

export default ConListPage;
