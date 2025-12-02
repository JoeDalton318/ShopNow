import React from "react";
import { Link } from "react-router-dom";
import { usePanier } from "../context/PanierContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Header() {
  const { getNombreArticles } = usePanier();
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const nombreArticles = getNombreArticles();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold fs-4" to="/" style={{ color: '#0d6efd' }}>
          <i className="bi bi-bag-heart-fill me-2"></i>
          ShopNow+
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Navigation principale */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="bi bi-house-door me-1"></i>
                Accueil
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/catalogue">
                <i className="bi bi-grid-3x3-gap me-1"></i>
                Catalogue
              </Link>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <Link className="nav-link" to="/recommendations">
                  <i className="bi bi-stars me-1"></i>
                  Recommandations
                </Link>
              </li>
            )}
          </ul>

          {/* Actions utilisateur */}
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item me-2">
              <button 
                className="btn btn-sm btn-outline-light"
                onClick={toggleDarkMode}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                <i className={`bi bi-${darkMode ? 'sun' : 'moon'}-fill`}></i>
              </button>
            </li>
            
            <li className="nav-item me-3">
              <Link className="btn btn-primary position-relative" to="/panier">
                <i className="bi bi-cart3 me-1"></i>
                Panier
                {nombreArticles > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {nombreArticles}
                    <span className="visually-hidden">articles</span>
                  </span>
                )}
              </Link>
            </li>
            
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle d-flex align-items-center" 
                  href="#" 
                  id="navbarDropdown" 
                  role="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle fs-5 me-2"></i>
                  <span>{user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.nom || user?.email}</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li>
                    <Link className="dropdown-item" to="/profil">
                      <i className="bi bi-person-badge me-2"></i>
                      Mon Profil
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={logout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-light btn-sm" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Connexion
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-light btn-sm" to="/register">
                    <i className="bi bi-person-plus me-1"></i>
                    Inscription
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Header;