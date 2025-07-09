import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/16/solid';
import Modal from '@src/components/Modal';
import { SortMethod } from '@extension/shared/lib/models/UserConfig';

interface SortMethodEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSortMethod: SortMethod;
  onSave: (sortMethod: SortMethod) => void;
}

const SortMethodEditModal: React.FC<SortMethodEditModalProps> = ({
  isOpen,
  onClose,
  currentSortMethod,
  onSave,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<SortMethod>(currentSortMethod);

  const sortMethodOptions = [
    {
      value: SortMethod.RECENT_USED,
      label: '최근 사용한 콘 우선 정렬',
      description: '같은 우선순위에 있는 콘들 중 최근 사용한 콘을 우선으로 정렬',
    },

    {
      value: SortMethod.NEWEST_FIRST,
      label: '최신 콘 우선 정렬',
      description: '같은 우선순위에 있는 콘들 중 최신 콘을 우선으로 정렬',
    },
    {
      value: SortMethod.OLDEST_FIRST,
      label: '과거 콘 우선 정렬',
      description: '같은 우선순위에 있는 콘들 중 과거 콘을 우선으로 정렬',
    },
    {
      value: SortMethod.RANDOM,
      label: '랜덤 정렬',
      description: '같은 우선순위에 있는 콘들 중 랜덤으로 정렬',
    },
  ];

  const handleSave = () => {
    onSave(selectedMethod);
    onClose();
  };

  const handleClose = () => {
    setSelectedMethod(currentSortMethod); // 변경사항 취소
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col gap-2 items-center">
        <div className="flex flex-row justify-between items-center w-full mb-3">
          <div className="w-[50px]"></div>
          <div className="font-bold text-center w-full">정렬 방식 설정</div>
          <div className="w-[50px] flex justify-end">
            <XMarkIcon
              className="w-6 h-6 cursor-pointer"
              onClick={handleClose}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto w-full">
          {sortMethodOptions.map((option) => (
            <div
              key={option.value}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedMethod === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedMethod(option.value)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === option.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedMethod === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="
            mt-4
            cursor-pointer flex-grow text-center
            text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
            w-full"
          tabIndex={1}
          onClick={handleSave}>
          확인
        </div>
      </div>
    </Modal>
  );
};

export default SortMethodEditModal; 