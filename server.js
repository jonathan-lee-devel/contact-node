const express = require('express');
const app = express();
app.use(express.urlencoded());
const PORT = 8080;

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	}
});

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(
	process.env.DATABASE_URL,
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

let collection;
client.connect(err => {
	if (err) {
		console.error(err);
	}
	collection = client.db('jonathanlee_io').collection('contacts');

	app.listen(PORT, () => {
		console.log(`Running on http://jonathanlee.io:${PORT}`);
	});
});

const Contact = require('./Contact.js');
app.post('/submit_contact', (req, res) => {
	const { firstname, surname, email, phone, message } = req.body;

	const contact = new Contact(firstname, surname, email, phone, message);
	try {
		collection.insertOne(contact);
	} catch (err) {
		console.error(err);
	}

	console.log(`Saved to database: ${new Date()}`);

	const subjectString = `Contact ${email} Submitted on jonathanlee.io`;
	const textString = `First Name: ${firstname}\nSurname: ${surname}\nE-mail: ${email}\nPhone: ${phone}\nMessage: ${message}`;

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: process.env.TARGET_EMAIL,
		subject: subjectString,
		text: textString
	};

	transporter.sendMail(mailOptions, function(err, info){
		if(err) {
			console.error(err);
		} else {
			console.log(`E-mail sent: ${info.response}`);
		}
	});
	res.end();
});
