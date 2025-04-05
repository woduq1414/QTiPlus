import { useState, useEffect, useCallback } from 'react';
import { ConPackage, CustomConList } from '@src/types/conList';
import Storage from '@extension/shared/lib/storage';
import { Message } from '@extension/shared/lib/enums/Message';
import makeToast from '@src/functions/toast';
import parseCookies from '@src/functions/cookies';

export const useConList = (userId: string, setUserPackageData: (data: any) => void) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [conLabelList, setConLabelList] = useState<CustomConList['conLabelList'] | null>(null);
  const [doubleConPreset, setDoubleConPreset] = useState<any>(null);
  const [isHideState, setIsHideState] = useState<{ [key: string]: boolean }>({});

  const toggleIsHide = useCallback((key: string) => {
    setIsHideState(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const syncConList = useCallback(async () => {
    if (isSyncing) return;

    const cookies = parseCookies();
    const ci_t = cookies['ci_c'];

    setIsSyncing(true);
    setSyncProgress('');

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'SYNC_CON_LIST',
          data: {
            ci_t,
            userId,
          },
        },
        response => {
          if (response.error) {
            makeToast(response.error);
            setIsSyncing(false);
            reject(response.error);
            return;
          }

          setUserPackageData(response.data);
          makeToast('동기화 성공!');

          chrome.runtime.sendMessage({
            type: 'TRIGGER_EVENT',
            action: 'SYNC_CON_LIST',
            data: {
              dataLength: Object.keys(response.data).length,
            },
          });

          setIsSyncing(false);
          resolve(response.data);
        },
      );
    });
  }, [isSyncing, userId, setUserPackageData]);

  const saveHideState = useCallback(
    async (hideState: { [key: string]: boolean }) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'UPDATE_HIDE_STATE',
            data: {
              hideState,
            },
          },
          response => {
            if (response.error) {
              reject(response.error);
              return;
            }

            setUserPackageData(response.data);
            chrome.runtime.sendMessage({ type: Message.CHANGED_DATA }, () => {
              makeToast('저장 완료!');
              resolve(response.data);
            });
          },
        );
      });
    },
    [setUserPackageData],
  );

  const loadCustomConList = useCallback(async () => {
    const storageConLabelList = await Storage.getCustomConList();
    if (storageConLabelList) {
      setConLabelList(storageConLabelList['conLabelList']);
      setDoubleConPreset(storageConLabelList['doubleConPreset']);
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'SYNC_PROGRESS') {
        setSyncProgress(` (${request.data.page + 1}/${request.data.maxPage + 1})`);
      }
    });

    loadCustomConList();
  }, [loadCustomConList]);

  return {
    isSyncing,
    syncProgress,
    conLabelList,
    doubleConPreset,
    isHideState,
    toggleIsHide,
    syncConList,
    saveHideState,
    setConLabelList,
    setDoubleConPreset,
  };
};
