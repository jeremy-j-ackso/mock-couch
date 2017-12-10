/* jslint node: true, indent: 2, nomen  : true */


let R = require('ramda');

/**
 * GET method used to show the info of one database
 */
module.exports = self => (req, res, next) => {
  let dbname
  let db
  let seq
  let heartbeat
  let stringify

  dbname = req.params.db;
  db = self.databases[dbname];
  stringify = R.rPartial(JSON.stringify.bind(JSON), null, '');
  heartbeat = req.query.hasOwnProperty('heartbeat') ?
    parseInt(req.query.heartbeat, 10) : 1000;

  // Send the changes stream (inject some vars into scope)
  // function sendChanges(scope, dbnme, rs, rq, sq) {
  //   return () => {
  //     R.compose(
  //       R.forEach((o) => {
  //         rs.write(`${o}\n`); // couchdb changes are split by newline
  //       }),
  //       R.map(stringify),
  //       R.reduce((list, change) => {
  //         // Handle include_docs param
  //         if (rq.query.include_docs !== 'true') {
  //           delete change.doc;
  //         }

  //         // Handle 'since' squence number param
  //         if (change.sq >= sq) {
  //           sq += 1;
  //           list.push(change);
  //         }

  //         return list;
  //       }, []),

  //       R.map(R.cloneDeep),
  //     )(scope.changes[dbnme]);
  //   };
  // }

  if (!(db && self.changes[dbname])) {
    res.send(404, { error: 'not_found', reason: 'no_db_file' });
    return;
  }

  // Set sequence to query param or current seq number
  seq = req.query.since || 0;
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




// Send the changes stream (inject some vars into scope)
function sendChanges(scope, dbnme, rs, rq, sq) {
  return () => {
    R.compose(
      R.forEach((o) => {
        rs.write(`${o}\n`); // couchdb changes are split by newline
      }),
      R.map(stringify),
      R.reduce((list, change) => {
        // Handle include_docs param
        if (rq.query.include_docs !== 'true') {
          delete change.doc;
        }

        // Handle 'since' squence number param
        if (change.sq >= sq) {
          sq += 1;
          list.push(change);
        }

        return list;
      }, []),

      R.map(R.cloneDeep),
    )(scope.changes[dbnme]);
  };
}

function sendChanges(scope, dbname, res, req, seq) {
  return () => {
    
  }
}
