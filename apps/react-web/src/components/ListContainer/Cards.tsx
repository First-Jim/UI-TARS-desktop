import { Col, Row } from 'antd';
import { isEmpty, map } from 'lodash';
import NoData from '../NoData';

interface IItem {
  [key: string]: any;
}
type Props = {
  list: IItem[];
  children?: (l: IItem, i: number) => React.ReactNode;
  Pagination: () => React.ReactElement;
};

const Cards = (props: Props) => {
  const { children, list, Pagination } = props;
  return (
    <>
      {!isEmpty(list) ? (
        <>
          <Row gutter={[24, 24]}>
            {map(list, (item, index) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} key={index}>
                {children ? children(item, index) : ''}
              </Col>
            ))}
          </Row>
          <Pagination />
        </>
      ) : (
        <NoData />
      )}
    </>
  );
};

export default Cards;
