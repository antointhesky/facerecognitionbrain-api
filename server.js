import express from 'express';
import cors from 'cors';
import knex from 'knex';
import bcrypt from 'bcrypt-nodejs';

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'aneagoie',
    password: '',
    database: 'smart-brain'
  }
});

const app = express();

app.use(cors());
app.use(express.json());

app.post('/signin', async (req, res) => {
  try {
    const data = await db.select('email', 'hash')
      .from('login')
      .where('email', '=', req.body.email);
    
    if (data.length && bcrypt.compareSync(req.body.password, data[0].hash)) {
      const user = await db.select('*')
        .from('users')
        .where('email', '=', req.body.email);
      return res.json(user[0]);
    }
    
    res.status(400).json('wrong credentials');
  } catch (error) {
    res.status(400).json('wrong credentials');
  }
});

app.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  
  try {
    await db.transaction(async trx => {
      const loginEmail = await trx('login')
        .insert({ hash, email })
        .returning('email');
      
      const user = await trx('users')
        .insert({
          email: loginEmail[0].email,
          name,
          joined: new Date()
        })
        .returning('*');
      
      res.json(user[0]);
    });
  } catch (error) {
    res.status(400).json('unable to register');
  }
});

app.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await db.select('*').from('users').where({ id });
    if (user.length) {
      res.json(user[0]);
    } else {
      res.status(400).json('Not found');
    }
  } catch (error) {
    res.status(400).json('error getting user');
  }
});

app.put('/image', async (req, res) => {
  const { id } = req.body;
  
  try {
    const entries = await db('users')
      .where('id', '=', id)
      .increment('entries', 1)
      .returning('entries');
    
    res.json(entries[0].entries);
  } catch (error) {
    res.status(400).json('unable to get entries');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
