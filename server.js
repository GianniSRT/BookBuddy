const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const booksRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rewardsRoutes = require('./routes/rewards');

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = 'mongodb://127.0.0.1:27017/bookbuddy';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connecté'))
  .catch((err) => console.error('Erreur MongoDB :', err));

app.use('/books', booksRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/rewards', rewardsRoutes);

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
