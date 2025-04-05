import React from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';
import { Square2StackIcon } from '@heroicons/react/16/solid';

interface DoubleConItemProps {
  detailData: any;
  index: number;
  focusedIndex: number | null;
  imageRefs: React.RefObject<(HTMLDivElement | null)[]>;
  handleImageKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
    detailData: any,
    horizontalItemCount?: number,
  ) => void;
  onConClick: (params: { detailData: any; e: any; manualFirstDoubleCon?: any }) => void;
  onConRightClick: (params: { detailData: any; e: any }) => void;
  tabIndex?: number;
  horizontalItemCount?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

const DoubleConItem: React.FC<DoubleConItemProps> = ({
  detailData,
  index,
  focusedIndex,
  imageRefs,
  handleImageKeyDown,
  onConClick,
  onConRightClick,
  tabIndex = 0,
  horizontalItemCount = 2,
  onFocus,
  onBlur,
}) => {
  const firstDoubleCon = detailData.firstDoubleCon;
  const secondDoubleCon = detailData.secondDoubleCon;

  return (
    <div
      tabIndex={tabIndex}
      key={detailData.detailIdx}
      className={`flex cursor-pointer w-[calc(50%-0.2em)] rounded-md
        transition-all duration-200
        ${focusedIndex === index ? ' border-0 scale-[125%]  z-[9999999999] ' : 'scale-100 z-[9999999]'}
      `}
      ref={el => {
        imageRefs.current[index] = el;
      }}
      onKeyDown={e => handleImageKeyDown(e, index, detailData, horizontalItemCount)}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={e => {
        onConClick({
          detailData: secondDoubleCon,
          e: e,
          manualFirstDoubleCon: firstDoubleCon,
        });
      }}
      onContextMenu={e => {
        onConRightClick({
          detailData: detailData,
          e: e,
        });
      }}>
      <div className="flex flex-row gap-[0em]">
        <ImageWithSkeleton src={firstDoubleCon.imgPath} alt={firstDoubleCon.title} doubleConType={0} />
        <ImageWithSkeleton src={secondDoubleCon.imgPath} alt={secondDoubleCon.title} doubleConType={1} />
      </div>

      {true && (
        <div className="absolute top-0 right-0">
          <Square2StackIcon className="w-5 h-5 text-white stroke-[0.9] stroke-gray-300" />
        </div>
      )}
    </div>
  );
};

export default DoubleConItem;
