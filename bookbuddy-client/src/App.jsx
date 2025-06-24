import React, { useEffect, useState } from 'react';
import './app.css';

const API = 'http://localhost:5000/books';

function BookComponent({ book, onDelete, onToggleFav, onUpdateStatus, onUpdateProgress }) {
  const [showDetails, setShowDetails] = useState(false);
  const [lastPageRead, setLastPageRead] = useState(book.lastPageRead || 0);

  const progressPercent = Math.round((lastPageRead / book.pages) * 100);

  const updateProgress = async () => {
    if (lastPageRead > book.pages) {
      alert('La dernière page lue ne peut pas dépasser le nombre total de pages.');
      return;
    }
    await onUpdateProgress(book._id, lastPageRead);
  };

  // Définir classe status pour badge couleur
  const statusClass = {
    'à lire': 'status-toread',
    'en cours': 'status-reading',
    'terminé': 'status-finished',
  }[book.status] || 'status-toread';

  return (
    <div className="book-card">
      <div className="book-info" onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <span className={`book-status ${statusClass}`}>{book.status}</span>{' '}
        {book.favorite ? '💖' : ''}
      </div>

      {showDetails && (
        <div style={{ marginTop: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 }}>
          <p><b>Pages :</b> {book.pages}</p>
          <p><b>Catégorie :</b> {book.category || 'Non spécifiée'}</p>
          <p><b>Dernière page lue :</b> {lastPageRead}</p>
          <p>
            <b>Progression :</b>
            <progress value={lastPageRead} max={book.pages} style={{ width: '100%' }} />
            {` ${progressPercent}%`}
          </p>

          <div>
            <label>Modifier état lecture: </label>
            <select
              value={book.status}
              onChange={(e) => onUpdateStatus(book._id, e.target.value)}
            >
              <option value="à lire">À lire</option>
              <option value="en cours">En cours</option>
              <option value="terminé">Terminé</option>
            </select>
          </div>

          {book.status === 'en cours' && (
            <div style={{ marginTop: 10 }}>
              <label>Mettre à jour dernière page lue : </label>
              <input
                type="number"
                min="0"
                max={book.pages}
                value={lastPageRead}
                onChange={(e) => setLastPageRead(Number(e.target.value))}
              />
              <button onClick={updateProgress}>Valider</button>
            </div>
          )}

          <button onClick={() => onToggleFav(book._id)} style={{ marginTop: 10 }}>
            {book.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>

          <button onClick={() => onDelete(book._id)} style={{ marginLeft: 10, marginTop: 10, backgroundColor: '#ef4444' }}>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    pages: '',
    category: '',
    status: 'à lire',
    lastPageRead: 0,
  });
  const [filter, setFilter] = useState({ status: '', favoriteOnly: false });
  const [showFavPage, setShowFavPage] = useState(false);

  const fetchBooks = async () => {
    let url = API;
    const params = [];
    if (filter.status) params.push(`status=${encodeURIComponent(filter.status)}`);
    if (filter.favoriteOnly) params.push('favorite=true');
    if (params.length > 0) url += '?' + params.join('&');

    const res = await fetch(url);
    const data = await res.json();
    setBooks(data);
  };

  useEffect(() => {
    fetchBooks();
  }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.pages) {
      alert('Titre, auteur et nombre de pages sont obligatoires.');
      return;
    }
    if (isNaN(form.pages) || form.pages <= 0) {
      alert('Le nombre de pages doit être un nombre positif.');
      return;
    }
    const newBook = {
      title: form.title,
      author: form.author,
      pages: Number(form.pages),
      category: form.category,
      status: form.status,
      lastPageRead: 0,
      favorite: false,
    };
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook),
    });
    setForm({ title: '', author: '', pages: '', category: '', status: 'à lire', lastPageRead: 0 });
    fetchBooks();
  };

  const deleteBook = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchBooks();
  };

  const toggleFavorite = async (id) => {
    const book = books.find((b) => b._id === id);
    if (!book) return;
    if (book.favorite) {
      await fetch(`${API}/${id}/favorite`, { method: 'DELETE' });
    } else {
      await fetch(`${API}/${id}/favorite`, { method: 'POST' });
    }
    fetchBooks();
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchBooks();
  };

  const updateProgress = async (id, lastPageRead) => {
    await fetch(`${API}/${id}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastPageRead }),
    });
    fetchBooks();
  };

  const toggleFavPage = () => {
    setShowFavPage(!showFavPage);
    setFilter({ status: '', favoriteOnly: false });
  };

  return (
    <div className="app-container">
      <header>
        <h1>📚 BookBuddy</h1>
      </header>

      <button onClick={toggleFavPage} style={{ marginBottom: 20 }}>
        {showFavPage ? 'Retour à la collection' : 'Voir mes favoris'}
      </button>

      {!showFavPage && (
        <>
          <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <input
              className="input"
              placeholder="Titre"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Auteur"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
            <input
              className="input"
              type="number"
              placeholder="Nombre de pages"
              value={form.pages}
              onChange={(e) => setForm({ ...form, pages: e.target.value })}
              required
              min="1"
            />
            <input
              className="input"
              placeholder="Catégorie"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              required
            >
              <option value="à lire">À lire</option>
              <option value="en cours">En cours</option>
              <option value="terminé">Terminé</option>
            </select>
            <button type="submit" style={{ marginLeft: 10 }}>
              Ajouter un livre
            </button>
          </form>

          <div style={{ marginBottom: 20 }}>
            <label>
              Filtrer par statut:{' '}
              <select
                className="input"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">Tous</option>
                <option value="à lire">À lire</option>
                <option value="en cours">En cours</option>
                <option value="terminé">Terminé</option>
              </select>
            </label>

            <label style={{ marginLeft: 20 }}>
              <input
                type="checkbox"
                checked={filter.favoriteOnly}
                onChange={(e) => setFilter({ ...filter, favoriteOnly: e.target.checked })}
              />{' '}
              Favoris uniquement
            </label>
          </div>
        </>
      )}

      <div className="book-list">
        {(showFavPage ? books.filter((b) => b.favorite) : books).map((book) => (
          <BookComponent
            key={book._id}
            book={book}
            onDelete={deleteBook}
            onToggleFav={toggleFavorite}
            onUpdateStatus={updateStatus}
            onUpdateProgress={updateProgress}
          />
        ))}
      </div>
    </div>
  );
}
