import { useState, useEffect, useCallback } from 'react';
import { DoubleConPresetItem, DoubleConPresetData } from '@src/types/doubleConPreset';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import makeToast from '@src/functions/toast';

export const useDoubleConPreset = (userPackageData: any) => {
  const [items, setItems] = useState<DoubleConPresetItem[]>([]);

  const loadDoubleConPreset = useCallback(async () => {
    const data = await Storage.getCustomConList();
    if (!data?.doubleConPreset) return;

    const doubleConPreset = data.doubleConPreset;
    const newData: { [key: string]: any } = {};

    for (const key in doubleConPreset) {
      const item = doubleConPreset[key];
      const { firstDoubleCon, secondDoubleCon } = item;

      if (!firstDoubleCon || !secondDoubleCon) continue;

      const isFirstConAvailable =
        userPackageData?.[firstDoubleCon.packageIdx] !== undefined &&
        userPackageData?.[firstDoubleCon.packageIdx].isHide !== true;
      const isSecondConAvailable =
        userPackageData?.[secondDoubleCon.packageIdx] !== undefined &&
        userPackageData?.[secondDoubleCon.packageIdx].isHide !== true;

      if (!isFirstConAvailable || !isSecondConAvailable) continue;

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

    const sortedData = Object.fromEntries(Object.entries(newData).sort((a, b) => a[0].localeCompare(b[0])));

    setItems(
      Object.keys(sortedData).map(key => ({
        presetKey: key,
        ...sortedData[key],
      })),
    );
  }, [userPackageData]);

  const handleDelete = useCallback((index: number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);

  const handleTagChange = useCallback((index: number, value: string) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], tag: value };
      return newItems;
    });
  }, []);

  const saveDoubleConPreset = useCallback(async () => {
    const newItems = items.map(item => ({
      presetKey: item.presetKey,
      tag: item.tag
        .split(' ')
        .filter(word => word.length > 0)
        .join(' '),
      firstDoubleCon: {
        packageIdx: item.firstDoubleCon.packageIdx,
        sort: item.firstDoubleCon.sort,
      },
      secondDoubleCon: {
        packageIdx: item.secondDoubleCon.packageIdx,
        sort: item.secondDoubleCon.sort,
      },
    }));

    const customConList = await Storage.getCustomConList();
    const updatedCustomConList = {
      ...customConList,
      doubleConPreset: newItems,
    };

    await Storage.setCustomConList(updatedCustomConList);

    return new Promise<void>(resolve => {
      chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, () => {
        makeToast('저장 완료!');
        resolve();
      });
    });
  }, [items]);

  useEffect(() => {
    loadDoubleConPreset();
  }, [loadDoubleConPreset]);

  return {
    items,
    handleDelete,
    handleTagChange,
    saveDoubleConPreset,
  };
};
