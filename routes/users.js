const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ton_secret_jwt_ici';

// Middleware d'authentification
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

// [GET] Profil utilisateur
router.get('/:id', authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Accès refusé' });
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [PUT] Modifier profil (email ou mot de passe)
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Accès refusé' });
  try {
    const update = {};
    if (req.body.username) update.username = req.body.username;
    if (req.body.password) update.password = await bcrypt.hash(req.body.password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;