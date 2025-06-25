import {
  AppstoreOutlined,
  BarsOutlined,
  RedoOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import Skeleton from '@ant-design/pro-skeleton';
import { useCreation, useUpdateEffect } from 'ahooks';
import {
  Button,
  Pagination as PaginationAntd,
  PaginationProps,
  Spin,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { assign, isEmpty } from 'lodash';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled from 'styled-components';
import Cards from './Cards';
import Table from './Table';

export type IType = 'card' | 'table';
export type ISort = 'asc' | 'desc';

type Props = {
  fetchData: ({
    current,
    pageSize,
    sort,
  }: {
    current: number;
    pageSize: number;
    sort: ISort;
  }) => Promise<any>;
  defaultPagination?: PaginationProps;
  search?: React.ReactNode;
  card?: (card: any, index: number) => React.ReactNode; // 卡片
  columns?: ColumnsType<any>;
  refreshIndex?: number;
  extraIcon?: {
    hasRefresh?: boolean; // 刷新按钮
    hasSort?: boolean; // 排序按钮
    hasType?: boolean; // 类型按钮
  };
  type?: IType; // 卡片 ｜ 表格
  sort?: ISort; // 正序 ｜ 反序
  showHeader?: boolean;
  cache?: boolean;
};

const Wrapper = styled.div`
  .list-container-header {
    display: flex;
    justify-content: space-between;
    .left {
      flex: 1;
    }
    .right {
      button {
        margin-left: 1rem;
      }
    }
    padding-bottom: 1rem;
  }
  .list-container-content {
    margin-top: 1.5rem;
    h3 {
      color: #666666;
    }
  }
  .ant-pagination {
    margin-top: 1.5rem;
    text-align: right;
  }
`;

const ListContainer = (props: Props) => {
  const {
    fetchData,
    defaultPagination = {},
    search,
    card,
    columns = [],
    refreshIndex = 0,
    extraIcon = {},
    sort = 'asc',
    showHeader = true,
    cache,
  } = props;

  const state = useLocalObservable(() => ({
    pagination: {
      ...defaultPagination,
      current: defaultPagination.current || 1,
      pageSize: defaultPagination.pageSize || 10,
      pageSizeOptions:
        defaultPagination.pageSizeOptions || card
          ? [12, 48, 96]
          : [10, 50, 100],
      showSizeChanger: defaultPagination.showSizeChanger || true,
      showQuickJumper: defaultPagination.showSizeChanger || true,
      total: 0,
    },
    setPagination(p: any) {
      this.pagination = assign({}, this.pagination, p);
    },
    refreshIndex: refreshIndex,
    setRefreshIndex() {
      this.refreshIndex = Date.now();
    },
    list: [],
    setDataSource(list: any) {
      this.list = list;
    },
    type: card ? 'card' : 'table',
    setType(type: IType) {
      this.type = type;
    },
    sort: sort || 'desc',
    setSort(sort: ISort) {
      this.sort = sort;
    },
    loading: true,
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    fetched: false,
    setFetched(fetched: boolean) {
      this.fetched = fetched;
    },
  }));

  const load = async () => {
    if (!fetchData) return;
    state.setLoading(true);
    const res = await fetchData({
      current: state.pagination.current,
      pageSize: state.pagination.pageSize,
      sort: state.sort,
    });
    if (!state.fetched) state.setFetched(true);
    state.setLoading(false);
    state.setDataSource(res?.list || []);
    state.setPagination({ total: res?.total || 0 });
  };

  useEffect(() => {
    load();
  }, []);

  useUpdateEffect(() => {
    if (refreshIndex > 0) {
      state.setPagination({ current: 1 });
    }
    load();
  }, [refreshIndex]);

  const onPageinationChange = (current: number, pageSize: number) => {
    state.setPagination({ current, pageSize });
    load();
  };

  const Pagination = useCreation(() => {
    return () => (
      <PaginationAntd {...state.pagination} onChange={onPageinationChange} />
    );
  }, [state.pagination]);

  const WrapIcon = useCreation(() => {
    return () => (
      <>
        {!isEmpty(extraIcon) && extraIcon.hasSort ? (
          <>
            {state.sort === 'asc' && (
              <Tooltip title={'切换逆序'}>
                <Button
                  onClick={() => {
                    state.setSort('desc');
                    state.setPagination({ current: 1 });
                    load();
                  }}
                  icon={<SortAscendingOutlined />}
                />
              </Tooltip>
            )}
            {state.sort === 'desc' && (
              <Tooltip title={'切换正序'}>
                <Button
                  onClick={() => {
                    state.setSort('asc');
                    state.setPagination({ current: 1 });
                    load();
                  }}
                  icon={<SortDescendingOutlined />}
                />
              </Tooltip>
            )}
          </>
        ) : null}
        {!isEmpty(extraIcon) && extraIcon.hasRefresh ? (
          <Tooltip title={'刷新'}>
            <Button
              onClick={() => {
                state.setPagination({ current: 1 });
                load();
              }}
              icon={<RedoOutlined />}
            />
          </Tooltip>
        ) : null}
      </>
    );
  }, [state.type, state.sort]);

  return (
    <Wrapper>
      <div className="list-container-header">
        <div className="left">{search}</div>
        <div className="right">
          <WrapIcon />
        </div>
      </div>
      <div className="list-container-content">
        {state.fetched ? (
          <Spin spinning={state.loading}>
            {state.type === 'card' ? (
              <>
                <Cards list={state.list} Pagination={Pagination}>
                  {(item, index) => (card ? card(item, index) : '')}
                </Cards>
              </>
            ) : (
              <Table
                showHeader={showHeader}
                list={state.list}
                columns={columns}
                pagination={{ ...state.pagination }}
                onChange={({ current, pageSize }) => {
                  state.setPagination({
                    current,
                    pageSize,
                  });
                  load();
                }}
              />
            )}
          </Spin>
        ) : (
          <Skeleton type="list" list={1} />
        )}
      </div>
    </Wrapper>
  );
};

export default observer(ListContainer);
