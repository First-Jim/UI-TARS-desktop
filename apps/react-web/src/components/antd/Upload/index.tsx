import type { UploadFile, UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { isValidElement } from 'react';

interface Props extends UploadProps {
  dragger?: boolean | React.ReactNode; // 是否为dragger
  size?: number; // 限制大小，单位为 MB
  value?: UploadFile[];
  content?: React.ReactNode; // 上传 button 的 content
}

const { Dragger } = Upload;
export default (props: Props) => {
  const {
    name = 'files',
    action = '/api/cae/upload',
    // showUploadList = {
    //   showDownloadIcon: true,
    //   showRemoveIcon: true,
    // },
    size: maxSize = 200,
    beforeUpload = (file, list) => {
      if (file.size > maxSize * 1024 * 1024) {
        message.error(
          intl.formatMessage(
            { id: 'page.upload.file.size.limit' },
            { name: file.name, size: maxSize },
          ),
        );
        return Upload.LIST_IGNORE;
      }
      if (
        !/^[a-zA-Z_]([a-zA-Z0-9_]+)?$/.test(
          file.name?.slice(0, file.name.lastIndexOf('.')),
        )
      ) {
        message.error(
          intl.formatMessage(
            { id: 'page.upload.file.name.limit' },
            { name: file.name },
          ),
        );
        return Upload.LIST_IGNORE;
      }
    },
    maxCount,
    dragger,
    content,
    ...rest
  } = props;

  const intl = useIntl();

  return dragger ? (
    <Dragger
      name={name}
      maxCount={maxCount}
      // disabled={!!maxCount && size(props.fileList) >= maxCount}
      action={action}
      beforeUpload={beforeUpload}
      {...rest}
    >
      {isValidElement(dragger) ? (
        dragger
      ) : (
        <>
          <p className="ant-upload-text">
            <FormattedMessage id="page.upload.hint" />
          </p>
          {props.accept && (
            <p className="ant-upload-hint">
              <FormattedMessage
                id="page.upload.accept"
                values={{ accept: props.accept }}
              />
            </p>
          )}
          {maxSize && (
            <p className="ant-upload-hint">
              <FormattedMessage
                id="page.upload.size"
                values={{ size: maxSize }}
              />
            </p>
          )}
        </>
      )}
    </Dragger>
  ) : (
    <Upload
      name={name}
      action={action}
      maxCount={maxCount}
      beforeUpload={beforeUpload}
      {...rest}
    >
      {content}
    </Upload>
  );
};

export const LIST_IGNORE = Upload.LIST_IGNORE;
