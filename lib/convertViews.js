/* eslint no-new-func: "off" */

let nl = /(?:\\r|\\n|\n|\r)/g

function convertViews(doc) {
  if (doc.views && (!doc.id || (doc.id && doc._id.substr(0, 8) === '_design/'))) {
    Object.keys(doc.views).forEach((view) => {
      let thisView = doc.views[view]

      if (thisView.hasOwnProperty('map')) {
        let fn = `return ${thisView.map.replace(nl, '')}`;
        thisView.map = (new Function(fn))();
      }

      if (thisView.hasOwnProperty('reduce') && thisView.reduce !== '_sum' && thisView.reduce !== '_count') {
        let fn = `return ${thisView.reduce.replace(nl, '')}`;
        thisView.reduce = (new Function(fn))();
      }
    })
  }
  return doc
}

module.exports = convertViews
