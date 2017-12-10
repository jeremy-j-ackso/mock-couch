let nl = /(?:\\r|\\n|\n|\r)/g

module.exports = (doc) => {
  if (doc.views && (!doc.id || (doc.id && doc._id.substr(0, 8) === '_design/'))) {
    Object.keys(doc.views).forEach((view) => {
      let thisView = doc.views[view]

      if (thisView.hasOwnProperty('map')) {
        // fn = `return ${thisView.map.replace(nl, '')}`;
        // thisView.map = (new Function(fn))();
        thisView.map = () => {
          let fn = `${thisView.map.replace(nl, '')}`
          return fn
        }
      }
      if (thisView.hasOwnProperty('reduce') && thisView.reduce !== '_sum' && thisView.reduce !== '_count') {
        // fn = `return ${thisView.reduce.replace(nl, '')}`;
        // thisView.reduce = (new Function(fn))();
        thisView.reduce = () => {
          let fn = `${thisView.reduce.replace(nl, '')}`
          return fn
        }
      }
    });
  }
  return doc;
};

