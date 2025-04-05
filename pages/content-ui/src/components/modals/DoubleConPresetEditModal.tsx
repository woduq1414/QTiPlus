import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/16/solid';
import Modal from '@src/components/Modal';
import ImageWithSkeleton from '@src/components/ImageWithSkeleton';
import Storage from '@extension/shared/lib/storage';
import makeToast from '@src/functions/toast';

interface DoubleConPresetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  doubleConPresetEditData: {
    firstDoubleCon: any;
    secondDoubleCon: any;
    tag: string;
    presetKey: string;
  };
  setDoubleConPresetEditData: React.Dispatch<
    React.SetStateAction<{
      firstDoubleCon: any;
      secondDoubleCon: any;
      tag: string;
      presetKey: string;
    }>
  >;
  setIsDoubleConPresetEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DoubleConPresetEditModal: React.FC<DoubleConPresetEditModalProps> = ({
  isOpen,
  onClose,
  doubleConPresetEditData,
  setDoubleConPresetEditData,
  setIsDoubleConPresetEditModalOpen,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  async function saveDoubleConPreset() {
    doubleConPresetEditData.tag = doubleConPresetEditData.tag
      .split(' ')
      .filter((word: string) => word.length > 0)
      .join(' ');

    if (doubleConPresetEditData.tag === '') {
      makeToast('태그를 입력해주세요!');
      return;
    }

    const prevCustomConList = (await Storage.getCustomConList()) as any;

    if (prevCustomConList === null || prevCustomConList === undefined) {
      return;
    }

    if (prevCustomConList?.['doubleConPreset'] === undefined) {
      prevCustomConList['doubleConPreset'] = {};
    }

    // 딕셔너리 형태로 처리
    const presetKey = doubleConPresetEditData.presetKey;

    // 이미 존재하는 경우 업데이트, 없는 경우 추가
    prevCustomConList['doubleConPreset'][presetKey] = {
      presetKey: doubleConPresetEditData.presetKey,
      tag: doubleConPresetEditData.tag,
      firstDoubleCon: {
        packageIdx: doubleConPresetEditData.firstDoubleCon.packageIdx,
        sort: doubleConPresetEditData.firstDoubleCon.sort,
      },
      secondDoubleCon: {
        packageIdx: doubleConPresetEditData.secondDoubleCon.packageIdx,
        sort: doubleConPresetEditData.secondDoubleCon.sort,
      },
    };

    await Storage.setCustomConList(prevCustomConList);

    chrome.runtime.sendMessage(
      {
        type: 'CHANGED_DATA',
      },
      response => {
        makeToast('저장 완료!');
      },
    );

    setIsDoubleConPresetEditModalOpen(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-2 items-center">
        <div className="flex flex-row justify-between items-center w-full mb-3">
          <div className="w-[50px]"></div>
          <div className="font-bold text-center w-full ">더블콘 프리셋 수정</div>
          <div className="w-[50px] flex justify-end">
            <XMarkIcon
              className="w-6 h-6 cursor-pointer"
              onClick={onClose}
              // tabIndex={2}
            />
          </div>
        </div>

        {doubleConPresetEditData.firstDoubleCon && (
          <div className="flex flex-row w-[200px]">
            <ImageWithSkeleton
              src={doubleConPresetEditData.firstDoubleCon.imgPath}
              alt={doubleConPresetEditData.firstDoubleCon.title}
              doubleConType={0}
            />
            <ImageWithSkeleton
              src={doubleConPresetEditData.secondDoubleCon.imgPath}
              alt={doubleConPresetEditData.secondDoubleCon.title}
              doubleConType={1}
            />
          </div>
        )}

        <div className="flex flex-row gap-2 items-center">
          <div className="flex-grow font-semibold text-lg sm:text-sm">태그</div>
          <input
            type="text"
            className="border px-2 py-2 rounded-lg
              bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(0,0,0,0.5)] dark:text-white
              w-[220px] sm:max-w-[80%]
              "
            spellCheck="false"
            tabIndex={0}
            value={doubleConPresetEditData.tag}
            onChange={e => {
              setDoubleConPresetEditData({
                ...doubleConPresetEditData,
                tag: e.target.value,
              });
            }}
            ref={inputRef}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                saveDoubleConPreset();
              }
            }}></input>
        </div>

        <div
          className="
            mt-4
            cursor-pointer flex-grow text-center
            text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
            w-full"
          tabIndex={1}
          onClick={saveDoubleConPreset}>
          확인
        </div>
      </div>
    </Modal>
  );
};

export default DoubleConPresetEditModal;
