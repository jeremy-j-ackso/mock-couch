let proto = {}

Object.defineProperty(proto, '__doc_count', {
  enumerable: false,
  get() {
    let this_keys = Object.keys(this)
    let agg = []

    this_keys.forEach((key) => {
      agg.push(this[key]._deleted ? 0 : 1)
    })

    const output = agg.reduce((acc, cv) => {
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

function mockDB(data) {
  if (data === undefined) data = {}
  let data_keys = Object.keys(data)
  let properties = {}

  data_keys.forEach((key) => {
    properties[key] = {
      value: data[key],
      configurable: true,
      enumerable: true,
      writable: true,
    }
  })

  // properties = data.map(value => ({
  //   value,
  //   configurable: true,
  //   enumerable: true,
  //   writable: true,
  // }))

  // properties = R.mapObj(value => ({
  //   value,
  //   configurable: true,
  //   enumerable: true,
  //   writable: true,
  // }), data);

  return Object.create(proto, properties);
}

module.exports = mockDB
