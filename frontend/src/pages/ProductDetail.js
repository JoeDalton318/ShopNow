import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduit } from "../api";
import { usePanier } from "../context/PanierContext";

function ProductDetail() {
  const { id } = useParams();
  const { ajouterAuPanier } = usePanier();
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ajoutSuccess, setAjoutSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getProduit(id);
        if (mounted) setProduit(data);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Impossible de charger le produit.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

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
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (!produit) return null;

  const imgSrc = produit.image_url || null;

  const handleAjouterAuPanier = async () => {
    if (isAdding) return; // Empêcher les clics multiples
    
    setIsAdding(true);
    const result = await ajouterAuPanier(produit, 1);
    setIsAdding(false);
    
    if (result.success) {
      setAjoutSuccess(true);
      setTimeout(() => setAjoutSuccess(false), 2000);
      
      // Mettre à jour le stock local
      if (result.nouveau_stock !== null && result.nouveau_stock !== undefined) {
        setProduit(prev => ({ ...prev, stock: result.nouveau_stock }));
      }
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <Link to="/catalogue" className="btn btn-outline-secondary mb-4">
        <i className="bi bi-arrow-left me-2"></i>
        Retour au catalogue
      </Link>

      <div className="card shadow-sm">
        <div className="row g-0">
          {imgSrc && (
            <div className="col-md-5">
              <img
                src={imgSrc}
                alt={produit.nom || produit.title}
                className="img-fluid rounded-start"
                style={{ height: "100%", objectFit: "cover", minHeight: "400px" }}
              />
            </div>
          )}
          <div className={imgSrc ? "col-md-7" : "col-12"}>
            <div className="card-body p-4">
              <h2 className="card-title mb-3">{produit.nom || produit.title}</h2>
              <h4 className="text-primary mb-4">
                {produit.prix ? `${produit.prix} €` : "Prix non renseigné"}
              </h4>
              <p className="card-text">{produit.description}</p>
              
              {produit.stock > 0 ? (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  En stock ({produit.stock} disponibles)
                </div>
              ) : (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-x-circle me-2"></i>
                  Rupture de stock
                </div>
              )}

              {ajoutSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Produit ajouté au panier !
                </div>
              )}
              
              <div className="mt-4 d-flex gap-2">
                <button 
                  className="btn btn-primary btn-lg flex-grow-1"
                  onClick={handleAjouterAuPanier}
                  disabled={produit.stock === 0 || isAdding}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  {isAdding ? 'Ajout en cours...' : 'Ajouter au panier'}
                </button>
                <Link to="/panier" className="btn btn-outline-primary btn-lg">
                  <i className="bi bi-cart3 me-2"></i>
                  Voir le panier
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
