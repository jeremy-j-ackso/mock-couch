const createMD5 = require('./createMD5')
const mockDB = require('./mockDB')

function addDB(name, arr) {
  let database
  let changes

  /**
   * Used to add a database to the mock couch
   * @param {string} name - the name of the database
   * @param {array} arr - array with the rows
   */
  let rows = arr || []
  if (!Array.isArray(rows)) {
    return false
  }

  // Add an _id and a _rev to each document, if necessary.
  rows = rows.map((doc) => {
    doc._id = doc._id || createMD5()
    doc._rev = doc._rev || `1- ${createMD5(JSON.stringify(doc))}`
    return doc
  })

  // Prepare the database object.
  // Is pretty much the passed array, converted to an object,
  // where each property is the document, indexed by the _id
  database = arrayToObject(rows)

  changes = createChanges(rows)

  this.databases[name] = mockDB(database)
  this.changes[name] = changes

  if (!this.sequence.hasOwnProperty(name)) {
    Object.defineProperty(this.sequence, name, {
      get: (() => (this.changes[name].length + 1)),
    })
  }

  return this.databases[name]
}

function arrayToObject(arr) {
  const output = {}

  arr.forEach((doc) => {
    const id = doc._id
    const vals = doc
    delete vals._id
    output[id] = vals
  })

  return output
}

function createChanges(arr) {
  return arr
    .filter(doc => /^_local.*$/.test(doc))
    .map((doc, index) => ({
      seq: index,
      id: doc._id,
      changes: [
        { rev: doc._rev },
      ],
      doc,
    }))
}

module.exports = addDB
