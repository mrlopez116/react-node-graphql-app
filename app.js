const express = require('express');
const bodyParser = require('body-parser');
const graphQlhttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const events = [];

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
				return events;
			},
			createEvent : (args) => {
				const event = {
					_id         : Math.random().toString(),
					title       : args.eventInput.title,
					description : args.eventInput.description,
					price       : +args.eventInput.price, //This `+` converts to a number
					date        : args.eventInput.date
				};

				events.push(event);
				return event;
			}
		},
		graphiql  : true // we get nice user interface
	})
);

app.listen(8081);
