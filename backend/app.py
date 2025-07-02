from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import json
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret')
app.config['UPLOAD_FOLDER'] = 'static/uploads'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

db = SQLAlchemy(app)
CORS(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {'id': self.id, 'username': self.username}

class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    birth_year = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
    cover_image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author_id = db.Column(db.Integer, db.ForeignKey('author.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'isbn': self.isbn,
            'publication_year': self.publication_year,
            'pages': self.pages,
            'description': self.description,
            'cover_image': self.cover_image,
            'author_id': self.author_id,
            'author_name': self.author.name if self.author else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'categories': [bc.to_dict() for bc in self.book_categories]
        }

class BookCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    priority = db.Column(db.Integer, nullable=False, default=1)
    notes = db.Column(db.String(200), nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    book = db.relationship('Book', backref='book_categories')
    category = db.relationship('Category', backref='category_books')

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

# Auth Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409

    hashed_pw = generate_password_hash(data['password'])
    user = User(username=data['username'], password_hash=hashed_pw)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    if not user or not user.check_password(data.get('password')):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token, 'user': user.to_dict()})

# Public Routes
@app.route('/api/authors', methods=['GET'])
def get_authors():
    authors = Author.query.all()
    return jsonify([author.to_dict() for author in authors])

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([category.to_dict() for category in categories])

@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([book.to_dict() for book in books])

@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify(book.to_dict())

# Protected Routes
@app.route('/api/books', methods=['POST'])
@jwt_required()
def create_book():
    if 'cover_image' in request.files:
        file = request.files['cover_image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        else:
            return jsonify({'error': 'Invalid image format'}), 400
    else:
        filename = None

    title = request.form.get('title')
    author_id = request.form.get('author_id')
    if not title or not author_id:
        return jsonify({'error': 'Title and Author are required'}), 400

    author = Author.query.get(author_id)
    if not author:
        return jsonify({'error': 'Author not found'}), 400

    book = Book(
        title=title,
        isbn=request.form.get('isbn'),
        publication_year=request.form.get('publication_year'),
        pages=request.form.get('pages'),
        description=request.form.get('description'),
        author_id=author_id,
        cover_image=filename
    )
    db.session.add(book)
    db.session.commit()

    categories = request.form.get('categories')
    if categories:
        try:
            categories_data = json.loads(categories)
            for cat_data in categories_data:
                db.session.add(BookCategory(
                    book_id=book.id,
                    category_id=cat_data['category_id'],
                    priority=cat_data.get('priority', 1),
                    notes=cat_data.get('notes')
                ))
        except Exception:
            return jsonify({'error': 'Invalid categories format'}), 400

    db.session.commit()
    return jsonify(book.to_dict()), 201

@app.route('/api/books/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json()

    if data.get('title'):
        book.title = data['title']
    if data.get('isbn'):
        book.isbn = data['isbn']
    if data.get('publication_year'):
        book.publication_year = data['publication_year']
    if data.get('pages'):
        book.pages = data['pages']
    if data.get('description'):
        book.description = data['description']
    if data.get('author_id'):
        book.author_id = data['author_id']

    if 'categories' in data:
        BookCategory.query.filter_by(book_id=book.id).delete()
        for cat_data in data['categories']:
            db.session.add(BookCategory(
                book_id=book.id,
                category_id=cat_data['category_id'],
                priority=cat_data.get('priority', 1),
                notes=cat_data.get('notes')
            ))

    db.session.commit()
    return jsonify(book.to_dict())

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
@jwt_required()
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    BookCategory.query.filter_by(book_id=book.id).delete()
    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'Book deleted successfully'})

def create_tables():
    db.create_all()
    if User.query.count() == 0:
        db.session.add(User(username='admin', password_hash=generate_password_hash('admin123')))
    if Author.query.count() == 0:
        authors = [
            Author(name="Jane Austen", email="jane@example.com", birth_year=1775),
            Author(name="George Orwell", email="george@example.com", birth_year=1903),
            Author(name="J.K. Rowling", email="jk@example.com", birth_year=1965)
        ]
        categories = [
            Category(name="Fiction", description="Fictional works and novels"),
            Category(name="Classic", description="Classic literature"),
            Category(name="Fantasy", description="Fantasy and magical stories"),
            Category(name="Dystopian", description="Dystopian and futuristic themes")
        ]
        db.session.bulk_save_objects(authors + categories)
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        create_tables()
    app.run(debug=True)
