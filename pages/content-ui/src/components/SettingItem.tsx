import React from 'react';
import Switch from 'react-switch';

interface SettingItemProps {
  title: string;
  description?: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  isChecked,
  onChange,
  showEditButton = false,
  onEditClick,
}) => {
  return (
    <div className="flex flex-row gap-4 items-center">
      <div className="flex-grow font-semibold text-lg">
        <div>{title}</div>
        {description && <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>}
      </div>
      {showEditButton ? (
        <div
          className="
          bg-blue-500
          text-white
          rounded-lg
          px-3
          py-2
          text-md
          font-semibold
          cursor-pointer
          hover:bg-blue-600
          dark:hover:bg-blue-400
        "
          onClick={onEditClick}>
          편집
        </div>
      ) : (
        <div>
          <Switch
            checked={isChecked}
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
