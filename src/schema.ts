import { PrismaClient } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const typeDefs = `#graphql
    type Message {
        sender: User
        senderId: Int!
        id: ID!
        content: String!
        replyTo: ID
    }

    type User {
        id: ID!
        email: String!
        displayName: String!
        displayColour: String!
    }

    type Query {
        getMessages: [Message]
        checkForUser(
            email: String!
        ): User
    }

    type Mutation {
        createMessage (
            senderId: Int!
            content: String!
        ): Message

        createUser (
           email: String!
           displayName: String!
           displayColour: String!
        ): User
    }

    type Subscription {
        newMessage: Message
    }
`;

const prisma = new PrismaClient();

export const resolvers = {
    Query: {
        getMessages: async () => {
            const messages = await prisma.message.findMany({
                take: 20,
                orderBy: {
                    id: 'desc',
                },
                include: {
                    sender: true,
                },
            });
            return messages;
        },

        checkForUser: async (_parent, args, _contextValue, _info) => {
            let userFound = await prisma.user.findUnique({
                where: {
                    email: args.email,
                },
            });

            if (!userFound) {
                return;
            }

            return userFound;
        },
    },

    Mutation: {
        async createMessage(_parent, args, _contextValue, _info) {
            await prisma.message.create({
                data: {
                    senderId: args.senderId,
                    content: args.content,
                },
            });

            const databaseId = await prisma.message.findFirst({
                take: 1,
                orderBy: {
                    id: 'desc',
                },
                select: {
                    id: true,
                },
            });

            pubsub.publish('MESSAGE_SENT', {
                newMessage: {
                    __typename: 'Message',
                    id: databaseId.id,
                    content: args.content,
                    sender: await prisma.user.findFirst({ where: { id: args.senderId } }),
                },
            });

            prisma.$disconnect;
        },

        async createUser(_parent, args, _contextValue, _info) {
            await prisma.user.create({
                data: {
                    email: args.email,
                    displayName: args.displayName,
                    displayColour: args.displayColour,
                },
            });

            return await prisma.user.findFirst({
                take: 1,
                where: {
                    email: args.email,
                },
            });
        },
    },

    Subscription: {
        newMessage: {
            subscribe: () => pubsub.asyncIterator(['MESSAGE_SENT']),
        },
    },
};
