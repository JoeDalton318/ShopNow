import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProduits, getCategories, getTopProduitsConsultes, API_BASE_URL } from "../api";
import useDebounce from "../hooks/useDebounce";
import axios from "axios";

function Catalogue() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProduits, setTopProduits] = useState([]);
  const [filtresDisponibles, setFiltresDisponibles] = useState({
    genders: [],
    colours: [],
    seasons: [],
    usages: []
  });

  // états pour les filtres (tous cumulables)
  const [categorie, setCategorie] = useState("");
  const [niveauPrix, setNiveauPrix] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [ordering, setOrdering] = useState("");
  const [gender, setGender] = useState("");
  const [colour, setColour] = useState("");
  const [season, setSeason] = useState("");
  const [usage, setUsage] = useState("");

  // états pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  
  // état pour afficher/masquer les filtres avancés
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce la valeur de recherche
  const debouncedSearch = useDebounce(searchInput, 500);

  const fetchProduits = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (categorie) params["categorie__nom"] = categorie;
      if (niveauPrix) params.niveau_prix = niveauPrix;
      if (ordering) params.ordering = ordering;
      if (gender) params.gender = gender;
      if (colour) params.colour = colour;
      if (season) params.season = season;
      if (usage) params.usage = usage;
      const data = await getProduits(params);
      setProduits(data);
      setCurrentPage(1); // Reset à la page 1 lors d'un nouveau filtre
    } catch (err) {
      console.error(err);
      setError("Impossible de récupérer les produits.");
    } finally {
      setLoading(false);
    }
  };

  // Charger les filtres disponibles
  const fetchFiltres = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/filtres`);
      setFiltresDisponibles(response.data);
    } catch (err) {
      console.warn("Impossible de charger les filtres", err);
    }
  };

  // Charger le top 5 des produits consultés (temps réel)
  const fetchTopProduits = async () => {
    try {
      const data = await getTopProduitsConsultes();
      setTopProduits(data);
    } catch (err) {
      console.warn("Impossible de charger le top produits", err);
    }
  };

  const resetFiltres = () => {
    setCategorie("");
    setNiveauPrix("");
    setSearchInput("");
    setOrdering("");
    setGender("");
    setColour("");
    setSeason("");
    setUsage("");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await getCategories();
        if (mounted) setCategories(cats);
      } catch (err) {
        console.warn("Erreur récupération catégories", err);
      }
    })();
    fetchTopProduits();
    fetchFiltres();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchir le top produits toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTopProduits();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effet déclenché lorsque les filtres changent
  useEffect(() => {
    fetchProduits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorie, niveauPrix, debouncedSearch, ordering, gender, colour, season, usage]);

  // Calcul des produits à afficher pour la page courante
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentProduits = produits.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(produits.length / ITEMS_PER_PAGE);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Colonne principale */}
        <div className="col-lg-9">
          <h2 className="mb-4">
            <i className="bi bi-grid-3x3-gap me-2"></i>
            Catalogue Produits
          </h2>

          {/* Barre de recherche */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-6">
                  <input
                    className="form-control"
                    placeholder="🔍 Rechercher un produit..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={ordering}
                    onChange={(e) => setOrdering(e.target.value)}
                  >
                    <option value="">Tri par défaut</option>
                    <option value="prix">Prix croissant</option>
                    <option value="-prix">Prix décroissant</option>
                    <option value="nom">Nom A-Z</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={resetFiltres}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres détaillés (cumulables et rétractables) */}
          <div className="card mb-4">
            <div 
              className="card-header bg-light d-flex justify-content-between align-items-center" 
              role="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <h6 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtres avancés
              </h6>
              <i className={`bi bi-chevron-${showAdvancedFilters ? 'up' : 'down'}`}></i>
            </div>
            {showAdvancedFilters && (
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Catégorie</label>
                    <select
                      className="form-select form-select-sm"
                      value={categorie}
                      onChange={(e) => setCategorie(e.target.value)}
                    >
                      <option value="">Toutes</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.nom}>{c.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Genre</label>
                    <select
                      className="form-select form-select-sm"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Tous</option>
                      {filtresDisponibles.genders.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Couleur</label>
                    <select
                      className="form-select form-select-sm"
                      value={colour}
                      onChange={(e) => setColour(e.target.value)}
                    >
                      <option value="">Toutes</option>
                      {filtresDisponibles.colours.slice(0, 20).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Saison</label>
                  <select
                    className="form-select form-select-sm"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {filtresDisponibles.seasons.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Usage</label>
                  <select
                    className="form-select form-select-sm"
                    value={usage}
                    onChange={(e) => setUsage(e.target.value)}
                  >
                    <option value="">Tous</option>
                    {filtresDisponibles.usages.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Prix</label>
                  <select
                    className="form-select form-select-sm"
                    value={niveauPrix}
                    onChange={(e) => setNiveauPrix(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="low">Moins de 50€</option>
                    <option value="medium">50€ - 200€</option>
                    <option value="high">Plus de 200€</option>
                  </select>
                </div>
              </div>
              
              {/* Indicateurs de filtres actifs */}
              <div className="mt-3">
                {(categorie || gender || colour || season || usage || niveauPrix) && (
                  <div className="d-flex flex-wrap gap-2">
                    <small className="text-muted me-2">Filtres actifs:</small>
                    {categorie && (
                      <span className="badge bg-primary">
                        Catégorie: {categorie}
                        <i className="bi bi-x ms-1" role="button" onClick={() => setCategorie("")}></i>
                      </span>
                    )}
                    {gender && (
                      <span className="badge bg-info">
                        Genre: {gender}
                        <i className="bi bi-x ms-1" role="button" onClick={() => setGender("")}></i>
                      </span>
                    )}
                    {colour && (
                      <span className="badge bg-success">
                        Couleur: {colour}
                        <i className="bi bi-x ms-1" role="button" onClick={() => setColour("")}></i>
                      </span>
                    )}
                    {season && (
                      <span className="badge bg-warning">
                        Saison: {season}
                        <i className="bi bi-x ms-1" role="button" onClick={() => setSeason("")}></i>
                      </span>
                    )}
                    {usage && (
                      <span className="badge bg-secondary">
                        Usage: {usage}
                        <i className="bi bi-x ms-1" role="button" onClick={() => setUsage("")}></i>
                      </span>
                    )}
                    {niveauPrix && (
                      <span className="badge bg-danger">
                        Prix: {niveauPrix}
                        <i className="bi bi-x ms-1" role="button" onClick={() => setNiveauPrix("")}></i>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  {produits.length} produit{produits.length > 1 ? 's' : ''} trouvé{produits.length > 1 ? 's' : ''}
                  {produits.length > ITEMS_PER_PAGE && ` - Page ${currentPage}/${totalPages}`}
                </small>
              </div>

              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {currentProduits.map((p) => {
            const imgSrc =
              p.image_url ||
              (p.image &&
                (p.image.startsWith("http")
                  ? p.image
                  : `${API_BASE_URL.replace(/\/api$/, "")}${p.image}`)) ||
              null;
            return (
              <div key={p.id} className="col">
                <div className="card h-100 shadow-sm">
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      className="card-img-top"
                      alt={p.nom || p.title}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{p.nom || p.title}</h5>
                    <p className="card-text text-muted small flex-grow-1">
                      {p.description
                        ? p.description.substring(0, 80) +
                          (p.description.length > 80 ? "..." : "")
                        : ""}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <Link
                        to={`/produit/${p.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Détails
                      </Link>
                      <span className="fw-bold text-success">
                        {p.prix ? `${p.prix}€` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li
                    key={index + 1}
                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {!loading && !error && produits.length === 0 && (
        <div className="alert alert-info text-center">
          Aucun produit trouvé avec ces critères
        </div>
      )}
        </div>

        {/* Sidebar - Top 5 des produits consultés */}
        <div className="col-lg-3">
          <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-fire me-2"></i>
                Top 5 Consultés
              </h5>
            </div>
            <div className="card-body p-2">
              {topProduits.length === 0 ? (
                <p className="text-muted text-center p-3 mb-0">Chargement...</p>
              ) : (
                <div className="list-group list-group-flush">
                  {topProduits.map((p, index) => {
                    const imgSrc =
                      p.image_url ||
                      (p.image &&
                        (p.image.startsWith("http")
                          ? p.image
                          : `${API_BASE_URL.replace(/\/api$/, "")}${p.image}`)) ||
                      null;
                    return (
                      <Link
                        key={p.id}
                        to={`/produit/${p.id}`}
                        className="list-group-item list-group-item-action p-2"
                        style={{ textDecoration: 'none' }}
                      >
                        <div className="d-flex align-items-center">
                          <span className="badge bg-primary me-2">{index + 1}</span>
                          {imgSrc && (
                            <img
                              src={imgSrc}
                              alt={p.nom || p.title}
                              className="me-2"
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="small fw-bold text-truncate">
                              {p.nom || p.title}
                            </div>
                            <div className="text-success small">
                              {p.prix ? `${p.prix}€` : ''}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Catalogue;
