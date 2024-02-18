const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

mongoose.connect('mongodb://localhost:27017/temperatureDB', { useNewUrlParser: true, useUnifiedTopology: true });

const temperatureSchema = new mongoose.Schema({
  temperature: Number,
  batteryLevel: Number,
  timeStamp: String
});

const Temperature = mongoose.model('Temperature', temperatureSchema);

app.use(bodyParser.json());

// Serve the latest 20 records HTML page
app.get('/latest-20-records', async (req, res) => {
  try {
    const latestRecords = await Temperature.find().sort({ timeStamp: 'desc' }).limit(20);

    // Extract relevant data for simplicity
    const formattedRecords = latestRecords.map(record => ({
      temperature: record.temperature,
      batteryLevel: record.batteryLevel,
      timeStamp: record.timeStamp
    }));

    res.render('latest-20-records', { latestRecords: formattedRecords });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Serve the historical data selection HTML page
app.get('/historical-data', (req, res) => {
  res.sendFile(__dirname + '/historical-data.html');
});

app.post('/api/saveTemperature', async (req, res) => {
  const { temperature, batteryLevel } = req.body;
  const timeStamp = new Date().toLocaleString();

  const newTemperature = new Temperature({ temperature, batteryLevel, timeStamp });
  await newTemperature.save();

  io.emit('newTemperature', newTemperature);

  res.send('Data saved successfully');
});

app.get('/api/fetchHistoricalData', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const historicalData = await Temperature.find({
      timeStamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timeStamp: 'asc' });

    if (historicalData.length === 0) {
      return res.status(404).json({ error: 'No historical data found for the specified date range' });
    }

    res.json(historicalData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve the default page (latest 20 records)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/latest-20-records.html');
});

app.use(express.static(__dirname));

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
































// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/temperatureDB', { useNewUrlParser: true, useUnifiedTopology: true });

// // Create MongoDB Schema
// const temperatureSchema = new mongoose.Schema({
//   temperature: Number,
//   batteryLevel: Number,
//   timeStamp: String
// });

// // Create MongoDB Model
// const Temperature = mongoose.model('Temperature', temperatureSchema);

// // Express Middleware
// app.use(bodyParser.json());

// // API to save random integer values into the database
// app.post('/api/saveTemperature', async (req, res) => {
//   const { temperature, batteryLevel } = req.body;
//   const timeStamp = new Date().toLocaleString();

//   const newTemperature = new Temperature({ temperature, batteryLevel, timeStamp });
//   await newTemperature.save();

//   io.emit('newTemperature', newTemperature); // Emit new data to all connected clients

//   res.send('Data saved successfully');
// });

// // Part 2 - HTML Page to Show Latest 20 Records using Socket.io
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// // Socket.io connection
// io.on('connection', (socket) => {
//   console.log('A user connected');
// });

// // Serve static files
// app.use(express.static(__dirname));

// // Start the server
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });