import { Descriptions } from '@/components/antd';
import MainLayout from '@/layouts/MainLayout';
import { authApi } from '@/services';
import GlobalStore from '@/store';
import { Col, Modal as Mod, Popconfirm, Row } from 'antd';
import { replace } from 'lodash';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useRef } from 'react';
import styled from 'styled-components';
import avatar from '/public/assets/images/user.svg';
import email from '/public/assets/images/email.svg';
import GoBack from '@/components/GoBack';

const LeftWrapper = styled.div`
  padding: 20px 16px;
  background: #fff;
  flex: 1;
  border-radius: 4px;
  box-shadow: 0 0 5px #eee;

  .edit {
    cursor: pointer;
  }
  .ant-descriptions-item-container {
    display: flex;
    align-items: center;
  }
  .ant-descriptions-title {
    font-weight: 450;
    font-weight: normal;

    .title-extra {
      font-size: 1rem;
      color: #666;
    }
  }
  .ant-descriptions-row {
    font-size: 12px;

    .ant-descriptions-item-label {
      display: flex;
      justify-content: center;
      align-items: center;
      color: #666;
    }
    .ant-descriptions-item-content {
      color: #666;
    }
  }
  Button {
    margin-left: 0.3rem;
  }
`;
const Avatar = () => {
  const { userInfo } = GlobalStore;
  const userRef = useRef(null);

  const state = useLocalObservable(() => ({
    refreshIndex: 0,
    setRefreshIndex() {
      this.refreshIndex = Date.now();
    },
    searchValue: {
      start_time: '',
      combo_name: '',
    },
    setSearchValue(searchValue: { [key: string]: string | number }) {
      this.searchValue = Object.assign({}, this.searchValue, searchValue);
    },
  }));

  return (
    <MainLayout>
      <div className="user-info">
        <Row gutter={24} justify="center">
          <Col span={22}>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 'bolder',
                margin: '30px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div className="left">个人中心</div>
              <GoBack routerPath="/" />
            </div>
          </Col>
        </Row>
        <Row gutter={24} justify="center">
          <Col span={22}>
            <LeftWrapper>
              <Descriptions
                className="middle-text"
                column={3}
                title={
                  <>
                    <h3 className="fz-20 mb-0">{userInfo.name}</h3>
                  </>
                }
                items={[
                  {
                    label: (
                      <>
                        <img loading={'eager'} className="mr-2" src={avatar} />
                        账号
                      </>
                    ),
                    children: replace(userInfo.phone, '+86', ''),
                    copy: true,
                  },
                  {
                    label: (
                      <>
                        <img loading={'eager'} className="mr-2" src={email} />
                        邮箱
                      </>
                    ),
                    children: userInfo.email,
                    copy: true,
                  },
                ]}
              />
            </LeftWrapper>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
};

export default observer(Avatar);
