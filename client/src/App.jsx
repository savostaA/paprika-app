import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Catalog from './components/Catalog';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import Admin from './components/Admin';
import SplashScreen from './components/SplashScreen';

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Configure StatusBar color for Android/iOS if running inside Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        StatusBar.setStyle({ style: Style.Light });
      } catch (e) {
        console.error('Failed to configure StatusBar', e);
      }
    }
  }, []);

  return (
    <CartProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </CartProvider>
  );
}
