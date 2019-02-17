const express = require('express');
const graphqlHTTP = require('express-graphql')
const app = express();
const PORT = 8753;

//GRAPHQL ENDPOINT
const schema = require('./schema');

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});

