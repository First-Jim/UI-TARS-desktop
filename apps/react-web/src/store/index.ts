import { makeAutoObservable } from 'mobx';
import { User } from './User';
import { Env } from './Env';
export const currentUser = new User();
export const env = new Env();

interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  // 微信相关字段
  wechatNickname?: string;
  wechatHeadImgUrl?: string;
  wechatOpenid?: string;
  wechatUnionid?: string;
}
interface IJobs {
  count: number;
  list: [];
}

interface IAccount {
  accountID: string;
  accountBalance: number;
}

class Store {
  constructor() {
    makeAutoObservable(this);
  }
  userInfo = {} as IUser;
  setUserInfo(info: IUser) {
    this.userInfo = info;
  }
  clearUserInfo() {
    this.userInfo = {} as IUser;
  }
  // 账户余额
  accountInfo = {} as IAccount;
  setAccountInfo(info: IAccount) {
    this.accountInfo = info;
  }
  jobs = { count: 0, list: [] };
  setJobs(jobs: IJobs) {
    this.jobs = jobs;
  }
  get isLogin() {
    // 检查用户信息和 access token
    const hasUserInfo = !!this.userInfo?.id;
    const hasAccessToken = !!localStorage.getItem('access_token');
    return hasUserInfo && hasAccessToken;
  }
}

const GlobalStore = new Store();

export default GlobalStore;
