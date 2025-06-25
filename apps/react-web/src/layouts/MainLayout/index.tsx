import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import Header from './Header';

const Wrapper = styled.div`
  .user-info {
    .right {
      font-family: PingFangSC-Regular;
      font-size: 20px;
      color: #004588;
      font-weight: 400;
      cursor: pointer;
      height: 30px;
      line-height: 30px;
    }
  }
`;

export default observer((props: { children: React.ReactNode }) => {
  const { children } = props;
  return (
    <Wrapper>
      <Header />
      {children}
    </Wrapper>
  );
});
