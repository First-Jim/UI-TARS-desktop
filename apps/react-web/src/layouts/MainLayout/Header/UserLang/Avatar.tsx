import { authApi } from '@/services';
import GlobalStore from '@/store';
import { Button, Tooltip, Avatar as AntdAvatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import replace from 'lodash/replace';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { userImg } from '@/utils';
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
  const goUserCenter = () => {
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
        {GlobalStore?.userInfo?.id ? (
          <Tooltip
            color="#fff"
            overlay={
              <div
                className="avatar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '184px',
                }}
              >
                <Button type="text" onClick={goUserCenter}>
                  个人中心
                </Button>
                <Button type="text" onClick={goPluginPage}>
                  插件下载
                </Button>
                <Button type="text" onClick={authApi.logout}>
                  退出
                </Button>
              </div>
            }
          >
            <AvatarWrapper className="flex cursor-pointer items-center">
              {/* 优先显示微信头像，否则显示默认头像 */}
              {GlobalStore?.userInfo?.wechatHeadImgUrl ? (
                <img
                  src={GlobalStore.userInfo.wechatHeadImgUrl}
                  alt="微信头像"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <img src={userImg} alt="默认头像" className="w-8 h-8" />
              )}
              <span className="ml-2 mr-2">
                {/* 优先显示微信昵称，然后是用户名，最后是手机号 */}
                {GlobalStore?.userInfo?.wechatNickname ||
                  GlobalStore?.userInfo?.name ||
                  replace(GlobalStore?.userInfo?.phone || '', '+86', '')}
              </span>
            </AvatarWrapper>
          </Tooltip>
        ) : (
          <div className="flex items-center">
            <img src={userImg} alt="search" />
            <span
              className="ml-2  cursor-pointer"
              onClick={() => navigate('/login')}
            >
              注册/登录
            </span>
          </div>
        )}
      </div>
    </Wrapper>
  );
});
