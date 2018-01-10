/* eslint guard-for-in: "off", no-restricted-syntax: "off", vars-on-top: "off", no-var: "off" */
/* global describe, it, expect, beforeEach */


let addDB = require('../lib/addDB')
let save_doc_fn = require('../lib/save_doc')
let get_changes_fn = require('../lib/get_changes')

describe('get_changes', () => {
  let mock_mock
  let save_doc
  let get_changes
  let dummy_function
  let res

  dummy_function = () => {

  };

  res = {
    send() {

    },
    setHeader: dummy_function,
  };

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
    save_doc({
      route: { method: 'POST' },
      params: { db: 'people', doc: 'player2' },
      body: { name: 'sanae', lastname: 'kochiya' },
    }, res, dummy_function);
    expect(!!mock_mock.databases.people.player2).toBe(true);
    expect(mock_mock.databases.people.player2.name).toBe('sanae');
    // Looking at the couchdb docs, I don't think the original 3 below was correct.
    expect(mock_mock.sequence.people).toEqual(2);
    let change = mock_mock.changes.people.pop();
    expect(change.id).toEqual('player2');
    // Looking at the couchdb docs, seq is actually some kind of crazy checksum,
    // so this could be anything.
    expect(change.seq).toEqual(1);
    expect(change.doc._id).toEqual('player2');
    mock_mock.changes.people.push(change);
  });

  it('should save a _local document and not create a change/increment the sequence number', () => {
    save_doc({
      route: { method: 'POST' },
      params: { db: 'people', doc: '_local/test' },
      body: { test_local: 'value' },
    }, res, dummy_function);
    // no changes should be added
    expect(mock_mock.changes.people.length).toEqual(0);
    expect(mock_mock.sequence.people).toEqual(1);
  });

  it('should get the changes since revision 0', (done) => {
    res.write = (str) => {
      expect(str[str.length - 1]).toEqual('\n');
      let chunk = JSON.parse(str);
      expect(chunk.id).toEqual('miko');
      expect(chunk.seq).toEqual(0);
      expect(chunk.doc._id).toEqual('miko');
      expect(chunk.doc.name).toEqual('reimu');
      done();
    };
    get_changes({
      route: { method: 'GET' },
      params: { db: 'people', doc: '_changes' },
      query: { include_docs: 'true', since: 0 },
    }, res, dummy_function);
  });
});

