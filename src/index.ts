import { ApolloServer } from '@apollo/server';
import { config } from 'dotenv';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import { typeDefs, resolvers } from './schema.js';

config();

const app = express();
const httpServer = createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/gqlws',
});

const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
    schema,

    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),

        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
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
