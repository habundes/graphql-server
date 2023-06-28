import { ApolloServer, AuthenticationError, gql, UserInputError } from 'apollo-server'
import { PubSub } from 'graphql-subscriptions'
import axios from 'axios'
import Person from './models/person.js'
import User from './models/user.js'
import jwt from 'jsonwebtoken'

import "dotenv/config.js"
import './db.js'

const JWT_SECRET = 'DO_RE_MI_FA_SOL_LA_SI_DO'
const pubsub = new PubSub()
const SUBSCRIPTION_EVENTS = {
  PERSON_ADDED: 'PERSON_ADDED'
}
// const people = [
//     {
//         name: 'John',
//         phone: '123-456-789',
//         street: 'Mountain',
//         city: 'San Francisco',
//         id: '3d599471-3436-11e9-bc57-8b80ba54c431',
//     },
//     {
//         name: 'Paul',
//         phone: '',
//         street: 'View',
//         city: 'San Francisco',
//         id: '3d599471-3437-11e9-bc57-8b80ba54c431',
//     },
//     {
//         name: 'George',
//         phone: '123-456-789',
//         street: 'McStreet',
//         city: 'San Francisco',
//         id: '3d599471-3438-11e9-bc57-8b80ba54c431',
//     }
// ]

const typeDefs = gql`

    enum YesNo {
        YES
        NO
    }
    
    type Address {
        street: String!
        city: String!
    }
    
    type Person {
        name: String!
        phone: String
        address: Address!
        id: ID!
    }
    
    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]
        findPerson(name: String!): Person
        me: User
    }
    
    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
        
        editNumber(
            name: String!
            phone: String!
        ):Person
        
        createUser(
            username: String!
        ): User
        
        login(
            username: String!
            password: String!
        ): Token
        
        addFriend(
            name: String!
        ):User
    }
    
    type User {
        username: String!
        friends: [Person]
        id: ID!
    }
    
    type Token {
        value: String!
    }
    
    type Subscription {
        personAdded: Person!
    }
`

const resolvers = {
  Query: {
    personCount: () => Person.collection.countDocuments(),
    allPersons: async (root, args) => {
      if (!args.phone) return await Person.find({})
      return await Person.find({ phone: { $exists: args.phone === 'YES' } })
    },
    findPerson: async (root, args) => {
      const { name } = args
      return await Person.findOne({ name })
    },
    me: (root, args, context) => {
      return context.currentUser
    },
  },
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city
      }
    }
  },
  Mutation: {
    addPerson: async (root, args, context) => {
      const { currentUser } = context
      if (!currentUser) throw new AuthenticationError('not authenticated')

      const person = new Person({ ...args })
      try {
        await person.save()
        currentUser.friends = currentUser.friends.concat(person)
        await currentUser.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
      //pubsub.publish(SUBSCRIPTION_EVENTS.PERSON_ADDED, { personAdded: person })
      return person
    },
    editNumber: async (root, args) => {
      const { name, phone } = args
      const person = await Person.findOne({ name })
      if (!person) return
      person.phone = phone
      try {
        await person.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
      return person
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username, })
      return user.save().catch(err => {
        throw new UserInputError(e.message, {
          invalidArgs: args
        })
      })
    },
    login: async (toot, args) => {
      const { username, password } = args
      const user = await User.findOne({ username })

      if (!user || password !== 'secret') {
        throw new UserInputError('wrong credentials')
      }

      const userForToke = {
        username: user.username,
        id: user._id
      }

      return {
        value: jwt.sign(userForToke, JWT_SECRET)
      }
    },
    addFriend: async (root, args, { currentUser }) => {
      if (!currentUser) throw new AuthenticationError('not authenticated')
      const { name } = args
      const person = await Person.findOne({ name })
      const notFriend = person => !currentUser.friends.map(p => p._id).includes(person._id)

      if (!notFriend(person)) {
        currentUser.friends = [...currentUser.friends, person]
        await currentUser.save()
      }
      return currentUser
    }
  },
  Subscription: {
    personAdded: {
      subscribe: () => pubsub.asyncIterator(SUBSCRIPTION_EVENTS.PERSON_ADDED)
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.substring(7)
      const { id } = jwt.verify(token, JWT_SECRET)
      const currentUser = await User.findById(id).populate('friends')
      return { currentUser }
    }
  }
})


server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
  // console.log(`🚀  Subscription ready at ${subscriptionsUrl}`);

});