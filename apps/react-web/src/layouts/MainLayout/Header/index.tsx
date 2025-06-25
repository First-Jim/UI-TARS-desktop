/**
 * @name 自定义导航栏
 * @author oh
 */
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import UserLang from './UserLang';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
const Wrapper = styled.div`
  height: 56px;
  line-height: 56px;
  position: sticky;
  width: 100%;
  z-index: 100;
  padding: 0 3.5rem 0 6rem;
  border-block-end: 1px solid rgba(5, 5, 5, 0.06);
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);

  @media only screen and (max-width: 1080px) {
    .title {
      display: none;
    }
    .username {
      display: none;
    }
  }

  @media only screen and (max-width: 960px) {
    .link-col {
      margin-left: 10px;
      margin-right: 10px;
    }
  }
`;

export default observer(() => {
  // const isDownloadPage = location.pathname.includes('/download');
  return (
    <Wrapper className="flex justify-between">
      <Link to={'/'} className="flex items-center">
        <img src="/public/assets/images/logo.svg" width={250} />
        {/* <span className="title fz-16 ml-24 color-gray">
          {intl.formatMessage({ id: 'page.yscae' })}
        </span> */}
      </Link>
      <UserLang />
    </Wrapper>
  );
});
