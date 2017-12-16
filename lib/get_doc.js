/**
 * GET method used to show a document
 */
module.exports = self => (req, res) => {
  let db = self.databases[req.params.db]

  if (db) {
    let name = req.params.hasOwnProperty('designdoc') ?
      `_design/${req.params.designdoc}` : req.params.doc

    if (name && db.hasOwnProperty(name)) {
      let doc = db[name]
      doc._id = name;
      res.setHeader('ETag', `"${doc._rev}"`);
      res.send(200, doc);
      return self.emit('GET', { type: 'document', id: req.params.doc, doc });
    }
    return res.send(404, { error: 'not_found', reason: 'missing' });
  }
  res.send(404, { error: 'not_found', reason: 'no_db_file' });
};
