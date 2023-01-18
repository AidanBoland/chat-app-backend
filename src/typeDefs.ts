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
`;
