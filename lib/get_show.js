/**
 * GET method used to show a show
 */
module.exports = self => (req, res) => {
  let db = self.databases[req.params.db];
  let doc = null
  let name = req.params.doc;

  if (!db) {
    return res.send(404, { error: 'not_found', reason: 'no_db_file' });
  }

  let designdoc = req.params.hasOwnProperty('designdoc') ?
    db[`_design/${req.params.designdoc}`] : null;
  if (!designdoc) {
    return res.send(404, { error: 'not_found', reason: 'missing' });
  }

  let show_fn = designdoc.shows[req.params.name];
  if (!show_fn) {
    return res.send(404, { error: 'not_found', reason: 'missing' });
  }

  if (name) {
    if (!db.hasOwnProperty(name)) {
      return res.send(404, { error: 'not_found', reason: 'missing' });
    }
    doc = db[name]
    doc._id = name;
  }

  try {
    let output = show_fn(doc, req);
    if (typeof output === 'object') {
      if (typeof output.headers === 'object') {
        Object.keys(output.headers)
          .forEach((key) => {
            if (output.headers.hasOwnProperty(key)) {
              res.setHeader(key, output.headers[key]);
            }
          })

        // for (key of Object.keys(output.headers)) {
        //   if (output.headers.hasOwnProperty(key)) {
        //     res.setHeader(key, output.headers[key]);
        //   }
        // }
      }
      if (output.base64) {
        let img = Buffer.from(output.base64, 'base64');
        return res.end(img);
      }
      return res.send(200, output.body);
    }

    res.send(200, output);

    return self.emit('GET', {
      type: 'show',
      name: `_design/${req.params.designdoc}`,
      show: req.params.name,
      database: req.params.db,
      output,
    });
  } catch (error) {
    return res.send(500, { error: 'render_error', reason: `function raised error: ${error.message}` });
  }
};
