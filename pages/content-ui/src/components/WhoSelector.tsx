import React from 'react';

interface WhoSelectorProps {
  who: boolean[];
  onChange: (newWho: boolean[], isOneItemOnly?: boolean) => void;
  itemId: number;
}

const WHO_COLORS = {
  Q: 'bg-[rgba(160,160,160,1)]',
  W: 'bg-[rgba(239,135,181,1)]',
  E: 'bg-[rgba(6,189,237,1)]',
  R: 'bg-[rgba(195,215,115,1)]',
} as const;

const WhoSelector: React.FC<WhoSelectorProps> = ({ who, onChange, itemId }) => {
  const handleClick = (e: React.MouseEvent, idx: number) => {
    const newWho = [...who];
    newWho[idx] = !newWho[idx];
    onChange(newWho, e.ctrlKey);
  };

  return (
    <div className="flex flex-row gap-0.5">
      {['Q', 'W', 'E', 'R'].map((whoKey, idx) => (
        <div
          key={whoKey}
          className={`flex w-8 h-8 items-center justify-center cursor-pointer rounded-lg
            ${WHO_COLORS[whoKey as keyof typeof WHO_COLORS]}
            ${who[idx] ? 'opacity-100 border-4 border-gray-600 dark:border-gray-300' : 'opacity-20'}
          `}
          onClick={e => handleClick(e, idx)}
          role="button"
          // aria-pressed={who[idx]}
          // tabIndex={0}
        />
      ))}
    </div>
  );
};

export default WhoSelector;
