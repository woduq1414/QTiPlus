import React, { useState } from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';

interface SingleConItemProps {
  detailData: any;
  index: number;
  focusedIndex: number | null;
  imageRefs: React.RefObject<(HTMLDivElement | null)[]>;
  handleImageKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number, detailData: any) => void;
  onConClick: (params: { detailData: any; e: any }) => void;
  onConRightClick: (params: { detailData: any; e: any }) => void;
  favoriteConList: any;
  userPackageData: any;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SingleConItem: React.FC<SingleConItemProps> = ({
  detailData,
  index,
  focusedIndex,
  imageRefs,
  handleImageKeyDown,
  onConClick,
  onConRightClick,
  favoriteConList,
  userPackageData,
  tabIndex = 0,
  onFocus,
  onBlur,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div
      key={detailData.detailIdx}
      className={`flex cursor-pointer w-[calc(25%-0.2em)] rounded-md
        transition-all duration-200
        ${focusedIndex === index ? ' border-0 scale-125  z-[9999999999]' : 'scale-100 z-[9999999]'}
      `}
      ref={el => {
        imageRefs.current[index] = el;
      }}
      onKeyDown={e => handleImageKeyDown(e, index, detailData)}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={tabIndex}
      onClick={e => {
        onConClick({ detailData, e });
      }}
      onContextMenu={e => {
        onConRightClick({ detailData, e });
      }}>
      <ImageWithSkeleton
        src={detailData.imgPath}
        alt={detailData.title}
        doubleConType={-1}
        setIsImageLoaded={setIsImageLoaded}
      />

      {isImageLoaded &&
        favoriteConList &&
        favoriteConList[userPackageData[detailData.packageIdx]?.conList?.[detailData.sort]?.detailIdx] && (
          <div className="absolute top-0 right-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="rgb(240,177,0)"
              className="w-5 h-5"
              stroke="white"
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round">
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
    </div>
  );
};

export default SingleConItem;
