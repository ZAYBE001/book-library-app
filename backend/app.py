from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime
import re

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///library.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Models
class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    birth_year = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # One-to-many relationship
    books = db.relationship('Book', backref='author', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'birth_year': self.birth_year,
            'created_at': self.created_at.isoformat(),
            'book_count': len(self.books)
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    isbn = db.Column(db.String(20), nullable=True)
    publication_year = db.Column(db.Integer, nullable=True)
    pages = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign key for one-to-many relationship
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'isbn': self.isbn,
            'publication_year': self.publication_year,
            'pages': self.pages,
            'description': self.description,
            'author_id': self.author_id,
            'author_name': self.author.name if self.author else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'categories': [bc.to_dict() for bc in self.book_categories]
        }

# Many-to-many association table with additional attribute
class BookCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    
    # Additional user-submittable attribute
    priority = db.Column(db.Integer, nullable=False, default=1)  # 1-5 priority rating
    notes = db.Column(db.String(200), nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    book = db.relationship('Book', backref='book_categories')
    category = db.relationship('Category', backref='category_books')
    
    # Ensure unique book-category combinations
    __table_args__ = (db.UniqueConstraint('book_id', 'category_id'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'priority': self.priority,
            'notes': self.notes,
            'assigned_at': self.assigned_at.isoformat()
        }

# Routes

# Authors - Create and Read
@app.route('/api/authors', methods=['GET'])
def get_authors():
    authors = Author.query.all()
    return jsonify([author.to_dict() for author in authors])

@app.route('/api/authors', methods=['POST'])
def create_author():
    data = request.get_json()
    
    # Server-side validation
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    if data.get('email'):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
    
    if data.get('birth_year'):
        try:
            birth_year = int(data['birth_year'])
            if birth_year < 1000 or birth_year > datetime.now().year:
                return jsonify({'error': 'Invalid birth year'}), 400
        except ValueError:
            return jsonify({'error': 'Birth year must be a number'}), 400
    
    author = Author(
        name=data['name'],
        email=data.get('email'),
        birth_year=data.get('birth_year')
    )
    
    try:
        db.session.add(author)
        db.session.commit()
        return jsonify(author.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create author'}), 500

# Categories - Create and Read
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([category.to_dict() for category in categories])

@app.route('/api/categories', methods=['POST'])
def create_category():
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    category = Category(
        name=data['name'],
        description=data.get('description')
    )
    
    try:
        db.session.add(category)
        db.session.commit()
        return jsonify(category.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Category name must be unique'}), 400

# Books - Full CRUD
@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([book.to_dict() for book in books])

@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify(book.to_dict())

@app.route('/api/books', methods=['POST'])
def create_book():
    data = request.get_json()
    
    # Server-side validation
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not data.get('author_id'):
        return jsonify({'error': 'Author is required'}), 400
    
    # Validate author exists
    author = Author.query.get(data['author_id'])
    if not author:
        return jsonify({'error': 'Author not found'}), 400
    
    # Validate ISBN format if provided
    if data.get('isbn'):
        isbn_pattern = r'^[\d-]{10,17}$'
        if not re.match(isbn_pattern, data['isbn']):
            return jsonify({'error': 'Invalid ISBN format'}), 400
    
    # Validate numeric fields
    if data.get('publication_year'):
        try:
            year = int(data['publication_year'])
            if year < 1000 or year > datetime.now().year:
                return jsonify({'error': 'Invalid publication year'}), 400
        except ValueError:
            return jsonify({'error': 'Publication year must be a number'}), 400
    
    if data.get('pages'):
        try:
            pages = int(data['pages'])
            if pages < 1 or pages > 10000:
                return jsonify({'error': 'Pages must be between 1 and 10000'}), 400
        except ValueError:
            return jsonify({'error': 'Pages must be a number'}), 400
    
    book = Book(
        title=data['title'],
        isbn=data.get('isbn'),
        publication_year=data.get('publication_year'),
        pages=data.get('pages'),
        description=data.get('description'),
        author_id=data['author_id']
    )
    
    try:
        db.session.add(book)
        db.session.commit()
        
        # Add categories if provided
        if data.get('categories'):
            for cat_data in data['categories']:
                book_category = BookCategory(
                    book_id=book.id,
                    category_id=cat_data['category_id'],
                    priority=cat_data.get('priority', 1),
                    notes=cat_data.get('notes')
                )
                db.session.add(book_category)
            db.session.commit()
        
        return jsonify(book.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create book'}), 500

@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    
    # Server-side validation (same as create)
    if data.get('title'):
        book.title = data['title']
    if data.get('isbn'):
        isbn_pattern = r'^[\d-]{10,17}$'
        if not re.match(isbn_pattern, data['isbn']):
            return jsonify({'error': 'Invalid ISBN format'}), 400
        book.isbn = data['isbn']
    if data.get('publication_year'):
        try:
            year = int(data['publication_year'])
            if year < 1000 or year > datetime.now().year:
                return jsonify({'error': 'Invalid publication year'}), 400
            book.publication_year = year
        except ValueError:
            return jsonify({'error': 'Publication year must be a number'}), 400
    if data.get('pages'):
        try:
            pages = int(data['pages'])
            if pages < 1 or pages > 10000:
                return jsonify({'error': 'Pages must be between 1 and 10000'}), 400
            book.pages = pages
        except ValueError:
            return jsonify({'error': 'Pages must be a number'}), 400
    if data.get('description'):
        book.description = data['description']
    if data.get('author_id'):
        author = Author.query.get(data['author_id'])
        if not author:
            return jsonify({'error': 'Author not found'}), 400
        book.author_id = data['author_id']
    
    book.updated_at = datetime.utcnow()
    
    # Update categories
    if 'categories' in data:
        # Remove existing categories
        BookCategory.query.filter_by(book_id=book.id).delete()
        
        # Add new categories
        for cat_data in data['categories']:
            book_category = BookCategory(
                book_id=book.id,
                category_id=cat_data['category_id'],
                priority=cat_data.get('priority', 1),
                notes=cat_data.get('notes')
            )
            db.session.add(book_category)
    
    try:
        db.session.commit()
        return jsonify(book.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update book'}), 500

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    
    try:
        # Delete associated book categories first
        BookCategory.query.filter_by(book_id=book.id).delete()
        db.session.delete(book)
        db.session.commit()
        return jsonify({'message': 'Book deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete book'}), 500

# Initialize database
# Removed @app.before_first_request due to compatibility issue.
def create_tables():
    db.create_all()
    
    # Add sample data if tables are empty
    if Author.query.count() == 0:
        # Sample authors
        authors = [
            Author(name="Jane Austen", email="jane@example.com", birth_year=1775),
            Author(name="George Orwell", email="george@example.com", birth_year=1903),
            Author(name="J.K. Rowling", email="jk@example.com", birth_year=1965)
        ]
        
        # Sample categories
        categories = [
            Category(name="Fiction", description="Fictional works and novels"),
            Category(name="Classic", description="Classic literature"),
            Category(name="Fantasy", description="Fantasy and magical stories"),
            Category(name="Dystopian", description="Dystopian and futuristic themes")
        ]
        
        for author in authors:
            db.session.add(author)
        for category in categories:
            db.session.add(category)
        
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        create_tables()
    app.run(debug=True)