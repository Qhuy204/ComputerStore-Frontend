import Link from 'next/link';
import { useRouter } from 'next/router';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppTopbar = forwardRef((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const router = useRouter();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                if (userData && userData.full_name) {
                    setUserName(userData.full_name);
                }
            } catch (error) {
                console.error('Lỗi khi đọc userData từ localStorage:', error);
            }
        }
    }, []);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const handleLogout = () => {
        // Xóa token xác thực
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Xóa cookie
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Xóa các thông tin khác
        localStorage.removeItem('userData');
        sessionStorage.removeItem('hasCheckedAuth');
        
        // Hard redirect để đảm bảo làm mới middleware
        window.location.href = '/auth/login';
    };

    return (
        <div className="layout-topbar">
            <Link href="/admin" className="layout-topbar-logo">
                <img src="/img_data/index/logo_fd11946b31524fbe98765f34f3de0628.svg" width="true" alt="logo" />
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef}  className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <div className='Hello' style={{ justifyContent: 'center', color: '#FFF', alignContent:'center', fontWeight:'bold' }}>
                    <span>Xin chào, {userName}</span>
                </div>
                <Link href="/admin/adminProfie">
                    <button type="button" className="p-link layout-topbar-button">
                        <i className="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                </Link>
                <button type="button" className="p-link layout-topbar-button" onClick={handleLogout}>
                    <i className="pi pi-sign-out"></i>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
});

export default AppTopbar;