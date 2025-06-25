import React from 'react';
import { getCookie } from '../../cookie';
import { CopyOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { message as AntMessage, Modal } from 'antd';

class ErrorDialog {
  instance;
  constructor() {}

  show({ message, title, code, config }) {
    if (this.instance) return;
    if (code === 401) {
      const bool = !!getCookie('soc-session-id');
      this.instance = Modal.info({
        width: 480,
        title: '提示',
        autoFocusButton: null,
        style: { top: 140 },
        content: (
          <div className="pb-5 pt-5">
            {bool ? (
              <span
                dangerouslySetInnerHTML={{
                  __html:
                    '您好，您当前登录已失效，请点击下方 <span class="color-primary">重新登录</span> 按钮。',
                }}
              />
            ) : (
              <span
                dangerouslySetInnerHTML={{
                  __html:
                    '您好，您当前账号还未登录，请点击下方 <span class="color-primary">登录</span> 按钮。',
                }}
              />
            )}
          </div>
        ),
        // content: message,
        onOk: () => {
          this.instance = null;
          window.location.href = `/business/sso/login?source_uri=${window.location.href}`;
        },
        okText: bool ? '重新登录' : '登录',
      });
    } else {
      AntMessage.error(message);
    }
  }
}

export default ErrorDialog;
