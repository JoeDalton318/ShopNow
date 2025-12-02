import React, { createContext, useContext, useState, useEffect } from 'react';
import { ajouterAuPanierAPI, retirerDuPanierAPI, viderPanierAPI } from '../api';

const PanierContext = createContext();

export const usePanier = () => {
  const context = useContext(PanierContext);
  if (!context) {
    throw new Error('usePanier doit être utilisé dans un PanierProvider');
  }
  return context;
};

export const PanierProvider = ({ children }) => {
  const [panier, setPanier] = useState(() => {
    // Charger le panier depuis localStorage au démarrage
    const saved = localStorage.getItem('shopnow_panier');
    return saved ? JSON.parse(saved) : [];
  });

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('shopnow_panier', JSON.stringify(panier));
  }, [panier]);

  const ajouterAuPanier = async (produit, quantite = 1) => {
    // Vérifier si le produit existe déjà dans le panier
    const existingIndex = panier.findIndex(item => item.id === produit.id);
    const productAlreadyInCart = existingIndex >= 0;
    
    try {
      // Appeler l'API backend pour décrémenter le stock
      const response = await ajouterAuPanierAPI(produit.id, quantite);
      
      // Si succès, ajouter au panier local
      setPanier(prevPanier => {
        const currentIndex = prevPanier.findIndex(item => item.id === produit.id);
        
        if (currentIndex >= 0) {
          // Produit existe : augmenter la quantité
          const newPanier = [...prevPanier];
          newPanier[currentIndex].quantite += quantite;
          return newPanier;
        } else {
          // Nouveau produit : l'ajouter
          return [...prevPanier, { ...produit, quantite }];
        }
      });
      
      // Retourner le nouveau stock pour mise à jour UI
      return { success: true, nouveau_stock: response.nouveau_stock };
    } catch (error) {
      console.error("Erreur ajout au panier:", error);
      const errorMsg = error.response?.data?.error || "Erreur lors de l'ajout au panier";
      alert(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const supprimerDuPanier = async (index) => {
    const produit = panier[index];
    
    try {
      // Appeler l'API pour remettre le stock
      await retirerDuPanierAPI(produit.id, produit.quantite);
      
      // Supprimer du panier local
      setPanier(panier.filter((_, i) => i !== index));
      return { success: true };
    } catch (error) {
      console.error("Erreur suppression du panier:", error);
      alert("Erreur lors de la suppression du panier");
      return { success: false };
    }
  };

  const modifierQuantite = async (index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      supprimerDuPanier(index);
      return;
    }
    
    const produit = panier[index];
    const ancienneQuantite = produit.quantite;
    const difference = nouvelleQuantite - ancienneQuantite;
    
    try {
      if (difference > 0) {
        // Augmentation : ajouter au panier (décrémenter stock)
        await ajouterAuPanierAPI(produit.id, difference);
      } else if (difference < 0) {
        // Diminution : retirer du panier (incrémenter stock)
        await retirerDuPanierAPI(produit.id, Math.abs(difference));
      }
      
      // Mettre à jour le panier local
      const nouveauPanier = [...panier];
      nouveauPanier[index].quantite = nouvelleQuantite;
      setPanier(nouveauPanier);
      return { success: true };
    } catch (error) {
      console.error("Erreur modification quantité:", error);
      alert(error.response?.data?.error || "Erreur lors de la modification");
      return { success: false };
    }
  };

  const viderPanier = async () => {
    try {
      // Appeler l'API pour remettre tous les stocks
      await viderPanierAPI(panier);
      
      // Vider le panier local
      setPanier([]);
      return { success: true };
    } catch (error) {
      console.error("Erreur vidage du panier:", error);
      alert("Erreur lors du vidage du panier");
      return { success: false };
    }
  };

  const calculerTotal = () => {
    return panier.reduce((total, item) => total + (item.prix * item.quantite), 0);
  };

  const getNombreArticles = () => {
    return panier.reduce((total, item) => total + item.quantite, 0);
  };

  const value = {
    panier,
    ajouterAuPanier,
    supprimerDuPanier,
    modifierQuantite,
    viderPanier,
    calculerTotal,
    getNombreArticles
  };

  return (
    <PanierContext.Provider value={value}>
      {children}
    </PanierContext.Provider>
  );
};
