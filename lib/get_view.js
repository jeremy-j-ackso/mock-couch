/* eslint prefer-destructuring: "off" */

// let R = require('ramda')
let doFilter = require('./query_options')

/**
 * GET method used to show a document
 */
function get_view(self) {
  return (req, res, next) => {
    let db = formatDB(self.databases[req.params.db]);
    let view = self.databases[req.params.db][`_design/${req.params.doc}`].views[req.params.name];

    // console.log('self.databases:',
    // JSON.stringify(self.databases[req.params.db][`_design/${req.params.doc}`].views))
    // console.log('req:', req.params)
    // Create flags
    let useReduce = (view.hasOwnProperty('reduce') && (!req.query.hasOwnProperty('reduce') || req.query.reduce !== 'false'));
    let useGroup = (req.query.hasOwnProperty('group') && req.query.group === 'true');
    let includeDocs = (req.query.hasOwnProperty('include_docs') && req.query.include_docs === 'true');
    let skip = (req.query.hasOwnProperty('skip') && parseInt(req.query.skip, 10)) || 0;

    let rows = [];

    // console.log('db:', JSON.stringify(db))
    // console.log('pre-view:', JSON.stringify(view))
    // Execute the map function
    db.forEach((doc) => {
      // console.log('doc:', doc)
      let local = Object.seal(doc);
      global.emit = (key, value) => {
        if (!/^_design/.test(doc._id)) {
          let result = { id: doc._id, key, value };
          if (!useReduce && includeDocs) {
            if (value && (typeof value._id === 'string') && (value._id !== doc._id)) {
              result.doc = self.databases[req.params.db][value._id];
            } else {
              result.doc = doc;
            }
          }
          rows.push(result);
        }
      };
      view.map(local);
    });
    // console.log('rows:', rows)
    // console.log('post-view:', JSON.stringify(view))

    if (!view.hasOwnProperty('reduce') && req.query.hasOwnProperty('reduce') && req.query.reduce === 'true') {
      res.send(400, {
        error: 'query_parse_error',
        reason: 'Reduce is invalid for map-only views.',
      });
      return false;
    }

    if (useReduce && includeDocs) {
      res.send(400, {
        error: 'query_parse_error',
        reason: '`include_docs` is invalid for reduce',
      });
      return false;
    }

    if (!useReduce && useGroup) {
      res.send(400, {
        error: 'query_parse_error',
        reason: 'Invalid use of grouping on a map view.',
      });
      return false;
    }

    if (typeof view.reduce === 'string') {
      switch (view.reduce) {
        case '_sum':
          view.reduce = (keys, values) => values.reduce((a, b) => a + b);
          break;
        case '_count':
          /* jslint unparam:true */
          view.reduce = (keys, values, rereduce) => {
            if (rereduce) {
              return values.reduce((a, b) => a + b);
            }
            return values.length;
          };
          break;
        default:
          throw new Error('problem with the views')
      }
    }

    // Reduce and no group
    if (useReduce && !useGroup) {
      (() => {
        let keys
        let values
        let reduced
        let output

        rows = rows.reverse();
        keys = rows.map(row => [row.key, row.id]);

        values = rows.map(row => row.value)

        reduced = view.reduce(keys, values, false);
        output = { rows: [{ key: null, value: reduced }] };
        self.emit(req.route.method, {
          type: 'view',
          name: `_design/${req.params.doc}`,
          group: false,
          reduce: true,
          database: req.params.db,
          view: req.params.name,
          output,
        });
        res.send(200, output);
      })();
    }

    // Reduce and group
    if (useReduce && useGroup) {
      (() => {
        let groups_obj = {}
        let groups_keys = []
        rows.forEach((row) => {
          if (!groups_keys.includes(JSON.stringify(row.key))) {
            groups_keys.push(JSON.stringify(row.key))
          }
          if (!groups_obj.hasOwnProperty(JSON.stringify(row.key))) {
            groups_obj[JSON.stringify(row.key)] = []
          }
          groups_obj[JSON.stringify(row.key)].push(row)
        })

        let groups = groups_keys.reduce((acc, cv) => {
          acc.push(groups_obj[cv])
          return acc
        }, [])

        let output = groups.map((group) => {
          let keys = group.map(row => [row.key, row.id])
          let values = group.reduce((acc, row) => {
            acc.push(row.value)
            return acc
          }, [])
          return { key: group[0].key, value: view.reduce(keys, values, false) }
        })

        output = doFilter(req, res, output)

        self.emit(req.route.method, {
          type: 'view',
          name: `_design/${req.params.doc}`,
          group: true,
          reduce: true,
          database: req.params.db,
          view: req.params.name,
          output,
        })

        res.send(200, { rows: output })
      })()
    }

    // Output map array only
    if (!useReduce) {
      // console.log('pre-filter rows:', rows)
      rows = doFilter(req, res, rows);
      // console.log('post-filter rows:', rows)
      self.emit(req.route.method, {
        type: 'view',
        name: `_design/${req.params.doc}`,
        group: false,
        reduce: false,
        database: req.params.db,
        view: req.params.name,
        output: rows,
      });
      res.send(200, { total_rows: rows.length, offset: skip, rows });
    }
    next();
  }
}

function formatDB(ob) {
  let pairs = Object.entries(ob)
  let sorted = pairs.sort(i => i[0])
  let mapped = sorted.map((item) => {
    item[1]._id = item[0]
    return item[1]
  })
  return mapped
}

module.exports = get_view
