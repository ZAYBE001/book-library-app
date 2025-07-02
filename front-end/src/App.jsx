import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../../front-end/src/pages/Home';
import AddBook from '../../front-end/src/pages/AddBook';
import EditBook from '../../front-end/src/pages/EditBook';
import Authors from '../../front-end/src/pages/Authors';
import Categories from '../../front-end/src/pages/Categories';
import Register from '../../front-end/src/pages/Register';
import Login from '../../front-end/src/pages/Login';
import Layout from '../../front-end/src/components/Layout';
import AuthContext from '../../front-end/src/pages/AuthContext';
import { AuthProvider } from '../../front-end/src/pages/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/add-book"
            element={
              <PrivateRoute>
                <Layout>
                  <AddBook />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/authors"
            element={
              <PrivateRoute>
                <Layout>
                  <Authors />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Layout>
                  <Categories />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/EditBook"
            element={
              <PrivateRoute>
                <Layout>
                  <EditBook />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
