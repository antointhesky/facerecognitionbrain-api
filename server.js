import express from 'express';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';
import axios from 'axios';

const db = knex({
  client: 'pg',
  connection: {
      host: '127.0.0.1',
      user: 'antonellafittipaldi',
      password: '',
      database: 'smart-brain'
  }
});

// Clarifai configuration using your PAT and model details
const PAT = '3c20b1388a6a48f89c0a057d7017522f';
const USER_ID = 'clarifai';
const APP_ID = 'main';
const MODEL_ID = 'face-detection';
const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';

const app = express();
app.use(cors());
app.use(express.json());

// SIGNIN endpoint
app.post('/signin', (req, res) => {
  db.select('email', 'hash')
    .from('login')
    .where('email', '=', req.body.email)
    .then(data => {
       const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
       if (isValid) {
         return db.select('*')
           .from('users')
           .where('email', '=', req.body.email)
           .then(user => res.json(user[0]))
           .catch(err => res.status(400).json('unable to get user'));
       } else {
         res.status(400).json('wrong credentials');
       }
    })
    .catch(err => res.status(400).json('wrong credentials'));
});

// REGISTER endpoint
app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
        .returning('*')
        .insert({
          email: loginEmail[0].email,
          name: name,
          joined: new Date()
        })
        .then(user => res.json(user[0]));
    })
    .then(trx.commit)
    .catch(trx.rollback);
  })
  .catch(err => res.status(400).json('unable to register'));
});

// PROFILE endpoint
app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*')
    .from('users')
    .where({ id })
    .then(user => {
      if (user.length) res.json(user[0]);
      else res.status(400).json('Not found');
    })
    .catch(err => res.status(400).json('error getting user'));
});

// IMAGE endpoint to update entries count
app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users')
    .where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => res.json(entries[0].entries))
    .catch(err => res.status(400).json('unable to get entries'));
});

// IMAGEURL endpoint to proxy Clarifai API call using PAT and model version
app.post('/imageurl', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json("No image URL provided");
  
  const raw = JSON.stringify({
    "user_app_id": {
      "user_id": USER_ID,
      "app_id": APP_ID
    },
    "inputs": [
      {
        "data": {
          "image": {
            "url": imageUrl
          }
        }
      }
    ]
  });
  
  try {
    const response = await axios.post(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
      raw,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Key ' + PAT
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error calling Clarifai API:", err.response?.data || err.message);
    res.status(400).json("Unable to work with API");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
