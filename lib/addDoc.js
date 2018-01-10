let createMD5 = require('./createMD5')

/**
 * Add a document to a database
 * @param {string} name - the name of the database
 * @param {object} doc - object containing the document
 */
function addDoc(name, doc) {
  let id = doc._id || createMD5()
  delete doc._id
  doc._rev = doc._rev || `1-${createMD5(JSON.stringify(doc))}`
  this.databases[name][id] = doc

  // Don't emit changes for _local documents
  if (id.indexOf('_local') !== 0) {
    this.changes[name].push({
      seq: this.sequence[name],
      id,
      changes: [
        { rev: doc._rev },
      ],
      doc,
    })
  }

  return {
    id,
    _rev: doc._rev,
  }
}

module.exports = addDoc
