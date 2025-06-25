import React from 'react';
import styled from 'styled-components';
import { StyledModule } from './style';
import {
  AlipayOutlined,
  CheckCircleOutlined,
  WechatOutlined,
} from '@ant-design/icons';

const StyledLayout = styled.div`
  margin: 30px 0;
  .body {
    display: flex;
    align-item: center;
    > .label {
      font-family: PingFangSC-Medium;
      font-weight: 500;
      color: #343434;
      font-size: 16px;
      margin-top: 15px;
      margin-bottom: 20px;
      margin-right: 33px;
    }
    .payType {
      position: relative;
      width: 160px;
      height: 40px;
      border: 1px solid #eee;
      border-radius: 2px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      margin-right: 40px;

      &.selected {
        border: 2px solid #0073cb;
        border-radius: 8px;
        > .checked-icon {
          display: inline-block;
        }
      }

      > .checked-icon {
        display: none;
        position: absolute;
        bottom: -12px;
        right: -12px;
        background-color: white;

        > .anticon {
          font-size: 25px;
          color: #0073cb;
        }
      }

      > .anticon {
        font-size: 26px;
        margin: 0 15px 0 25px;
      }
    }
  }
`;

export function PayType({
  payType,
  setPayType,
}: {
  payType: any;
  setPayType: any;
}) {
  return (
    <StyledLayout>
      <StyledModule>
        <div className="body">
          <div className="label">支付方式</div>
          <div
            className={'payType selected align-center'}
            onClick={() => setPayType(303)}
          >
            <img
              src="/public/assets/images/alipay.svg"
              style={{
                marginLeft: '25px',
                width: '30px',
                height: '30px',
                marginRight: '10px',
              }}
              alt=""
            />
            <span>支付宝</span>
            {/* <div className='checked-icon'>
              <CheckCircleOutlined />
            </div> */}
          </div>
          {/* <div
            className={`payType ${payType === 203 ? 'selected' : ''}`}
            onClick={() => setPayType(203)}>
            <WechatOutlined style={{ color: '#62b900' }} />
            <span>微信</span>
            <div className='checked-icon'>
              <CheckCircleOutlined />
            </div>
          </div> */}
        </div>
      </StyledModule>
    </StyledLayout>
  );
}
