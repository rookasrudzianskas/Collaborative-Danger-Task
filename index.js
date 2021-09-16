const { ApolloServer, gql } = require('apollo-server');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
// const {DB_URI, DB_NAME} = process.env;

const DB_URI="mongodb+srv://admin:admin@cluster0.nrccl.mongodb.net/taskade?retryWrites=true&w=majority";
const DB_NAME="taskade"

dotenv.config();

const books = [
    {
        title: 'The Awakening',
        author: 'Rokas Rudzianskas',
    },
    {
        title: 'City of Glass',
        author: 'Paul Auster',
    },
];

const typeDefs = gql`
    type Book {
        title: String
        author: String
    }
    
    type Query {
        books: [Book]
    }
`;

const resolvers = {
    Query: {
        books: (root, data, context) => {
            // console.log(context.db);
            return books;
        }
    },
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
