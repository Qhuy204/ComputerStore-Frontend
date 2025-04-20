import { useRouter } from 'next/router';
import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head'; // Thêm import Head từ next/head
import AppConfig from '../../../layout/AppConfig';
import { Checkbox } from 'primereact/checkbox';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import dynamic from 'next/dynamic';
import nhanvienService from '../../Services/nhanvienService'

// Dynamic import Button với ssr: false
const Button = dynamic(() => import('primereact/button').then(mod => mod.Button), {
  ssr: false
});

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const toast = React.useRef(null);
    const [isBrowser, setIsBrowser] = useState(false);
    
    // Đảm bảo Toast chỉ render ở client-side
    useEffect(() => {
        setIsBrowser(true);
    }, []);
    
    // Effect to check if user is already logged in
    useEffect(() => {
        // Chỉ kiểm tra trạng thái đăng nhập ở phía client
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (token) {
                // Đồng bộ token vào cookie để middleware cũng có thể xác thực
                document.cookie = `authToken=${token}; path=/;`;
                
                // Chuyển hướng dựa trên vai trò
                const user = JSON.parse(localStorage.getItem('userData') || '{}');
                if (user && user.is_admin) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/';
                }
            }
            setLoading(false);
        }
    }, []);
    
    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    const handleLogin = async (e) => {
        e.preventDefault();
      
        // Basic validation
        if (!username || !password) {
          setErrorMessage('Vui lòng nhập cả tài khoản và mật khẩu');
          return;
        }
      
        try {
          setLoading(true);
          setErrorMessage('');
      
          // Gọi API đăng nhập
          const response = await nhanvienService.login(username, password);
      
          if (response.success) {
            // Lưu token dựa trên lựa chọn "Ghi nhớ đăng nhập"
            if (rememberMe) {
              localStorage.setItem('authToken', response.token);
            } else {
              sessionStorage.setItem('authToken', response.token);
            }
            
            // Quan trọng: Lưu token vào cookie cho middleware
            document.cookie = `authToken=${response.token}; path=/;`;
      
            // Lưu thông tin người dùng nếu cần
            localStorage.setItem('userData', JSON.stringify(response.user));
      
            // Hiển thị thông báo thành công
            if (isBrowser && toast.current) {
              toast.current.show({ 
                severity: 'success', 
                summary: 'Đăng nhập thành công', 
                detail: 'Chào mừng trở lại!', 
                life: 3000 
              });
            }
      
            // Hard redirect để làm mới trang và đảm bảo middleware nhận cookie mới
            setTimeout(() => {
              window.location.href = response.user.is_admin ? '/admin' : '/';
            }, 1000);
          } else {
            setErrorMessage(response.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.');
          }
        } catch (error) {
          setErrorMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
          console.error('Lỗi đăng nhập:', error);
        } finally {
          setLoading(false);
        }
    };
      
    const handleForgotPassword = () => {
        router.push('/auth/forgot-password');
    };

    return (
        <>
            <Head>
                <link rel="icon" href="/img_data/index/favicon.ico" />
                <title>GEARVN</title>
            </Head>
            <div className={containerClassName}>
                {isBrowser && <Toast ref={toast} />}
                
                <div className="flex flex-column align-items-center justify-content-center">
                    
                    <div style={{ 
                        borderRadius: '56px', 
                        padding: '0.3rem', 
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' 
                    }}>
                        <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                            <div className="text-center mb-5">
                                <img src="/img_data/index/favicon.png" alt="Image" height="50" className="mb-3" />
                                <div className="text-900 text-3xl font-medium mb-3">TRANG QUẢN TRỊ GEARVN</div>
                                <span className="text-600 font-medium">Đăng nhập tài khoản Admin để tiếp tục</span>
                            </div>

                            <form onSubmit={handleLogin}>
                                {errorMessage && (
                                    <div className="p-3 mb-3 bg-red-100 text-red-700 border border-red-300 rounded">
                                        {errorMessage}
                                    </div>
                                )}
                                
                                <div className="mb-4">
                                    <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                        Tên tài khoản
                                    </label>
                                    <InputText 
                                        id="username" 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Tên tài khoản" 
                                        className="w-full md:w-30rem mb-2" 
                                        style={{ padding: '1rem' }}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                        Mật khẩu
                                    </label>
                                    <Password 
                                        id="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        placeholder="Password" 
                                        toggleMask 
                                        className="w-full mb-2" 
                                        inputClassName="w-full p-3 md:w-30rem"
                                        feedback={false}
                                        required
                                    />
                                </div>

                                <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                    <div className="flex align-items-center">
                                        <Checkbox 
                                            id="rememberMe" 
                                            checked={rememberMe} 
                                            onChange={(e) => setRememberMe(e.checked)} 
                                            className="mr-2"
                                        />
                                        <label htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
                                    </div>
                                    <a 
                                        href="/auth/forgot-password"
                                        className="font-medium no-underline ml-2 text-right cursor-pointer" 
                                        style={{ color: 'var(--primary-color)' }}
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            handleForgotPassword(); 
                                        }}
                                    >
                                        Quên mật khẩu?
                                    </a>
                                </div>
                                
                                {isBrowser ? (
                                    <Button 
                                        label={loading ? "Đang đăng nhập..." : "Đăng nhập"} 
                                        type="submit"
                                        className="w-full p-3 text-xl" 
                                        disabled={loading}
                                    />
                                ) : (
                                    <button 
                                        type="submit"
                                        className="w-full p-3 text-xl" 
                                        disabled
                                    >
                                        Đăng nhập
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

LoginPage.getLayout = function getLayout(page) {
    return (
        <React.Fragment>
            {page}
            <AppConfig simple />
        </React.Fragment>
    );
};

export default LoginPage;