let createMD5 = require('./createMD5')
let convertViews = require('./convertViews')

/**
 * POST method used to modify/insert multiple docs
 */
module.exports = self => (req, res, next) => {
  let db
  let docs

  db = self.databases[req.params.db];

  function saveDoc(doc) {
    /**
     * Save a document in the database
     * @param {object} doc - The document object that is going to be saved
     */

    // Store the id on its own var, and remove it from the doc
    let id = doc._id;
    delete doc._id;

    // Create the rev
    doc._rev = `1-${createMD5(JSON.stringify(doc))}`;

    // If this is a design document, convert its string functions to actual functions
    doc = convertViews(doc);

    // Save the doc
    db[id] = doc;

    return { id, rev: doc._rev };
  }

  if (!req.body || !req.body.docs) {
    res.send(400, { error: 'bad_request', reason: 'invalid_json' });
    return false;
  }


  docs = req.body.docs.map((doc) => {
    // is a new document without id
    if (!doc._id) {
      doc._id = createMD5();
      return saveDoc(doc);
    }

    // is a new document with id
    if (doc._id && !db.hasOwnProperty(doc._id)) {
      return saveDoc(doc);
    }

    // is a document to update
    if (doc._rev && doc._id && db.hasOwnProperty(doc._id) && db[doc._id]._rev === doc._rev) {
      return saveDoc(doc);
    }

    return { id: doc._id, error: 'conflict', reason: 'Document update conflict.' };
  });

  res.send(201, docs);

  // Emit an event
  self.emit('POST', { type: '_bulk_docs', docs });
  next();
};
