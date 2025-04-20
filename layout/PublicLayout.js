import React from 'react';
// Import các component header, footer cho trang public
import Header from '../pages/components/Header';
import LandingHeader from './LandingHeader';
import Footer from '../pages/components/Footer';
const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout">
      <LandingHeader />
      <main className="public-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;