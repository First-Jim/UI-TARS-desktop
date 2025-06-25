import { useCreation } from 'ahooks';
import {
  PaginationProps,
  Table as TableAntd,
  TablePaginationConfig,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { map, uniqueId } from 'lodash';
import styled from 'styled-components';
interface IItem {
  [key: string]: any;
}

type Props = {
  list: IItem[];
  columns: ColumnsType<IItem>;
  pagination: PaginationProps;
  onChange?: (pagination: TablePaginationConfig) => void;
  showHeader: boolean;
};

const Wrapper = styled.div`
  .ant-table-thead > tr > th {
    background: #ebecf1;
    padding: 10px 16px;
  }
  .ant-table-tbody > tr > td {
    padding: 10px 16px;
  }
`;
const Table = (props: Props) => {
  const { columns = [], list = [], pagination, onChange, ...rest } = props;

  const wrapColumns = useCreation(() => {
    return map(columns, (item: any) => {
      if (item.render) {
        return item;
      } else {
        return { ...item, render: (v: any) => v || '--' };
      }
    });
  }, []);
  return (
    <Wrapper>
      <TableAntd
        dataSource={map(list, (item) => ({
          ...item,
          key: item.key || uniqueId(),
        }))}
        columns={wrapColumns}
        pagination={pagination}
        onChange={onChange}
        {...rest}
      />
    </Wrapper>
  );
};

export default Table;
