import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../../front-end/src/components/Layout';
import Home from '../../front-end/src/pages/Home';
import AddBook from '../../front-end/src/pages/AddBook';
import EditBook from '../../front-end/src/pages/EditBook';
import Authors from '../../front-end/src/pages/Authors';
import Categories from '../../front-end/src/pages/Categories';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/edit-book/:id" element={<EditBook />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;