/* jslint node: true, indent: 2, nomen  : true */


let R = require('ramda');

module.exports = function (self) {
  /**
   * GET method used to show a document
   */
  return function (req, res) {
    let db,
      name,
      doc;

    db = self.databases[req.params.db];
    if (db) {
      name = req.params.hasOwnProperty('designdoc') ? `_design/${req.params.designdoc}` : req.params.doc;
      if (name && db.hasOwnProperty(name)) {
        doc = R.cloneDeep(db[name]);
        doc._id = name;
        res.setHeader('ETag', `"${doc._rev}"`);
        res.send(200, doc);
        return self.emit('GET', { type: 'document', id: req.params.doc, doc });
      }
      return res.send(404, { error: 'not_found', reason: 'missing' });
    }
    res.send(404, { error: 'not_found', reason: 'no_db_file' });
  };
};
