import Copy from '@/components/Copy';
import ListContainer from '@/components/ListContainer';
import MainLayout from '@/layouts/MainLayout';
import { authApi, jobApi } from '@/services';
import { ExclamationCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { DatePickerProps, Modal, notification, Select } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { assign } from 'lodash';
import { observer, useLocalObservable } from 'mobx-react-lite';
import styled from 'styled-components';
import moment from 'moment';
import { formatMoney } from '@/utils/formatMoney';
import GlobalStore from '@/store';

const Wrapper = styled.div`
  // margin-top: 56px;

  .list-container-header {
    padding: 20px 16px 20px 16px;
    background: #fff;
    border-radius: 4px 4px 0 0;
    box-shadow: 0 -5px 5px #eee;

    .left > h3 {
      font-family: PingFangSC-Semibold;
      font-size: 20px;
      color: #1b1b1b;
      font-weight: 600;
    }
  }

  .list-container-content {
    margin-top: 0;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 5px 5px #eee;
    padding: 0 16px 20px 16px;
    background: #fff;
    margin-bottom: 40px;

    .del {
      &:hover {
        color: red;
      }
    }
    .ant-pagination {
      margin-top: 24px;
      text-align: center;
      justify-content: center;
    }
    .ant-table-content {
      border-top: 1px solid #eee;
    }
  }
  .user-info {
    margin-top: 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    color: #666666;
  }

  @media screen and (min-width: 780px) {
    .list-container-header,
    .list-container-content,
    .user-info {
      margin-right: 4%;
      margin-left: 4%;
    }
  }
  @media screen and (min-width: 1080px) {
    .list-container-header,
    .list-container-content,
    .user-info {
      margin-right: 6.2rem;
      margin-left: 6.2rem;
    }
  }
`;
const { Option } = Select;
export default observer(() => {
  const { isLogin } = GlobalStore;
  // if (!isLogin) {
  //   return authApi.login();
  // }
  const state = useLocalObservable(() => ({
    refreshIndex: 0,
    setRefreshIndex(bool?) {
      this.refreshIndex = bool ? -Date.now() : Date.now();
    },
    searchValue: {
      startTime: '',
      endTime: '',
    },
    setSearchValue(searchValue: { [key: string]: string | number }) {
      this.searchValue = assign({}, this.searchValue, searchValue);
    },
    defaultPagination: {
      current: 1,
      pageSize: 10,
    },
  }));

  const fetchData = async ({
    current,
    pageSize,
  }: {
    current: number;
    pageSize: number;
  }) => {
    const params = {
      pageNo: current,
      pageSize: pageSize,
      startTime: state.searchValue.startTime,
      endTime: state.searchValue.endTime,
    };

    const res: any = await jobApi.getJobBillList();

    return {
      list: res?.result || [],
      total: res?.result?.length || 0,
    };
  };

  const onSearchChange = (searchValue: { [key: string]: string | number }) => {
    state.setSearchValue(searchValue);
  };

  const onDatePickChange: DatePickerProps['onChange'] = (
    dates,
    dateStrings,
  ) => {
    onSearchChange({
      startTime: dateStrings ? dateStrings[0] : '',
      endTime: dateStrings ? dateStrings[1] : '',
    });
    state.setRefreshIndex();
  };

  // 截取字符串中间显示省略号
  const getSubStr = (str) => {
    if (!str || str?.length < 10) return str;
    var subStr1 = str.substr(0, 7);
    var subStr2 = str.substr(str.length - 5, 5);
    var subStr = subStr1 + '...' + subStr2;
    return subStr;
  };
  // 作业ID，应用名称，版本，开始时间，结束时间，用量，单价(元)，应收金额(元)
  const columns: ColumnsType<any> = [
    {
      title: '作业名称',
      dataIndex: 'jobName',
      key: 'jobName',
      render: (v, record) => <Copy text={v}>{v || '--'}</Copy>,
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      key: 'appName',
      render: (v) => v || '--',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (v) => v || '--',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (v) => moment(v).format('YYYY-MM-DD HH:mm:ss') || '--',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (v) => moment(v).format('YYYY-MM-DD HH:mm:ss') || '--',
    },
    {
      // title: '用量（核时）',
      title: <p style={{ textAlign: 'right' }}>用量（核时）</p>,
      dataIndex: 'usage',
      key: 'usage',
      render: (v) => <p style={{ textAlign: 'right' }}>{v}</p>,
    },
    {
      // title: '单价（元/核时）',
      title: <p style={{ textAlign: 'right' }}>单价（元/核时）</p>,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (v) => <p style={{ textAlign: 'right' }}>{formatMoney(v, '')}</p>,
    },
    {
      // title: '应收金额（元）',
      title: <p style={{ textAlign: 'right' }}>应收金额（元）</p>,
      dataIndex: 'receivable',
      key: 'receivable',
      render: (v) => <p style={{ textAlign: 'right' }}>{formatMoney(v, '')}</p>,
    },
  ];
  return (
    <MainLayout>
      <Wrapper>
        <ListContainer
          cache
          refreshIndex={state.refreshIndex}
          search={
            <div className="left">
              <h3>作业明细</h3>
            </div>
          }
          defaultPagination={{
            current: 1,
            pageSize: 10,
            hideOnSinglePage: true,
          }}
          extraIcon={{
            hasRefresh: true, // 刷新按钮
          }}
          columns={columns}
          fetchData={fetchData}
        />
      </Wrapper>
    </MainLayout>
  );
});
