const User = require('../models/User');//Import User Model - can interact with user collection made in mongoDB
const Appointment = require('../models/Appointment');//Import User Model - can interact with user collection made in mongoDB
const bcrypt = require('bcrypt');//Import bcrypt Library into our app - Helps hash passwords
//Here we will update car info & user details

// This will render the dashboard page.
exports.dashboard = (req, res) => {
    //We need to store the username to MATCH to the database & userType for authentication access to g and g2 page
    const username = req.session.user.username;
    const userType = req.session.user.userType;

    if (username) {
        res.render('dashboard', { title: 'Dashboard Page', username, userType, loggedIn: true });
    }
    else {
        res.render('dashboard', { title: 'Dashboard Page', username, userType, loggedIn: false });
    }
};



//display user info based on user LICENSE NUMBER
//First it will validate license Number
//using bcrpty - We will compare and try to match the user
//After matching we will render G page.
exports.gPage = (req, res) => {
    const username = req.session.user.username;
    const userType = req.session.user.userType;

    if (!username) {
        return res.redirect('/login'); // Redirect to login if no user is logged in
    }

    User.findOne({ username })
        .then(user => {
            if (user) {
                const isNewUser = user.firstName == 'First Name' && user.lastName == 'Last Name';
                res.render('g', { title: 'G Page', user, message: null, isNewUser, userType, loggedIn: true });
            } else {
                res.render('g', { title: 'G Page', message: 'User not found', user: null, userType, isNewUser: false, loggedIn: true });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Internal Server Error');
        });
};

//If updating car details - we will match use user based on LICENSE NUMBER and then update it if MATCHED.
//G page will be rendered after sucessfully updating user information.
//if Error the error message will appear
exports.updateCarInfo = (req, res) => {
    const username = req.session.user.username;
    const userType = req.session.user.userType;


    if (!username) {
        return res.redirect('/login'); // Redirect to login if no user is logged in
    }

    const { make, model, carYear, plateNumber } = req.body;

    if (!make.match(/^[A-Za-z\s]{1,50}$/) || !model.match(/^[A-Za-z\s]{1,50}$/) || !carYear.match(/^\d{4}$/) || !plateNumber.match(/^[a-zA-Z0-9]+$/)) {
        return res.render('g', { title: 'G Page', message: 'Invalid input', goToG2: false, userType, user: null, loggedIn: true });
    }

    User.findOne({ username })
        .then(user => {
            if (user) {
                user.carDetails.make = make;
                user.carDetails.model = model;
                user.carDetails.carYear = carYear;
                user.carDetails.plateNumber = plateNumber;
                return user.save();
            } else {
                res.render('g', { title: 'G Page', message: 'User not found', goToG2: false, userType, loggedIn: true });
            }
        })
        .then(savedUser => {
            if (savedUser) {
                res.render('g', { title: 'G Page', user: savedUser, message: 'Updated successfully', goToG2: false, userType, loggedIn: true });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
};


exports.g2Page = async (req, res) => {
    const username = req.session.user.username;
    const userType = req.session.user.userType;
    const selectedDate = req.query.appointmentDate;

    try {
        const user = await User.findOne({ username });
        let slots = [];

        if (selectedDate) {
            const appointments = await Appointment.find({ date: selectedDate });
            slots = appointments.map(appointment => appointment.time);
        }

        if (user) {
            res.render('g2', { title: 'G2 Page', user, message: null, userType, loggedIn: true, slots, selectedDate });
        } else {
            res.render('g2', { title: 'G2 Page', message: 'User not found', user: null, userType, loggedIn: true, slots, selectedDate });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
};


//Form submissions chekced and done here.
//Create a new user based on values provided OR the values provided
//Save new user deatils and renders g2 page
exports.g2Post = async (req, res) => {
    const username = req.session.user.username;
    const userType = req.session.user.userType;
    const defaultDob = new Date('2000-01-01');
    const saltRounds = 10;
    const selectedDate = req.query.appointmentDate;
    let slots = []

    try {
        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            {
                $set: {
                    firstName: req.body.firstName || 'First Name',
                    lastName: req.body.lastName || 'Last Name',
                    licenseNumber: req.body.licenseNumber ? await bcrypt.hash(req.body.licenseNumber, saltRounds) : 'Unknown',
                    age: req.body.age || 18,
                    dob: req.body.dob || defaultDob,
                    'carDetails.make': req.body.make || 'Make',
                    'carDetails.model': req.body.model || 'Model',
                    'carDetails.carYear': req.body.carYear || new Date().getFullYear(),
                    'carDetails.plateNumber': req.body.plateNumber || 'Plate Number',
                    appointmentDate: req.body.appointmentDate,
                    appointmentTime: req.body.appointmentTime
                }
            },
            { new: true, useFindAndModify: false }
        );

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }

        res.render('g2', { title: 'G2 Page', user: updatedUser, message: 'Updated User Details!', userType, loggedIn: true, selectedDate, slots });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};


// This will render the Appointment page.
exports.appointmentPage = (req, res) => {
    //We need to store the username to MATCH to the database & userType for authentication access to g and g2 page
    const username = req.session.user.username;
    const userType = req.session.user.userType;

    if (username) {
        res.render('appointment', { title: 'Appointment Page', username, userType, message: null, loggedIn: true });
    }
    else {
        res.render('dashboard', { title: 'Dashboard Page', username, userType, loggedIn: false });
    }
};

//Form submissions to post the appointment availability - DONE by the admin
exports.appointmentPost = async (req, res) => {
    const userType = req.session.user.userType;
    const { date, slots } = req.body;

    if (!date || !slots) {
        return res.status(400).send('Date and slots are required');
    }

    const slotsArray = slots.split(',');

    try {
        console.log(slotsArray);

        for (const time of slotsArray) {
            const existingAppointment = await Appointment.findOne({ date, time });
            console.log(existingAppointment);
            if (existingAppointment) {
                return res.render('appointment', { title: 'Appointment', message: `Slot ${time} is already taken!`, loggedIn: true, userType });
            }

            const appointment = new Appointment({ date, time });
            await appointment.save();
        }

        return res.render('appointment', { title: 'Appointment', message: `Slot ${slotsArray} has been saved!`, loggedIn: true, userType });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};



// Add this function to handle booking an appointment
exports.bookAppointment = async (req, res) => {
    const username = req.session.user.username;
    const selectedSlot = req.body.selectedSlot;

    if (!selectedSlot) {
        return res.render('g2', { title: 'G2 Page', message: 'No slot selected', user: req.session.user, userType: req.session.user.userType, loggedIn: true });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find the selected appointment slot
        const appointment = await Appointment.findOne({ time: selectedSlot });

        if (!appointment) {
            return res.status(404).send('Appointment slot not found');
        }

        // Update the user's appointment
        user.appointment = appointment._id;
        await user.save();

        res.render('g2', { title: 'G2 Page', user, message: 'Appointment booked successfully!', userType: req.session.user.userType, loggedIn: true, slots: [], selectedDate: req.query.appointmentDate });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};


