import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Catalogue from "./pages/Catalogue";
import ProductDetail from "./pages/ProductDetail";
import Panier from "./pages/Panier";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recommendations from "./pages/Recommendations";
import Profil from "./pages/Profil";
import { PanierProvider } from "./context/PanierContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PanierProvider>
          <Router>
            <div className="App">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalogue" element={<Catalogue />} />
                  <Route path="/produit/:id" element={<ProductDetail />} />
                  <Route path="/panier" element={<Panier />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/profil" element={<Profil />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </PanierProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
