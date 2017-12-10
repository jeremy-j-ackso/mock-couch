/**
 * DELETE method to delete documents
 */
module.exports = self => (req, res, next) => {
  if (!self.databases.hasOwnProperty(req.params.db)) {
    res.send(404, { error: 'not_found', reason: 'missing' });
    return false;
  }

  delete self.databases[req.params.db];
  self.emit('DELETE', { type: 'database', database: req.params.db });
  res.send(200, { ok: true });
  next();
};
