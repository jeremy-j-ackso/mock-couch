/* eslint array-callback-return: "off" */

// let R = require('ramda')
let { isEqual, uniqWith } = require('lodash')
let keyCompare = require('couch-viewkey-compare')

function queryOptions(req, res, rows, isAllDocs) {
  let skip = (req.query.hasOwnProperty('skip') && parseInt(req.query.skip, 10)) || 0
  let limit = (req.query.hasOwnProperty('limit') && parseInt(req.query.limit, 10)) || false
  let startkey = req.query.startkey || req.query.start_key || false
  let endkey = req.query.endkey || req.query.end_key || false
  let key = req.query.key || false
  let keys = (req.body && req.body.keys) || (req.query && req.query.keys) || false
  let useDescending = (req.query.hasOwnProperty('descending') && req.query.descending === 'true')
  let tempkey

  // Try to parse startkey
  if (startkey) {
    try {
      startkey = JSON.parse(startkey);
    } catch (e) {
      res.send(400, { error: 'bad_request', reason: 'invalid_json' });
      return false;
    }
  }

  // Try to parse endkey
  if (endkey) {
    try {
      endkey = JSON.parse(endkey);
    } catch (e) {
      res.send(400, { error: 'bad_request', reason: 'invalid_json' });
      return false;
    }
  }

  // Try to parse key
  if (key) {
    try {
      key = JSON.parse(key);
    } catch (e) {
      res.send(400, { error: 'bad_request', reason: 'invalid_json' });
      return false;
    }
  }

  // Try to parse the query 'keys' parameter
  if (req.query && req.query.keys) {
    try {
      keys = JSON.parse(keys);
    } catch (e) {
      res.send(400, { error: 'bad_request', reason: 'invalid_json' });
      return false;
    }
  }

  if (startkey && keys) {
    res.send(400, { error: 'query_parse_error', reason: '`start_key` is incompatible with `keys`' });
    return false;
  }

  if (endkey && keys) {
    res.send(400, { error: 'query_parse_error', reason: '`end_key` is incompatible with `keys`' });
    return false;
  }

  // Sort rows
  rows = rows.sort((rowA, rowB) => {
    let k = rowA.key || '';
    let n = rowB.key || '';
    if (typeof k === 'object' && k !== null) {
      k = JSON.stringify(k);
    }
    if (typeof n === 'object' && n !== null) {
      n = JSON.stringify(n);
    }
    if (k < n) return -1
    if (k === n) return 0
    if (k > n) return 1
  });

  // Reverse the order and the keys if descending=true
  if (useDescending) {
    rows = rows.reverse();
    tempkey = endkey;
    endkey = startkey;
    startkey = tempkey;
  }

  // This petition requires to filter using 'keys'
  if (keys && !isAllDocs) {
    rows = keys.map(kk => rows.filter(row => isEqual(row.key, kk)));

    rows = uniqWith(rows, isEqual)
  }

  if (keys && isAllDocs) {
    rows = keys.reduce((acc, kk) => {
      let result = rows.filter(row => isEqual(row.key, kk));
      if (result.length > 0) {
        result = acc.concat(result)
        return result;
      }
      return acc.concat([{
        kk,
        error: 'not_found',
      }])
    }, [])

    rows = uniqWith(rows, isEqual)
  }

  if (startkey && !endkey) {
    rows = rows.filter((row) => {
      let o = keyCompare(startkey, row.key);
      if (o === keyCompare.descending) {
        return false;
      }

      return true;
    });
  }

  if (endkey && !startkey) {
    rows = rows.filter((row) => {
      let o = keyCompare(endkey, row.key);
      if (o === keyCompare.ascending) {
        return false;
      }

      return true;
    });
  }

  if (startkey && endkey) {
    rows = rows.filter((row) => {
      let startKeyOrder = keyCompare(startkey, row.key)
      let endKeyOrder = keyCompare(endkey, row.key)

      if ((startKeyOrder === keyCompare.descending) ||
          (endKeyOrder === keyCompare.ascending)) {
        return false;
      }

      return true;
    });
  }

  if (key) {
    rows = rows.filter(x => isEqual(x.key, key));
  }

  if (skip > 0 || limit !== false) {
    rows = rows.splice(skip, limit || rows.length - skip);
  }

  return rows;
}

module.exports = queryOptions
