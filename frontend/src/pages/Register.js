import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [genre, setGenre] = useState('none');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    const result = await register(email, password, nom, prenom, genre);
    
    if (result.success) {
      navigate('/catalogue');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">
                <i className="bi bi-person-plus me-2"></i>
                Inscription
              </h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="nom" className="form-label">
                    Nom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="prenom" className="form-label">
                    Prénom
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="genre" className="form-label">
                    Genre <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    required
                  >
                    <option value="none">Préfère ne pas dire / Sans préférence</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                  <small className="text-muted">
                    Utilisé pour des recommandations personnalisées. Sélectionnez "Sans préférence" pour des recommandations non genrées.
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mot de passe <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength="6"
                  />
                  <small className="text-muted">Minimum 6 caractères</small>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le mot de passe <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Inscription...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-check me-2"></i>
                      S'inscrire
                    </>
                  )}
                </button>
              </form>

              <hr />

              <p className="text-center mb-0">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-decoration-none">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
