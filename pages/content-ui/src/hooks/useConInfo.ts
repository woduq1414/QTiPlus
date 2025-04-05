import { useState, useEffect, useCallback } from 'react';
import { ConItem, ConListData, CustomConList } from '@src/types/conInfo';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import makeToast from '@src/functions/toast';

export const useConInfo = (packageIdx: string, userPackageData: any) => {
  const [items, setItems] = useState<ConItem[]>([]);

  const handleChange = useCallback(
    (id: number, field: keyof ConItem, value: any, type: string | undefined = undefined) => {
      if (field === 'who' && type !== 'one') {
        setItems(prevItems => prevItems.map(item => (item.id >= id ? { ...item, [field]: value } : item)));
      } else {
        setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
      }
    },
    [],
  );

  const fetchConInfo = useCallback(async () => {
    if (!userPackageData || userPackageData[packageIdx] === undefined) return;

    const prevCustomConList = await Storage.getCustomConList();
    if (!prevCustomConList) return;

    const conLabelList = prevCustomConList['conLabelList'];
    if (!conLabelList) return;

    let tmp = conLabelList;
    if (tmp[packageIdx] === undefined) {
      tmp[packageIdx] = {
        title: userPackageData[packageIdx].title,
        conList: {},
        packageIdx: String(packageIdx),
      };
    }

    const newItems = Object.keys(userPackageData[packageIdx].conList).map(key => {
      const index = parseInt(key);
      const conData = tmp[packageIdx].conList[String(index)];

      if (!conData) {
        return {
          id: index,
          title: '',
          tag: '',
          who: [false, false, false, false],
        };
      }

      const whoStrList = conData.who;
      const newWho = [false, false, false, false];
      whoStrList.forEach((whoStr: string) => {
        const key = {
          Q: 0,
          W: 1,
          E: 2,
          R: 3,
        }[whoStr];
        if (key !== undefined) newWho[key] = true;
      });

      return {
        id: index,
        title: conData.title,
        tag: conData.tag,
        who: newWho,
      };
    });

    setItems(newItems);
  }, [userPackageData, packageIdx]);

  const saveConInfo = useCallback(async () => {
    if (!userPackageData || !userPackageData[packageIdx]) return;

    const newConList = items.reduce((acc, cur) => {
      if (userPackageData[packageIdx].conList[cur.id] === undefined) return acc;

      acc[String(cur.id)] = {
        title: cur.title,
        tag: cur.tag
          .split(' ')
          .filter(word => word.length > 0)
          .join(' '),
        imgPath: userPackageData[packageIdx].conList[cur.id].imgPath,
        who: cur.who.map((who, idx) => (who ? ['Q', 'W', 'E', 'R'][idx] : '')).filter(who => who !== ''),
      };
      return acc;
    }, {} as any);

    const conListData: ConListData = {
      conList: newConList,
      title: userPackageData[packageIdx].title,
      packageIdx: String(packageIdx),
    };

    const oldCustomConList = await Storage.getCustomConList();
    const conLabelList = oldCustomConList?.conLabelList || {};
    const newCustomConList = { ...conLabelList, [packageIdx]: conListData };

    await Storage.setCustomConList({
      ...oldCustomConList,
      conLabelList: newCustomConList,
    });

    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, () => {
        makeToast('저장 완료!');
        chrome.runtime.sendMessage({
          type: 'TRIGGER_EVENT',
          action: 'CON_INFO_EDIT',
          data: { packageIdx },
        });
        resolve(true);
      });
    });
  }, [items, userPackageData, packageIdx]);

  useEffect(() => {
    fetchConInfo();
  }, [fetchConInfo]);

  return {
    items,
    handleChange,
    saveConInfo,
  };
};
