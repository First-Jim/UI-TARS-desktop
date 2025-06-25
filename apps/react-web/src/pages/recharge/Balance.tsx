import React from 'react';
import styled from 'styled-components';
import { PayCircleOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { formatMoney } from '@/utils/formatMoney';
const StyledLayout = styled.div`
  height: 80px;
  > .header {
    display: flex;
    align-items: baseline;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    color: #343434;
    font-size: 20px;
    position: relative;
    > .text {
      margin: 20px 20px 0 0;
    }
    > .balance {
      font-size: 20px;
    }

    ::before {
      content: '';
      width: 4px;
      height: 38px;
      background: #0073cb;
      position: absolute;
      left: -1.33rem;
      top: 1rem;
    }
  }
`;

export const Balance = observer(({ balance }: { balance: number }) => {
  return (
    <StyledLayout>
      <div className="header">
        <span className="text">账户余额</span>
        <div className="balance">{formatMoney(balance)}</div>
      </div>
    </StyledLayout>
  );
});
