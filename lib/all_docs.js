let doFilter = require('./query_options')

/**
 * GET method used to show all the documents of a database
 */
function all_docs(self) {
  return (req, res, next) => {
    let original = self.databases[req.params.db]
    let offset = 0
    let db = JSON.parse(JSON.stringify(original))

    // It creates and format the rows
    let entries = Object.entries(db)

    let rows = entries.map((data) => {
      let [id, doc] = data
      let output = {
        id,
        key: id,
        value: {
          rev: doc._rev,
        },
      }

      doc._id = id

      if (req.query.include_docs === 'true') {
        output.doc = doc;
      }

      return output
    })

    rows = doFilter(req, res, rows, true)

    res.send(200, {
      total_rows: original.__doc_count,
      offset,
      rows,
    })

    self.emit(req.route.method, { type: '_all_docs', database: req.params.db, rows })
    next()
  }
}

module.exports = all_docs
