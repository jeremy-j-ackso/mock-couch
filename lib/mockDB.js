let proto = {}

Object.defineProperty(proto, '__doc_count', {
  enumerable: false,
  get() {
    const output = this
      .map(doc => (doc._deleted ? 0 : 1))
      .reduce((acc, cv) => {
        acc += cv
        return acc
      }, 0)

    return output
    // return R.compose(
    //   R.sum,
    //   R.values,
    //   R.mapObj(doc => (doc._deleted ? 0 : 1)),
    // )(this);
  },
});

module.exports = (data) => {
  let properties;

  properties = data.map(value => ({
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  }))

  // properties = R.mapObj(value => ({
  //   value,
  //   configurable: true,
  //   enumerable: true,
  //   writable: true,
  // }), data);

  return Object.create(proto, properties);
};
