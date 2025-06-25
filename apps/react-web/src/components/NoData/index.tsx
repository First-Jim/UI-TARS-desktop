import { Empty } from 'antd';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 11px 0 10px;
  text-align: center;
  color: #00000040;
  width: 100%;
  background: #fff;
`;

const NoData = ({
  text,
  style,
  ...rest
}: {
  text?: string | React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <Wrapper style={style}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={text || '暂无数据'}
        imageStyle={{ color: 'red' }}
        {...rest}
      />
    </Wrapper>
  );
};
export default NoData;
