import React from 'react';
import styled from 'styled-components';
import { StyledModule } from './style';
import { InputNumber } from 'antd';

const StyledLayout = styled.div`
  .unit {
    margin-left: 4px;
  }
`;

export function CustomAmount({ custom, setCustom }) {
  return (
    <StyledLayout>
      <StyledModule>
        <div className="body">
          <InputNumber
            style={{ width: '160px', height: '40px', lineHeight: '40px' }}
            min={1}
            value={custom}
            placeholder="输入>=1的整数"
            onChange={setCustom}
            parser={(value) => {
              if (Number.isNaN(parseInt(value))) {
                return undefined;
              }
              return parseInt(value);
            }}
          />
          <span className="unit">自定义金额</span>
        </div>
      </StyledModule>
    </StyledLayout>
  );
}
