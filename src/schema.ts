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
    }

    type Mutation {
        createMessage (
            senderId: Int!
            content: String!
        ): Message
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
    },

    Mutation: {
        async createMessage(senderId, content) {
            await prisma.message.create({
                data: {
                    senderId: content.senderId,
                    content: content.content,
                },
            });

            pubsub.publish('MESSAGE_SENT', {
                newMessage: {
                    senderId: senderId,
                    sender: await prisma.user.findUnique({ where: { id: senderId } }),
                    id: await prisma.message.findMany({
                        take: 1,
                        orderBy: {
                            id: 'desc',
                        },
                        select: {
                            id: true,
                        },
                    }),
                    content: content,
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
