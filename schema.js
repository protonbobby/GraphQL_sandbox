const fetch = require('node-fetch');
const { goodreads } = require('./keys');
const { key } = goodreads;
const util = require('util');
const parseXML = util.promisify(require('xml2js').parseString);
const DataLoader = require('dataloader');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')

const fetchAuthor = id =>
  fetch(`https://www.goodreads.com/author/show.xml?id=${id}&key=${key}`)
    .then(res => res.text())
    .then(parseXML)

const fetchBook = id =>
  fetch(`https://www.goodreads.com/book/show/${id}.xml?key=${key}`)
    .then(res => res.text())
    .then(parseXML)

//for caching
const authorLoader = new DataLoader(keys => Promise.all(keys.map(fetchAuthor)))
const bookLoader = new DataLoader(keys => Promise.all(keys.map(fetchBook)))

const BookType = new GraphQLObjectType({
  name: 'Book',
  description: '...',

  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.book[0].title[0]
    },
    isbn: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
    },
    authors: {
      type: new GraphQLList(AuthorType),
      resolve: xml => {
        const authorElements = xml.GoodreadsResponse.book[0].authors[0].author
        const ids = authorElements.map(e => e.id[0])
        return authorLoader.loadMany(ids)
      }
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: '...',

  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: xml =>
        xml.GoodreadsResponse.author[0].name[0]
    },
    books: {
      type: new GraphQLList(BookType),
      resolve: xml => {
        const ids = xml.GoodreadsResponse.author[0].books[0].book.map(e => e.id[0]._)
        return bookLoader.loadMany(ids)
      }
    }
  })
})

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    description: '...',

    fields: () => ({
      author: {
        type: AuthorType,
        args: {
          id: { type: GraphQLInt }
        },
        resolve: (root, args) => authorLoader.load(args.id)
      }
    })
  })
})

