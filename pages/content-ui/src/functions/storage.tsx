import exp from 'constants';

interface UserConfig {
  isDarkMode: boolean;
  isShowRightBottomButton: boolean;
  isDefaultBigCon: boolean;
  isChoseongSearch: boolean;
}

interface CustomConList {
  [key: string]: {
    title: string;
    conList: {
      [key: string]: {
        title: string;
        tag: string;
        imgPath: string;
        who: string[];
      };
    };
    packageIdx: string;
  };
}

interface FavoriteConList {
  [key: string]: boolean;
}

interface RecentUsedConList {
  packageIdx: string;
  sort: string;

  detailIdx?: string;
  imgPath?: string;
  title?: string;
}

interface RecentUsedDoubleConList {
  detailIdx: string;
  firstDoubleCon: any;
  secondDoubleCon: any;
}

const readLocalStorage = async <T,>(key: string): Promise<T | null> => {
  return new Promise<T | null>((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        // reject();
        resolve(null);
      } else {
        resolve(result[key] as T);
      }
    });
  });
};

class Storage {
  private static userId: string | null = null;

  static saveCurrentUserId(userId: string) {
    this.userId = userId;
  }

  static getCurrentUserId() {
    return this.userId;
  }

  static async get<T>(key: string): Promise<T | null> {
    return readLocalStorage<T>(key);
  }

  static async set(key: string, value: any) {
    await chrome.storage.local.set({ [key]: value });
  }

  static async getReplaceWordData() {
    return readLocalStorage<any>('ReplaceWordData');
  }

  static async setReplaceWordData(value: any) {
    await chrome.storage.local.set({ ReplaceWordData: value });
  }

  static async getUserConfig(): Promise<UserConfig | null> {
    return readLocalStorage<UserConfig>('UserConfig');
  }

  static async setUserConfig(value: UserConfig) {
    await chrome.storage.local.set({ UserConfig: value });
  }

  static async setUserId(value: string) {
    await chrome.storage.local.set({ UserId: value });
  }

  static async getUserId(): Promise<string | null> {
    return readLocalStorage<string>('UserId');
  }

  static async getDeviceId(): Promise<string | null> {
    return readLocalStorage<string>('DeviceId');
  }

  static async setDeviceId(value: string) {
    await chrome.storage.local.set({ DeviceId: value });
  }

  static async getCustomConList(): Promise<CustomConList | null> {
    return readLocalStorage<CustomConList>('CustomConList');
  }

  static async setCustomConList(value: CustomConList) {
    await chrome.storage.local.set({ CustomConList: value });
  }

  static async getUserPackageData() {
    return readLocalStorage<any>(`UserPackageData_${this.userId}`);
  }

  static async setUserPackageData(value: any) {
    await chrome.storage.local.set({ [`UserPackageData_${this.userId}`]: value });
  }

  static async getFavoriteConList(): Promise<FavoriteConList | null> {
    return readLocalStorage<FavoriteConList>(`FavoriteConList_${this.userId}`);
  }

  static async setFavoriteConList(value: FavoriteConList) {
    await chrome.storage.local.set({ [`FavoriteConList_${this.userId}`]: value });
  }

  static async getBigConExpire(): Promise<number | null> {
    return readLocalStorage<number>(`BigConExpire_${this.userId}`);
  }

  static async setBigConExpire(value: number) {
    await chrome.storage.local.set({ [`BigConExpire_${this.userId}`]: value });
  }

  static async getRecentUsedConList(): Promise<RecentUsedConList[] | null> {
    return readLocalStorage<RecentUsedConList[]>(`RecentUsedConList_${this.userId}`);
  }

  static async setRecentUsedConList(value: RecentUsedConList[]) {
    await chrome.storage.local.set({ [`RecentUsedConList_${this.userId}`]: value });
  }

  static async getRecentUsedDoubleConList(): Promise<RecentUsedDoubleConList[] | null> {
    return readLocalStorage<RecentUsedDoubleConList[]>(`RecentUsedDoubleConList_${this.userId}`);
  }

  static async setRecentUsedDoubleConList(value: RecentUsedDoubleConList[]) {
    await chrome.storage.local.set({ [`RecentUsedDoubleConList_${this.userId}`]: value });
  }
}

export default Storage;
