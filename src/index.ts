import { ApolloServer } from '@apollo/server';
import { config } from 'dotenv';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import { typeDefs, resolvers } from './schema.js';

config();

interface MyContext {
    token?: string;
}

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
    '/gqlapi',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    })
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));

console.log(`Server ready at http://localhost:4000/`);
