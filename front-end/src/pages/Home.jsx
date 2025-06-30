import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Clock, User, BookOpen } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBooks(prev => prev.filter(book => book.id !== id));
      } else {
        alert('Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mt-5">
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">
            Book Library
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/add-book">
                  <Plus className="me-2" /> Add Book
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="mb-4">
        <div className="input-group">
          <Search className="input-group-text" />
          <input
            type="text"
            className="form-control"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <BookOpen className="mx-auto" size={48} />
          </div>
          <h3 className="h5 mb-3">No books found</h3>
          <p className="text-muted mb-4">Get started by adding your first book!</p>
          <Link className="btn btn-primary" to="/add-book">
            <Plus className="me-2" /> Add Book
          </Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDeleteBook} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookCard({ book, onDelete }) {
  return (
    <div className="col">
      <div className="card h-100 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">{book.title}</h5>
          <p className="card-text text-muted">
            <User className="me-2" /> {book.author_name}
          </p>
          {book.description && (
            <p className="card-text">{book.description}</p>
          )}
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {book.publication_year && (
                <div className="me-3">
                  <Clock className="me-2" /> {book.publication_year}
                </div>
              )}
              {book.pages && (
                <div>
                  <span className="me-2">{book.pages} pages</span>
                </div>
              )}
            </div>
            <div className="btn-group">
              <Link
                to={`/edit-book/${book.id}`}
                className="btn btn-outline-primary"
              >
                <Edit2 className="me-2" /> Edit
              </Link>
              <button
                onClick={() => onDelete(book.id)}
                className="btn btn-outline-danger"
              >
                <Trash2 className="me-2" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;