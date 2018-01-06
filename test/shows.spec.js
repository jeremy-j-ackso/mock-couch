/* global describe, it, expect, beforeEach */


let show_fn = require('../lib/get_show')
let mockDB = require('../lib/mockDB')

describe('shows', () => {
  let dummy_function
  let get
  let headers
  let mock_mock
  let res
  let result
  let statusCode

  dummy_function = (key, value) => {
    headers[key] = value;
  };

  res = {
    send(status, obj) {
      statusCode = status;
      result = obj;
    },
    setHeader: dummy_function,
  };

  beforeEach(() => {
    let db = {
      people: mockDB({
        miko: {
          type: 'player',
          _rev: '1-39117a69a5e6572d5935fab3239d309d',
          name: 'reimu',
          lastname: 'hakurei',
          trainer: 'qball',
          money: 20,
          friends: ['player2', 'qball'],
        },
        '_design/designer': {
          shows: {
            docName(doc) { return doc.name; },
            general() { return 'It works!'; },
            headers() { return { headers: { 'X-My-Own-Header': 'you can set your own headers' }, body: 'SimpleText' }; },
            nullDoc(doc) { return doc.name; },
          },
        },
      }),
    };
    mock_mock = {
      emit: dummy_function,
      databases: db,
      changes: { people: [] },
      sequence: { people: 5 },
    };
    headers = {};
    get = show_fn(mock_mock);
  });

  it('should return the text, It works!', () => {
    get({ params: { db: 'people', designdoc: 'designer', name: 'general' } }, res, dummy_function);
    expect(statusCode).toBe(200);
    expect(result).toBe('It works!');
  });

  it('should set X-My-Own-Header to header and return SimpleText', () => {
    get({ params: { db: 'people', designdoc: 'designer', name: 'headers' } }, res, dummy_function);
    expect(statusCode).toBe(200);
    expect(headers).toEqual({ 'X-My-Own-Header': 'you can set your own headers' });
    expect(result).toBe('SimpleText');
  });

  it('should return the doc name reimu', () => {
    get({
      params: {
        db: 'people', designdoc: 'designer', name: 'docName', doc: 'miko',
      },
    }, res, dummy_function);
    expect(statusCode).toBe(200);
    expect(result).toBe('reimu');
  });

  it('should return an error if the database does not exist', () => {
    get({ params: { db: 'nofound', designdoc: 'designer', name: 'shows' } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('no_db_file');
  });

  it('should return an error if the designdoc does not exist', () => {
    get({ params: { db: 'people', designdoc: 'nofound', name: 'miko' } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('missing');
  });

  it('should return an error if the document does not exist', () => {
    get({ params: { db: 'people', designdoc: 'designer', name: 'notfound' } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('missing');
  });

  it('should return an error if document is null', () => {
    get({ params: { db: 'people', designdoc: 'designer', name: 'nullDoc' } }, res, dummy_function);
    expect(statusCode).toBe(500);
    expect(result.error).toBe('render_error');
    expect(result.reason).toBe('function raised error: Cannot read property \'name\' of null');
  });
});
