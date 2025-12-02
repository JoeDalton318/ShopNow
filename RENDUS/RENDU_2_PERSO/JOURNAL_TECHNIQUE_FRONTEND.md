# Rendu 2 : Journal Technique - Spécialiste Frontend et Architecture Client

**Nom :** [Votre Nom]
**Rôle :** Spécialiste Frontend et Architecture Client

---

## 1. Ma Position dans l'Architecture

Dans l'architecture globale du projet ShopNow+, mon rôle se situe à l'entrée du flux de données. L'application React que j'ai développée est le premier point de contact avec l'utilisateur.

**Flux de données :**
**Client (Navigateur) → Frontend (React) → Backend (API REST)** → Kafka → HDFS → Spark

Chaque interaction de l'utilisateur (clic, recherche, ajout au panier) est capturée par l'interface React. Ces actions sont ensuite traduites en appels API vers le backend Flask. Le backend prend le relais pour la logique métier et la production d'événements vers la pipeline de données (Kafka), mais c'est le frontend qui initie l'ensemble du processus.

---

## 2. Développement de l'Interface Web avec React

J'ai structuré l'application en utilisant une approche modulaire basée sur des composants, ce qui facilite la maintenance et l'évolutivité.

### a. Structure du Projet et Routage

Le routage de l'application est géré par `react-router-dom`, permettant de définir des URL claires pour chaque page.

**Extrait de `frontend/src/App.js` :**
```javascript
// ... imports
import Home from "./pages/Home";
import Catalogue from "./pages/Catalogue";
import ProductDetail from "./pages/ProductDetail";
// ... autres pages

function App() {
  return (
    // ... Providers (Theme, Auth, Panier)
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/produit/:id" element={<ProductDetail />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </main>
      <Footer />
    </Router>
    // ...
  );
}
```

### b. Le Catalogue : Cœur de l'Expérience d'Achat

La page `Catalogue.js` est la pièce maîtresse de l'application. Elle permet non seulement d'afficher les produits, mais aussi d'offrir une expérience de recherche et de filtrage riche.

- **Filtres Avancés et Cumulatifs :** L'utilisateur peut combiner plusieurs filtres (genre, couleur, saison, usage, prix). Chaque changement de filtre déclenche un nouvel appel à l'API `/produits` avec les bons paramètres.
- **Recherche avec Debounce :** Pour éviter de surcharger l'API, la recherche textuelle utilise un hook custom `useDebounce`. L'appel API n'est effectué que 500ms après que l'utilisateur a fini de taper.

**Extrait de `frontend/src/pages/Catalogue.js` (Gestion des filtres) :**
```javascript
// ... états pour les filtres
const [categorie, setCategorie] = useState("");
const [niveauPrix, setNiveauPrix] = useState("");
const [searchInput, setSearchInput] = useState("");
// ...

const debouncedSearch = useDebounce(searchInput, 500);

useEffect(() => {
  const fetchProduits = async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (categorie) params["categorie__nom"] = categorie;
      // ... construction des autres paramètres
      const data = await getProduits(params);
      setProduits(data);
    } catch (err) {
      setError("Impossible de récupérer les produits.");
    } finally {
      setLoading(false);
    }
  };
  fetchProduits();
}, [categorie, niveauPrix, debouncedSearch, /* ... autres dépendances */]);
```

*Capture d'écran à insérer : Page catalogue avec plusieurs filtres activés (par exemple, "Homme", "Bleu", "Été").*

---

## 3. Interaction avec la Pipeline de Données

Mon travail ne se limite pas à l'affichage. Le frontend est un producteur actif de données pour la pipeline Big Data.

### a. Consultation de Produit et Ajout au Panier

La page `ProductDetail.js` est un point de contact crucial.
- **Consultation :** Le simple fait de charger cette page déclenche un appel à l'API `/produits/:id`. Le backend, en réponse, envoie un événement `produit-consulte` à Kafka.
- **Ajout au panier :** Le clic sur "Ajouter au panier" est encore plus significatif. Il appelle une fonction du `PanierContext` qui, à son tour, appelle l'API `/panier/ajouter`. Le backend décrémente alors le stock et produit deux événements : `article-ajoute` et `stock-mis-a-jour`.

