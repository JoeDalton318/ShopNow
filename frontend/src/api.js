import axios from 'axios';

// URL backend - utilise localhost car le frontend s'exécute dans le navigateur
const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
export const API_BASE_URL = `${BACKEND_BASE}`;

/**
 * Récupère la liste des produits.
 * Accepte un objet `params` pour les filtres (ex: { search, categorie, prix_min, prix_max })
 */
export async function getProduits(params = {}) {
  const res = await axios.get(`${API_BASE_URL}/produits`, { params });
  return res.data;
}

/**
 * Récupère un produit par son ID.
 */
export async function getProduit(id) {
  const res = await axios.get(`${API_BASE_URL}/produits/${id}`);
  return res.data;
}

/**
 * Récupère la liste des catégories.
 */
export async function getCategories() {
  const res = await axios.get(`${API_BASE_URL}/categories`);
  return res.data;
}

/**
 * Récupère le top 5 des produits les plus consultés (temps réel)
 */
export async function getTopProduitsConsultes() {
  const res = await axios.get(`${API_BASE_URL}/top-produits-consultes`);
  return res.data;
}

/**
 * Ajoute un produit au panier (décrémente le stock côté serveur)
 */
export async function ajouterAuPanierAPI(produitId, quantite = 1) {
  const res = await axios.post(`${API_BASE_URL}/panier/ajouter`, {
    produit_id: produitId,
    quantite: quantite
  });
  return res.data;
}

/**
 * Retire un produit du panier (incrémente le stock côté serveur)
 */
export async function retirerDuPanierAPI(produitId, quantite = 1) {
  const res = await axios.post(`${API_BASE_URL}/panier/retirer`, {
    produit_id: produitId,
    quantite: quantite
  });
  return res.data;
}

/**
 * Vide le panier (remet tous les stocks)
 */
export async function viderPanierAPI(articles) {
  const res = await axios.post(`${API_BASE_URL}/panier/vider`, {
    articles: articles
  });
  return res.data;
}

const api = {
  BACKEND_BASE,
  API_BASE_URL,
  getProduits,
  getProduit,
  getCategories,
  getTopProduitsConsultes,
  ajouterAuPanierAPI,
  retirerDuPanierAPI,
  viderPanierAPI,
};

export default api;
