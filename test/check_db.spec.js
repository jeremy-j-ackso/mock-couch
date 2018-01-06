/* global describe, it, expect, beforeEach */


let all_docs_fn = require('../lib/check_db')
let mockDB = require('../lib/mockDB')

describe('check_db', () => {
  let mock_mock
  let get
  let statusCode
  let result
  let dummy_function
  let res

  dummy_function = () => {

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
        qball: {
          _rev: '9999',
          name: 'cirno',
        },
      }),
    };
    mock_mock = {
      emit: dummy_function,
      databases: db,
      changes: { people: [] },
      sequence: { people: 4 },
    };
    get = all_docs_fn(mock_mock);
  });

  it('should return an error if the database does not exist', () => {
    get({ route: { method: 'GET' }, params: { db: 'nofound' }, query: { } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('no_db_file');
  });
});
