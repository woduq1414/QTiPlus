import { XMarkIcon } from '@heroicons/react/16/solid';
import Switch from 'react-switch';
import Modal from '@src/components/Modal';
import Storage from '@extension/shared/lib/storage';
import makeToast from '@src/functions/toast';
import { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPackageData: any;
  isHideState: { [key: string]: boolean };
  userId: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, userPackageData, isHideState, userId }) => {
  const [isExportHidePackageInclude, setIsExportHidePackageInclude] = useState(true);
  const [isExportNotHavePackageInclude, setIsExportNotHavePackageInclude] = useState(true);
  const [isExportIncludeDoubleConPreset, setIsExportIncludeDoubleConPreset] = useState(true);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isRound={false}>
      <div
        className="flex flex-col gap-2 items-center 
        text-black dark:text-white/90">
        <div className="flex flex-row justify-between items-center w-full mb-3">
          <div className="w-[50px]"></div>
          <div className="font-bold text-center w-full ">내보내기</div>
          <div className="w-[50px] flex justify-end">
            <XMarkIcon className="w-6 h-6 cursor-pointer" onClick={onClose} />
          </div>
        </div>
        <div className="flex flex-row gap-2 justify-between w-full font-bold">
          <span>숨긴 콘도 포함</span>
          <Switch
            checked={isExportHidePackageInclude}
            onChange={async () => {
              setIsExportHidePackageInclude(!isExportHidePackageInclude);
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
        <div className="flex flex-row gap-2 justify-between w-full font-bold">
          <span>미보유 콘도 포함</span>
          <Switch
            checked={isExportNotHavePackageInclude}
            onChange={async () => {
              setIsExportNotHavePackageInclude(!isExportNotHavePackageInclude);
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
        <div className="flex flex-row gap-2 justify-between w-full font-bold">
          <span>더블콘 프리셋 포함</span>
          <Switch
            checked={isExportIncludeDoubleConPreset}
            onChange={async () => {
              setIsExportIncludeDoubleConPreset(!isExportIncludeDoubleConPreset);
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
            mt-4
            cursor-pointer flex-grow text-center
            text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
            w-full"
          onClick={async () => {
            const customConList = (await Storage.getCustomConList()) as any;

            if (!customConList) {
              makeToast('콘 목록을 불러오지 못했습니다.');
              return;
            }

            let conLabelList = customConList['conLabelList'];
            let doubleConPreset = customConList['doubleConPreset'];

            if (!conLabelList) {
              conLabelList = {};
            }

            const element = document.createElement('a');

            for (let key of Object.keys(conLabelList)) {
              if (!isExportHidePackageInclude && userPackageData[key] && isHideState[key]) {
                delete conLabelList[key];
                continue;
              }
              if (!isExportNotHavePackageInclude && !userPackageData[key]) {
                delete conLabelList[key];
                continue;
              }

              for (let conKey of Object.keys(conLabelList[key].conList)) {
                if (conLabelList[key].conList[conKey].title === '' && conLabelList[key].conList[conKey].tag === '') {
                  delete conLabelList[key].conList[conKey];
                }
              }
            }

            if (doubleConPreset !== undefined) {
              const filteredDoubleConPreset: { [key: string]: any } = {};

              for (const key in doubleConPreset) {
                const item = doubleConPreset[key];

                if (
                  !isExportHidePackageInclude &&
                  ((userPackageData[item.firstDoubleCon?.packageIdx] && isHideState[item.firstDoubleCon?.packageIdx]) ||
                    (userPackageData[item.secondDoubleCon?.packageIdx] &&
                      isHideState[item.secondDoubleCon?.packageIdx]))
                ) {
                  continue;
                }

                if (
                  !isExportNotHavePackageInclude &&
                  (!userPackageData[item.firstDoubleCon?.packageIdx] ||
                    !userPackageData[item.secondDoubleCon?.packageIdx])
                ) {
                  continue;
                }

                filteredDoubleConPreset[key] = item;
              }

              doubleConPreset = filteredDoubleConPreset;
            }

            if (!isExportIncludeDoubleConPreset || doubleConPreset === undefined) {
              doubleConPreset = {};
            }

            const file = new Blob([JSON.stringify({ conLabelList, doubleConPreset })], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);

            element.download = `ConLabelList_${userId.slice(0, 3)}_${new Date().getTime()}.json`;
            document.body.appendChild(element);
            element.click();

            onClose();
          }}>
          확인
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
