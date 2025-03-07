const express = require('express');
const bodyParser = require('body-parser');
const { parseISO, isWithinInterval } = require('date-fns');
const user = require('./models/user'); // Adjust the path as needed


const app = express();
const PORT = 3000;

app.use(bodyParser.json());


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});