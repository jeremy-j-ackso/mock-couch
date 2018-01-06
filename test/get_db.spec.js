/* jslint node: true, indent: 2 , nomen  : true */
/* global describe, it, expect, beforeEach, afterEach */


let get_db_fn = require('../lib/get_db'),
  mockDB = require('../lib/mockDB');

describe('get_db', () => {
  let mock_mock,
    get,
    statusCode,
    result,
    dummy_function,
    res;

  dummy_function = function () {

  };
  /* jslint unparam: true */
  res = {
    send(status, obj) {
      statusCode = status;
      result = obj;
    },
    setHeader: dummy_function,
  };
  /* jslint unparam: false */

  beforeEach(() => {
    let db = {
      people: mockDB({
        miko: {
          _rev: '12345',
          name: 'reimu',
          lastname: 'hakurei',
        },
        magician: {
          _rev: '67890',
          name: 'marisa',
          lastname: 'kirisame',
        },
        player2: {
          _rev: '334455',
          name: 'sanae',
          lastname: 'kochiya',
        },
      }),
    };
    mock_mock = {
      emit: dummy_function,
      databases: db,
      changes: { people: [] },
      sequence: { people: 3 },
    };
    get = get_db_fn(mock_mock);
  });

  it('should get any existing database', () => {
    get({ params: { db: 'people' } }, res, dummy_function);
    expect(statusCode).toBe(200);
    expect(result.db_name).toBe('people');
    expect(result.doc_count).toBe(3);
  });

  it('should return an error if the database does not exist', () => {
    get({ params: { db: 'nofound' } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('no_db_file');
  });
});
