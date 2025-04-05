import React from 'react';
import Switch from 'react-switch';
import { ConListItemProps } from '@src/types/conList';

const ConListItem: React.FC<ConListItemProps> = ({
  packageData,
  customConData,
  isEditMode,
  isHideState,
  onToggleHide,
  onClick,
}) => {
  const getCustomConCount = () => {
    if (!customConData) return 0;
    return Object.values(customConData.conList).filter(con => con.title !== '' || con.tag !== '').length;
  };

  const customConCount = getCustomConCount();
  const totalConCount = Object.keys(packageData.conList).length;

  return (
    <div className="flex flex-row w-full items-center">
      {isEditMode && (
        <div className="mr-1 ml-1">
          <Switch
            checked={!isHideState[packageData.packageIdx]}
            onChange={() => onToggleHide(packageData.packageIdx)}
            onColor="#a7b4db"
            onHandleColor="#456bd8"
            handleDiameter={20}
            uncheckedIcon={false}
            checkedIcon={false}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            height={15}
            width={36}
          />
        </div>
      )}
      <div
        className={`flex flex-row gap-2 items-center justify-between flex-grow
          ${!isEditMode ? '' : 'cursor-pointer'}`}
        onClick={onClick}>
        <div className="w-[65px]">
          <img
            src={packageData.mainImg}
            alt={packageData.title}
            className="w-[3em] h-[3em] rounded-lg border-2 border-gray-600 dark:border-gray-400"
          />
        </div>
        <div
          className={`font-semibold
            ${
              isHideState[packageData.packageIdx] ? 'text-gray-400 dark:text-gray-500' : 'text-black dark:text-white/90'
            }`}>
          <h1>{packageData.title}</h1>
        </div>
        <div className="w-[65px] text-sm text-gray-600 dark:text-gray-400 text-right">
          ({customConCount}/{totalConCount})
        </div>
      </div>
    </div>
  );
};

export default ConListItem;
