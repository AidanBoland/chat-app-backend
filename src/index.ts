import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { config } from 'dotenv';
config();

import { resolvers } from './resolvers.js';
import { typeDefs } from './typeDefs.js';

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT) },
});

console.log(`server at ${url}`);
