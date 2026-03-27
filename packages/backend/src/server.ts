import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { schema } from './schema';
const yoga = createYoga({ 
  schema,
  graphqlEndpoint: '/graphql' 
});

const server = createServer(yoga);

server.listen(3000, () => {
  console.info('🚀 Server is running on http://localhost:3000/graphql');
});