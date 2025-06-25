import React from 'react';
import styled from 'styled-components';
import { StyledModule } from './style';

const StyledLayout = styled.div`
  margin: 10px 0;
  .body {
    display: flex;
    align-item: center;
    justify-content: center;
    color: #343434;

    .label {
      font-size: 16px;
      margin-top: 1rem;
      width: 98px;
      font-family: PingFangSC-Medium;
      font-weight: 500;
    }
    > .card {
      width: 160px;
      height: 40px;
      margin-right: 15px;
      text-align: center;
      line-height: 40px;
      cursor: pointer;
      border: 1px solid #dadada;
      border-radius: 8px;
      &.selected {
        border: 1px solid #0073cb;
        background: #0073cb;
        color: white;
      }
    }
  }
`;

const quotaList = [1000, 5000, 10000];

export function Quota({
  quota,
  setQuota,
}: {
  quota: number;
  setQuota: Function;
}) {
  return (
    <StyledLayout>
      <StyledModule>
        <div className="body">
          <div className="label">充值金额</div>
          {quotaList.map((item) => (
            <div
              key={item}
              className={`card ${quota === item ? 'selected' : ''}`}
              onClick={() => setQuota(item)}
            >
              {item}
            </div>
          ))}
        </div>
      </StyledModule>
    </StyledLayout>
  );
}
