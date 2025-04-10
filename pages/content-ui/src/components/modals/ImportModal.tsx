import { XMarkIcon } from '@heroicons/react/16/solid';
import Switch from 'react-switch';
import Modal from '@src/components/Modal';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import makeToast from '@src/functions/toast';
import { useState, useEffect } from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importedFileData: any;
  setConLabelList: (data: any) => void;
  setDoubleConPreset: (data: any) => void;
  onFileSelect: (file: File) => void;
}

interface FileStats {
  packageCount: number;
  labeledConCount: number;
  totalConCount: number;
  doubleConPresetCount: number;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  importedFileData,
  setConLabelList,
  setDoubleConPreset,
  onFileSelect,
}) => {
  const [isImportOverwrite, setIsImportOverwrite] = useState(true);
  const [isImportIncludeDoubleConPreset, setIsImportIncludeDoubleConPreset] = useState(true);
  const [useDefaultData, setUseDefaultData] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [defaultData, setDefaultData] = useState<any>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);

  // 파일 통계 계산
  useEffect(() => {
    if (importedFileData) {
      const stats: FileStats = {
        packageCount: 0,
        labeledConCount: 0,
        totalConCount: 0,
        doubleConPresetCount: 0,
      };

      // 콘 패키지 통계
      if (importedFileData.conLabelList) {
        stats.packageCount = Object.keys(importedFileData.conLabelList).length;

        // 각 패키지별 콘 통계
        Object.values(importedFileData.conLabelList).forEach((packageData: any) => {
          if (packageData.conList) {
            const conList = packageData.conList;
            stats.totalConCount += Object.keys(conList).length;

            // 라벨링된 콘 개수 계산
            Object.values(conList).forEach((con: any) => {
              if (con.title !== '' || con.tag !== '') {
                stats.labeledConCount++;
              }
            });
          }
        });
      }

      // 더블콘 프리셋 통계
      if (importedFileData.doubleConPreset) {
        stats.doubleConPresetCount = Object.keys(importedFileData.doubleConPreset).length;
      }

      setFileStats(stats);
    } else {
      setFileStats(null);
    }
  }, [importedFileData]);

  // 디폴트 데이터 로드
  useEffect(() => {
    if (useDefaultData) {
      fetch(chrome.runtime.getURL('data.json'))
        .then(response => response.json())
        .then(data => {
          console.log('디폴트 데이터:', data);
          setDefaultData(data);
          onFileSelect(new File([JSON.stringify(data)], 'data.json', { type: 'application/json' }));
        })
        .catch(error => {
          console.error('디폴트 데이터를 불러오는데 실패했습니다:', error);
          makeToast('디폴트 데이터를 불러오는데 실패했습니다.');
          setUseDefaultData(false);
        });
    } else {
      setDefaultData(null);
    }
  }, [useDefaultData, onFileSelect]);

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFileName(file.name);
        onFileSelect(file);
      }
    };
    input.click();
  };

  const handleClose = () => {
    setUseDefaultData(false);
    setSelectedFileName(null);
    setFileStats(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isRound={false}>
      <div
        className="flex flex-col gap-2 items-start
        text-black dark:text-white/90">
        <div className="flex flex-row justify-between items-center w-full mb-3">
          <div className="w-[50px]"></div>
          <div className="font-bold text-center w-full ">불러오기</div>
          <div className="w-[50px] flex justify-end">
            <XMarkIcon className="w-6 h-6 cursor-pointer" onClick={handleClose} />
          </div>
        </div>

        <>
          <div className="flex flex-row gap-2 justify-between w-full font-bold mb-1">
            <span className="text-black dark:text-white/90">디폴트 데이터 사용</span>
            <Switch
              checked={useDefaultData}
              onChange={() => {
                setUseDefaultData(!useDefaultData);
                if (!useDefaultData) {
                  setSelectedFileName(null);
                }
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

          <div className="flex flex-row items-center w-full gap-2">
            {selectedFileName && (
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate flex-grow">{selectedFileName}</div>
            )}
            <div
              className={`
                  cursor-pointer text-center
           
                  text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
                  ${useDefaultData ? 'opacity-50 cursor-not-allowed' : ''}
                  ${selectedFileName ? 'w-[100px]' : 'w-full'}
                `}
              onClick={() => {
                if (!useDefaultData) {
                  handleFileSelect();
                }
              }}>
              파일 선택
            </div>
          </div>
        </>

        {!importedFileData ? (
          <></>
        ) : (
          <>
            {fileStats && (
              <div className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-3">
                <div className="text-sm font-medium mb-1">파일 정보</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div>콘 패키지: {fileStats.packageCount}개</div>
                  <div>라벨링된 콘: {fileStats.labeledConCount}개</div>
                  <div>더블콘 프리셋: {fileStats.doubleConPresetCount}개</div>
                </div>
              </div>
            )}

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
          </>
        )}
      </div>

      {importedFileData && (
        <>
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
                  handleClose();
                });
              });
            }}>
            확인
          </div>
        </>
      )}
    </Modal>
  );
};

export default ImportModal;
