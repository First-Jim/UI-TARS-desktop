export default (response) => {
  const { status } = response;
  if (status >= 200 && status < 300) {
    return response;
  }
  if (status === 500) {
    response.message = '服务异常，请稍后再试！';
    response.title = '服务异常';
    response.code = status;
    throw response;
  }
  response.message = `Invalid response status code ${status}`;
  response.title = '提示';
  response.code = status;
  throw response;
};
