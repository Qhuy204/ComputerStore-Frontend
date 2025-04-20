import React from 'react';
import GEARVN from './landing/home';
// import Header from '../admin/components/Header';
import Footer from './components/Footer';
import LandingHeader from '../layout/LandingHeader';

// Tạo component PublicLayout riêng cho các trang public
const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout">
      {/* Bạn có thể thêm header, footer cho trang public ở đây nếu cần */}
      {children}
    </div>
  );
};

// Component HomePage
const HomePage = () => {
  return (
    <div>
      <LandingHeader />
      <GEARVN />
      <Footer />
    </div>
  )
};

// Định nghĩa getLayout cho HomePage
HomePage.getLayout = (page) => {
  return <PublicLayout>{page}</PublicLayout>;
};

export default HomePage;