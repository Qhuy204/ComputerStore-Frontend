import React from 'react';

const AppFooter = () => {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-section">
          <img src="Image/Index/icon_policy_page_1.png" alt="" />
          <div className="policy-content">
            <h5>CHÍNH SÁCH GIAO HÀNG</h5>
            <p>Nhanh hàng và thanh toán tại nhà</p>
          </div>
        </div>
        <div className="footer-section">
          <img src="Image/Index/icon_policy_page_2.png" alt="" />
          <div className="policy-content">
            <h5>ĐỔI TRẢ DỄ DÀNG</h5>
            <p>1 đổi 1 trong 7 ngày</p>
          </div>
        </div>
        <div className="footer-section">
          <img src="Image/Index/icon_policy_page_3.png" alt="" />
          <div className="policy-content">
            <h5>GIÁ LUÔN LUÔN RẺ NHẤT</h5>
            <p>Giá cả hợp lý, nhiều ưu đãi tốt</p>
          </div>
        </div>
        <div className="footer-section">
          <img src="Image/Index/icon_policy_page_4.png" alt="" />
          <div className="policy-content">
            <h5>HỖ TRỢ NHIỆT TÌNH</h5>
            <p>Tư vấn, giải đáp mọi thắc mắc</p>
          </div>
        </div>
      </div>
      <div className="footer-info">
        <div id="footer-content">
          <div className="footer-column">
            <h4>GIỚI THIỆU THNS</h4>
            <ul>
              <li><a href="#">Về chúng tôi</a></li>
              <li><a href="#">Tuyển dụng</a></li>
            </ul>
          </div>
          {/* Add more footer columns here */}
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
