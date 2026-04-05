import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { schema } from './graphql/schema';

const yoga = createYoga({
  schema,
});

const server = createServer(yoga);

server.listen(3000, () => {
  console.log('Visit http://localhost:3000/graphql');
});