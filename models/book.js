const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  pages: { type: Number, required: true, min: 1 },
  category: { type: String },
  status: { type: String, enum: ['à lire', 'en cours de lecture', 'terminé'], default: 'à lire' },
  favorite: { type: Boolean, default: false },
  lastPageRead: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
