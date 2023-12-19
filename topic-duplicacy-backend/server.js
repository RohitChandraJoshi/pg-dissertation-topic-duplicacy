const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { compareTwoStrings } = require('string-similarity');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/research_topics', { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('db connected');
}

const researchTopicSchema = new mongoose.Schema({
  topic: String,
  guide: String,
});

const ResearchTopic = mongoose.model('ResearchTopic', researchTopicSchema);

const server = express();

server.use(cors());
server.use(bodyParser.json());


server.get('/get-random-topic', async (req, res) => {
  try {
    const randomTopic = await ResearchTopic.aggregate([{ $sample: { size: 1 } }]);
    res.json({ topic: randomTopic[0].topic });
  } catch (error) {
    console.error('Error fetching random topic:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


server.post('/submit-topic', async (req, res) => {
  const submittedTopic = req.body.topic;
  const selectedGuide = req.body.guide;

  try {
    
    const existingTopics = await ResearchTopic.find({}, 'topic');

    
    let isSimilar = false;
    for (const existingTopic of existingTopics) {
      const similarity = compareTwoStrings(submittedTopic, existingTopic.topic);
      if (similarity >= 0.7) {
        isSimilar = true;
        break;
      }
    }

    if (isSimilar) {
      res.status(400).json({ success: false, message: 'Topic similarity is too high. Please choose a different topic.' });
    } else {
      const newTopic = new ResearchTopic({
        topic: submittedTopic,
        guide: selectedGuide,
      });

      await newTopic.save();
      res.json({ success: true, message: 'Topic submitted successfully' });
    }
  } catch (error) {
    console.error('Error submitting topic:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

server.get('/get-topics', async (req, res) => {
  try {
    const topics = await ResearchTopic.find({}, 'topic');
    res.json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

server.listen(8080, () => {
  console.log('Server started on port 8080');
});
