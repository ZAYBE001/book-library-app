import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Plus, Minus, Save, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required').min(1).max(200),
  isbn: Yup.string().matches(/^[\d-]{10,17}$/, 'Invalid ISBN').nullable(),
  publication_year: Yup.number().typeError('Must be a number').min(1000).max(new Date().getFullYear()).nullable(),
  pages: Yup.number().typeError('Must be a number').min(1).max(10000).nullable(),
  description: Yup.string().max(1000),
  author_id: Yup.number().required('Author is required').typeError('Author is required'),
  categories: Yup.array().of(
    Yup.object({
      category_id: Yup.number().required('Category is required'),
      priority: Yup.number().min(1).max(5).required('Priority is required'),
      notes: Yup.string().max(200)
    })
  )
});

function AddBook() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [authorsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/authors'),
        fetch('/api/categories')
      ]);
      setAuthors(await authorsResponse.json());
      setCategories(await categoriesResponse.json());
    } catch {
      console.error('Error fetching authors/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('isbn', values.isbn || '');
    formData.append('publication_year', values.publication_year || '');
    formData.append('pages', values.pages || '');
    formData.append('description', values.description || '');
    formData.append('author_id', values.author_id);
    formData.append('categories', JSON.stringify(values.categories));
    if (values.cover_image) {
      formData.append('cover_image', values.cover_image);
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
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
          <button onClick={() => navigate('/')} className="btn btn-link">
            <ArrowLeft className="me-2" /> Back to Books
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
              categories: [],
              cover_image: null
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting, errors, touched, setFieldValue }) => (
              <Form encType="multipart/form-data">
                {errors.general && (
                  <div className="alert alert-danger" role="alert">
                    {errors.general}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="title" className="form-label">Title *</label>
                    <Field name="title" type="text" className={`form-control ${touched.title && errors.title ? 'is-invalid' : ''}`} />
                    <ErrorMessage name="title" component="div" className="invalid-feedback" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="author_id" className="form-label">Author *</label>
                    <Field as="select" name="author_id" className={`form-select ${touched.author_id && errors.author_id ? 'is-invalid' : ''}`}>
                      <option value="">Select author</option>
                      {authors.map(author => (
                        <option key={author.id} value={author.id}>{author.name}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="author_id" component="div" className="invalid-feedback" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="isbn" className="form-label">ISBN</label>
                    <Field name="isbn" type="text" className="form-control" placeholder="978-1-234..." />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="publication_year" className="form-label">Publication Year</label>
                    <Field name="publication_year" type="number" className="form-control" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="pages" className="form-label">Pages</label>
                    <Field name="pages" type="number" className="form-control" />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="cover_image" className="form-label">Cover Image</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(event) => {
                        setFieldValue('cover_image', event.currentTarget.files[0]);
                        setPreview(URL.createObjectURL(event.currentTarget.files[0]));
                      }}
                    />
                    {preview && (
                      <div className="mt-2">
                        <img src={preview} alt="Preview" className="img-thumbnail" width="150" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3 mt-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <Field as="textarea" name="description" className="form-control" rows="4" />
                </div>

                <div className="mb-3">
                  <label className="form-label">Categories</label>
                  <FieldArray name="categories">
                    {({ push, remove }) => (
                      <div>
                        {values.categories.map((_, index) => (
                          <div key={index} className="mb-3">
                            <div className="row g-2">
                              <div className="col-md-5">
                                <Field as="select" name={`categories.${index}.category_id`} className="form-select">
                                  <option value="">Select category</option>
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </Field>
                              </div>
                              <div className="col-md-3">
                                <Field name={`categories.${index}.priority`} type="number" className="form-control" placeholder="Priority" />
                              </div>
                              <div className="col-md-3">
                                <Field name={`categories.${index}.notes`} type="text" className="form-control" placeholder="Notes" />
                              </div>
                              <div className="col-md-1 d-grid">
                                <button type="button" onClick={() => remove(index)} className="btn btn-danger">
                                  <Minus size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => push({ category_id: '', priority: 1, notes: '' })}>
                          <Plus className="me-1" size={16} /> Add Category
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>

                <div className="text-end">
                  <button type="button" onClick={() => navigate('/')} className="btn btn-secondary me-2">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? 'Creating...' : 'Create Book'} <Save className="ms-1" size={16} />
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
