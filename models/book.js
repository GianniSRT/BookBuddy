const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  pages: Number,
  status: { type: String, enum: ['à lire', 'en cours', 'terminé'], default: 'à lire' },
  favorite: { type: Boolean, default: false },
  lastPageRead: { type: Number, default: 0 },
});

module.exports = mongoose.model('Book', bookSchema);
