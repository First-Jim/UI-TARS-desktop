import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import styled from 'styled-components';

const Wrapper = styled.span`
  .copy {
    opacity: 0;
    margin-left: 4px;
  }
  &:hover {
    .copy {
      opacity: 1;
      &:hover {
        color: #1a6cba;
        transition: 0.2s all;
        transform: scale(1.1);
      }
    }
  }
`;
const Copy = ({
  text = '',
  children,
}: {
  text?: string;
  children?: React.ReactNode;
}) => {
  const copy = (e) => {
    e.stopPropagation();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.value = text;
    input.select();
    document.execCommand('copy', false);
    input.remove();
    message.success('复制成功');
  };
  return (
    <Wrapper>
      {children ? children : <span>{text || '--'}</span>}
      {text && (
        <CopyOutlined onClick={copy} className="copy ml-4 cursor-pointer" />
      )}
    </Wrapper>
  );
};

export default Copy;
