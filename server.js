const express = require('express');
const cors = require('cors');

async function main() {
  const PORT = 8080;
  const app = express();
  let origin = `http://localhost:${PORT}`;
  if (process.env.NODE_ENV === 'production') {
    origin = 'https://jonathanlee.io';
  }
  if (process.env.NODE_ENV === 'staging') {
    origin = 'https://staging.jonathanlee.io';
  }
  app.use(cors({ credentials: true, optionsSuccessStatus: 200, origin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const MongoClient = require('mongodb').MongoClient;
  const client = new MongoClient(process.env.DATABASE_URL);

  console.log(
    `Attempting to connect to database at: ${process.env.DATABASE_URL}`
  );

  await client.connect();
  const databaseCollection = client.db('jonathanlee_io').collection('contacts');
  app.listen(PORT, () => {
    console.log(`Running on http://jonathanlee.io:${PORT}`);
  });

  const Contact = require('./Contact.js');

  app.get('/', (req, res) => {
    // k8s health check
    res.status(200).send();
  });

  app.post('/submit_contact', (req, res) => {
    const { firstname, surname, email, phone, message } = req.body;

    const contact = new Contact(firstname, surname, email, phone, message);
    databaseCollection.insertOne(contact).catch((err) => {
      console.error(err);
    });

    console.log(`Saved to database: ${new Date()}`);

    const subjectString = `Contact ${email} Submitted on jonathanlee.io`;
    const textString = `First Name: ${firstname}\nSurname: ${surname}\nE-mail: ${email}\nPhone: ${phone}\nMessage: ${message}`;

    const mailOptions = {
      from: `${process.env.NODE_ENV} <${process.env.EMAIL_USER}>`,
      to: process.env.TARGET_EMAIL,
      subject: subjectString,
      text: textString,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.error(err);
      } else {
        console.log(
          `E-mail sent to ${process.env.TARGET_EMAIL}: ${info.response}`
        );
      }
    });
    res.redirect(
      process.env.NODE_ENV === 'production'
        ? 'https://jonathanlee.io'
        : 'https://staging.jonathanlee.io'
    );
  });
}

main()
  .then((_) => {})
  .catch((err) => {
    throw err;
  });
