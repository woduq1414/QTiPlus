import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef } from 'react';
import conInfoData from '../../public/data.json';

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
  const { userPackageData, unicroId, setUserPackageData } = useGlobalStore();
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

  useEffect(() => {
    if (userPackageData === null) return;
    if (userPackageData[packageIdx] === undefined) return;
    const tmp = conInfoData as any;
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
  }, [userPackageData]);

  if (userPackageData === null) {
    return <div>데이터가 없습니다.</div>;
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none max-w-[800px]  mx-auto flex-col
        `}>
      <div className="bg-white p-6 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-4 ">
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
        <div
          className="cursor-pointer bg-red-400"
          onClick={async () => {
            const tmp = conInfoData as any;
            const newConList = items.reduce((acc, cur) => {
              if (cur.title === '' && cur.tag === '') return acc;
              acc[String(cur.id)] = {
                title: cur.title,
                tag: cur.tag,
                imgPath: tmp[packageIdx].conList[String(cur.id)].imgPath,
                who: cur.who.map((who, idx) => (who ? ['Q', 'W', 'E', 'R'][idx] : '')).filter(who => who !== ''),
              };
              return acc;
            }, {} as any);

            console.log(newConList);

            // const newUserPackageData = { ...userPackageData };
            // newUserPackageData[packageIdx].conList = newConList;
            // setUserPackageData(newUserPackageData);
          }}>
          저장
        </div>
        <div>unicro_id : {unicroId}</div>
      </div>
    </div>
  );
};

export default ConInfoEditPage;
