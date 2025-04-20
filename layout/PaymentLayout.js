import React from 'react';
const PaymentLayout = ({ children }) => {
  return (
    <div className="public-layout">
      <main className="public-content">
        {children}
      </main>
    </div>
  );
};

export default PaymentLayout;