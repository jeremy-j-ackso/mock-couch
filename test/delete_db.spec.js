/* global describe, it, expect, beforeEach */


let del_fn = require('../lib/delete_db');

describe('delete_db', () => {
  let mock_mock
  let del
  let result
  let dummy_function
  let res

  dummy_function = () => {

  };
  /* jslint unparam: true */
  res = {
    send(status, obj) {
      result = obj;
    },
    setHeader: dummy_function,
  };
  /* jslint unparam: false */

  beforeEach(() => {
    let db = {
      people: {
        miko: {
          _rev: '12345',
          name: 'reimu',
          lastname: 'hakurei',
        },
      },
    };
    mock_mock = {
      emit: dummy_function,
      databases: db,
      changes: { people: [] },
      sequence: { people: 1 },
    };
    del = del_fn(mock_mock);
  });

  it('should remove a database', () => {
    del({ params: { db: 'people' } }, res, dummy_function);
    expect(!!mock_mock.databases.people).toBe(false);
  });

  it('should do nothing if you try to delete an nonexistent database', () => {
    del({ params: { db: 'humans' } }, res, dummy_function);
    expect(!!result.error).toBe(true);
  });
});
