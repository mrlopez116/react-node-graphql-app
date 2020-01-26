const express = require('express');
const bodyParser = require('body-parser');
const graphQlhttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

// Congiuring graphql api
app.use(
	'/graphql',
	graphQlhttp({
		schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
		}
		
		type User {
			_id: ID!
			email: String!
			password: String
		}

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
		}
		
		input UserInput {
			email: String!
			password: String!
		}

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
			createEvent(eventInput: EventInput): Event
			createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `), // Points to a valid graphql Schema
		rootValue: {
			events: () => {
				return Event.find()
					.then(events => {
						return events.map(event => {
							// We need to convert the id to a normal string understood by GraphQl
							return { ...event._doc, _id: event.id }; // returns a new object with the event infomration without the metadata
						});
					})
					.catch(err => {
						throw err;
					});
			},
			createEvent: args => {
				const event = new Event({
					title: args.eventInput.title,
					description: args.eventInput.description,
					price: +args.eventInput.price, //This `+` converts to a number
					date: new Date(args.eventInput.date), // Parses the incoming data string into a javascript object to send it to MongoDB
					creator: '5e2d19bec42af695ad69e747'
				});
				let createdEvent;
				// Return our promise that saves to the database online
				return event
					.save()
					.then(result => {
						createdEvent = { ...result._doc, _id: result._doc._id.toString() }; // storre the created event docuement without the metadate
						return User.findById('5e2d19bec42af695ad69e747');
						console.log(result);
						// We are returning a new javascript object
						// based on the gathering all the properties in the result
						// using the spread operator allowing us gather all the properties.
						// With out the use of `._doc` we gut unecssary metadata. `._doc` is provided by mongoose.
						return { ...result._doc, _id: result._doc._id.toString() };
					})
					.then(user => {
						if (!user) {
							throw new Error('User not found');
						}
						user.createdEvents.push();
						return user.save(); //Updates existing user
					})
					.then(reult => {
						return createdEvent;
					})
					.catch(err => {
						console.log(err);
						throw err; // Returns us the error.
					}); // Writes our data as defined above into the database
			},
			createUser: args => {
				return User.findOne({
					email: args.userInput.email
				})
					.then(user => {
						// User will be either undefined or the user object. Will always run `then` block in mongoose
						if (user) throw new Error('User exists already.');
						return bcrypt.hash(args.userInput.password, 12);
					})
					.then(hashedPassword => {
						const user = new User({
							email: args.userInput.email,
							password: hashedPassword
						});
						return user.save();
					})
					.then(result => {
						return { ...result._doc, password: null, _id: result.id }; // We make sure that the password is null so not even the hasehed password can be returned
					})
					.catch(err => {
						throw err;
					});
			}
		},
		graphiql: true // we get nice user interface
	})
);
//${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}
mongoose
	.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-buyuh.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log('Database connected');
		app.listen(8081);
	})
	.catch(err => {
		console.log(err);
	});
