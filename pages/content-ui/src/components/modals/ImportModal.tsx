import { XMarkIcon } from '@heroicons/react/16/solid';
import Switch from 'react-switch';
import Modal from '@src/components/Modal';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import makeToast from '@src/functions/toast';
import { useState } from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importedFileData: any;
  setConLabelList: (data: any) => void;
  setDoubleConPreset: (data: any) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  importedFileData,
  setConLabelList,
  setDoubleConPreset,
}) => {
  const [isImportOverwrite, setIsImportOverwrite] = useState(true);
  const [isImportIncludeDoubleConPreset, setIsImportIncludeDoubleConPreset] = useState(true);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="flex flex-col gap-2 items-start
        text-black dark:text-white/90">
        <div className="flex flex-row justify-between items-center w-full mb-3">
          <div className="w-[50px]"></div>
          <div className="font-bold text-center w-full ">불러오기</div>
          <div className="w-[50px] flex justify-end">
            <XMarkIcon className="w-6 h-6 cursor-pointer" onClick={onClose} />
          </div>
        </div>
        <div className="font-bold">이미 라벨링이 있는 콘에 대해</div>
        <div className="flex flex-row gap-2 justify-between w-full font-bold">
          <div
            className={`py-3 flex-grow cursor-pointer text-center rounded-xl
              ${isImportOverwrite ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
            `}
            onClick={() => {
              setIsImportOverwrite(true);
            }}>
            덮어쓰기
          </div>
          <div
            className={`py-3 flex-grow cursor-pointer text-center rounded-xl
              ${!isImportOverwrite ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
            `}
            onClick={() => {
              setIsImportOverwrite(false);
            }}>
            건너뛰기
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-2 justify-between w-full font-bold mt-3">
        <span className="text-black dark:text-white/90">더블콘 프리셋 포함</span>
        <Switch
          checked={isImportIncludeDoubleConPreset}
          onChange={async () => {
            setIsImportIncludeDoubleConPreset(!isImportIncludeDoubleConPreset);
          }}
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

      <div
        className="
          mt-8
          cursor-pointer flex-grow text-center
          text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
          w-full"
        onClick={async () => {
          const customConList = (await Storage.getCustomConList()) as any;

          if (!customConList) {
            makeToast('콘 목록을 불러오지 못했습니다.');
            return;
          }

          const conLabelList = customConList['conLabelList'];
          const doubleConPreset = customConList['doubleConPreset'];

          let importedConLabelList = importedFileData['conLabelList'];

          if (!importedConLabelList) {
            makeToast('콘 목록을 불러오지 못했습니다.');
            return;
          }

          for (let key of Object.keys(importedConLabelList)) {
            if (!conLabelList[key]) {
              conLabelList[key] = JSON.parse(JSON.stringify(importedFileData[key]));
              conLabelList[key].conList = {};
            }

            for (let conKey of Object.keys(importedConLabelList[key].conList)) {
              if (isImportOverwrite) {
                conLabelList[key].conList[conKey] = importedConLabelList[key].conList[conKey];
              } else {
                if (
                  conLabelList[key] !== undefined &&
                  conLabelList[key].conList[conKey] !== undefined &&
                  (conLabelList[key].conList[conKey].title !== '' || conLabelList[key].conList[conKey].tag !== '')
                ) {
                  continue;
                } else {
                  conLabelList[key].conList[conKey] = importedConLabelList[key].conList[conKey];
                }
              }
            }
          }

          if (doubleConPreset && isImportIncludeDoubleConPreset && importedFileData['doubleConPreset']) {
            if (isImportOverwrite) {
              for (const key in importedFileData['doubleConPreset']) {
                doubleConPreset[key] = importedFileData['doubleConPreset'][key];
              }
            } else {
              for (const key in importedFileData['doubleConPreset']) {
                if (!(key in doubleConPreset)) {
                  doubleConPreset[key] = importedFileData['doubleConPreset'][key];
                }
              }
            }
          }

          setConLabelList(conLabelList);
          setDoubleConPreset(doubleConPreset);

          Storage.setCustomConList({
            conLabelList,
            doubleConPreset,
          }).then(() => {
            chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, response => {
              makeToast('저장 완료!');
              onClose();
            });
          });
        }}>
        확인
      </div>
    </Modal>
  );
};

export default ImportModal;
