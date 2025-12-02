import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Profil() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    consultations: 0,
    commandes: 0,
    favoris: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const genreLabel = {
    'homme': 'Homme',
    'femme': 'Femme',
    'none': 'Non spécifié'
  };

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-md-4">
          {/* Carte Profil */}
          <div className="card shadow-sm mb-4">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="bi bi-person-circle display-1 text-primary"></i>
              </div>
              <h4 className="card-title">{user.prenom} {user.nom}</h4>
              <p className="text-muted mb-2">
                <i className="bi bi-envelope me-2"></i>
                {user.email}
              </p>
              {user.genre && (
                <p className="text-muted">
                  <i className="bi bi-gender-ambiguous me-2"></i>
                  {genreLabel[user.genre] || user.genre}
                </p>
              )}
              <hr />
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary" disabled>
                  <i className="bi bi-pencil me-2"></i>
                  Modifier le profil
                </button>
                <button className="btn btn-outline-secondary" disabled>
                  <i className="bi bi-key me-2"></i>
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </div>

          {/* Carte Recommandations */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-stars text-warning me-2"></i>
                Recommandations
              </h5>
              <p className="small text-muted">
                Vos recommandations sont personnalisées en fonction de :
              </p>
              <ul className="small">
                <li>Votre historique de consultation</li>
                <li>Votre profil ({genreLabel[user.genre] || 'Non spécifié'})</li>
                <li>Les tendances actuelles</li>
              </ul>
              <button 
                className="btn btn-primary btn-sm w-100"
                onClick={() => navigate('/recommendations')}
              >
                Voir mes recommandations
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {/* Statistiques */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title mb-4">
                <i className="bi bi-graph-up me-2"></i>
                Mes Statistiques
              </h5>
              <div className="row text-center">
                <div className="col-md-4 mb-3">
                  <div className="p-3 border rounded">
                    <i className="bi bi-eye-fill fs-1 text-info"></i>
                    <h3 className="mt-2">{stats.consultations}</h3>
                    <p className="text-muted small">Produits consultés</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="p-3 border rounded">
                    <i className="bi bi-cart-check-fill fs-1 text-success"></i>
                    <h3 className="mt-2">{stats.commandes}</h3>
                    <p className="text-muted small">Commandes passées</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="p-3 border rounded">
                    <i className="bi bi-heart-fill fs-1 text-danger"></i>
                    <h3 className="mt-2">{stats.favoris}</h3>
                    <p className="text-muted small">Produits favoris</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historique récent */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">
                <i className="bi bi-clock-history me-2"></i>
                Activité Récente
              </h5>
              <div className="list-group">
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">
                      <i className="bi bi-box-seam text-primary me-2"></i>
                      Bienvenue sur ShopNow+
                    </h6>
                    <small className="text-muted">Aujourd'hui</small>
                  </div>
                  <p className="mb-1 small">
                    Votre profil a été créé avec succès. Commencez à explorer notre catalogue !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profil;
