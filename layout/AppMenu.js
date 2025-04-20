import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model = [
        {
            label: 'Tổng quan',
            items: [{ label: 'Tổng quan', icon: 'pi pi-fw pi-home', to: '/admin' }]
        },
        {
            label: 'Đơn hàng',
            items: [
                { label: 'Tất cả đơn hàng', icon: 'pi pi-fw pi-list', to: '/admin/orders' },
                { label: 'Thêm đơn hàng', icon: 'pi pi-fw pi-pencil', to: '/admin/orders_new' },
                { label: 'Chờ xác nhận', icon: 'pi pi-fw pi-clock', to: '/admin/pendingOrders' },
                { label: 'Đang vận chuyển', icon: 'pi pi-fw pi-truck', to: '/admin/shippingOrders' },
                { label: 'Giao hàng thành công', icon: 'pi pi-fw pi-check-circle', to: '/admin/successfulOrders' },
                { label: 'Đơn hàng hủy', icon: 'pi pi-fw pi-times-circle', to: '/admin/cancelledOrders' }
            ]
        },
        {
            label: 'Sản phẩm',
            items: [
                { label: 'Tất cả sản phẩm', icon: 'pi pi-fw pi-box', to: '/admin/products' },
                { label: 'Danh mục sản phẩm', icon: 'pi pi-fw pi-tags', to: '/admin/categories' },
                { label: 'Thêm sản phẩm', icon: 'pi pi-fw pi-plus', url: '/admin/addnewproduct' }
            ] 
        },
        {
            label: 'Nhãn hiệu',
            items: [
                { label: 'Danh sách nhãn hiệu', icon: 'pi pi-fw pi-box', to: '/admin/brand' },
            ]
        },
        {
            label: 'Khách hàng',
            items: [
                { label: 'Danh sách khách hàng', icon: 'pi pi-fw pi-users', to: '/admin/users' },


            ]
        },
        {
            label: 'Nhân viên',
            items: [
                { label: 'Danh sách nhân viên', icon: 'pi pi-fw pi-id-card', to: '/admin/nhanvien' },
            ]
        },
        {
            label: 'Thống kê',
            items: [
                { label: 'Bảng phân tích', icon: 'pi pi-fw pi-chart-line', to: '/admin/Statistic' },
            ]
        },
        {
            label: 'Blogs',
            items: [
                { label: 'Danh sách Blog', icon: 'pi pi-file', to: '/admin/blogs/listblogs' },
                { label: 'Thêm Blog', icon: 'pi pi-pencil', to: '/admin/blogs/addblogs' },
            ]
        },
        {
            label: 'Trang người dùng',
            icon: 'pi pi-fw pi-briefcase',
            to: '/admin',
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe',
                    to: '/'
                },
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

                <Link href="#" target="_blank" style={{ cursor: 'pointer' }}>
                    <img alt="GEARVN" className="w-full mt-3" src={`/img_data/index/logo_19e1857044964108ba828fb142fce16a.svg`} />
                </Link>
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
