const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = 'mongodb://127.0.0.1:27017/bookbuddy';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schéma Livre
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  pages: Number,
  category: String,
  status: { type: String, enum: ['à lire', 'en cours', 'terminé'], default: 'à lire' },
  lastPageRead: { type: Number, default: 0 },
  favorite: { type: Boolean, default: false },
});
const Book = mongoose.model('Book', bookSchema);

// Routes livres

// Ajouter un livre
app.post('/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Récupérer tous les livres avec filtres optionnels
app.get('/books', async (req, res) => {
  const { status, favorite } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (favorite === 'true') filter.favorite = true;

  try {
    const books = await Book.find(filter);
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Récupérer un livre par id
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json(book);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Modifier un livre (statut, etc.)
app.put('/books/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Modifier progression (dernière page lue)
app.put('/books/:id/progress', async (req, res) => {
  const { lastPageRead } = req.body;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    if (lastPageRead > book.pages) {
      return res.status(400).json({ error: "La dernière page lue ne peut pas dépasser le nombre total de pages." });
    }
    book.lastPageRead = lastPageRead;
    await book.save();
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Ajouter un livre aux favoris
app.post('/books/:id/favorite', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    book.favorite = true;
    await book.save();
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Retirer un livre des favoris
app.delete('/books/:id/favorite', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    book.favorite = false;
    await book.save();
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Supprimer un livre
app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json({ message: 'Livre supprimé' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ton_secret_jwt_ici'; // À remplacer par une vraie clé secrète et stocker en variable d'environnement

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});
const User = mongoose.model('User', userSchema);

// Route inscription
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé' });
  } catch (e) {
    res.status(400).json({ error: 'Nom d’utilisateur déjà pris' });
  }
});

// Route login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ error: 'Mot de passe incorrect' });

  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user; // stocke user dans la requête
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}
