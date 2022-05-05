function getBase (price) {
  var price = Number(price);
  if (price < 50) {
    return 1000;
  } else if (price >= 50 && price < 70) {
    return 1500;
  } else if (price >= 70 && price < 100) {
    return 2000;
  }
  return 3000;
};

module.exports = getBase;