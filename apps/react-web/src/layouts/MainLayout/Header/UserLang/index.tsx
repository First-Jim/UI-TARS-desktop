import { authApi } from '@/services';
import GlobalStore from '@/store';
import { Button, Tooltip } from 'antd';
import replace from 'lodash/replace';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
const Wrapper = styled.div`
  .rechargeBtn {
    width: 70px;
    height: 30px;
    margin-right: 48px;
    line-height: 30px;
    text-align: center;
    background-image: linear-gradient(
      95deg,
      #00adff 0%,
      #1165d2 45%,
      #9b33b9 100%
    );
    border-radius: 8px;
    font-family: PingFangSC-Regular;
    color: #ffffff;
  }
  .balance {
    vertical-align: middle;
    font-family: PingFangSC-Regular;
    color: #525252;
    margin-right: 40px;
  }
  .avatar {
    width: 180px;
    box-shadow: 2px 2px 16px 3px rgba(0, 0, 0, 0.22);
    border-radius: 8px;
    font-family: PingFangSC-Regular;
    font-size: 20px;
    color: #525252;
    .ant-btn {
      width: 180px;
      height: 40px;
    }
  }
`;
const AvatarWrapper = styled.div`
  font-family: PingFangSC-Regular;
  color: #525252;
  .username-icon-active {
    display: none;
  }
  &:hover {
    .CaretUpOutlined {
      transform: rotate(180deg);
      transition: transform 0.3s;
    }
    .username-icon {
      display: none;
    }
    .username-icon-active {
      font-family: PingFangSC-Regular;
      display: block;
    }
    .username {
      font-family: PingFangSC-Regular;
      color: #525252;
    }
  }
`;

export default observer(() => {
  const { userInfo, isLogin } = GlobalStore;

  const navigate = useNavigate();
  const goProjectPage = () => {
    navigate(`/user`);
  };
  const goRechargePage = () => {
    navigate(`/recharge`);
  };
  const goPluginPage = () => {
    navigate(`/download`);
  };
  return (
    <Wrapper>
      <div className="w-full  sm:px-10 px-5 flex justify-between items-center">
        {userInfo?.id && (
          <div className="balance flex justify-center items-center">
            <img
              src="/public/assets/images/creditcard.svg"
              width={40}
              className="pr-3"
            />{' '}
            账户余额：￥{GlobalStore?.accountInfo?.accountBalance || 0.0}
          </div>
        )}
        {userInfo?.id && (
          <div className="rechargeBtn  cursor-pointer" onClick={goRechargePage}>
            充值
          </div>
        )}
        <Avatar />
      </div>
    </Wrapper>
  );
});
