/**
 * 简化的存储工具类
 * 主要使用 localStorage，提供同步接口，避免 Promise 复杂性
 * 对于复杂数据，可以选择性使用 localforage
 */
export class Storage {
  /**
   * 设置存储项（同步）
   * @param key 键名
   * @param value 值（支持任意类型）
   */
  static setItem<T>(key: string, value: T): void {
    try {
      console.log(`💾 Storage: Setting ${key}`, value);
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`❌ Storage: Failed to set ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取存储项（同步）
   * @param key 键名
   * @param defaultValue 默认值
   */
  static getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }

      const value = JSON.parse(item);
      console.log(`📖 Storage: Getting ${key}`, value);
      return value;
    } catch (error) {
      console.error(`❌ Storage: Failed to get ${key}`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 删除存储项（同步）
   * @param key 键名
   */
  static removeItem(key: string): void {
    try {
      console.log(`🗑️ Storage: Removing ${key}`);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Storage: Failed to remove ${key}`, error);
      throw error;
    }
  }

  /**
   * 清空所有存储（同步）
   */
  static clear(): void {
    try {
      console.log('🧹 Storage: Clearing all data');
      localStorage.clear();
    } catch (error) {
      console.error('❌ Storage: Failed to clear', error);
      throw error;
    }
  }

  /**
   * 获取所有键名（同步）
   */
  static keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('❌ Storage: Failed to get keys', error);
      return [];
    }
  }

  /**
   * 获取存储项数量（同步）
   */
  static get length(): number {
    try {
      return localStorage.length;
    } catch (error) {
      console.error('❌ Storage: Failed to get length', error);
      return 0;
    }
  }

  /**
   * 检查是否存在某个键（同步）
   * @param key 键名
   */
  static hasItem(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`❌ Storage: Failed to check ${key}`, error);
      return false;
    }
  }
}

/**
 * 异步存储工具类（使用 localforage）
 * 用于需要存储大量数据或复杂对象的场景
 */
import localforage from 'localforage';

// 配置 localforage
localforage.config({
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  name: 'my-fullstack-app',
  version: 1.0,
  size: 4980736, // 5MB
  storeName: 'app_storage',
  description: 'Application storage for user data and cache',
});

export class AsyncStorage {
  /**
   * 设置存储项（异步）
   * @param key 键名
   * @param value 值（支持任意类型）
   */
  static async setItem<T>(key: string, value: T): Promise<T> {
    try {
      console.log(`💾 AsyncStorage: Setting ${key}`, value);
      return await localforage.setItem(key, value);
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to set ${key}`, error);
      // 降级到同步存储
      Storage.setItem(key, value);
      return value;
    }
  }

  /**
   * 获取存储项（异步）
   * @param key 键名
   * @param defaultValue 默认值
   */
  static async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await localforage.getItem<T>(key);
      console.log(`📖 AsyncStorage: Getting ${key}`, value);
      return value !== null ? value : (defaultValue ?? null);
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to get ${key}`, error);
      // 降级到同步存储
      return Storage.getItem(key, defaultValue);
    }
  }

  /**
   * 删除存储项（异步）
   * @param key 键名
   */
  static async removeItem(key: string): Promise<void> {
    try {
      console.log(`🗑️ AsyncStorage: Removing ${key}`);
      await localforage.removeItem(key);
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to remove ${key}`, error);
      // 降级到同步存储
      Storage.removeItem(key);
    }
  }

  /**
   * 清空所有存储（异步）
   */
  static async clear(): Promise<void> {
    try {
      console.log('🧹 AsyncStorage: Clearing all data');
      await localforage.clear();
    } catch (error) {
      console.error('❌ AsyncStorage: Failed to clear', error);
      // 降级到同步存储
      Storage.clear();
    }
  }
}

// 导出默认实例
export default Storage;

// 常用的存储键名常量
export const STORAGE_KEYS = {
  // 用户相关
  USER_INFO: 'user_info',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',

  // 应用设置
  APP_SETTINGS: 'app_settings',
  THEME: 'theme',
  LANGUAGE: 'language',

  // 缓存
  API_CACHE: 'api_cache',
  LAST_AUTH_CHECK: 'last_auth_check',

  // 临时数据
  TEMP_DATA: 'temp_data',
  FORM_DRAFT: 'form_draft',
} as const;
