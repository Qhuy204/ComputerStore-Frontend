import React, { useState, useEffect } from 'react';
import LogoutButton from './LogOut';

const Header = () => {
  const [userData, setUserData] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  return (
    <header>
      <div className="header-top">
        <div id="top-content">
          <p id="logo">
            <a href="/"><img src="Image/Linhkien/logo.png" alt="Logo" /></a>
          </p>
          <div id="search-bar">
            <input id="searchbar" type="text" placeholder="Bạn tìm gì..." />
            <button id="searchbutton">Tìm kiếm</button>
          </div>
          <div className="header-actions">
            {isClient && userData ? (
              <div id="login-signin">
                <LogoutButton />
                <span id="account">
                  <b>{userData.username}</b>
                </span>
              </div>
            ) : (
              <div id="login-signin">
                <a href="/Login">
                  <span>Đăng nhập/Đăng ký</span><br />
                  <span id="account"><b>Tài khoản</b></span>
                </a>
              </div>
            )}
            <div id="cart">
              <a href="/cart">
                <b>Giỏ hàng(0)</b>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="header-menu">
        <div id="danhmucsp">
          <span>
            <b>
              <strong>
                <img className='a' src="Image/Icon/Menu.png" alt="DANH MỤC SẢN PHẨM" /> DANH MỤC SẢN PHẨM
              </strong>
            </b>
          </span>
        </div>
        <div id="sub-menu">
          <ul>
            <li><a href="/categories/1">Lắp đặt phòng net</a></li>
            <li><a href="/categories/1">Trả góp</a></li>
            <li><a href="/categories/1">Bảng giá</a></li>
            <li><a href="/categories/1">Xây dựng cấu hình</a></li>
            <li><a href="/categories/2">Chính sách bảo hành</a></li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;