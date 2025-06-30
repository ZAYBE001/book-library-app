import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Plus, Tag, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const containerStyle = {
  padding: '20px',
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: 'Arial, sans-serif',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const titleStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333',
};

const addButtonStyle = {
  backgroundColor: '#007BFF',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '5px',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
};

const formContainerStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1px solid #ddd',
  padding: '24px',
  marginBottom: '24px',
};

const formTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '16px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  outline: 'none',
};

const textareaStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  outline: 'none',
  resize: 'vertical',
};

const buttonStyle = {
  backgroundColor: '#007BFF',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '5px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};

const cancelButtonStyle = {
  backgroundColor: '#fff',
  color: '#333',
  padding: '10px 20px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};

const categoryCardStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1px solid #ddd',
  padding: '16px',
  marginBottom: '20px',
};

const categoryCardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
};

const categoryCardIconStyle = {
  width: '48px',
  height: '48px',
  backgroundColor: '#e0e0e0',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666',
};

const categoryCardTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
};

const categoryCardDescriptionStyle = {
  fontSize: '14px',
  color: '#666',
  marginBottom: '16px',
};

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Category name is required')
    .max(50, 'Name must be at most 50 characters'),
  description: Yup.string()
    .max(200, 'Description must be at most 200 characters'),
});

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        setFieldError('general', errorData.error || 'Failed to create category');
      }
    } catch {
      setFieldError('general', 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Categories</h1>
          <p className="text-slate-600 mt-2">Organize your books by categories</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={addButtonStyle}
        >
          <Plus className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      </div>

      {showForm && (
        <div style={formContainerStyle}>
          <h2 style={formTitleStyle}>Add New Category</h2>
          <Formik
            initialValues={{
              name: '',
              description: ''
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {errors.general && (
                  <div style={{ backgroundColor: '#ffebee', border: '1px solid #fbc02d', color: '#333', padding: '10px', borderRadius: '5px' }}>
                    {errors.general}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }} htmlFor="name">
                    Name *
                  </label>
                  <Field
                    name="name"
                    type="text"
                    style={inputStyle}
                    placeholder="Category name"
                  />
                  <ErrorMessage name="name" component="div" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }} htmlFor="description">
                    Description
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    rows="3"
                    style={textareaStyle}
                    placeholder="Brief description of the category"
                  />
                  <ErrorMessage name="description" component="div" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={cancelButtonStyle}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={buttonStyle}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ marginBottom: '24px' }}>
            <Tag style={{ width: '48px', height: '48px', color: '#666' }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>No categories found</h3>
          <p style={{ fontSize: '14px', marginBottom: '24px' }}>Get started by adding your first category!</p>
          <button
            onClick={() => setShowForm(true)}
            style={addButtonStyle}
          >
            <Plus className="h-5 w-5" />
            <span>Add Category</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }) {
  return (
    <div style={categoryCardStyle}>
      <div style={categoryCardHeaderStyle}>
        <div style={categoryCardIconStyle}>
          <Tag style={{ width: '24px', height: '24px', color: '#666' }} />
        </div>
        <h3 style={categoryCardTitleStyle}>{category.name}</h3>
      </div>

      {category.description && (
        <p style={categoryCardDescriptionStyle}>{category.description}</p>
      )}
    </div>
  );
}

export default Categories;