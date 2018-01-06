/* global describe, it, expect, beforeEach */


let bulk_docs_fn = require('../lib/bulk_docs')
let mockDB = require('../lib/mockDB')

describe('_bulk_docs', () => {
  let mock_mock
  let bulkDocs
  let result
  let { people } = mock_mock.databases
  let dummy_function
  let res

  dummy_function = () => {

  };

  res = {
    send(status, obj) {
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
        nineball: {
          _rev: '9999',
          name: 'cirno',
        },
      }),
    };
    mock_mock = {
      emit: dummy_function,
      databases: db,
      changes: { people: [] },
      sequence: { people: 3 },
    };
    bulkDocs = bulk_docs_fn(mock_mock);
  });

  it('should be able to create several documents', () => {
    bulkDocs({ params: { db: 'people' }, body: { docs: [{ _id: 'player2', name: 'sanae', lastname: 'kochiya' }, { name: 'chen' }, { _id: 'moonbunny', name: 'reisen', nickname: 'udonge' }] } }, res, dummy_function);
    expect(people.__doc_count).toBe(6);
    expect(!!people.player2).toBe(true);
    expect(people.moonbunny.nickname).toBe('udonge');
    expect(people[result[1].id].name).toBe('chen');
  });

  it('should be able to update documents, if the valid rev is passed', () => {
    bulkDocs({
      params: { db: 'people' },
      body: {
        docs: [{ _id: 'miko', name: 'sanae', lastname: 'kochiya' }, {
          _id: 'magician', _rev: '67890', name: 'patchouli', lastname: 'knowledge',
        }, {
          _id: 'nineball', _rev: '9999', name: 'cirno', lastname: 'hakurei',
        }],
      },
    }, res, dummy_function);
    expect(people.__doc_count).toBe(3);
    expect(people.miko.name).toBe('reimu');
    expect(people.miko.lastname).toBe('hakurei');
    expect(people.magician.name).toBe('patchouli');
    expect(people.magician.lastname).toBe('knowledge');
    expect(people.nineball.name).toBe('cirno');
    expect(people.nineball.lastname).toBe('hakurei');
    expect(!!result[0].error).toBe(true);
    expect(!!result[1].error).toBe(false);
    expect(!!result[2].error).toBe(false);
  });
});

