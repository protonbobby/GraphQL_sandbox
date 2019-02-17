const express = require('express');
const graphqlHTTP = require('express-graphql')
const app = express();
const DataLoader = require('dataloader');
const fetch = require('node-fetch');
const { goodreads } = require('./keys');
const { key } = goodreads;
const util = require('util');
const parseXML = util.promisify(require('xml2js').parseString);
const PORT = 8753;
const schema = require('./schema');

const fetchAuthor = id =>
  fetch(`https://www.goodreads.com/author/show.xml?id=${id}&key=${key}`)
    .then(res => res.text())
    .then(parseXML)

const fetchBook = id =>
  fetch(`https://www.goodreads.com/book/show/${id}.xml?key=${key}`)
    .then(res => res.text())
    .then(parseXML)

//for caching

app.use('/graphql', graphqlHTTP(req => {
  const authorLoader = new DataLoader(keys => Promise.all(keys.map(fetchAuthor)))
  const bookLoader = new DataLoader(keys => Promise.all(keys.map(fetchBook)))
  return {
    schema,
    context: { authorLoader, bookLoader },
    graphiql: true
  }
}));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});

