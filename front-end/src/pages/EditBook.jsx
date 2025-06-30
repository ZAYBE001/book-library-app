import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

function EditBook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookResponse, authorsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/books/${id}`),
          fetch('/api/authors'),
          fetch('/api/categories')
        ]);
        
        const bookData = await bookResponse.json();
        const authorsData = await authorsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setBook(bookData);
        setAuthors(authorsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        navigate('/');
      } else {
        const errorData = await response.json();
        setFieldError('general', errorData.error || 'Failed to update book');
      }
    } catch {
      setFieldError('general', 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!book) return <div>Book not found</div>;

  const initialValues = {
    title: book.title || '',
    isbn: book.isbn || '',
    publication_year: book.publication_year || '',
    pages: book.pages || '',
    description: book.description || '',
    author_id: book.author_id || '',
    categories: book.categories.map(bc => ({
      category_id: bc.category_id,
      priority: bc.priority,
      notes: bc.notes || ''
    }))
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Books</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Book</h1>
          <p className="text-slate-600 mt-1">Update the book details</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, isSubmitting, errors, touched }) => (
            <Form className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <Field
                    name="title"
                    type="text"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.title && touched.title ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Enter book title"
                  />
                  <ErrorMessage name="title" component="div" className="text-red-600 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="author_id" className="block text-sm font-medium text-slate-700 mb-2">
                    Author *
                  </label>
                  <Field
                    as="select"
                    name="author_id"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.author_id && touched.author_id ? 'border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select an author</option>
                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="author_id" component="div" className="text-red-600 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="isbn" className="block text-sm font-medium text-slate-700 mb-2">
                    ISBN
                  </label>
                  <Field
                    name="isbn"
                    type="text"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.isbn && touched.isbn ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="978-1-234-56789-7"
                  />
                  <ErrorMessage name="isbn" component="div" className="text-red-600 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="publication_year" className="block text-sm font-medium text-slate-700 mb-2">
                    Publication Year
                  </label>
                  <Field
                    name="publication_year"
                    type="number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.publication_year && touched.publication_year ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="2023"
                  />
                  <ErrorMessage name="publication_year" component="div" className="text-red-600 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="pages" className="block text-sm font-medium text-slate-700 mb-2">
                    Pages
                  </label>
                  <Field
                    name="pages"
                    type="number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.pages && touched.pages ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="300"
                  />
                  <ErrorMessage name="pages" component="div" className="text-red-600 text-sm mt-1" />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <Field
                  as="textarea"
                  name="description"
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.description && touched.description ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Brief description of the book"
                />
                <ErrorMessage name="description" component="div" className="text-red-600 text-sm mt-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Categories
                  </label>
                </div>

                <FieldArray name="categories">
                  {({ push, remove }) => (
                    <div className="space-y-4">
                      {values.categories.map((category, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Category
                              </label>
                              <Field
                                as="select"
                                name={`categories.${index}.category_id`}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </Field>
                              <ErrorMessage
                                name={`categories.${index}.category_id`}
                                component="div"
                                className="text-red-600 text-sm mt-1"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Priority (1-5)
                              </label>
                              <Field
                                name={`categories.${index}.priority`}
                                type="number"
                                min="1"
                                max="5"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1"
                              />
                              <ErrorMessage
                                name={`categories.${index}.priority`}
                                component="div"
                                className="text-red-600 text-sm mt-1"
                              />
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Notes
                            </label>
                            <Field
                              name={`categories.${index}.notes`}
                              type="text"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Optional notes"
                            />
                            <ErrorMessage
                              name={`categories.${index}.notes`}
                              component="div"
                              className="text-red-600 text-sm mt-1"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => push({ category_id: '', priority: 1, notes: '' })}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Updating...' : 'Update Book'}</span>
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default EditBook;