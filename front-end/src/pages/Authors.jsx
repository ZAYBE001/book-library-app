import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Plus, User, Mail, Calendar, BookOpen } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: Yup.string()
    .email('Invalid email format')
    .nullable()
    .notRequired(),
  birth_year: Yup.number()
    .typeError('Birth year must be a number')
    .min(1000, 'Birth year must be at least 1000')
    .max(new Date().getFullYear(), 'Birth year cannot be in the future')
    .nullable()
    .notRequired()
});

function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors');
      const data = await response.json();
      setAuthors(data);
    } catch (error) {
      console.error('Error fetching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      const response = await fetch('/api/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const newAuthor = await response.json();
        setAuthors(prev => [...prev, newAuthor]);
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        setFieldError('general', errorData.error || 'Failed to create author');
      }
    } catch {
      setFieldError('general', 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mt-5">
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-6">Authors</h1>
          <p className="text-muted">Manage your book authors</p>
        </div>
        <div className="col text-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <Plus className="me-2" />
            Add Author
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="card-title">Add New Author</h2>
            <Formik
              initialValues={{
                name: '',
                email: '',
                birth_year: ''
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  {errors.general && (
                    <div className="alert alert-danger" role="alert">
                      {errors.general}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label">Name *</label>
                      <Field
                        name="name"
                        type="text"
                        className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`}
                        placeholder="Author name"
                      />
                      <ErrorMessage name="name" component="div" className="invalid-feedback" />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">Email</label>
                      <Field
                        name="email"
                        type="email"
                        className={`form-control ${errors.email && touched.email ? 'is-invalid' : ''}`}
                        placeholder="author@example.com"
                      />
                      <ErrorMessage name="email" component="div" className="invalid-feedback" />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="birth_year" className="form-label">Birth Year</label>
                      <Field
                        name="birth_year"
                        type="number"
                        className={`form-control ${errors.birth_year && touched.birth_year ? 'is-invalid' : ''}`}
                        placeholder="1970"
                      />
                      <ErrorMessage name="birth_year" component="div" className="invalid-feedback" />
                    </div>
                  </div>

                  <div className="text-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn btn-secondary me-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Author'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {authors.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <User className="mx-auto" size={48} />
          </div>
          <h3 className="h5 mb-3">No authors found</h3>
          <p className="text-muted mb-4">Get started by adding your first author!</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus className="me-2" />
            Add Author
          </button>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {authors.map((author) => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuthorCard({ author }) {
  
  // const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random`;
  const randomId = author.id % 100; // keep ID within 0-99
  const gender = randomId % 2 === 0 ? 'men' : 'women';
  const avatarUrl = `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;


  return (
    <div className="col">
      <div className="card h-100 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="flex-shrink-0">
              <img
                src={avatarUrl}
                alt={author.name}
                className="rounded-circle"
                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
              />
            </div>
            <div className="flex-grow-1 ms-3">
              <h5 className="card-title mb-1">{author.name}</h5>
              <div className="d-flex align-items-center text-muted">
                <BookOpen className="me-2" size={16} />
                <span>{author.book_count} books</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center">
            {author.email && (
              <div className="d-flex align-items-center text-muted me-3">
                <Mail className="me-2" size={16} />
                <span>{author.email}</span>
              </div>
            )}
            {author.birth_year && (
              <div className="d-flex align-items-center text-muted">
                <Calendar className="me-2" size={16} />
                <span>Born {author.birth_year}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default Authors;