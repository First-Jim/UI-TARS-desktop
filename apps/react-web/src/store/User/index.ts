import { observable, computed } from 'mobx';
import { authApi } from '@/services';
export class BaseUser {
  @observable id: string = '';
  @observable name: string = '';
  @observable email: string = '';
  @observable phone: string = '';
  @observable role: string = '';
}

type IRequest = Omit<BaseUser, 'id'> & {
  ys_id: string;
};

export class User extends BaseUser {
  constructor(props?: IRequest) {
    super();
    if (props) {
      this.init(props);
    }
  }

  init = (props: Partial<IRequest>) => {
    Object.assign(this, props);
  };

  fetch = async () => {
    const res = await authApi.getUserInfo();
    this.init(res.data);

    return res;
  };

  login = () => {
    window.location.href = `/business/sso/login?source_uri=${window.location.href}`;
  };

  logout = () => {
    window.location.href = `/business/sso/logout?source_uri=${window.location.origin}`;
  };
}
