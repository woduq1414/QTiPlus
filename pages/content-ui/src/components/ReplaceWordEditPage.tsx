import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, use } from 'react';

import readLocalStorage from '@src/functions/storage';
import EmojiSearch from '@src/class/Trie';
import { WithContext as ReactTags, SEPARATORS } from 'react-tag-input';

import { Tag } from 'react-tag-input';
import makeToast from '@src/functions/toast';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid';

interface Item {
  key: string;
  value: string;
}

const ReplaceWordEditPage: React.FC = props => {
  const {
    userPackageData,
    unicroId,
    setUserPackageData,
    setCurrentPage,
    emojiSearch,
    setEmojiSearch,
    setDetailIdxDict,
    setIsEditMode,
  } = useGlobalStore();
  const [items, setItems] = useState<Item[]>(
    Array.from({ length: 1001 }, (_, index) => ({
      key: '',
      value: '',
    })),
  );

  useEffect(() => {
    async function func() {
      const data = (await readLocalStorage('ReplaceWordData')) as { [key: string]: string[] } | null;
      console.log(data);

      if (!data) {
        return;
      }

      let newData = {} as any;
      for (let key in data) {
        newData[key] = data[key].join(' ');
      }

      setItems(
        Object.keys(newData).map(key => {
          return {
            key: key,
            value: newData[key],
          };
        }),
      );
    }
    func();
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none max-w-[800px]  mx-auto flex-col z-[999999999]
        `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4   w-[600px] max-w-[90vw]
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

              setIsEditMode(true);
            }}>
            이전
          </div>
          <div className="flex-grow text-center font-semibold">
            <h1>자동 추가 키워드</h1>
          </div>
          <div className="w-[90px]"></div>
        </div>
        <div className="flex flex-col gap-1 max-h-[65vh] overflow-auto scrollbar">
          <div className="flex flex-row gap-2 items-center ">
            <div className="w-4"></div>
            <div className="w-[100px] text-center text-sm font-semibold">추가 키워드(A)</div>
            <div className="flex-grow text-center text-sm font-semibold">
              조건 키워드(B) - 띄어쓰기로 구분해서 입력해주세요.
            </div>
          </div>
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
                  <input
                    type="text"
                    placeholder="키워드"
                    value={item.key}
                    className="border px-2 py-2 rounded-lg w-[100px]
           bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
           "
                    onChange={e => {
                      let newItems = [...items];
                      newItems[idx].key = e.target.value;
                      setItems(newItems);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="조건 키워드"
                    value={item.value}
                    className="border px-2 py-2 rounded-lg flex-grow
           bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
           "
                    onChange={e => {
                      let newItems = [...items];
                      newItems[idx].value = e.target.value;
                      setItems(newItems);
                    }}
                  />
                </div>
              );
            })}
          <div
            className="flex w-full justify-center gap-2
                        items-center bg-gray-200 dark:bg-gray-800
                        rounded-lg px-2 py-1 cursor-pointer 
                    "
            onClick={() => {
              let newItems = [...items];
              newItems.push({
                key: '',
                value: '',
              });
              setItems(newItems);
            }}>
            <PlusIcon className="w-6 h-6 cursor-pointer text-blue-500" />
            추가하기
          </div>
        </div>

        <div
          className="
                    mt-3
                    cursor-pointer
          text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
          "
          onClick={async () => {
            let newItems = {} as any;
            items.forEach(item => {
              if (item.key && item.value) {
                newItems[item.key] = item.value.split(' ').filter((word: string) => word.length > 0);
              }
            });

            // console.log(newItems);

            chrome.storage.local.set({
              ReplaceWordData: newItems,
            });

            chrome.runtime.sendMessage({ type: 'CHANGED_DATA' }, response => {
              // const emojiSearchTmp = new EmojiSearch();
              // emojiSearchTmp.deserialize(response.emojiSearch);

              // setEmojiSearch(emojiSearchTmp);
              setDetailIdxDict(response.detailIdxDict);

              makeToast('저장 완료!');
            });

            // setCurrentPage(3);
          }}>
          저장
        </div>

        {/* <div>unicro_id : {unicroId}</div> */}
      </div>
    </div>
  );
};

export default ReplaceWordEditPage;
