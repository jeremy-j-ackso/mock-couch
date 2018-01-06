/* global describe, it, expect, beforeEach */


let get_doc_fn = require('../lib/get_doc');

describe('get_doc', () => {
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
      people: {
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
      },
    };
    mock_mock = {
      emit: dummy_function,
      databases: db,
      changes: { people: [] },
      sequence: { people: 1 },
    };
    get = get_doc_fn(mock_mock);
  });

  it('should get any existing document', () => {
    get({ params: { db: 'people', doc: 'miko' } }, res, dummy_function);
    expect(result._id).toBe('miko');
  });

  it('should return an error if the database does not exist', () => {
    get({ params: { db: 'nofound', doc: 'miko' } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('no_db_file');
  });

  it('should return an error if the document does not exist', () => {
    get({ params: { db: 'people', doc: 'notfound' } }, res, dummy_function);
    expect(statusCode).toBe(404);
    expect(result.error).toBe('not_found');
    expect(result.reason).toBe('missing');
  });
});
