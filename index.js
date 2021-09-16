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






// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
        title: String
        author: String
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        books: [Book]
    }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        books: () => books,
    },
};
// console.log("THIS IS DB", DB_URI);


const start = async() => {
    const client = new MongoClient(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    await client.connect();
    const db = client.db(DB_NAME);


// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
    const server = new ApolloServer({typeDefs, resolvers});

// The `listen` method launches a web server.
    server.listen().then(({url}) => {
        console.log(`🚀  Server ready at ${url}`);
    });

}

start();
