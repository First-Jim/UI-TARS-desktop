import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
const StyledLayout = styled.div`
  .title {
    display: flex;
    font-family: PingFangSC-Regular;
    font-size: 20px;
    color: #004588;
    font-weight: 400;
    cursor: pointer;
    height: 30px;
    line-height: 30px;
    font-size: 18px;
  }
`;
interface IGoBack {
  routerPath: string;
}
export default function GoBack({ routerPath = '/' }: IGoBack) {
  const navigate = useNavigate();
  const goBack = () => {
    navigate(routerPath);
  };
  return (
    <StyledLayout>
      <div className="title" onClick={goBack}>
        返回首页{' '}
        <img
          width={18}
          height={18}
          src="/public/assets/images/arrow-left.svg"
        />
      </div>
    </StyledLayout>
  );
}
