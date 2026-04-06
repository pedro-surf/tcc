import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';
import { loggingPlugin } from './graphql/logging';

const yoga = createYoga({
  schema,
  context: createContext,
  plugins: [loggingPlugin],
});

const server = createServer(yoga);

server.listen(3000, () => {
  console.log('Visit http://localhost:3000/graphql');
});