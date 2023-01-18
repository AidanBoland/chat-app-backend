import { PrismaClient } from '@prisma/client';

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
            console.log(content);

            const result = await prisma.message.create({
                data: {
                    senderId: content.senderId,
                    content: content.content,
                },
            });
        },
    },
};
