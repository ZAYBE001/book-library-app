import React, { useState, useContext } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

function Login() {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center">Login</h2>
              <Formik
                initialValues={{ username: '', password: '' }}
                validationSchema={validationSchema}
                onSubmit={async (values, { resetForm }) => {
                  setLoading(true);
                  try {
                    console.log('Logging in with:', values); // Debug
                    await login(values.username, values.password);
                    resetForm(); // Optional: clear form
                    navigate('/'); // Redirect after success
                  } catch (err) {
                    alert('Login failed. Please check your credentials.');
                    console.error('Login error:', err); // Optional debug
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label">Username</label>
                      <Field name="username" type="text" className="form-control" />
                      <ErrorMessage name="username" component="div" className="text-danger" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password</label>
                      <Field name="password" type="password" className="form-control" />
                      <ErrorMessage name="password" component="div" className="text-danger" />
                    </div>
                    <div className="d-flex justify-content-between">
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting || loading}>
                        {loading ? 'Logging in...' : 'Login'}
                      </button>
                      <Link to="/register" className="btn btn-secondary">
                        Register
                      </Link>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
