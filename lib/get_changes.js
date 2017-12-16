/* eslint array-callback-return: "off" */

/**
 * GET method used to show the info of one database
 */
module.exports = self => (req, res, next) => {
  let dbname = req.params.db;
  let db = self.databases[dbname];
  let seq = req.query.since || 0;
  let heartbeat = req.query.hasOwnProperty('heartbeat') ?
    parseInt(req.query.heartbeat, 10) : 1000;

  if (!(db && self.changes[dbname])) {
    res.send(404, { error: 'not_found', reason: 'no_db_file' });
    return;
  }

  // Set sequence to query param or current seq number
  if (seq === 'now') {
    seq = self.sequence[dbname];
  }

  // Just return the changes if is not continuous.
  if (req.query.feed !== 'continuous') {
    sendChanges(self, dbname, res, req, seq)();
    next();
    return;
  }

  // If continuous, set an interval for sending responses
  setInterval(sendChanges(self, dbname, res, req, seq), heartbeat);
};


function sendChanges(scope, dbname, res, req, seq) {
  return () => {
    scope.changes[dbname]
      .reduce((arry, change) => {
        // Handle include docs param.
        if (req.query.include_docs !== 'true') delete change.doc

        // Handle 'since' sequency number parame.
        if (change.seq >= seq) {
          seq += 1
          arry.push(change)
        }
        return arry
      }, [])
      .map((message) => {
        let chg = JSON.stringify(message)
        res.write(`${chg}\n`)
      })
  }
}
