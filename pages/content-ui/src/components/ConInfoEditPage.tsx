import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';
import conInfoData from '../../public/data.json';
import readLocalStorage from '@src/functions/storage';
import EmojiSearch from '@src/class/Trie';
import { WithContext as ReactTags, SEPARATORS } from 'react-tag-input';

import { Tag } from 'react-tag-input';

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
    unicroId,
    setUserPackageData,
    setCurrentPage,
    emojiSearch,
    setEmojiSearch,
    setDetailIdxDict,
  } = useGlobalStore();
  const [items, setItems] = useState<Item[]>(
    Array.from({ length: 101 }, (_, index) => ({
      id: index,
      title: '',
      tag: '',
      who: [false, false, false, false],
    })),
  );

  const handleChange = (id: number, field: keyof Item, value: any) => {
    if (field === 'who') {
      setItems(prevItems => prevItems.map(item => (item.id >= id ? { ...item, [field]: value } : item)));
    } else {
      setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    }
  };
  const packageIdx = props.packageIdx;

  const [tags, setTags] = useState<Array<Tag>>([
    { id: 'India', text: 'India', className: '' },
    { id: 'Vietnam', text: 'Vietnam', className: '' },
    { id: 'Turkey', text: 'Turkey', className: '' },
  ]);

  const handleDelete = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const onTagUpdate = (index: number, newTag: Tag) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1, newTag);
    setTags(updatedTags);
  };

  const handleAddition = (tag: Tag) => {
    setTags(prevTags => {
      return [...prevTags, tag];
    });
  };

  const handleDrag = (tag: Tag, currPos: number, newPos: number) => {
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    setTags(newTags);
  };

  const handleTagClick = (index: number) => {
    console.log('The tag at index ' + index + ' was clicked');
  };

  const onClearAll = () => {
    setTags([]);
  };

  useEffect(() => {
    if (userPackageData === null) return;
    if (userPackageData[packageIdx] === undefined) return;

    async function fetchConInfo() {
      let tmp = conInfoData as any;
      const prevCustomConList = await readLocalStorage('CustomConList');
      if (prevCustomConList === null || prevCustomConList === undefined) {
        tmp = conInfoData;
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

      console.log(tmp, '!!');

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
      className={`fixed inset-0 flex items-center justify-center pointer-events-none max-w-[800px]  mx-auto flex-col
        `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4 ">
        <div className="flex flex-row ">
          <div
            className="w-[90px] cursor-pointer"
            onClick={() => {
              // setUserPackageData(null);
              setCurrentPage(1);
            }}>
            이전
          </div>
          <div className="flex-grow text-center font-semibold">
            <h1>{userPackageData[packageIdx].title}</h1>
          </div>
          <div className="w-[90px]"></div>
        </div>
        <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto">
          {userPackageData[packageIdx] &&
            Object.keys(userPackageData[packageIdx].conList).map(key => {
              const item = items[parseInt(key)];

              return (
                <div key={key} className="flex flex-row gap-2 items-center">
                  <img src={userPackageData[packageIdx].conList[key].imgPath} alt="" className="w-[70px] h-[70px]" />
                  <input
                    type="text"
                    placeholder="Title"
                    value={item.title}
                    onChange={e => handleChange(item.id, 'title', e.target.value)}
                    className="border p-1 mb-2"
                  />
                  <input
                    type="text"
                    // list="tagList"
                    placeholder="Tag"
                    value={item.tag}
                    onChange={e => handleChange(item.id, 'tag', e.target.value)}
                    className="border p-1"
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
                                        ${item.who[idx] ? 'opacity-100 border-4 border-gray-600' : 'opacity-20'}
                                        
                                        `}
                          onClick={() => {
                            const newWho = [...item.who];
                            newWho[idx] = !newWho[idx];
                            handleChange(item.id, 'who', newWho);
                          }}></div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
        <datalist id="tagList">
          <option value="안녕" />
          <option value="슬픔" />
        </datalist>
        <div
          className="cursor-pointer
          text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
          "
          onClick={async () => {
            const tmp = conInfoData as any;
            let newConList = items.reduce((acc, cur) => {
              // if (cur.title === '' && cur.tag === '') return acc;
              if (userPackageData[packageIdx].conList[cur.id] === undefined) {
                return acc;
              }
              acc[String(cur.id)] = {
                title: cur.title,
                tag: cur.tag,
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

            console.log(newCustomConList);

            chrome.storage.local.set({ ['CustomConList']: newCustomConList }, async function () {
              console.log('Value is set to ', newCustomConList);

              chrome.runtime.sendMessage({ type: 'CHANGED_DATA' }, response => {
                console.log(response);
                const emojiSearchTmp = new EmojiSearch();
                emojiSearchTmp.deserialize(response.emojiSearch);

                setEmojiSearch(emojiSearchTmp);
                setDetailIdxDict(response.detailIdxDict);
              });
            });

            // const newUserPackageData = { ...userPackageData };
            // newUserPackageData[packageIdx].conList = newConList;
            // setUserPackageData(newUserPackageData);
          }}>
          저장
        </div>
        {/* <div>unicro_id : {unicroId}</div> */}
      </div>
    </div>
  );
};

export default ConInfoEditPage;
