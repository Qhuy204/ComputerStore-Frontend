import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Menu } from 'primereact/menu';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LayoutContext } from '../layout/context/layoutcontext';
import Head from 'next/head';
import usersService from './Services/usersService';
import ordersService from './Services/ordersService';
import productsService from './Services/productsService';
import orderItemsService from './Services/orderItemsService';
import { 
    calculateDashboardStats, 
    prepareChartData, 
    getBestSellingProducts, 
    getRecentNotifications,
    getInventoryStats,
    getCategoryPerformanceStats
} from './utilities/dashboardUtils';

const Dashboard = () => {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        todayOrders: 0,
        ordersSincelastvisit: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        totalCustomers: 0,
        newCustomers: 0,
        unreadComments: 0,
        respondedComments: 0
    });
    const [lineData, setLineData] = useState({
        labels: [],
        datasets: []
    });
    const menu1 = useRef(null);
    const menu2 = useRef(null);
    const [lineOptions, setLineOptions] = useState(null);
    const { layoutConfig } = useContext(LayoutContext);
    const [loading, setLoading] = useState(true);
    const [inventoryStatsData, setInventoryStatsData] = useState({
        totalProducts: 0,
        totalVariants: 0,
        inStockProducts: 0,
        lowStockProducts: [],
    });

    const [categoryPerformance, setCategoryPerformance] = useState({
        categories: [],
        topCategory: null,
        totalCategorySales: 0
    });

    // Lấy dữ liệu từ các service
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
    
                // Lấy danh sách sản phẩm
                const productsData = await productsService.getAll();

                const productVariantsData = await productsService.getAllVariant();

                // Thống kê tồn kho
                const inventoryStatsData = getInventoryStats(productVariantsData);
                setInventoryStatsData(inventoryStatsData);
                
                // Lấy danh sách đơn hàng
                const ordersData = await ordersService.getAll();
    
                // Lấy danh sách order items
                const orderItemsData = await orderItemsService.getAll();
    
                // Mở rộng đơn hàng với chi tiết order items
                const ordersWithItems = ordersData.map(order => ({
                    ...order,
                    order_items: orderItemsData.filter(
                        item => item.order_id === order.order_id
                    )
                }));
    
                // Lấy danh sách người dùng
                const usersData = await usersService.getAll();

                const notifications = getRecentNotifications(
                    ordersData, 
                    usersData, 
                    orderItemsData, 
                    formatCurrency
                );
    
                // Tính toán các số liệu thống kê
                const statsData = calculateDashboardStats(ordersWithItems, usersData);
                setStats(statsData);
    
                // Chuẩn bị dữ liệu cho biểu đồ
                const chartData = prepareChartData(ordersWithItems);
                setLineData(chartData);
    
                // Lấy sản phẩm với danh mục
                const productsWithCategory = productsData.map(product => ({
                    ...product,
                    category_name: product.category_name || 'Chưa phân loại'
                }));
    
                // Lấy sản phẩm bán chạy nhất
                const bestSellingProductsData = getBestSellingProducts(
                    productsWithCategory, 
                    ordersWithItems
                );

                // Thống kê hiệu quả danh mục
                const categoryPerformanceData = getCategoryPerformanceStats(
                    productsData, 
                    ordersData, 
                    orderItemsData
                );
                setCategoryPerformance(categoryPerformanceData);
    
                // Cập nhật state
                setProducts(productsData);
                setOrders(ordersWithItems);
                setUsers(usersData);
    
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
    
        fetchData();
    }, []);

    // Định dạng tiền tệ VND
    const formatCurrency = (value) => {
        if (value == null) return '0 đ'; 
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0 
        }).format(value).replace('₫', 'đ');
    };

    // Lấy danh sách thông báo
    const notifications = getRecentNotifications(orders, users, formatCurrency);
    
    // Lấy danh sách sản phẩm bán chạy
    const bestSellingProducts = getBestSellingProducts(products, orders);

    return (
        <>
            <Head>
                <link rel="icon" href="/img_data/index/favicon.jpg" />
                <title>GEARVN</title>
            </Head>
            
            <div className="grid">
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Đơn hàng hôm nay</span>
                                <div className="text-900 font-medium text-xl">{stats.todayOrders}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{stats.ordersSincelastvisit} mới </span>
                        <span className="text-500">kể từ lần truy cập cuối</span>
                    </div>
                </div>
                
                {/* Rest of the component remains unchanged */}
                {/* ... */}
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Doanh thu</span>
                                <div className="text-900 font-medium text-xl">{formatCurrency(stats.totalRevenue)}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-dollar text-orange-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}% </span>
                        <span className="text-500">so với tuần trước</span>
                    </div>
                </div>
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Khách hàng</span>
                                <div className="text-900 font-medium text-xl">{stats.totalCustomers}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-users text-cyan-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{stats.newCustomers} </span>
                        <span className="text-500">đăng ký mới</span>
                    </div>
                </div>
                <div className="card ml-1 mt-2" style={{height:'140px', width:'360px'}}>
                    <div className="flex justify-content-between align-items-center mb-0">
                        <h5>Sản phẩm sắp hết hàng</h5>
                    </div>
                    {inventoryStatsData.lowStockProducts.length > 0 ? (
                        <ul className="list-none p-0 m-0">
                            {inventoryStatsData.lowStockProducts.map((product, index) => (
                                <li key={index} className="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
                                    <div>
                                        <span className="text-900 font-medium mr-2 mb-1 md:mb-0">
                                            {product.productName}
                                        </span>
                                        {product.variants.map((variant, variantIndex) => (
                                            <div key={variantIndex} className="mt-1 text-600">
                                                SKU: {variant.variantSku} 
                                                - Số lượng: {variant.stockQuantity}
                                            </div>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-4">
                            <i className="pi pi-check-circle text-green-500 text-xl mb-3"></i>
                            <p>Tất cả sản phẩm đều còn hàng</p>
                        </div>
                    )}
                </div>

                <div className="card ml-2" style={{width:'100%'}}>
                    <div className="flex justify-content-between mb-5">
                        <h5>Hiệu Quả Kinh Doanh Theo Danh Mục</h5>
                    </div>
                    <div className="grid">
                        <div className="col-12 md:col-6 lg:col-4">
                            <div className="surface-50 p-3 border-round text-center">
                                <div className="text-900 mb-3">Danh Mục Hàng Đầu</div>
                                {categoryPerformance.topCategory && (
                                    <>
                                        <div className="text-xl font-bold text-primary">
                                            {categoryPerformance.topCategory.name}
                                        </div>
                                        <div className="mt-2 text-600">
                                            Doanh Thu: {new Intl.NumberFormat('vi-VN', { 
                                                style: 'currency', 
                                                currency: 'VND' 
                                            }).format(categoryPerformance.topCategory.totalSales)}
                                        </div>
                                        <div className="text-600">
                                            Số Lượng Bán: {categoryPerformance.topCategory.totalQuantity}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 lg:col-8">
                            <div className="surface-50 p-3 border-round">
                                <div className="text-900 mb-3">Chi Tiết Danh Mục</div>
                                <div className="grid">
                                    {categoryPerformance.categories.slice(0, 5).map((category, index) => (
                                        <div key={index} className="col-12 md:col-6 lg:col-4 mb-3">
                                            <div className="flex justify-content-between">
                                                <span className="text-600">{category.name}</span>
                                                <span className="font-bold">
                                                    {new Intl.NumberFormat('vi-VN', { 
                                                        style: 'currency', 
                                                        currency: 'VND' 
                                                    }).format(category.totalSales)}
                                                </span>
                                            </div>
                                            <div className="surface-300 border-round overflow-hidden mt-2" style={{height: '8px'}}>
                                                <div 
                                                    className="bg-primary h-full" 
                                                    style={{
                                                        width: `${(category.totalSales / categoryPerformance.totalCategorySales) * 100}%`
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="col-12 xl:col-6">
                    <div className="card">
                        <div className="flex justify-content-between align-items-center mb-2" >
                            <h5>Sản phẩm bán chạy</h5>
                            <div>
                                <Button type="button" icon="pi pi-ellipsis-v" className="p-button-rounded p-button-text p-button-plain" onClick={(event) => menu1.current.toggle(event)} />
                                <Menu
                                    ref={menu1}
                                    popup
                                    model={[
                                        { label: 'Cập nhật', icon: 'pi pi-fw pi-refresh' },
                                        { label: 'Xuất file', icon: 'pi pi-fw pi-download' }
                                    ]}
                                />
                            </div>
                        </div>
                        <ul className="list-none p-0 m-0">
                            {bestSellingProducts.map((product, index) => (
                                <li key={index} className="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
                                    <div>
                                        <span className="text-900 font-medium mr-2 mb-0 md:mb-0">{product.name}</span>
                                        <div className="mt-0 text-600">{product.category}</div>
                                    </div>
                                    <div className="mt-2 md:mt-0 ml-0 md:ml-8 flex align-items-center">
                                        <div className="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style={{ height: '8px' }}>
                                            <div className={`bg-${product.percentage >= 66 ? 'pink' : product.percentage >= 33 ? 'orange' : 'cyan'}-500 h-full`} style={{ width: `${product.percentage}%` }} />
                                        </div>
                                        <span className={`text-${product.percentage >= 66 ? 'pink' : product.percentage >= 33 ? 'orange' : 'cyan'}-500 ml-3 font-medium`}>%{product.percentage}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                

                <div className="col-12 xl:col-6">
                    <div className="card">
                        <h5>Tổng quan doanh số</h5>
                        <Chart type="line" data={lineData} options={lineOptions} />
                    </div>

                    <div className="card">
                        <div className="flex align-items-center justify-content-between mb-4">
                            <h5>Thông báo</h5>
                            <div>
                                <Button type="button" icon="pi pi-ellipsis-v" className="p-button-rounded p-button-text p-button-plain" onClick={(event) => menu2.current.toggle(event)} />
                                <Menu
                                    ref={menu2}
                                    popup
                                    model={[
                                        { label: 'Đánh dấu đã đọc', icon: 'pi pi-fw pi-check' },
                                        { label: 'Cài đặt', icon: 'pi pi-fw pi-cog' }
                                    ]}
                                />
                            </div>
                        </div>

                        {notifications.today.length > 0 && (
                            <>
                                <span className="block text-600 font-medium mb-3">HÔM NAY</span>
                                <ul className="p-0 mx-0 mt-0 mb-4 list-none">
                                    {notifications.today.map((notification, index) => (
                                        <li key={`today-${index}`} className="flex align-items-center py-2 border-bottom-1 surface-border">
                                            <div className={`w-3rem h-3rem flex align-items-center justify-content-center ${notification.iconClass} border-circle mr-3 flex-shrink-0`}>
                                                <i className={`${notification.icon} text-xl text-blue-500`} />
                                            </div>
                                            <span className="text-900 line-height-3">
                                                {notification.user}
                                                <span className="text-700">
                                                    {' '}
                                                    đã mua sản phẩm với giá <span className="text-blue-500">{notification.value}</span>
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {notifications.yesterday.length > 0 && (
                            <>
                                <span className="block text-600 font-medium mb-3">HÔM QUA</span>
                                <ul className="p-0 m-0 list-none">
                                    {notifications.yesterday.map((notification, index) => (
                                        <li key={`yesterday-${index}`} className="flex align-items-center py-2 border-bottom-1 surface-border">
                                            <div className={`w-3rem h-3rem flex align-items-center justify-content-center ${notification.iconClass} border-circle mr-3 flex-shrink-0`}>
                                                <i className={`${notification.icon} text-xl text-blue-500`} />
                                            </div>
                                            <span className="text-900 line-height-3">
                                                {notification.user}
                                                <span className="text-700">
                                                    {' '}
                                                    đã mua sản phẩm với giá <span className="text-blue-500">{notification.value}</span>
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {notifications.today.length === 0 && notifications.yesterday.length === 0 && (
                            <div className="text-center p-4">
                                <i className="pi pi-info-circle text-xl text-blue-500 mb-3"></i>
                                <p>Không có thông báo gần đây</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;