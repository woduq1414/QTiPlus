import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, use } from 'react';

import Storage from '@extension/shared/lib/storage';
import ConSearch from '@src/class/Trie';
import { WithContext as ReactTags, SEPARATORS } from 'react-tag-input';

import { Tag } from 'react-tag-input';
import makeToast from '@src/functions/toast';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid';
import ImageWithSkeleton from './ImageWithSkeleton';

interface Item {
  presetKey: string;
  tag: string;
  firstDoubleCon: any;
  secondDoubleCon: any;
}

const DoubleConPresetEditPage: React.FC = props => {
  const {
    userPackageData,
    userId,
    setUserPackageData,
    setCurrentPage,
    conSearch,
    setConSearch,
    setDetailIdxDict,
    setIsEditMode,
  } = useGlobalStore();
  const [items, setItems] = useState<Item[]>(
    Array.from({ length: 1 }, (_, index) => ({
      tag: '',
      presetKey: '',
      firstDoubleCon: '',
      secondDoubleCon: '',
    })),
  );

  useEffect(() => {
    async function func() {
      const data = (await Storage.getCustomConList()) as any | null;

      //   console.log(data);

      if (!data) {
        return;
      }

      const doubleConPreset = data['doubleConPreset'];
      if (!doubleConPreset) {
        return;
      }

      let newData = {} as any;

      // 딕셔너리 형태로 처리
      for (const key in doubleConPreset) {
        const item = doubleConPreset[key];
        const firstDoubleCon = item.firstDoubleCon;
        const secondDoubleCon = item.secondDoubleCon;
        const tag = item.tag;

        if (firstDoubleCon === undefined || secondDoubleCon === undefined) {
          continue;
        }

        const isFirstConAvailable =
          userPackageData?.[firstDoubleCon.packageIdx] !== undefined &&
          userPackageData?.[firstDoubleCon.packageIdx].isHide !== true;
        const isSecondConAvailable =
          userPackageData?.[secondDoubleCon.packageIdx] !== undefined &&
          userPackageData?.[secondDoubleCon.packageIdx].isHide !== true;

        if (!isFirstConAvailable || !isSecondConAvailable) {
          continue;
        }

        const firstDoubleConData = userPackageData?.[firstDoubleCon.packageIdx].conList[firstDoubleCon.sort];
        const secondDoubleConData = userPackageData?.[secondDoubleCon.packageIdx].conList[secondDoubleCon.sort];

        newData[key] = {
          tag: item.tag,
          firstDoubleCon: {
            imgPath: firstDoubleConData.imgPath,
            packageIdx: firstDoubleCon.packageIdx,
            sort: firstDoubleCon.sort,
            title: firstDoubleConData.title,
          },
          secondDoubleCon: {
            imgPath: secondDoubleConData.imgPath,
            packageIdx: secondDoubleCon.packageIdx,
            sort: secondDoubleCon.sort,
            title: secondDoubleConData.title,
          },
        };
      }

      // sort by key

      newData = Object.fromEntries(
        Object.entries(newData).sort((a, b) => {
          return a[0].localeCompare(b[0]);
        }),
      );
      // console.log(newData);

      setItems(
        Object.keys(newData).map(key => {
          return {
            presetKey: key,
            ...newData[key],
          };
        }),
      );

      // console.log(newData);

      // let newData = {} as any;
      // for (let key in data) {
      //   newData[key] = data[key].join(' ');
      // }

      // setItems(
      //   Object.keys(newData).map(key => {
      //     return {
      //       key: key,
      //       value: newData[key],
      //     };
      //   }),
      // );
    }
    func();
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none max-w-[800px]  mx-auto flex-col z-[999999999]
        `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4   w-[600px] max-w-[100vw]
      text-black
      dark:bg-[rgba(46,46,46,0.75)] dark:text-white 
      "
        style={{
          backdropFilter: 'blur(15px)',
        }}>
        <div className="flex flex-row ">
          <div
            className="w-[90px] cursor-pointer"
            onClick={() => {
              // setUserPackageData(null);
              setCurrentPage(3);

              // setIsEditMode(true);
            }}>
            이전
          </div>
          <div className="flex-grow text-center font-semibold">
            <h1>더블콘 프리셋</h1>
          </div>
          <div className="w-[90px]"></div>
        </div>

        <div className="text-sm w-full text-center">
          새로운 프리셋 추가는 최근 사용한 더블콘 목록에서 해당 더블콘을 우클릭(Alt + S)하면 가능합니다.
        </div>

        <div className="flex flex-col gap-1 max-h-[65vh] overflow-auto scrollbar">
          {items &&
            items.map((item: any, idx: number) => {
              // const item = items[idx];
              return (
                <div className="flex flex-row gap-2 items-center mb-1" key={idx}>
                  <TrashIcon
                    className="w-4 h-4 cursor-pointer
                                        text-gray-600 dark:text-gray-400
                                        hover:text-red-400 dark:hover:text-red-400"
                    onClick={() => {
                      let newItems = [...items];
                      newItems.splice(idx, 1);
                      setItems(newItems);
                    }}
                  />
                  <div className="flex flex-row w-[140px] ">
                    <img
                      src={item.firstDoubleCon?.imgPath}
                      alt=""
                      className="w-[70px] h-[70px] rounded-tl-md rounded-bl-md"
                    />
                    <img
                      src={item.secondDoubleCon?.imgPath}
                      alt=""
                      className="w-[70px] h-[70px] rounded-tr-md rounded-br-md"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder=""
                    value={item.tag}
                    className="border px-2 py-2 rounded-lg flex-grow
           bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
           "
                    onChange={e => {
                      let newItems = [...items];
                      newItems[idx].tag = e.target.value;
                      setItems(newItems);
                    }}
                    spellCheck="false"
                  />
                </div>
              );
            })}
        </div>

        <div
          className="
                    mt-3
                    cursor-pointer
          text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
          "
          onClick={async () => {
            let newItems = items.map((item: any) => {
              return {
                presetKey: item.presetKey,
                tag: item.tag
                  .split(' ')
                  .filter((word: string) => word.length > 0)
                  .join(' '),
                firstDoubleCon: item.firstDoubleCon,
                secondDoubleCon: item.secondDoubleCon,
              };
            });

            let customConList = (await Storage.getCustomConList()) as any | null;
            if (customConList === null || customConList === undefined) {
              customConList = {};
            }

            customConList['doubleConPreset'] = newItems;

            // console.log(newItems);

            await Storage.setCustomConList(customConList);

            chrome.runtime.sendMessage({ type: 'CHANGED_DATA' }, response => {
              // const conSearchTmp = new ConSearch();
              // conSearchTmp.deserialize(response.conSearch);

              // setConSearch(conSearchTmp);

              makeToast('저장 완료!');
            });

            return;

            // setCurrentPage(3);
          }}>
          저장
        </div>

        {/* <div>unicro_id : {userId}</div> */}
      </div>
    </div>
  );
};

export default DoubleConPresetEditPage;
