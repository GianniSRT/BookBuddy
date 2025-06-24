const express = require('express');
const Book = require('../models/Book');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ton_secret_jwt_ici'; // Remplace avec ta vraie clé

// Middleware d'authentification JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// [GET] Tous les livres ou filtrés (uniquement de l'utilisateur connecté)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, favorite, author, category, title } = req.query;
    let filter = { userId: req.user.id };

    if (status) filter.status = status;
    if (favorite === 'true') filter.favorite = true;
    if (author) filter.author = new RegExp(author, 'i'); // recherche insensible à la casse
    if (category) filter.category = category;
    if (title) filter.title = new RegExp(title, 'i');

    const books = await Book.find(filter);
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// [POST] Ajouter un livre
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newBook = new Book({
      ...req.body,
      userId: req.user.id,
      lastPageRead: 0,
      favorite: false,
    });
    await newBook.save();
    res.status(201).json({ message: 'Livre ajouté', book: newBook });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [PUT] Modifier un livre (ex: titre, auteur, catégorie, etc.)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [PUT] Modifier progression (dernière page lue)
router.put('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { lastPageRead } = req.body;
    if (typeof lastPageRead !== 'number' || lastPageRead < 0)
      return res.status(400).json({ error: 'Page invalide' });

    const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    if (lastPageRead > book.pages)
      return res.status(400).json({ error: "La dernière page lue ne peut pas dépasser le nombre total de pages." });

    book.lastPageRead = lastPageRead;
    await book.save();
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [PUT] Modifier l'état de lecture (ex: à lire, en cours, terminé)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['à lire', 'en cours de lecture', 'terminé'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Statut invalide' });

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [POST] Ajouter un livre aux favoris
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    book.favorite = true;
    await book.save();
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [DELETE] Retirer un livre des favoris
router.delete('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    book.favorite = false;
    await book.save();
    res.json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [DELETE] Supprimer un livre
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json({ message: 'Livre supprimé' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
