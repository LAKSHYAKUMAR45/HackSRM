const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');
const connectDB = require('./server/utils/database');
const authRoutes = require('./server/routes/auth');
const Conversation = require('./server/models/Conversation');
const { Configuration, OpenAIApi } = require("openai");

// Connect to the database
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', authRoutes);

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  // Send the dashboard.html file as the response
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Settings
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Conversation History
app.get('/conversation_history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'conversation-history.html'));
});

// GPT-3 API Endpoint
app.post('/gpt-3', async (req, res) => {
  const configuration = new Configuration({
    apiKey: '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',
  });
  const openai = new OpenAIApi(configuration);

  try {
    const { text } = req.body;

    // Call GPT-3 API to generate a response
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: text,
      temperature: 0,
      max_tokens: 100,
    });

    // Extract the generated response
    const generatedResponse = response.data.choices[0].text.trim();

    // Send the generated response back to the client
    res.json({ response: generatedResponse });
  } catch (error) {
    console.error('Error during GPT-3 API call:', error);
    res.status(500).json({ message: 'An error occurred during GPT-3 API call' });
  }
});

// GET conversation history
router.get('/', async (req, res) => {
  try {
    // Retrieve all conversations from the database
    const conversations = await Conversation.find();

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ message: 'An error occurred while fetching conversation history' });
  }
});

app.post('/conversation', (req, res) => {
  const { question, response } = req.body;
  const conversation = new Conversation({ question, response });

  conversation.save()
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.error('Error saving conversation:', error);
      res.sendStatus(500);
    });
});

// Retrieve conversation history from the database
app.get('/conversation', (req, res) => {
  Conversation.find()
    .sort({ timestamp: -1 })
    .then((conversations) => {
      res.json(conversations);
    })
    .catch((error) => {
      console.error('Error fetching conversation history:', error);
      res.sendStatus(500);
    });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
