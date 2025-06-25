import { Modal, ModalProps } from 'antd';
import { get } from 'lodash';
import React, { forwardRef, Ref, useImperativeHandle, useState } from 'react';

interface Props extends ModalProps {
  async?: boolean; // 支持异步
  content?: React.ReactNode; // 显示内容
}
export default forwardRef((props: Props, ref: Ref<unknown> | undefined) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { async, onOk, onCancel, content, ...rest } = props;

  useImperativeHandle(ref, () => ({
    show,
    close: cancel,
  }));

  const show = () => {
    setIsOpen(true);
  };

  const ok = async (e: any) => {
    if (async) setIsOpen(false);
    if (onOk) {
      setLoading(true);
      try {
        await onOk(e);
        setIsOpen(false);
      } catch (e) {}
      setLoading(false);
    } else {
      setIsOpen(false);
    }
  };

  const cancel = async (e: any) => {
    if (onCancel) {
      onCancel(e);
    }
    setIsOpen(false);
  };

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const disabled = get(content, 'props.disabled', false);
    const loading = get(content, 'props.loading', false);
    if (disabled || loading) return;
    setIsOpen(true);
  };

  return (
    <>
      <Modal
        styles={{
          body: {
            padding: '20px 10px 10px',
            borderBottom: '1px solid #eee',
          },
        }}
        open={isOpen}
        onCancel={cancel}
        cancelButtonProps={{
          disabled: loading,
        }}
        onOk={ok}
        confirmLoading={loading}
        closable={!loading && props.closable}
        {...rest}
      />
      {content &&
        React.Children.map(content, (child) => {
          return React.cloneElement(child, { onClick });
        })}
    </>
  );
});
