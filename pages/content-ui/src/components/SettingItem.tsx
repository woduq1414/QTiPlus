import React, { useState } from 'react';
import Switch from 'react-switch';
import { ArrowPathIcon } from '@heroicons/react/16/solid';

interface SettingItemProps {
  title: string;
  description?: string;
  isChecked: boolean | undefined;
  onChange: (checked: boolean) => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
  showRefreshButton?: boolean;
  onRefreshClick?: () => Promise<void>;
  buttonText?: string;
  buttonType?: 'blue' | 'red';
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  isChecked,
  onChange,
  showEditButton = false,
  buttonText = '편집',
  buttonType = 'blue',
  onEditClick,
  showRefreshButton = false,
  onRefreshClick,
}) => {
  const [onRefreshing, setOnRefreshing] = useState(false);

  return (
    <div className="flex flex-row gap-4 items-center">
      <div className="flex-grow font-semibold text-lg">
        <div>{title}</div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            {description}
            {showRefreshButton && (
              <ArrowPathIcon
                className={`ml-2 w-4 h-4 cursor-pointer text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 ${onRefreshing ? 'invisible' : 'visible'}`}
                onClick={async e => {
                  e.stopPropagation();

                  if (!onRefreshing) {
                    setOnRefreshing(true);
                    onRefreshClick && (await onRefreshClick());
                    setOnRefreshing(false);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
      {showEditButton ? (
        <div
          className={`
          ${buttonType === 'blue' ? 'bg-blue-500' : 'bg-red-500'}
          text-white
          rounded-lg
          px-3
          py-2
          text-md
          font-semibold
          cursor-pointer
          ${buttonType === 'blue' ? 'hover:bg-blue-600' : 'hover:bg-red-600'}
          ${buttonType === 'blue' ? 'dark:hover:bg-blue-400' : 'dark:hover:bg-red-400'}
        `}
          onClick={onEditClick}>
          {buttonText}
        </div>
      ) : (
        <div>
          <Switch
            checked={isChecked === undefined ? false : isChecked}
            onChange={onChange}
            onColor="#a7b4db"
            onHandleColor="#456bd8"
            handleDiameter={25}
            uncheckedIcon={false}
            checkedIcon={false}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            height={25}
            width={45}
          />
        </div>
      )}
    </div>
  );
};

export default SettingItem;