**Extrait de `frontend/src/pages/ProductDetail.js` :**
```javascript
// ...
const { ajouterAuPanier } = usePanier();
// ...

const handleAjouterAuPanier = async () => {
  // ...
  // La fonction `ajouterAuPanier` du contexte appelle l'API
  const result = await ajouterAuPanier(produit, 1); 
  
  if (result.success) {
    // Met à jour l'UI avec le nouveau stock retourné par l'API
    if (result.nouveau_stock !== null) {
      setProduit(prev => ({ ...prev, stock: result.nouveau_stock }));
    }
  }
};
```

### b. Gestion du Panier et Synchronisation du Stock

Pour une gestion centralisée de l'état du panier, j'ai utilisé **React Context** (`PanierContext.js`). Ce contexte expose des fonctions pour ajouter, modifier ou supprimer des articles.

Chaque action modifiant le panier appelle l'API correspondante pour que le backend puisse ajuster les stocks en base de données et envoyer les événements `stock-mis-a-jour`. Cela garantit que le stock affiché est toujours cohérent avec la réalité.

**Extrait de `frontend/src/context/PanierContext.js` :**
```javascript
export const PanierProvider = ({ children }) => {
  const [panier, setPanier] = useState(/* ... */);

  const ajouterAuPanier = async (produit, quantite = 1) => {
    try {
      // Appel à l'API qui décrémente le stock et envoie l'événement Kafka
      const response = await ajouterAuPanierAPI(produit.id, quantite);
      
      // Mise à jour de l'état local du panier
      setPanier(prevPanier => { /* ... */ });
      
      // On retourne le nouveau stock pour que l'UI puisse se mettre à jour
      return { success: true, nouveau_stock: response.nouveau_stock };
    } catch (error) {
      // ... gestion d'erreur
      return { success: false };
    }
  };

  // ... autres fonctions (supprimer, modifier, vider)
};
```

### c. Consommation des Données Analysées

Le frontend ne fait pas qu'envoyer des données, il en reçoit aussi les fruits.
- **Page d'accueil :** Affiche les "Top Produits", une information calculée en temps réel par Spark et exposée par une route d'API du backend.
- **Page Recommandations :** La page `Recommendations.js` appelle l'endpoint `/recommendations`. Le backend utilise alors le profil de l'utilisateur connecté (genre, historique) pour retourner une liste de produits personnalisée.

**Extrait de `frontend/src/pages/Recommendations.js` :**
```javascript
useEffect(() => {
  const fetchRecommendations = async () => {
    try {
      // Appel à l'API avec les cookies de session
      const response = await axios.get(`${API_BASE_URL}/recommendations`, {
        withCredentials: true
      });
      setRecommendations(response.data);
    } catch (err) {
      setError('Impossible de charger les recommandations');
    }
  };
  fetchRecommendations();
}, [isAuthenticated]);
```

*Capture d'écran à insérer : Page des recommandations affichant une liste de produits personnalisés pour l'utilisateur connecté.*

---

## 4. Commandes de Test et Validation

Pour valider le bon fonctionnement du frontend et sa communication avec le backend :

**1. Lancer et vérifier les logs du frontend :**
```powershell
docker-compose up frontend
docker-compose logs -f frontend
```
*Réponse attendue :* Le serveur de développement React démarre et l'application est accessible sur `http://localhost:3000`.

**2. Simuler un ajout au panier via `curl` pour tester l'API :**

Cette commande simule une requête POST que le frontend enverrait au backend lorsqu'un utilisateur ajoute un article à son panier.

```powershell
curl -X POST http://localhost:8000/panier/ajouter -H "Content-Type: application/json" -d '{\"produit_id\": 1597, \"quantite\": 1, \"client_id\": 1}'
```

*Réponse attendue :* Un JSON confirmant l'ajout. `{"message":"Article ajouté au panier", ...}`. Simultanément, les logs du backend et du consommateur Kafka doivent montrer les événements `article-ajoute` et `stock-mis-a-jour`.

### Exemple de Données (JSON)

Voici à quoi ressemble le corps de la requête (`payload`) envoyé par le frontend lors de cet appel. C'est cette action qui déclenchera la production de l'événement `article-ajoute` par le backend.

```json
{
  "produit_id": 1597,
  "quantite": 1,
  "client_id": 1
}
```

---

## 5. Conclusion

Mon travail sur le frontend a permis de créer une interface utilisateur moderne et réactive qui sert de point d'entrée principal pour la collecte de données. Chaque action de l'utilisateur est une information précieuse qui alimente la pipeline Big Data, permettant des analyses en temps réel et une personnalisation accrue de l'expérience client. La synchronisation constante des stocks et l'affichage des données analysées (comme les recommandations) bouclent la boucle et démontrent la puissance de l'architecture globale.
