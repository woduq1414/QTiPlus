import React from 'react';
import { TrashIcon } from '@heroicons/react/16/solid';
import { DoubleConPresetItem as DoubleConPresetItemType } from '@src/types/doubleConPreset';

interface DoubleConPresetItemProps {
  item: DoubleConPresetItemType;
  index: number;
  onDelete: (index: number) => void;
  onTagChange: (index: number, value: string) => void;
}

const DoubleConPresetItem: React.FC<DoubleConPresetItemProps> = ({ item, index, onDelete, onTagChange }) => {
  return (
    <div className="flex flex-row gap-2 items-center mb-1">
      <TrashIcon
        className="w-4 h-4 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-400"
        onClick={() => onDelete(index)}
      />
      <div className="flex flex-row w-[140px]">
        <img
          src={item.firstDoubleCon?.imgPath}
          alt={item.firstDoubleCon?.title || '첫 번째 콘'}
          className="w-[70px] h-[70px] rounded-tl-md rounded-bl-md"
        />
        <img
          src={item.secondDoubleCon?.imgPath}
          alt={item.secondDoubleCon?.title || '두 번째 콘'}
          className="w-[70px] h-[70px] rounded-tr-md rounded-br-md"
        />
      </div>
      <input
        type="text"
        placeholder="태그"
        value={item.tag}
        className="border px-2 py-2 rounded-lg flex-grow bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white"
        onChange={e => onTagChange(index, e.target.value)}
        spellCheck="false"
      />
    </div>
  );
};

export default DoubleConPresetItem;
