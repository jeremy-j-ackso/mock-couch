/* jslint node: true, indent: 2, nomen  : true */


let R = require('ramda'),
  proto = {};

Object.defineProperty(proto, '__doc_count', {
  enumerable: false,
  get() {
    return R.compose(
      R.sum,
      R.values,
      R.mapObj(doc => (doc._deleted ? 0 : 1)),
    )(this);
  },
});

module.exports = function (data) {
  let properties;

  properties = R.mapObj(value => ({
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  }), data);

  return Object.create(proto, properties);
};
