const readLocalStorage = async key => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        // reject();
        resolve(null);
      } else {
        resolve(result[key]);
      }
    });
  });
};
class Storage {
  static userId = null;
  static cache = {};
  static saveCurrentUserId(userId) {
    this.userId = userId;
  }
  static getCurrentUserId() {
    return this.userId;
  }
  static async get(key, isUseCache = false) {
    if (isUseCache && this.cache[key]) {
      return this.cache[key];
    }
    const result = await readLocalStorage(key);
    this.cache[key] = result;
    // console.log(`${key} get to ${result}, isUseCache: ${isUseCache}`);
    return result;
  }
  static async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
    this.cache[key] = value;
    // console.log(`${key} set to ${value}`);
  }
  static async clearCache(key) {
    delete this.cache[key];
  }
  static async clearAllCache() {
    this.cache = {};
  }
  static async getReplaceWordData(isUseCache = false) {
    return this.get('ReplaceWordData', isUseCache);
  }
  static async setReplaceWordData(value) {
    await this.set('ReplaceWordData', value);
  }
  static async clearReplaceWordDataCache() {
    await this.clearCache('ReplaceWordData');
  }
  static async getCustomConList(isUseCache = false) {
    return this.get('CustomConList', isUseCache);
  }
  static async setCustomConList(value) {
    await this.set('CustomConList', value);
  }
  static async clearCustomConListCache() {
    await this.clearCache('CustomConList');
  }
  static async getUserConfig(isUseCache = false) {
    return this.get('UserConfig', isUseCache);
  }
  static async setUserConfig(value) {
    await this.set('UserConfig', value);
  }
  static async clearUserConfigCache() {
    await this.clearCache('UserConfig');
  }
  static async getUserId(isUseCache = false) {
    return this.get('UserId', isUseCache);
  }
  static async setUserId(value) {
    await this.set('UserId', value);
  }
  static async clearUserIdCache() {
    await this.clearCache('UserId');
  }
  static async getDeviceId(isUseCache = false) {
    return this.get('DeviceId', isUseCache);
  }
  static async setDeviceId(value) {
    await this.set('DeviceId', value);
  }
  static async clearDeviceIdCache() {
    await this.clearCache('DeviceId');
  }
  static async getBigConExpire(isUseCache = false) {
    return this.get(`BigConExpire_${this.userId}`, isUseCache);
  }
  static async setBigConExpire(value) {
    await this.set(`BigConExpire_${this.userId}`, value);
  }
  static async clearBigConExpireCache() {
    await this.clearCache(`BigConExpire_${this.userId}`);
  }
  static async getUserPackageData(isUseCache = false) {
    return this.get(`UserPackageData_${this.userId}`, isUseCache);
  }
  static async setUserPackageData(value) {
    await this.set(`UserPackageData_${this.userId}`, value);
  }
  static async clearUserPackageDataCache() {
    await this.clearCache(`UserPackageData_${this.userId}`);
  }
  static async getFavoriteConList(isUseCache = false) {
    return this.get(`FavoriteConList_${this.userId}`, isUseCache);
  }
  static async setFavoriteConList(value) {
    await this.set(`FavoriteConList_${this.userId}`, value);
    return value;
  }
  static async clearFavoriteConListCache() {
    await this.clearCache(`FavoriteConList_${this.userId}`);
  }
  static async getRecentUsedConList(isUseCache = false) {
    return this.get(`RecentUsedConList_${this.userId}`, isUseCache);
  }
  static async setRecentUsedConList(value) {
    await this.set(`RecentUsedConList_${this.userId}`, value);
    return value;
  }
  static async clearRecentUsedConListCache() {
    await this.clearCache(`RecentUsedConList_${this.userId}`);
  }
  static async getRecentUsedDoubleConList(isUseCache = false) {
    return this.get(`RecentUsedDoubleConList_${this.userId}`, isUseCache);
  }
  static async setRecentUsedDoubleConList(value) {
    await this.set(`RecentUsedDoubleConList_${this.userId}`, value);
    return value;
  }
  static async clearRecentUsedDoubleConListCache() {
    await this.clearCache(`RecentUsedDoubleConList_${this.userId}`);
  }
}
export default Storage;
