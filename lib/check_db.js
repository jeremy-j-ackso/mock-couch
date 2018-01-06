module.exports = self => (req, res, next) => {
  if (req.params.db) {
    let original = self.databases[req.params.db]

    // return a 404 not found error if the database was not found
    if (!original) {
      return res.send(404, { error: 'not_found', reason: 'no_db_file' })
    }

    req.db = JSON.parse(JSON.stringify(original))
    next()
  }
};

