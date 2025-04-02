import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';

import readLocalStorage from '@src/functions/storage';
import ConSearch from '@src/class/Trie';
import { WithContext as ReactTags, SEPARATORS } from 'react-tag-input';

import { Tag } from 'react-tag-input';
import makeToast from '@src/functions/toast';

interface ConInfoEditPageProps {
  packageIdx: number;
}

interface Item {
  id: number;
  title: string;
  tag: string;
  who: boolean[];
}

const ConInfoEditPage: React.FC<ConInfoEditPageProps> = props => {
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
    Array.from({ length: 101 }, (_, index) => ({
      id: index,
      title: '',
      tag: '',
      who: [false, false, false, false],
    })),
  );

  const handleChange = (id: number, field: keyof Item, value: any, type: string | undefined = undefined) => {
    if (field === 'who' && type !== 'one') {
      setItems(prevItems => prevItems.map(item => (item.id >= id ? { ...item, [field]: value } : item)));
    } else {
      setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    }
  };
  const packageIdx = props.packageIdx;

  useEffect(() => {
    if (userPackageData === null) return;
    if (userPackageData[packageIdx] === undefined) return;

    async function fetchConInfo() {
      let tmp: any;
      const prevCustomConList = await readLocalStorage('CustomConList');
      if (prevCustomConList === null || prevCustomConList === undefined) {
        return;
      } else {
        tmp = prevCustomConList;
      }
      let isCreateNew = false;
      if (tmp[packageIdx] === undefined) {
        isCreateNew = true;
        tmp[packageIdx] = {
          title: userPackageData[packageIdx].title,
          conList: {},
          packageIdx: packageIdx,
        };
      }

      setItems(
        Array.from({ length: 101 }, (_, index) => {
          if (tmp[packageIdx].conList[String(index)] === undefined)
            return {
              id: index,
              title: '',
              tag: '',
              who: [false, false, false, false],
            };
          const title = tmp[packageIdx].conList[String(index)].title;
          const tag = tmp[packageIdx].conList[String(index)].tag;

          const whoStrList = tmp[packageIdx].conList[String(index)].who;
          let newWho = [false, false, false, false];
          whoStrList.forEach((whoStr: string) => {
            const key = {
              Q: 0,
              W: 1,
              E: 2,
              R: 3,
            }[whoStr];
            if (key === undefined) return;
            newWho[key] = true;
          });

          return {
            id: index,
            title: title,
            tag: tag,
            who: newWho,
          };
        }),
      );
    }

    fetchConInfo();
  }, [userPackageData]);

  if (userPackageData === null) {
    return <div>데이터가 없습니다.</div>;
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none max-w-[100vw] mx-auto flex-col z-[999999999]
        `}>
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 
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
              setCurrentPage(1);

              setIsEditMode(true);
            }}>
            이전
          </div>
          <div className="flex-grow text-center font-semibold">
            <h1>{userPackageData[packageIdx].title}</h1>
          </div>
          <div className="w-[90px]"></div>
        </div>
        <div className="flex flex-col gap-2 sm:gap-8 max-h-[65vh] overflow-y-auto overflow-auto scrollbar">
          {userPackageData[packageIdx] &&
            Object.keys(userPackageData[packageIdx].conList).map(key => {
              const item = items[parseInt(key)];

              return (
                <div key={key} className="flex flex-row gap-2 items-center sm:flex-col sm:gap-2">
                  <img src={userPackageData[packageIdx].conList[key].imgPath} alt="" className="w-[70px] h-[70px]" />
                  <input
                    type="text"
                    placeholder="이름"
                    value={item.title}
                    onChange={e => handleChange(item.id, 'title', e.target.value)}
                    className="border px-2 py-2 rounded-lg
                    bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
                    w-[220px] sm:w-[70vw]
                    "
                    spellCheck="false"
                  />
                  <input
                    type="text"
                    // list="tagList"
                    placeholder="태그"
                    value={item.tag}
                    onChange={e => handleChange(item.id, 'tag', e.target.value)}
                    className="border px-2 py-2 rounded-lg
                    bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
                     w-[220px] sm:w-[70vw]
                    "
                    spellCheck="false"
                  />

                  <div className="flex flex-row gap-0.5">
                    {['Q', 'W', 'E', 'R'].map((who: string, idx) => {
                      const colorMap: { [key: string]: string } = {
                        Q: 'bg-[rgba(160,160,160,1)]',
                        W: 'bg-[rgba(239,135,181,1)]',
                        E: 'bg-[rgba(6,189,237,1)]',
                        R: 'bg-[rgba(195,215,115,1)]',
                      };
                      return (
                        <div
                          key={who}
                          className={`flex w-8 h-8 items-center justify-center cursor-pointer rounded-lg
                                        ${colorMap[who]}
                                        ${item.who[idx] ? 'opacity-100 border-4 border-gray-600 dark:border-gray-300' : 'opacity-20'}
                                        
                                        `}
                          onClick={e => {
                            const newWho = [...item.who];
                            newWho[idx] = !newWho[idx];

                            if (e.ctrlKey) {
                              handleChange(item.id, 'who', newWho, 'one');
                            } else {
                              handleChange(item.id, 'who', newWho);
                            }
                          }}></div>
                      );
                    })}
                  </div>
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
            let newConList = items.reduce((acc, cur) => {
              // if (cur.title === '' && cur.tag === '') return acc;
              if (userPackageData[packageIdx].conList[cur.id] === undefined) {
                return acc;
              }
              acc[String(cur.id)] = {
                title: cur.title,
                tag: cur.tag
                  .split(' ')
                  .filter((word: string) => word.length > 0)
                  .join(' '),
                imgPath: userPackageData[packageIdx].conList[cur.id].imgPath,
                who: cur.who.map((who, idx) => (who ? ['Q', 'W', 'E', 'R'][idx] : '')).filter(who => who !== ''),
              };
              return acc;
            }, {} as any);

            newConList = {
              conList: newConList,
              title: userPackageData[packageIdx].title,
              packageIdx: String(packageIdx),
            };

            let oldCustomConList = await readLocalStorage('CustomConList');

            if (oldCustomConList === null || oldCustomConList === undefined) {
              oldCustomConList = {};
            }

            let newCustomConList = { ...(oldCustomConList || {}), [packageIdx]: newConList };

            // console.log(newCustomConList);

            chrome.storage.local.set({ ['CustomConList']: newCustomConList }, async function () {
              // console.log('Value is set to ', newCustomConList);

              chrome.runtime.sendMessage({ type: 'CHANGED_DATA' }, response => {
                // console.log(response);
                // const conSearchTmp = new ConSearch();
                // conSearchTmp.deserialize(response.conSearch);

                // setConSearch(conSearchTmp);
                setDetailIdxDict(response.detailIdxDict);

                makeToast('저장 완료!');

                chrome.runtime.sendMessage({
                  type: 'TRIGGER_EVENT',
                  action: 'CON_INFO_EDIT',
                  data: {
                    packageIdx: packageIdx,
                  },
                });
              });
            });

            // const newUserPackageData = { ...userPackageData };
            // newUserPackageData[packageIdx].conList = newConList;
            // setUserPackageData(newUserPackageData);
          }}>
          저장
        </div>
        {/* <div>unicro_id : {userId}</div> */}
      </div>
    </div>
  );
};

export default ConInfoEditPage;
