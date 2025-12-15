/* eslint-disable */
const mongoose = require('mongoose');

const uri = "mongodb+srv://TeoriaDeSistemas:Uade2025@roscotds.opcgiry.mongodb.net/?appName=RoscoTDS";
console.log('Testing connection...');

mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
