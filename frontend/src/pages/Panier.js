import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePanier } from "../context/PanierContext";

function Panier() {
  const { panier, supprimerDuPanier, modifierQuantite, calculerTotal, viderPanier } = usePanier();
  const [isClearing, setIsClearing] = useState(false);

  const total = calculerTotal();

  const handleViderPanier = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider votre panier ?")) {
      setIsClearing(true);
      const result = await viderPanier();
      setIsClearing(false);
      if (result.success) {
        // Optionnel : afficher un message de succès
      }
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">
        <i className="bi bi-cart3 me-2"></i>
        Mon Panier
      </h2>

      {panier.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          Votre panier est vide.
          <Link to="/catalogue" className="alert-link ms-2">
            Continuer mes achats
          </Link>
        </div>
      ) : (
        <>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Prix unitaire</th>
                      <th>Quantité</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {panier.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.nom}
                                className="me-3"
                                style={{ width: "60px", height: "60px", objectFit: "cover" }}
                              />
                            )}
                            <div>
                              <h6 className="mb-0">{item.nom}</h6>
                            </div>
                          </div>
                        </td>
                        <td>{item.prix.toFixed(2)} €</td>
                        <td>
                          <div className="input-group" style={{ width: "120px" }}>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => modifierQuantite(index, item.quantite - 1)}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                            <input
                              type="number"
                              className="form-control form-control-sm text-center"
                              value={item.quantite}
                              onChange={(e) => modifierQuantite(index, parseInt(e.target.value) || 0)}
                              min="0"
                            />
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => modifierQuantite(index, item.quantite + 1)}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                        </td>
                        <td className="fw-bold">{(item.prix * item.quantite).toFixed(2)} €</td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => supprimerDuPanier(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <Link to="/catalogue" className="btn btn-outline-secondary me-2">
                <i className="bi bi-arrow-left me-2"></i>
                Continuer mes achats
              </Link>
              <button 
                className="btn btn-outline-danger" 
                onClick={handleViderPanier}
                disabled={isClearing}
              >
                <i className="bi bi-trash me-2"></i>
                {isClearing ? 'Vidage en cours...' : 'Vider le panier'}
              </button>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Récapitulatif</h5>
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <span>Sous-total:</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Livraison:</span>
                    <span className="text-success">Gratuite</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total:</span>
                    <span className="text-primary">{total.toFixed(2)} €</span>
                  </div>
                  <button className="btn btn-primary w-100 mt-3">
                    <i className="bi bi-credit-card me-2"></i>
                    Passer la commande
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Panier;
