import { Descriptions, DescriptionsProps, Typography } from 'antd';
import { DescriptionsItemProps } from 'antd/es/descriptions/Item';
import { filter, isArray, isEmpty, map } from 'lodash';
interface IProps extends DescriptionsProps {
  items: IItemProps[];
}

interface IItemProps extends DescriptionsItemProps {
  visible?: boolean;
  copy?: boolean; // copy 仅 string ｜ number 生效
}
export default (props: IProps) => {
  const { items = [], ...rest } = props;

  return (
    <>
      <Descriptions {...rest}>
        {map(
          filter(items, (item) => item.visible !== false),
          (item: IItemProps, index) => {
            const { children, copy, ...sub_rest } = item;
            switch (typeof children) {
              case 'number':
                return (
                  <Descriptions.Item {...sub_rest} key={index}>
                    {copy ? (
                      <Typography.Paragraph
                        copyable
                        style={{ marginBottom: 0 }}
                      >
                        {children}
                      </Typography.Paragraph>
                    ) : (
                      children
                    )}
                  </Descriptions.Item>
                );
              case 'string':
                return (
                  <Descriptions.Item {...sub_rest} key={index}>
                    {children ? (
                      <>
                        {copy ? (
                          <Typography.Paragraph
                            copyable
                            style={{ marginBottom: 0 }}
                          >
                            {children}
                          </Typography.Paragraph>
                        ) : (
                          children
                        )}
                      </>
                    ) : (
                      '--'
                    )}
                  </Descriptions.Item>
                );
              case 'object':
                if (isArray(children))
                  return (
                    <Descriptions.Item {...sub_rest} key={index}>
                      {isEmpty(children) ? '--' : children}
                    </Descriptions.Item>
                  );
                return (
                  <Descriptions.Item {...sub_rest} key={index}>
                    {children || '--'}
                  </Descriptions.Item>
                );
              default:
                return (
                  <Descriptions.Item {...sub_rest} key={index}>
                    {children || '--'}
                  </Descriptions.Item>
                );
            }
          },
        )}
      </Descriptions>
    </>
  );
};
