/* jslint node: true, indent: 2 , nomen  : true */
/* global describe, it, expect, beforeEach, afterEach */


let addDB = require('../lib/addDB'),
  save_doc_fn = require('../lib/save_doc'),
  get_changes_fn = require('../lib/get_changes');

describe('get_changes', () => {
  let mock_mock,
    save_doc,
    get_changes,
    dummy_function,
    res;

  dummy_function = function () {

  };
  /* jslint unparam: true */
  res = {
    send() {

    },
    setHeader: dummy_function,
  };
  /* jslint unparam: false */

  beforeEach(() => {
    mock_mock = {
      emit: dummy_function,
      databases: {},
      changes: {},
      sequence: {},
    };
    addDB.call(mock_mock, 'people', [
      {
        _id: 'miko',
        _rev: '12345',
        name: 'reimu',
        lastname: 'hakurei',
      },
    ]);

    save_doc = save_doc_fn(mock_mock);
    get_changes = get_changes_fn(mock_mock);
  });

  it('should allow to create a new document and add to db changes list, db sequence number', () => {
    save_doc({ route: { method: 'POST' }, params: { db: 'people', doc: 'player2' }, body: { name: 'sanae', lastname: 'kochiya' } }, res, dummy_function);
    expect(!!mock_mock.databases.people.player2).toBe(true);
    expect(mock_mock.databases.people.player2.name).toBe('sanae');
    expect(mock_mock.sequence.people).toEqual(3);
    let change = mock_mock.changes.people.pop();
    expect(change.id).toEqual('player2');
    expect(change.seq).toEqual(2);
    expect(change.doc._id).toEqual('player2');
    mock_mock.changes.people.push(change);
  });

  it('should save a _local document and not create a change/increment the sequence number', () => {
    save_doc({ route: { method: 'POST' }, params: { db: 'people', doc: '_local/test' }, body: { test_local: 'value' } }, res, dummy_function);
    // no changes should be added
    expect(mock_mock.changes.people.length).toEqual(1);
    expect(mock_mock.sequence.people).toEqual(2);
  });

  it('should get the changes since revision 0', (done) => {
    res.write = function (str) {
      expect(str[str.length - 1]).toEqual('\n');
      let chunk = JSON.parse(str);
      expect(chunk.id).toEqual('miko');
      expect(chunk.seq).toEqual(0);
      expect(chunk.doc._id).toEqual('miko');
      expect(chunk.doc.name).toEqual('reimu');
      done();
    };
    get_changes({ route: { method: 'GET' }, params: { db: 'people', doc: '_changes' }, query: { include_docs: 'true', since: 0 } }, res, dummy_function);
  });
});

