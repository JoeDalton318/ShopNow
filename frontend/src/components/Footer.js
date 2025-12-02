import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Footer() {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <footer className="bg-dark text-light mt-auto">
      <div className="container py-5">
        <div className="row">
          {/* À propos */}
          <div className="col-md-4 mb-4">
            <h5 className="mb-3">
              <i className="bi bi-bag-heart-fill me-2 text-primary"></i>
              ShopNow+
            </h5>
            <p className="text-muted small">
              Votre destination mode ultime ! Découvrez les dernières tendances
              avec des recommandations personnalisées grâce à notre technologie Big Data.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light" title="Facebook">
                <i className="bi bi-facebook fs-4"></i>
              </a>
              <a href="#" className="text-light" title="Instagram">
                <i className="bi bi-instagram fs-4"></i>
              </a>
              <a href="#" className="text-light" title="Twitter">
                <i className="bi bi-twitter fs-4"></i>
              </a>
              <a href="#" className="text-light" title="LinkedIn">
                <i className="bi bi-linkedin fs-4"></i>
              </a>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="col-md-4 mb-4">
            <h6 className="mb-3">Navigation</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-muted text-decoration-none">
                  <i className="bi bi-house-door me-2"></i>Accueil
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/catalogue" className="text-muted text-decoration-none">
                  <i className="bi bi-grid-3x3-gap me-2"></i>Catalogue
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/panier" className="text-muted text-decoration-none">
                  <i className="bi bi-cart3 me-2"></i>Panier
                </Link>
              </li>
            </ul>
          </div>

          {/* Compte */}
          <div className="col-md-4 mb-4">
            <h6 className="mb-3">Mon Compte</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/profil" className="text-muted text-decoration-none">
                  <i className="bi bi-person-badge me-2"></i>Profil
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/recommendations" className="text-muted text-decoration-none">
                  <i className="bi bi-stars me-2"></i>Recommandations
                </Link>
              </li>
              <li className="mb-2">
                {isAuthenticated ? (
                  <span 
                    className="text-muted text-decoration-none" 
                    role="button"
                    onClick={logout}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>Déconnexion
                  </span>
                ) : (
                  <Link to="/login" className="text-muted text-decoration-none">
                    <i className="bi bi-box-arrow-in-right me-2"></i>Connexion
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-4 bg-secondary" />

        {/* Copyright */}
        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <p className="text-muted small mb-0">
              &copy; 2025 ShopNow+. Tous droits réservés.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="text-muted small mb-0">
              <a href="#" className="text-muted text-decoration-none me-3">Conditions d'utilisation</a>
              <a href="#" className="text-muted text-decoration-none me-3">Politique de confidentialité</a>
              <a href="#" className="text-muted text-decoration-none">Mentions légales</a>
            </p>
          </div>
        </div>

        {/* Badge Big Data */}
        <div className="text-center mt-4">
          <span className="badge bg-primary">
            <i className="bi bi-cpu me-2"></i>
            Powered by Big Data: Kafka + HDFS + Spark
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
