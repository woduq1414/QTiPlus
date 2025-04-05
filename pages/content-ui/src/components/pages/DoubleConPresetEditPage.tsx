import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, use } from 'react';

import Storage from '@extension/shared/lib/storage';

import { WithContext as ReactTags, SEPARATORS } from 'react-tag-input';

import { Tag } from 'react-tag-input';
import makeToast from '@src/functions/toast';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid';
import ImageWithSkeleton from '@src/components/ImageWithSkeleton';
import { Message } from '@extension/shared/lib/enums/Message';
import { Page } from '@src/enums/Page';

// 타입 정의
interface DoubleConData {
  imgPath: string;
  packageIdx: number;
  sort: number;
  title: string;
}

interface Item {
  presetKey: string;
  tag: string;
  firstDoubleCon: DoubleConData;
  secondDoubleCon: DoubleConData;
}

interface CustomConList {
  doubleConPreset?: {
    [key: string]: {
      tag: string;
      firstDoubleCon: {
        packageIdx: number;
        sort: number;
      };
      secondDoubleCon: {
        packageIdx: number;
        sort: number;
      };
    };
  };
}

// 프리셋 아이템 컴포넌트
const PresetItem: React.FC<{
  item: Item;
  index: number;
  onDelete: (index: number) => void;
  onUpdateTag: (index: number, value: string) => void;
}> = ({ item, index, onDelete, onUpdateTag }) => {
  return (
    <div className="flex flex-row gap-2 items-center mb-1">
      <TrashIcon
        className="w-4 h-4 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-400"
        onClick={() => onDelete(index)}
      />
      <div className="flex flex-row w-[140px]">
        <img
          src={item.firstDoubleCon?.imgPath}
          alt="첫 번째 콘 이미지"
          className="w-[70px] h-[70px] rounded-tl-md rounded-bl-md"
        />
        <img
          src={item.secondDoubleCon?.imgPath}
          alt="두 번째 콘 이미지"
          className="w-[70px] h-[70px] rounded-tr-md rounded-br-md"
        />
      </div>
      <input
        type="text"
        placeholder="태그 입력"
        value={item.tag}
        className="border px-2 py-2 rounded-lg flex-grow bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white"
        onChange={e => onUpdateTag(index, e.target.value)}
        spellCheck="false"
      />
    </div>
  );
};

// 헤더 컴포넌트
const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex flex-row">
      <div className="w-[90px] cursor-pointer" onClick={onBack}>
        이전
      </div>
      <div className="flex-grow text-center font-semibold">
        <h1>더블콘 프리셋</h1>
      </div>
      <div className="w-[90px]"></div>
    </div>
  );
};

const DoubleConPresetEditPage: React.FC = () => {
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
  const [items, setItems] = useState<Item[]>([]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const data = (await Storage.getCustomConList()) as CustomConList | null;
      if (!data || !data.doubleConPreset) return;

      const doubleConPreset = data.doubleConPreset;
      const newData: { [key: string]: Item } = {};

      // 딕셔너리 형태로 처리
      for (const key in doubleConPreset) {
        const item = doubleConPreset[key];
        const firstDoubleCon = item.firstDoubleCon;
        const secondDoubleCon = item.secondDoubleCon;

        if (firstDoubleCon === undefined || secondDoubleCon === undefined) continue;

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
          presetKey: key,
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

      // 키로 정렬
      const sortedData = Object.fromEntries(Object.entries(newData).sort((a, b) => a[0].localeCompare(b[0])));

      setItems(Object.values(sortedData));
    };

    loadData();
  }, [userPackageData]);

  // 아이템 삭제 핸들러
  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 태그 업데이트 핸들러
  const handleUpdateTag = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], tag: value };
    setItems(newItems);
  };

  // 저장 핸들러
  const handleSave = async () => {
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

    let customConList = (await Storage.getCustomConList()) as CustomConList | null;
    if (!customConList) {
      customConList = {};
    }

    // 배열을 객체로 변환
    const doubleConPresetObj: { [key: string]: any } = {};
    newItems.forEach(item => {
      doubleConPresetObj[item.presetKey] = {
        tag: item.tag,
        firstDoubleCon: item.firstDoubleCon,
        secondDoubleCon: item.secondDoubleCon,
      };
    });

    customConList.doubleConPreset = doubleConPresetObj;
    await Storage.setCustomConList(customConList);

    chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, () => {
      makeToast('저장 완료!');
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none max-w-[800px] mx-auto flex-col z-[999999999]">
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 w-[600px] max-w-[100vw] text-black dark:bg-[rgba(46,46,46,0.75)] dark:text-white"
        style={{ backdropFilter: 'blur(15px)' }}>
        <Header onBack={() => setCurrentPage(Page.SETTING)} />

        <div className="text-sm w-full text-center">
          새로운 프리셋 추가는 최근 사용한 더블콘 목록에서 해당 더블콘을 우클릭(Alt + S)하면 가능합니다.
        </div>

        <div className="flex flex-col gap-1 max-h-[65vh] overflow-auto scrollbar">
          {items.map((item, idx) => (
            <PresetItem key={idx} item={item} index={idx} onDelete={handleDeleteItem} onUpdateTag={handleUpdateTag} />
          ))}
        </div>

        <div
          className="mt-3 cursor-pointer text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          onClick={handleSave}>
          저장
        </div>
      </div>
    </div>
  );
};

export default DoubleConPresetEditPage;
