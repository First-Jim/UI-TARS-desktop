import { forEach, split, trim } from 'lodash';

export const getCookie = (key) => {
  const list = split(document.cookie, ';');
  const obj = {};
  forEach(list, (item) => {
    const _item = split(item, '=');
    obj[trim(_item[0])] = _item[1];
  });
  if (key) return obj[key];
  return obj;
};
