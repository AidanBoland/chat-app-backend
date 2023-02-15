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

        checkForUser: async (parent, args, contextValue, info) => {
            console.log(args);
            let userFound = await prisma.user.findUnique({
                where: {
                    email: args.email,
                },
            });

            console.log(userFound);

            if (!userFound) {
                return { user: null };
            }

            return userFound;
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

            const databaseId = await prisma.message.findFirst({
                take: 1,
                orderBy: {
                    id: 'desc',
                },
                select: {
                    id: true,
                },
            });

            console.log(
                `NEW MESSAGE /n id: ${databaseId.id} /n content: ${content.content}, sender: ${await prisma.user.findFirst({
                    where: { id: content.senderId },
                })}`
            );

            pubsub.publish('MESSAGE_SENT', {
                newMessage: {
                    __typename: 'Message',
                    id: databaseId.id,
                    content: content.content,
                    sender: await prisma.user.findFirst({ where: { id: content.senderId } }),
                },
            });

            prisma.$disconnect;
        },
    },

    Subscription: {
        newMessage: {
            subscribe: () => pubsub.asyncIterator(['MESSAGE_SENT']),
        },
    },
};
