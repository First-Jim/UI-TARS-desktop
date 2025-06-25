export default (response) => {
  const { data } = response;
  if (data === null || data === undefined) {
    throw 'Response Error';
  }

  const { code, data: result, message: msg } = data;

  return response;
};
