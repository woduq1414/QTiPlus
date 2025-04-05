import React from 'react';
import { ConItem as ConItemType } from '@src/types/conInfo';
import WhoSelector from './WhoSelector';

interface ConItemProps {
  item: ConItemType;
  imgPath: string;
  onItemChange: (id: number, field: keyof ConItemType, value: any, type?: string) => void;
}

const ConItem: React.FC<ConItemProps> = ({ item, imgPath, onItemChange }) => {
  const handleWhoChange = (newWho: boolean[], isOneItemOnly?: boolean) => {
    onItemChange(item.id, 'who', newWho, isOneItemOnly ? 'one' : undefined);
  };

  return (
    <div className="flex flex-row gap-2 items-center sm:flex-col sm:gap-2">
      <img src={imgPath} alt="" className="w-[70px] h-[70px]" />
      <input
        type="text"
        placeholder="이름"
        value={item.title}
        onChange={e => onItemChange(item.id, 'title', e.target.value)}
        className="border px-2 py-2 rounded-lg
          bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
          w-[220px] sm:w-[70vw]
        "
        spellCheck="false"
      />
      <input
        type="text"
        placeholder="태그"
        value={item.tag}
        onChange={e => onItemChange(item.id, 'tag', e.target.value)}
        className="border px-2 py-2 rounded-lg
          bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
          w-[220px] sm:w-[70vw]
        "
        spellCheck="false"
      />
      <WhoSelector who={item.who} onChange={handleWhoChange} itemId={item.id} />
    </div>
  );
};

export default ConItem;
