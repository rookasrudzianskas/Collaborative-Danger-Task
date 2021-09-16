
const { ApolloServer, gql } = require('apollo-server');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
// const {DB_URI, DB_NAME} = process.env;

const DB_URI="mongodb+srv://admin:admin@cluster0.nrccl.mongodb.net/taskade?retryWrites=true&w=majority";
const DB_NAME="taskade"

dotenv.config();

const typeDefs = gql`
    
    type Query {
        myTaskLists: [TaskList!]!
    }
    
    type Mutation {
        signUp(input: SignUpInput): AuthUser!
        signIn(input: SignInInput): AuthUser!
    }
    
    input SignUpInput {
        email: String!
        password: String!
        name: String!
        avatar: String
    }
    
    input SignInInput {
        email: String!
        password: String!
    }
    
    type AuthUser {
        user: User!
        token: String!
    }
    
    type User {
        id: ID!
        name: String!
        email: String! 
        avatar: String!
    }
    
    type TaskList {
        id: ID!
        createdAt: String!
        title: String!
        progress: Float!
        
        users: [User!]!
        todos: [ToDo!]!
    }
    
    type ToDo {
        id: ID!
        content: String!
        isCompleted: Boolean!
        
        taskList: TaskList!
    }

`;

const resolvers = {
    Query: {
        myTaskLists: () => []
    },
    Mutation: {
        signUp: (_, { input }) => {
            // console.log(input);

        },
        signIn: () => {

        }
    }
};
// console.log("THIS IS DB", DB_URI);


const start = async() => {
    const client = new MongoClient(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    await client.connect();
    const db = client.db(DB_NAME);

    const context = {
        db,
    }


    const server = new ApolloServer({typeDefs, resolvers, context});

    server.listen().then(({url}) => {
        console.log(`🚀  Server ready at ${url}`);
    });

}

start();


// some cool stuff goes in here
