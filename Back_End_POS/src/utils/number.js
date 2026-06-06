const toNumber = (value) => Number(value || 0);

const toDecimalString = (value, digits = 3) =>
  Number(value || 0).toFixed(digits);

module.exports = {
  toNumber,
  toDecimalString,
};
