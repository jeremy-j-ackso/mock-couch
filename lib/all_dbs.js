module.exports = self => (req, res, next) => {
  let dbs = Object.keys(self.databases);
  res.send(200, dbs);
  self.emit('GET', { type: '_all_dbs', databases: dbs });
  next();
  return true;
};
