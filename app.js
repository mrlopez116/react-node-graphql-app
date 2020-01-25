const express = require('express');
const bodyParser = require('body-parser');
const graphQlhttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

app.use(bodyParser.json());

// Congiuring graphql api
app.use(
	'/graphql',
	graphQlhttp({
		schema    : buildSchema(`
        type RootQuery {
            events: [String!]!
        }

        type RootMutation {
            createEvent(name: String): String
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `), // Points to a valid graphql Schema
		rootValue : {
			events      : () => {
				return [ 'Sometehing 1', 'Somethign 2', 'Something 3' ];
			},
			createEvent : (args) => {
				const eventName = args.name; // name because that ishow we neamed it in the    `RootMutation`
				return eventName;
			},
			graphiql    : true // we get nice user interface
		}
	})
);

app.listen(8081);
