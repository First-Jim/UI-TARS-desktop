export const formatMoney = (money = 0, symbol = '￥', decimals = 2) => {
  const numericMoney =
    typeof money === 'number'
      ? parseFloat(money.toFixed(decimals))
      : parseFloat(money);

  if (
    !numericMoney ||
    (typeof numericMoney === 'number' &&
      /^0+(\.0+)?$/.test(numericMoney?.toString().trim()))
  ) {
    return `${symbol}0.00`;
  }

  return `${symbol}${numericMoney?.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
