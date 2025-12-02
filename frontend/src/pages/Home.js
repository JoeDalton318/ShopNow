import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-lg border-0">
            <div className="card-body text-center p-5">
              <h1 className="display-4 fw-bold text-primary mb-4">
                Bienvenue sur ShopNow+
              </h1>
              <p className="lead text-muted mb-4">
                Découvrez notre collection exclusive de produits mode et accessoires. 
                Des milliers de produits disponibles avec livraison rapide.
              </p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Link to="/catalogue" className="btn btn-primary btn-lg px-5">
                  🛍️ Voir le Catalogue
                </Link>
              </div>
            </div>
          </div>

          <div className="row mt-5 g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 text-primary mb-3">🚚</div>
                  <h5 className="card-title">Livraison Rapide</h5>
                  <p className="card-text text-muted">
                    Livraison en 24-48h partout en France
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 text-success mb-3">✅</div>
                  <h5 className="card-title">Paiement Sécurisé</h5>
                  <p className="card-text text-muted">
                    Transactions 100% sécurisées
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 text-warning mb-3">⭐</div>
                  <h5 className="card-title">Qualité Premium</h5>
                  <p className="card-text text-muted">
                    Produits sélectionnés avec soin
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

export default Home;