import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { Button, Modal } from 'antd';
import { CreditModal } from './CreditModal';
import http from '@/utils/http';
import { usePromise } from '@/utils';
import qs from 'querystring';
import { formatMoney } from '@/utils/formatMoney';

const StyledLayout = styled.div`
  display: flex;

  > .container {
    display: flex;
    flex-direction: column;
    margin-right: auto;

    > .info {
      font-size: 16px;

      > div {
        margin: 4px 0;
      }

      > .rebate {
        color: #f5333b;
      }

      > .money {
        > span {
          vertical-align: middle;
          font-family: PingFangSC-Medium;
          font-weight: 500;
          color: #343434;
          font-size: 16px;
        }
        display: flex;
        align-items: baseline;
        > .amount {
          margin-left: 32px;
          font-size: 36px;
        }
      }
    }

    > .btns {
      color: #fff;
      > .disabled {
        cursor: not-allowed;
        // pointer-events: none;
      }
      > .not-disabled {
        cursor: pointer;
      }
      .payMoney {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 160px;
        height: 40px;
        background-image: linear-gradient(
          95deg,
          #00adff 0%,
          #1165d2 45%,
          #9b33b9 100%
        );
        border-radius: 8px;
        margin-top: 40px;
      }
    }
  }
`;

export function Confirm({ payType, amount }) {
  const rechargeDisable = () => {
    if (!amount) {
      return '充值金额不能为空';
    }

    if (+amount < 1) {
      return '充值金额不能小于 1';
    }

    return false;
  };

  const goAlipay = () => {
    if (rechargeDisable() === false) {
      window.location.href = `/business/alipay/pay?amount=${amount}`;
    }
  };
  return (
    <StyledLayout>
      <div className="container">
        <div className="info">
          <div className="money">
            <span>确认金额</span>
            <span className="amount">
              <span className="value">{formatMoney(amount)}</span>
            </span>
          </div>
        </div>
        <div className="btns">
          <div
            className={`payMoney ${rechargeDisable() === false ? 'not-disabled' : 'disabled'}`}
            onClick={goAlipay}
          >
            立即充值
          </div>
        </div>
      </div>
    </StyledLayout>
  );
}
