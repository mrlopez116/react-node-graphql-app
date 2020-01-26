const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// The schema for out Event Model
const eventSchema = new Schema({
	title       : {
		type     : String,
		required : true
	},
	description : {
		type     : String,
		required : true
	},
	price       : {
		type     : Number,
		required : true
	},
	date        : {
		type     : Date,
		required : true
	}
});

// Allows for exporting our files
module.exports = mongoose.model('Event', eventSchema);
