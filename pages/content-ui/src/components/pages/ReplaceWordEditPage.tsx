import parseCookies from '@src/functions/cookies';
import useGlobalStore from '@src/store/globalStore';
import { useEffect, useState, useRef, use } from 'react';

import { WithContext as ReactTags, SEPARATORS } from 'react-tag-input';

import { Tag } from 'react-tag-input';
import makeToast from '@src/functions/toast';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid';

import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import { Page } from '@src/enums/Page';

interface Item {
  key: string;
  value: string;
}

interface ReplaceWordData {
  [key: string]: string[];
}

// 아이템 입력 필드 컴포넌트
const ItemInput: React.FC<{
  item: Item;
  index: number;
  onUpdate: (index: number, field: keyof Item, value: string) => void;
  onDelete: (index: number) => void;
}> = ({ item, index, onUpdate, onDelete }) => {
  return (
    <div className="flex flex-row gap-2 items-center mb-1">
      <TrashIcon
        className="w-4 h-4 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-400"
        onClick={() => onDelete(index)}
      />
      <input
        type="text"
        placeholder="키워드"
        value={item.key}
        className="border px-2 py-2 rounded-lg w-[100px] bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white"
        onChange={e => onUpdate(index, 'key', e.target.value)}
        spellCheck="false"
      />
      <input
        type="text"
        placeholder="조건 키워드"
        value={item.value}
        className="border px-2 py-2 rounded-lg flex-grow bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white"
        onChange={e => onUpdate(index, 'value', e.target.value)}
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
        <h1>자동 추가 키워드</h1>
      </div>
      <div className="w-[90px]"></div>
    </div>
  );
};

const ReplaceWordEditPage: React.FC = () => {
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
    Array.from({ length: 1 }, () => ({
      key: '',
      value: '',
    })),
  );

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const data = (await Storage.getReplaceWordData()) as ReplaceWordData | null;
      if (!data) return;

      const formattedData = Object.entries(data).map(([key, value]) => ({
        key,
        value: value.join(' '),
      }));

      setItems(formattedData);
    };

    loadData();
  }, []);

  // 아이템 업데이트 핸들러
  const handleItemUpdate = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // 아이템 삭제 핸들러
  const handleItemDelete = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 아이템 추가 핸들러
  const handleAddItem = () => {
    setItems([...items, { key: '', value: '' }]);
  };

  // 저장 핸들러
  const handleSave = async () => {
    const newItems: ReplaceWordData = {};

    items.forEach(item => {
      if (item.key && item.value) {
        newItems[item.key] = item.value.split(' ').filter(word => word.length > 0);
      }
    });

    // chrome.storage.local.set({
    //   ReplaceWordData: newItems,
    // });

    chrome.runtime.sendMessage({ type: Message.UPDATE_REPLACE_WORD_DATA, data: { replaceWordData: newItems } }, () => {
      makeToast('저장 완료!');
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none max-w-[800px] mx-auto flex-col z-[999999999]">
      <div
        className="bg-[rgba(246,246,246,0.75)] p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 w-[600px] max-w-[100vw] text-black dark:bg-[rgba(46,46,46,0.75)] dark:text-white"
        style={{ backdropFilter: 'blur(15px)' }}>
        <Header onBack={() => setCurrentPage(Page.SETTING)} />

        <div className="flex flex-col gap-1 max-h-[65vh] overflow-auto scrollbar">
          <div className="flex flex-row gap-2 items-center">
            <div className="w-4"></div>
            <div className="w-[100px] text-center text-sm font-semibold">추가 키워드(A)</div>
            <div className="flex-grow text-center text-sm font-semibold">
              조건 키워드(B) - 띄어쓰기로 구분하여 입력해주세요.
            </div>
          </div>

          {items.map((item, idx) => (
            <ItemInput key={idx} item={item} index={idx} onUpdate={handleItemUpdate} onDelete={handleItemDelete} />
          ))}

          <div
            className="flex w-full justify-center gap-2 items-center bg-gray-200 dark:bg-gray-800 rounded-lg px-2 py-1 cursor-pointer"
            onClick={handleAddItem}>
            <PlusIcon className="w-6 h-6 cursor-pointer text-blue-500" />
            추가하기
          </div>
        </div>

        <div
          className="mt-3 cursor-pointer text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          onClick={handleSave}>
          저장
        </div>

        {/* <div>unicro_id : {userId}</div> */}
      </div>
    </div>
  );
};

export default ReplaceWordEditPage;
