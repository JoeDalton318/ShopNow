import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { useAuth } from '../context/AuthContext';

function Recommendations() {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/recommendations`, {
          withCredentials: true
        });
        setRecommendations(response.data);
      } catch (err) {
        console.error('Erreur chargement recommandations:', err);
        setError('Impossible de charger les recommandations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">
          <i className="bi bi-info-circle me-2"></i>
          Vous devez être connecté pour voir vos recommandations.
          <br />
          <Link to="/login" className="btn btn-primary mt-3">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">
        <i className="bi bi-stars me-2"></i>
        Recommandations pour vous
      </h2>

      {recommendations.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Consultez des produits pour recevoir des recommandations personnalisées !
        </div>
      ) : (
        <>
          <p className="text-muted mb-4">
            Basé sur vos {recommendations.reduce((acc, p) => acc + p.nb_vues, 0)} consultations
          </p>

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
            {recommendations.map((produit) => (
              <div key={produit.id} className="col">
                <div className="card h-100 shadow-sm">
                  {produit.image_url && (
                    <img
                      src={produit.image_url}
                      className="card-img-top"
                      alt={produit.nom}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{produit.nom}</h5>
                    <p className="text-muted small">
                      Vous avez consulté {produit.nb_vues} fois
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <Link
                        to={`/produit/${produit.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Voir détails
                      </Link>
                      <span className="fw-bold text-success">
                        {produit.prix}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Recommendations;
