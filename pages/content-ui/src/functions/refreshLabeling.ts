import makeToast from '../functions/toast';
import useGlobalStore from '../store/globalStore';
import Storage from '@extension/shared/lib/storage';

export const refreshLabeling = async (isShowToast: boolean = true): Promise<boolean> => {
  try {
    const response = await fetch('https://qtiplus.vercel.app/data.json');
    const data = await response.json();

    return new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          type: 'IMPORT_DATA',
          data: {
            importedFileData: data,
            isImportOverwrite: false,
            isImportIncludeDoubleConPreset: true,
          },
        },
        async response => {
          if (response.success) {
            // storage에 저장
            if (isShowToast) {
              makeToast('라벨링 업데이트가 완료되었습니다.');
            }
            resolve(true);
          } else {
            if (isShowToast) {
              makeToast('라벨링 업데이트에 실패했습니다.');
            }
            resolve(false);
          }
        },
      );
    });
  } catch (error) {
    if (isShowToast) {
      makeToast('데이터를 불러오는데 실패했습니다.');
    }
    return false;
  }
};
