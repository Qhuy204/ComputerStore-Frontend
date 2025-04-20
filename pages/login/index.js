import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import dynamic from 'next/dynamic';
import PublicLayout from '../../layout/PublicLayout';
import nhanvienService from '../Services/nhanvienService';

// Dynamic import Button với ssr: false để tránh lỗi hydration
const Button = dynamic(() => import('primereact/button').then(mod => mod.Button), {
  ssr: false
});

const LoginPage = () => {
  const router = useRouter();
  const toast = useRef(null);
  
  // State cho client-side rendering
  const [isBrowser, setIsBrowser] = useState(false);
  
  // State cho đăng nhập
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  
  // State cho đăng ký
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    phone_number: ''
  });
  
  // State cho kiểm tra username
  const [usernameExists, setUsernameExists] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const usernameCheckTimeoutRef = useRef(null);
  
  // State cho xử lý form
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Đảm bảo components chỉ render ở client-side
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Kiểm tra nếu người dùng đã đăng nhập
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        // Đồng bộ token vào cookie cho middleware
        document.cookie = `authToken=${token}; path=/;`;
        
        // Kiểm tra vai trò và chuyển hướng phù hợp
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.is_admin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      }
    }
    
    // Cleanup timeout khi component unmount
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  // Hàm kiểm tra username đã tồn tại hay chưa
  const checkUsername = (username) => {
    if (!username || username.trim() === '') {
      setUsernameExists(false);
      return;
    }
    
    setIsCheckingUsername(true);
    
    // Sử dụng debounce để không gọi API quá nhiều lần
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }
    
    usernameCheckTimeoutRef.current = setTimeout(() => {
      // Gọi API kiểm tra username
      nhanvienService.checkUsername(username)
        .then(exists => {
          setUsernameExists(exists);
          setIsCheckingUsername(false);
        })
        .catch(error => {
          console.error('Lỗi kiểm tra username:', error);
          setIsCheckingUsername(false);
          // Hiển thị thông báo lỗi nếu cần
          toast.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể kiểm tra tên đăng nhập',
            life: 3000,
          });
        });
    }, 500); // Đợi 500ms sau khi người dùng ngừng gõ
  };

  // Xử lý thay đổi username trong form đăng ký
  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setRegisterData({...registerData, username});
    checkUsername(username);
  };

  // Xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.username || !loginData.password) {
      setLoginError('Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }
    
    try {
      setLoading(true);
      setLoginError('');
      
      // Gọi API đăng nhập
      const response = await nhanvienService.login(loginData.username, loginData.password);
      
      if (response.success) {
        // Lưu token theo tùy chọn "Ghi nhớ đăng nhập"
        if (loginData.rememberMe) {
          localStorage.setItem('authToken', response.token);
        } else {
          sessionStorage.setItem('authToken', response.token);
        }
        
        // Lưu token vào cookie cho middleware
        document.cookie = `authToken=${response.token}; path=/;`;
        
        // Lưu thông tin người dùng
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        // Hiển thị thông báo thành công
        if (toast.current) {
          toast.current.show({ 
            severity: 'success', 
            summary: 'Đăng nhập thành công', 
            detail: 'Chào mừng bạn trở lại!', 
            life: 3000 
          });
        }
        
        // Chuyển hướng sau khi đăng nhập thành công
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setLoginError(response.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setLoginError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý đăng ký tài khoản
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Kiểm tra dữ liệu
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.full_name || !registerData.phone_number) {
      setRegisterError('Vui lòng nhập đầy đủ thông tin đăng ký');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Mật khẩu nhập lại không khớp');
      return;
    }
    
    // Kiểm tra username đã tồn tại hay chưa
    if (usernameExists) {
      setRegisterError('Tên đăng nhập đã tồn tại, vui lòng chọn tên đăng nhập khác');
      return;
    }
    
    try {
      setLoading(true);
      setRegisterError('');
      
      // Gọi API đăng ký
      const response = await nhanvienService.register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        full_name: registerData.full_name,
        phone_number: registerData.phone_number
      });
      
      if (response.success) {
        // Lưu token và thông tin người dùng
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        // Lưu token vào cookie
        document.cookie = `authToken=${response.token}; path=/;`;
        
        // Hiển thị thông báo thành công  
        if (toast.current) {
          toast.current.show({ 
            severity: 'success', 
            summary: 'Đăng ký thành công', 
            detail: 'Tài khoản của bạn đã được tạo!', 
            life: 3000 
          });
        }
        
        // Chuyển hướng sau khi đăng ký thành công
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setRegisterError(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      setRegisterError('Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý đăng nhập bằng Facebook
  const handleFacebookLogin = async () => {
    // Triển khai đăng nhập Facebook ở đây
    toast.current.show({ 
      severity: 'info', 
      summary: 'Thông báo', 
      detail: 'Chức năng đăng nhập bằng Facebook đang được phát triển.', 
      life: 3000 
    });
  };
  
  // Xử lý đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    // Triển khai đăng nhập Google ở đây
    toast.current.show({ 
      severity: 'info', 
      summary: 'Thông báo', 
      detail: 'Chức năng đăng nhập bằng Google đang được phát triển.', 
      life: 3000 
    });
  };

  return (
    <main>
      {isBrowser && <Toast ref={toast} />}
      
      <div className="container">
        <div id="login-method">
          <h2></h2>
          <h2></h2>
          <h2>ĐĂNG NHẬP BẰNG</h2>
          <div id="login-fbgg">
            <button onClick={handleFacebookLogin}>
              <img src="/Image/Icon/Facebook Circled.png" alt="" />Facebook
            </button>
            <button onClick={handleGoogleLogin}>
              <img src="/Image/Icon/Google Plus.png" alt="" />Google
            </button>
          </div>
        </div>
        
        <div id="login-signin-region">
          <section className="login">
            <h2>ĐĂNG NHẬP</h2>
            {loginError && <div className="error-message p-error">{loginError}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <InputText
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  placeholder="Tên đăng nhập hoặc email"
                  className="w-full"
                  required
                />
              </div>
              
              <div className="form-group">
                <Password
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="Mật khẩu"
                  toggleMask
                  className="w-full"
                  feedback={false}
                  required
                />
              </div>
              
              <div className="form-group flex align-items-center">
                <Checkbox
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData({...loginData, rememberMe: e.checked})}
                  id="rememberMe"
                  className="mr-2"
                />
                <label htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
              </div>
              
              <div className="form-group">
                {isBrowser ? (
                  <Button
                    label={loading ? "Đang xử lý..." : "Đăng nhập"}
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  />
                ) : (
                  <button type="submit" className="w-full">Đăng nhập</button>
                )}
              </div>
              
              <div className="form-group forgot-password">
                <a href="/auth/forgot-password">Quên mật khẩu?</a>
              </div>
            </form>
          </section>
          
          <section className="register">
            <h2>ĐĂNG KÝ THÀNH VIÊN MỚI</h2>
            {registerError && <div className="error-message p-error">{registerError}</div>}
            
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <InputText
                  type="text"
                  value={registerData.username}
                  onChange={handleUsernameChange}
                  placeholder="Tên đăng nhập"
                  className={classNames("w-full", { 'p-invalid': usernameExists })}
                  required
                />
                {isCheckingUsername && (
                  <small className="text-blue-500">Đang kiểm tra tên đăng nhập...</small>
                )}
                {usernameExists && (
                  <small className="p-error">Tên đăng nhập đã tồn tại, vui lòng chọn tên khác</small>
                )}
              </div>
              
              <div className="form-group">
                <InputText
                  type="text"
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                  placeholder="Họ và tên"
                  className="w-full"
                  required
                />
              </div>
              
              <div className="form-group">
                <InputText
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Email"
                  className="w-full"
                  required
                />
              </div>
              
              <div className="form-group">
                <InputText
                  type="tel"
                  value={registerData.phone_number}
                  onChange={(e) => setRegisterData({...registerData, phone_number: e.target.value})}
                  placeholder="Số điện thoại"
                  className="w-full"
                  required
                />
              </div>
              
              <div className="form-group">
                <Password
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Mật khẩu"
                  toggleMask
                  className="w-full"
                  required
                />
              </div>
              
              <div className="form-group">
                <Password
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  placeholder="Nhập lại mật khẩu"
                  toggleMask
                  className="w-full"
                  feedback={false}
                  required
                />
              </div>
              
              <div className="form-group button-container">
                {isBrowser ? (
                  <Button
                    label={loading ? "Đang xử lý..." : "Đăng ký"}
                    type="submit"
                    className="w-full"
                    disabled={loading || usernameExists}
                  />
                ) : (
                  <button 
                    type="submit" 
                    className="w-full" 
                    disabled={usernameExists}
                  >
                    Đăng ký
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

LoginPage.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>;
};

export default LoginPage;