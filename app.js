const express = require('express');
const bodyParser = require('body-parser');
const graphQlhttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/event');

const app = express();

app.use(bodyParser.json());

// Congiuring graphql api
app.use(
	'/graphql',
	graphQlhttp({
		schema    : buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `), // Points to a valid graphql Schema
		rootValue : {
			events      : () => {
				return Event.find()
					.then((events) => {
						return events.map((event) => {
							// We need to convert the id to a normal string understood by GraphQl
							return { ...event._doc, _id: event.id }; // returns a new object with the event infomration without the metadata
						});
					})
					.catch((err) => {
						throw err;
					});
			},
			createEvent : (args) => {
				const event = new Event({
					title       : args.eventInput.title,
					description : args.eventInput.description,
					price       : +args.eventInput.price, //This `+` converts to a number
					date        : new Date(args.eventInput.date) // Parses the incoming data string into a javascript object to send it to MongoDB
				});
				// Return our promise that saves to the database online
				return event
					.save()
					.then((result) => {
						console.log(result);
						// We are returning a new javascript object
						// based on the gathering all the properties in the result
						// using the spread operator allowing us gather all the properties.
						// With out the use of `._doc` we gut unecssary metadata. `._doc` is provided by mongoose.
						return { ...result._doc, _id: result._doc._id.toString() };
					})
					.catch((err) => {
						console.log(err);
						throw err; // Returns us the error.
					}); // Writes our data as defined above into the database
			}
		},
		graphiql  : true // we get nice user interface
	})
);
//${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}
mongoose
	.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-buyuh.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, {
		useNewUrlParser    : true,
		useUnifiedTopology : true
	})
	.then(() => {
		console.log('Database connected');
		app.listen(8081);
	})
	.catch((err) => {
		console.log(err);
	});
