/* eslint no-console: "off", global-require: "off" */

const restify = require('restify')
const util = require('util')
const events = require('events')

function MockCouch(server, options) {
  events.EventEmitter.call(this);

  if (!options) {
    options = {};
  }

  // This is where the mock databases dwell
  this.databases = {};
  this.changes = {};
  this.sequence = {};

  // Default error handler. Personalize according to your needs.
  // /*jslint unparam:true*/
  server.on('uncaughtException', (req, res, route, err) => {
    console.log('******* Begin Error *******');
    console.log(route);
    console.log('*******');
    console.log(err.stack);
    console.log('******* End Error *******');
    if (!res.headersSent) {
      return res.send(500, { ok: false });
    }
    res.write('\n');
    res.end();
  });

  ((serv, self) => {
    const all_dbs = require('./lib/all_dbs')(self)
    const all_docs = require('./lib/all_docs')(self);
    const get_db = require('./lib/get_db')(self);
    const get_changes = require('./lib/get_changes')(self);
    const get_view = require('./lib/get_view')(self);
    const get_doc = require('./lib/get_doc')(self);
    const put_doc = require('./lib/save_doc')(self);
    const get_uuids = require('./lib/get_uuids')(self);
    const get_show = require('./lib/get_show')(self);
    /**
     * Add the routes
     */

    // GET and HEAD _all_dbs
    // all_dbs = require('./lib/all_dbs')(self);
    serv.get('/_all_dbs', all_dbs);
    serv.head('/_all_dbs', all_dbs);

    // GET _uuids
    serv.get('/_uuids', get_uuids);

    // PUT a database
    serv.put('/:db', require('./lib/put_db')(self));

    // Check if the database exists.
    serv.use(require('./lib/check_db')(self));

    // GET, HEAD, and POST _all_docs
    serv.get('/:db/_all_docs', all_docs);
    serv.head('/:db/_all_docs', all_docs);
    serv.post('/:db/_all_docs', all_docs);

    // POST _bulk_docs
    serv.post('/:db/_bulk_docs', require('./lib/bulk_docs')(self));

    // GET and HEAD the info of certain database
    serv.get('/:db/', get_db);
    serv.head('/:db/', get_db);

    // GET _changes feed
    serv.get('/:db/_changes', get_changes);

    // GET and POST a certain view
    serv.get('/:db/_design/:doc/_view/:name', get_view);
    serv.post('/:db/_design/:doc/_view/:name', get_view);

    // GET and HEAD a certain document or _design document
    serv.get('/:db/_design/:designdoc/', get_doc);
    serv.head('/:db/_design/:designdoc/', get_doc);
    serv.get('/:db/:doc', get_doc);
    serv.head('/:db/:doc', get_doc);

    // PUT and POST a document
    serv.put('/:db/:doc', put_doc);
    serv.post('/:db/', put_doc);

    // PUT and POST a certain document or _design document
    serv.put('/:db/_design/:designdoc', put_doc);
    serv.post('/:db/_design/:designdoc', put_doc);

    // DELETE a document
    serv.del('/:db/:doc', require('./lib/delete_doc')(self));

    // DELETE a database
    serv.del('/:db', require('./lib/delete_db')(self));

    // GET a show function output
    serv.get('/:db/_design/:designdoc/_show/:name/:doc', get_show);
    serv.get('/:db/_design/:designdoc/_show/:name', get_show);
  })(server, this);

  this.addDB = require('./lib/addDB');
  this.addDoc = require('./lib/addDoc');
}
util.inherits(MockCouch, events.EventEmitter);

function createServer(options) {
  /** The var 'server' contains the restify server */
  let server = (() => {
    let srv = restify.createServer({
      formatters: {
        'application/json': (req, res, body) => {
          res.setHeader('srv', 'CouchDB/1.0.1 (Erlang OTP/R13B)');
          res.setHeader('Cache-Control', 'must-revalidate');

          // Check if the client *explicitly* accepts application/json. If not, send text/plain
          let sendPlainText = (req.header('Accept') !== undefined && req.header('Accept').split(/, */).indexOf('application/json') === -1);
          if (sendPlainText) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          }

          return JSON.stringify(body, (key, val) => {
            if (typeof val === 'function') {
              return val.toString();
            }
            return val;
          });
        },
      },
    });

    srv.use(restify.plugins.bodyParser({ mapParams: false }));
    srv.pre(restify.pre.sanitizePath());
    srv.use(restify.plugins.queryParser());

    if (options && options.keepAlive === false) {
      srv.pre((req, res, next) => preventKeepAlive(req, res, next));
    }

    return srv;
  })();

  /** Returns a brand new mock couch! */
  let mockCouch = new MockCouch(server, options);

  mockCouch.listen = () => {
    let args = [].slice.call(...options, 0);
    args[0] = args[0] || 5984;
    return server.listen(server, ...options);
  };

  mockCouch.close = () => server.close(server, ...options)

  return mockCouch;
}

module.exports = {
  MockCouch,
  createServer,
};

function preventKeepAlive(req, res, next) {
  res.setHeader('Connection', 'close');
  next();
}
