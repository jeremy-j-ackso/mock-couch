/**
 * GET method used to show a generate one or more UUIDs
 */
module.exports = self => (req, res) => {
  let count = req.params.count || 1
  let ret = []
  let seqPrefix = self.seqPrefix || '4e17c12963f4bee0e6ec90da54';

  for (let i = 0; i < count; i += 1) {
    ret.push(seqPrefix + (`000000${i}`).substr(-6, 6));
  }

  res.send(200, { uuids: ret });
  return self.emit('GET', { type: 'uuids', count });
};
