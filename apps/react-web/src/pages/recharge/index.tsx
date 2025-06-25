import { accountApi } from '@/services';
import GlobalStore from '@/store';
import { Tabs } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Balance } from './Balance';
import { Confirm } from './Confirm';
import { CustomAmount } from './CustomAmount';
import { PayType } from './PayType';
import { Quota } from './Quota';
import GoBack from '@/components/GoBack';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

const { TabPane } = Tabs;

const Warpper = styled.div`
  margin-top: 20px;
  .right {
    font-family: PingFangSC-Regular;
    font-size: 18px;
    color: #004588;
    cursor: pointer;
    height: 30px;
    line-height: 30px;
    display: flex;
    justify-content: flex-end;
  }
  @media screen and (min-width: 780px) {
    .list-container-header,
    .list-container-content,
    .user-info {
      margin-right: 4%;
      margin-left: 4%;
    }
  }

  @media screen and (min-width: 1080px) {
    .list-container-header,
    .list-container-content,
    .user-info {
      margin-right: 6.2rem;
      margin-left: 6.2rem;
    }
  }
`;
const StyledLayout = styled.div`
  margin-top: 20px;
  padding: 20px 20px;
  border-radius: 4px;
  box-shadow: 0 0 5px #eee;

  > .body {
    display: flex;
    align-items: center;
  }
  > .footer {
    display: flex;
    align-items: flex-start;
    padding: 20px;
  }
`;

export default function Recharge() {
  const [payType, setPayType] = useState();
  const [quota, setQuota] = useState(1000);
  const [custom, setCustom] = useState();
  const [amount, setAmount] = useState();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      await accountApi.getAccountBalance().then((res) => {
        GlobalStore.setAccountInfo(res);
      });
    })();
  }, []);
  function onTabChange(key) {
    if (key === 'recharge') {
      navigate('/recharge');
    }

    if (key === 'record') {
      navigate('/recharge_record');
    }
  }

  function updateQuota(value) {
    setQuota(value);
    setAmount(value);

    // reset custom
    setCustom(undefined);
  }

  function updateCustom(value) {
    setCustom(value);
    setAmount(value);
    // reset quota
    setQuota(undefined);
  }

  return (
    <MainLayout>
      <Warpper>
        <div className="list-container-content">
          {/* <Tabs
            defaultActiveKey="recharge
            onChange={onTabChange}
            className="tabs"
          >
            <TabPane tab="充值" key="recharge" className="tabline">
              <StyledLayout>
                <Balance balance={10000} />
                <div className="body">
                  <PayType payType={payType} setPayType={setPayType} />
                  <Quota quota={quota} setQuota={updateQuota} />
                  <CustomAmount custom={custom} setCustom={updateCustom} />
                </div>
                <div className="footer">
                  <Confirm payType={payType} amount={amount} />
                </div>
              </StyledLayout>
            </TabPane>
            <TabPane tab="记录" key="record" />
          </Tabs> */}
          <div className="right">
            {' '}
            <GoBack routerPath="/" />
          </div>
          <StyledLayout>
            <Balance balance={GlobalStore?.accountInfo?.accountBalance} />

            <div className="body">
              <Quota quota={quota} setQuota={updateQuota} />
              <CustomAmount custom={custom} setCustom={updateCustom} />
            </div>
            <PayType payType={payType} setPayType={setPayType} />
            <div className="footers">
              <Confirm payType={payType} amount={amount} />
            </div>
          </StyledLayout>
        </div>
      </Warpper>
    </MainLayout>
  );
}
