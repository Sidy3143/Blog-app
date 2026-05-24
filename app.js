// app.js 
require('dotenv').config();

const express = require('express');
const prisma = require('./lib/prisma.js');
const passport = require('./config/passport.js');
const bcrypt = require('bcryptjs');
const cors = require("cors");

const router = require('./routes/userRouter');

const app = express();

app.use(passport.initialize());
app.use(express.json());       
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(cors({origin: "http://localhost:5173"})); // allow requests from the frontend running on port 5173

app.use('/blog', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

