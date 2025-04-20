// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

// Tạo context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa (từ localStorage)
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Hàm đăng nhập
  const login = async (email, password) => {
    try {
      // Gọi API đăng nhập ở đây
      // Ví dụ:
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Có lỗi xảy ra khi đăng nhập' };
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
    // Xóa cookie nếu có
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  // Hàm đăng ký
  const register = async (userData) => {
    try {
      // Gọi API đăng ký ở đây
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Đăng ký thất bại' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Có lỗi xảy ra khi đăng ký' };
    }
  };

  // Đăng nhập với Facebook (stub)
  const loginWithFacebook = async () => {
    // Triển khai đăng nhập Facebook ở đây
    console.log('Facebook login not implemented yet');
    // Trả về promise để có thể await
    return { success: false, message: 'Chức năng đang phát triển' };
  };

  // Đăng nhập với Google (stub)
  const loginWithGoogle = async () => {
    // Triển khai đăng nhập Google ở đây
    console.log('Google login not implemented yet');
    // Trả về promise để có thể await
    return { success: false, message: 'Chức năng đang phát triển' };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      loginWithFacebook, 
      loginWithGoogle, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};