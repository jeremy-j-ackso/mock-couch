/* jslint node: true, indent: 2, nomen  : true */


let R = require('ramda'),
  doFilter = require('./query_options'),
  formatDB;

formatDB = R.compose(
  R.map((item) => {
    item[1]._id = item[0];
    return item[1];
  }),
  R.sortBy(i => i[0]),
  R.toPairs,
);

module.exports = function (self) {
  /**
   * GET method used to show a document
   */
  return function (req, res, next) {
    let db,
      view,
      useReduce,
      useGroup,
      includeDocs,
      skip,
      rows;

    db = formatDB(self.databases[req.params.db]);

    view = self.databases[req.params.db][`_design/${req.params.doc}`].views[req.params.name];

    // Create flags
    useReduce = (view.hasOwnProperty('reduce') && (!req.query.hasOwnProperty('reduce') || req.query.reduce !== 'false'));
    useGroup = (req.query.hasOwnProperty('group') && req.query.group === 'true');
    includeDocs = (req.query.hasOwnProperty('include_docs') && req.query.include_docs === 'true');
    skip = (req.query.hasOwnProperty('skip') && parseInt(req.query.skip, 10)) || 0;

    rows = [];
    // Execute the map function
    db.forEach((doc) => {
      let local = Object.seal(R.cloneDeep(doc));
      global.emit = function (key, value) {
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
        /* jslint unparam:true */
          view.reduce = function (keys, values, rereduce) {
            return values.reduce((a, b) => a + b);
          };
          /* jslint unparam:false */
          break;
        case '_count':
        /* jslint unparam:true */
          view.reduce = function (keys, values, rereduce) {
            if (rereduce) {
              return values.reduce((a, b) => a + b);
            }
            return values.length;
          };
          /* jslint unparam:false */
          break;
      }
    }

    if (useReduce && !useGroup) {
      // Reduce and no group
      (function () {
        let keys,
          values,
          reduced,
          output;

        rows = rows.reverse();
        keys = rows.map(row => [row.key, row.id]);
        values = R.pluck('value', rows);
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
      }());
    }

    if (useReduce && useGroup) {
      // Reduce and group
      (function () {
        let groups,
          output;

        groups = R.compose(
          R.pluck(1),
          R.toPairs,
          R.groupBy((row) => {
            let key = row.hasOwnProperty('key') ? row.key : '';
            if (typeof key === 'object' && key !== null) {
              key = JSON.stringify(key);
            }
            return key;
          }),
        )(rows);

        output = groups.map((group) => {
          let keys,
            values;
          keys = group.map(row => [row.key, row.id]);
          values = R.pluck('value', group);
          return { key: group[0].key, value: view.reduce(keys, values, false) };
        });
        output = doFilter(req, res, output);
        self.emit(req.route.method, {
          type: 'view',
          name: `_design/${req.params.doc}`,
          group: true,
          reduce: true,
          database: req.params.db,
          view: req.params.name,
          output,
        });
        res.send(200, { rows: output });
      }());
    }

    if (!useReduce) {
      // Output map array only
      rows = doFilter(req, res, rows);
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
  };
};

