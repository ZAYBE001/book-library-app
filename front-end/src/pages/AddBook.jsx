import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Plus, Minus, Save, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(1, 'Title must be at least 1 character')
    .max(200, 'Title must be less than 200 characters'),
  isbn: Yup.string()
    .matches(/^[\d-]{10,17}$/, 'ISBN must be 10-17 characters and contain only digits and hyphens')
    .nullable()
    .notRequired(),
  publication_year: Yup.number()
    .typeError('Publication year must be a number')
    .min(1000, 'Publication year must be at least 1000')
    .max(new Date().getFullYear(), `Publication year cannot be in the future`)
    .nullable()
    .notRequired(),
  pages: Yup.number()
    .typeError('Pages must be a number')
    .min(1, 'Pages must be at least 1')
    .max(10000, 'Pages must be less than 10000')
    .nullable()
    .notRequired(),
  description: Yup.string()
    .max(1000, 'Description must be less than 1000 characters')
    .notRequired(),
  author_id: Yup.number()
    .required('Author is required')
    .typeError('Author is required'),
  categories: Yup.array().of(
    Yup.object({
      category_id: Yup.number().required('Category is required'),
      priority: Yup.number()
        .min(1, 'Priority must be between 1 and 5')
        .max(5, 'Priority must be between 1 and 5')
        .required('Priority is required'),
      notes: Yup.string().max(200, 'Notes must be less than 200 characters')
    })
  )
});

function AddBook() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [authorsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/authors'),
        fetch('/api/categories')
      ]);
      
      const authorsData = await authorsResponse.json();
      const categoriesData = await categoriesResponse.json();
      
      setAuthors(authorsData);
      setCategories(categoriesData);
    } catch {
      console.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        navigate('/');
      } else {
        const errorData = await response.json();
        setFieldError('general', errorData.error || 'Failed to create book');
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
          <button
            onClick={() => navigate('/')}
            className="btn btn-link"
          >
            <ArrowLeft className="me-2" />
            Back to Books
          </button>
        </div>
        <div className="col text-center">
          <h1 className="display-6">Add New Book</h1>
          <p className="text-muted">Fill in the details to add a new book to your library</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <Formik
            initialValues={{
              title: '',
              isbn: '',
              publication_year: '',
              pages: '',
              description: '',
              author_id: '',
              categories: []
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting, errors, touched }) => (
              <Form>
                {errors.general && (
                  <div className="alert alert-danger" role="alert">
                    {errors.general}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="title" className="form-label">Title *</label>
                    <Field
                      name="title"
                      type="text"
                      className={`form-control ${errors.title && touched.title ? 'is-invalid' : ''}`}
                      placeholder="Enter book title"
                    />
                    <ErrorMessage name="title" component="div" className="invalid-feedback" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="author_id" className="form-label">Author *</label>
                    <Field
                      as="select"
                      name="author_id"
                      className={`form-select ${errors.author_id && touched.author_id ? 'is-invalid' : ''}`}
                    >
                      <option value="">Select an author</option>
                      {authors.map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="author_id" component="div" className="invalid-feedback" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="isbn" className="form-label">ISBN</label>
                    <Field
                      name="isbn"
                      type="text"
                      className={`form-control ${errors.isbn && touched.isbn ? 'is-invalid' : ''}`}
                      placeholder="978-1-234-56789-7"
                    />
                    <ErrorMessage name="isbn" component="div" className="invalid-feedback" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="publication_year" className="form-label">Publication Year</label>
                    <Field
                      name="publication_year"
                      type="number"
                      className={`form-control ${errors.publication_year && touched.publication_year ? 'is-invalid' : ''}`}
                      placeholder="2023"
                    />
                    <ErrorMessage name="publication_year" component="div" className="invalid-feedback" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="pages" className="form-label">Pages</label>
                    <Field
                      name="pages"
                      type="number"
                      className={`form-control ${errors.pages && touched.pages ? 'is-invalid' : ''}`}
                      placeholder="300"
                    />
                    <ErrorMessage name="pages" component="div" className="invalid-feedback" />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <Field
                    as="textarea"
                    name="description"
                    rows="4"
                    className={`form-control ${errors.description && touched.description ? 'is-invalid' : ''}`}
                    placeholder="Brief description of the book"
                  />
                  <ErrorMessage name="description" component="div" className="invalid-feedback" />
                </div>

                <div className="mb-3">
                  <label className="form-label">Categories</label>
                  <FieldArray name="categories">
                    {({ push, remove }) => (
                      <div>
                        {values.categories.map((category, index) => (
                          <div key={index} className="mb-3">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label htmlFor={`categories.${index}.category_id`} className="form-label">Category</label>
                                <Field
                                  as="select"
                                  name={`categories.${index}.category_id`}
                                  className="form-select"
                                >
                                  <option value="">Select category</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </Field>
                                <ErrorMessage name={`categories.${index}.category_id`} component="div" className="invalid-feedback" />
                              </div>

                              <div className="col-md-3">
                                <label htmlFor={`categories.${index}.priority`} className="form-label">Priority (1-5)</label>
                                <Field
                                  name={`categories.${index}.priority`}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="form-control"
                                  placeholder="1"
                                />
                                <ErrorMessage name={`categories.${index}.priority`} component="div" className="invalid-feedback" />
                              </div>

                              <div className="col-md-3">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="btn btn-danger btn-sm"
                                >
                                  <Minus className="me-2" />
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="mb-3">
                              <label htmlFor={`categories.${index}.notes`} className="form-label">Notes</label>
                              <Field
                                name={`categories.${index}.notes`}
                                type="text"
                                className="form-control"
                                placeholder="Optional notes"
                              />
                              <ErrorMessage name={`categories.${index}.notes`} component="div" className="invalid-feedback" />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => push({ category_id: '', priority: 1, notes: '' })}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus className="me-2" />
                          Add Category
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>

                <div className="text-end">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="btn btn-secondary me-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Book'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default AddBook;