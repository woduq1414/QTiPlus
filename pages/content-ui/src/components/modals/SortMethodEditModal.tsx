import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/16/solid';
import Modal from '@src/components/Modal';
import { BaseSortMethod } from '@extension/shared/lib/models/UserConfig';

interface SortMethodEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIsRecentUsedFirst: boolean;
  currentBaseSortMethod: BaseSortMethod;
  onSave: (isRecentUsedFirst: boolean, baseSortMethod: BaseSortMethod) => void;
}

const SortMethodEditModal: React.FC<SortMethodEditModalProps> = ({
  isOpen,
  onClose,
  currentIsRecentUsedFirst,
  currentBaseSortMethod,
  onSave,
}) => {
  const [selectedIsRecentUsedFirst, setSelectedIsRecentUsedFirst] = useState<boolean>(currentIsRecentUsedFirst);
  const [selectedBaseSortMethod, setSelectedBaseSortMethod] = useState<BaseSortMethod>(currentBaseSortMethod);

  const baseSortMethodOptions = [
    {
      value: BaseSortMethod.NEWEST_FIRST,
      label: '최신 콘 우선',
      description: '패키지 번호가 큰 순서부터 정렬',
    },
    {
      value: BaseSortMethod.OLDEST_FIRST,
      label: '과거 콘 우선',
      description: '패키지 번호가 작은 순서부터 정렬',
    },
    {
      value: BaseSortMethod.RANDOM,
      label: '랜덤 정렬',
      description: '패키지 순서를 랜덤으로 배치',
    },
  ];

  const handleSave = () => {
    onSave(selectedIsRecentUsedFirst, selectedBaseSortMethod);
    onClose();
  };

  const handleClose = () => {
    setSelectedIsRecentUsedFirst(currentIsRecentUsedFirst);
    setSelectedBaseSortMethod(currentBaseSortMethod);
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
        
        {/* 첫 번째 옵션: 최근 사용 우선 여부 */}
        <div className="w-full mb-4">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            최근 사용한 콘 우선 노출
          </div>
          <div className="flex flex-col gap-2">
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedIsRecentUsedFirst
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedIsRecentUsedFirst(true)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedIsRecentUsedFirst
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedIsRecentUsedFirst && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    사용
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                !selectedIsRecentUsedFirst
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedIsRecentUsedFirst(false)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    !selectedIsRecentUsedFirst
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {!selectedIsRecentUsedFirst && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    미사용
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 두 번째 옵션: 기본 정렬 방식 */}
        <div className="w-full">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            기본 정렬 방식
          </div>
          <div className="flex flex-col gap-2">
            {baseSortMethodOptions.map((option) => (
              <div
                key={option.value}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedBaseSortMethod === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedBaseSortMethod(option.value)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedBaseSortMethod === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedBaseSortMethod === option.value && (
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