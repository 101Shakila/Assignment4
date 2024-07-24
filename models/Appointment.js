//Here we have to define the User Collection Schema
const mongoose = require('mongoose'); //Import mongoose library
const Schema = mongoose.Schema;  // This is reference to Schema Class ~ can create new Schema instances.


//For admin we gotta create appointment schema
const appointmentSchema = new Schema({
    date: {
        type: String, // Storing date as a string for simplicity
        required: true
    },
    time: {
        type: String, // Storing time as a string
        required: true
    },
    isTimeAvailable: {
        type: Boolean,
        default: true
    }
});

//This will create a model names 'User' while using the schema defined above 'userCollection'
const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;