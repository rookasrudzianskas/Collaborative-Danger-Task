const { ApolloServer, gql } = require('apollo-server');
const dotenv = require('dotenv');
const { MongoClient, ObjectID } = require('mongodb');
// const {DB_URI, DB_NAME} = process.env;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DB_URI="mongodb+srv://admin:admin@cluster0.nrccl.mongodb.net/taskade?retryWrites=true&w=majority";
const DB_NAME="taskade"
const JWT_SECRET='dsfasdjflsdflksdkfjdlskf';

// "token": "",


const getToken = (user) => jwt.sign({id: user._id}, JWT_SECRET, {expiresIn: '7 days'});
const getUserFromToken = async (token, db) => {
    if(!token) {
        return null
    }
    // console.log('Hello');
    const tokenData = jwt.verify(token, JWT_SECRET);
    // console.log(tokenData);
    if(!tokenData?.id) {
        return null;
    }
    return await db.collection('Users').findOne({ _id: ObjectID(tokenData.id) });
}

dotenv.config();

const typeDefs = gql`
    
    type Query {
        myTaskLists: [TaskList!]!
        getTaskList(id: ID!): TaskList
    }
    
    type Mutation {
        signUp(input: SignUpInput!): AuthUser!
        signIn(input: SignInInput!): AuthUser!
        
        createTaskList(title: String!): TaskList!
        updateTaskList(id: ID!, title: String!): TaskList!
        deleteTaskList(id: ID!): Boolean!
        
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
        myTaskLists: async (_, __, {db, user}) => {
            if(!user) {
                throw new Error("Authentication failed, please sign in again");
            }
            return await db.collection('TaskList')
                .find({ userIds: user._id })
                .toArray();
        },
        getTaskList: async(_, { id }, { db, user }) => {
            if(!user) {
                throw new Error("Authentication failed, please sign in again");
            }
            return await db.collection('TaskList').findOne({ _id: ObjectID(id) });
        },
    },
    Mutation: {
        // could be the user with db
        signUp: async (_, {input}, {db}) => {
            // console.log(input);
            const hashedPassword = bcrypt.hashSync(input.password);
            const newUser = {
                ...input,
                password: hashedPassword
            }
            // save to the database

            const result = await db.collection('Users').insertOne(newUser);
            // console.log("This is the result", result);

            const user = result.ops[0];
            return {
                user,
                token: getToken(user)
            }

        },
        signIn: async(_, { input }, { db }) => {
            const user = await db.collection('Users').findOne({ email: input.email });
            // we need to check if the password is correct
            const isPasswordCorrect = user && bcrypt.compareSync(input.password, user.password);

            if(!user || !isPasswordCorrect) {
                throw new Error("Invalid credentials");
            }

            return {
                user,
                token: getToken(user),
            }

        },

        createTaskList: async(_, { title }, {db, user }) => {
            if(!user) {
                throw new Error("Authentication failed, please sign in again");
            }

            const newTaskList = {
                title,
                createdAt: new Date().toISOString(),
                userIds: [user._id]
            }

            const result = await db.collection('TaskList').insert(newTaskList);
            return result.ops[0];

        },
        updateTaskList: async(_, { id, title }, {db, user}) => {
            if(!user) {
                throw new Error("Authentication failed, please sign in again");
            }

            const result = await db.collection('TaskList')
                .updateOne({
                    _id: ObjectID(id)
                }, {
                    $set: {
                        title: title
                    }
                })
            // console.log("This is ", result)
            return await db.collection('TaskList').findOne({ _id: ObjectID(id) })
        },
        deleteTaskList: async(_, { id }, { db, user }) => {
            if(!user) {
                throw new Error("Authentication failed, please sign in again");
            }
           // @TODO only collaborators of this task list, should be able delete
            await db.collection('TaskList').removeOne({ _id: ObjectID(id) });
            return true;
        },


    },

    User: {
        id: ({ _id, id }) => _id || id
    },
    TaskList: {
        id: ({ _id, id }) => _id || id,
        progress: () => 0,
        users: async ({userIds}, _, { db }) => Promise.all(userIds.map((userId) => (db.collection('Users').findOne({ _id: userId })))),
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
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async ({req}) => {
            // console.log(req.headers)
            const user = await getUserFromToken(req.headers.authorization, db);
            // console.log(user);
            return {
                db,
                user,
            }
        },
    });

    server.listen().then(({url}) => {
        console.log(`🚀  Server ready at ${url}`);
    });

}

start();


// it actually works quite well
