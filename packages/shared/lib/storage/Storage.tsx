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
  private static cache: { [key: string]: any } = {};

  static saveCurrentUserId(userId: string) {
    this.userId = userId;
  }

  static getCurrentUserId() {
    return this.userId;
  }

  private static async get<T>(key: string, isUseCache: boolean = false): Promise<T | null> {
    if (isUseCache && this.cache[key]) {
      return this.cache[key];
    }

    const result = await readLocalStorage<T>(key);
    this.cache[key] = result;

    console.log(`${key} get to ${result}, isUseCache: ${isUseCache}`);
    return result;
  }

  private static async set(key: string, value: any) {
    await chrome.storage.local.set({ [key]: value });
    this.cache[key] = value;

    console.log(`${key} set to ${value}`);
  }

  private static async clearCache(key: string) {
    delete this.cache[key];
  }

  static async clearAllCache() {
    this.cache = {};
  }

  static async getReplaceWordData(isUseCache: boolean = false): Promise<any | null> {
    return this.get<any>('ReplaceWordData', isUseCache);
  }

  static async setReplaceWordData(value: any) {
    await this.set('ReplaceWordData', value);
  }

  static async clearReplaceWordDataCache() {
    await this.clearCache('ReplaceWordData');
  }

  static async getCustomConList(isUseCache: boolean = false): Promise<CustomConList | null> {
    return this.get<any>('CustomConList', isUseCache);
  }

  static async setCustomConList(value: any) {
    await this.set('CustomConList', value);
  }

  static async clearCustomConListCache() {
    await this.clearCache('CustomConList');
  }

  static async getUserConfig(isUseCache: boolean = false): Promise<UserConfig | null> {
    return this.get<any>('UserConfig', isUseCache);
  }

  static async setUserConfig(value: any) {
    await this.set('UserConfig', value);
  }

  static async clearUserConfigCache() {
    await this.clearCache('UserConfig');
  }

  static async getUserId(isUseCache: boolean = false): Promise<string | null> {
    return this.get<string>('UserId', isUseCache);
  }

  static async setUserId(value: string) {
    await this.set('UserId', value);
  }

  static async clearUserIdCache() {
    await this.clearCache('UserId');
  }

  static async getDeviceId(isUseCache: boolean = false): Promise<string | null> {
    return this.get<string>('DeviceId', isUseCache);
  }

  static async setDeviceId(value: string) {
    await this.set('DeviceId', value);
  }

  static async clearDeviceIdCache() {
    await this.clearCache('DeviceId');
  }

  static async getBigConExpire(isUseCache: boolean = false): Promise<number | null> {
    return this.get<number>(`BigConExpire_${this.userId}`, isUseCache);
  }

  static async setBigConExpire(value: number) {
    await this.set(`BigConExpire_${this.userId}`, value);
  }

  static async clearBigConExpireCache() {
    await this.clearCache(`BigConExpire_${this.userId}`);
  }

  static async getUserPackageData(isUseCache: boolean = false) {
    return this.get<any>(`UserPackageData_${this.userId}`, isUseCache);
  }

  static async setUserPackageData(value: any): Promise<any | null> {
    await this.set(`UserPackageData_${this.userId}`, value);
  }

  static async clearUserPackageDataCache() {
    await this.clearCache(`UserPackageData_${this.userId}`);
  }

  static async getFavoriteConList(isUseCache: boolean = false) {
    return this.get<any>(`FavoriteConList_${this.userId}`, isUseCache);
  }

  static async setFavoriteConList(value: any): Promise<FavoriteConList | null> {
    await this.set(`FavoriteConList_${this.userId}`, value);
    return value;
  }

  static async clearFavoriteConListCache() {
    await this.clearCache(`FavoriteConList_${this.userId}`);
  }

  static async getRecentUsedConList(isUseCache: boolean = false) {
    return this.get<any>(`RecentUsedConList_${this.userId}`, isUseCache);
  }

  static async setRecentUsedConList(value: any): Promise<RecentUsedConList[] | null> {
    await this.set(`RecentUsedConList_${this.userId}`, value);
    return value;
  }

  static async clearRecentUsedConListCache() {
    await this.clearCache(`RecentUsedConList_${this.userId}`);
  }

  static async getRecentUsedDoubleConList(isUseCache: boolean = false) {
    return this.get<any>(`RecentUsedDoubleConList_${this.userId}`, isUseCache);
  }

  static async setRecentUsedDoubleConList(value: any): Promise<RecentUsedDoubleConList[] | null> {
    await this.set(`RecentUsedDoubleConList_${this.userId}`, value);
    return value;
  }

  static async clearRecentUsedDoubleConListCache() {
    await this.clearCache(`RecentUsedDoubleConList_${this.userId}`);
  }
}

export default Storage;
