import GlobalStore, { currentUser } from '@/store';
import Storage, { STORAGE_KEYS } from '@/utils/storage';
export class Env {
  init = async () => {
    console.log(
      '🔧 Initializing env, has access token:',
      Storage.hasItem(STORAGE_KEYS.ACCESS_TOKEN),
    );

    // 只有在有 ACCESS_TOKEN 的情况下才尝试获取用户信息
    if (Storage.hasItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      try {
        console.log('📱 Found access token, fetching user info...');
        await currentUser.fetch();
        console.log('✅ User info fetched successfully');
      } catch (error) {
        console.error('❌ Failed to fetch user info:', error);
        // 如果获取用户信息失败，清除无效的 token
        Storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        Storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        GlobalStore.clearUserInfo();
      }
    } else {
      console.log('🔓 No access token found, user needs to login');
    }

    // observer user change
    window.onstorage = async (e) => {
      if (e.key === 'userId') {
        window.location.reload();
      }
    };
  };
}
