import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Plus, Users, Tag } from 'lucide-react';

function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid">
          {/* Logo */}
          <Link 
            to="/" 
            className="navbar-brand d-flex align-items-center"
          >
            <BookOpen className="me-2" size={24} color="#6C5DDC" />
            <span className="fs-4 fw-bold text-primary">BookLib</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              {[
                { path: "/", icon: Home, label: "Home" },
                { path: "/add-book", icon: Plus, label: "Add Book" },
                { path: "/authors", icon: Users, label: "Authors" },
                { path: "/categories", icon: Tag, label: "Categories" }
              ].map((item) => (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link d-flex align-items-center ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <item.icon className="me-2" size={16} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-grow-1">
        <div className="container py-5">
          <div className="bg-white rounded shadow-sm p-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Layout;