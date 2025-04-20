/**
 * Tính toán thống kê cho Dashboard
 * @param {Array} ordersData - Dữ liệu đơn hàng
 * @param {Array} usersData - Dữ liệu người dùng
 * @returns {Object} - Các số liệu thống kê
 */
export const calculateDashboardStats = (ordersData, usersData) => {
    // Đảm bảo dữ liệu hợp lệ
    const validOrders = Array.isArray(ordersData) ? ordersData : [];
    const validUsers = Array.isArray(usersData) ? usersData : [];
    
    // Tính tổng số đơn hàng ngày hôm nay (bao gồm tất cả status)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 của ngày hôm nay
    
    const todayOrders = validOrders.filter(order => {
        if (!order.order_date) return false;
        const orderDate = new Date(order.order_date);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    }).length;

    // Tính số đơn hàng mới (đơn hàng trong 7 ngày gần đây) (bao gồm tất cả status)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const ordersSincelastvisit = validOrders.filter(order => {
        if (!order.order_date) return false;
        return new Date(order.order_date) >= oneWeekAgo;
    }).length;

    // Tính số đơn hàng mới kể từ lần truy cập cuối của người dùng hiện tại (bao gồm tất cả status)
    let ordersSinceLastLogin = 0;
    if (typeof window !== 'undefined') {
        try {
            // Lấy thông tin người dùng từ localStorage
            const userDataString = localStorage.getItem('userData');
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                if (userData && userData.last_login) {
                    const lastLoginDate = new Date(userData.last_login);
                    ordersSinceLastLogin = validOrders.filter(order => {
                        if (!order.order_date) return false;
                        const orderDate = new Date(order.order_date);
                        return orderDate > lastLoginDate;
                    }).length;
                }
            }
        } catch (error) {
            console.error('Lỗi khi đọc dữ liệu người dùng từ localStorage:', error);
        }
    }

    // Lọc đơn hàng có status = "Delivered" để tính doanh thu
    const DeliveredOrders = validOrders.filter(order => order.status === "Delivered");

    // Tính tổng doanh thu - chỉ từ đơn hàng đã hoàn thành
    const totalRevenue = DeliveredOrders.reduce((sum, order) => {
        const amount = parseFloat(order.total_amount);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Tính tăng trưởng doanh thu (so với tuần trước) - chỉ từ đơn hàng đã hoàn thành
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const oneWeekOrders = DeliveredOrders.filter(order => {
        if (!order.order_date) return false;
        const orderDate = new Date(order.order_date);
        return orderDate >= oneWeekAgo;
    });
    
    const twoWeekOrders = DeliveredOrders.filter(order => {
        if (!order.order_date) return false;
        const orderDate = new Date(order.order_date);
        return orderDate >= twoWeeksAgo && orderDate < oneWeekAgo;
    });
    
    const oneWeekRevenue = oneWeekOrders.reduce((sum, order) => {
        const amount = parseFloat(order.total_amount);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const twoWeekRevenue = twoWeekOrders.reduce((sum, order) => {
        const amount = parseFloat(order.total_amount);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    let revenueGrowth = 0;
    if (twoWeekRevenue > 0) {
        revenueGrowth = Math.round((oneWeekRevenue - twoWeekRevenue) / twoWeekRevenue * 100);
    } else if (oneWeekRevenue > 0) {
        revenueGrowth = 100; 
    }

    // Tính tổng số khách hàng
    const totalCustomers = validUsers.length;

    // Tính số khách hàng mới đăng ký (trong 30 ngày gần đây)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const newCustomers = validUsers.filter(user => {
        if (!user.registration_date) return false;
        return new Date(user.registration_date) >= oneMonthAgo;
    }).length;

    return {
        todayOrders,
        ordersSincelastvisit: ordersSinceLastLogin > 0 ? ordersSinceLastLogin : ordersSincelastvisit,
        totalRevenue,
        revenueGrowth,
        totalCustomers,
        newCustomers,
        unreadComments: 152, // Giả lập dữ liệu
        respondedComments: 85 // Giả lập dữ liệu
    };
};
/**
 * Chuẩn bị dữ liệu cho biểu đồ
 * @param {Array} ordersData - Dữ liệu đơn hàng
 * @returns {Object} - Dữ liệu biểu đồ
 */
export const prepareChartData = (ordersData) => {
    // Lọc chỉ các đơn hàng đã hoàn thành
    const DeliveredOrders = Array.isArray(ordersData) 
        ? ordersData.filter(order => order.status === "Delivered") 
        : [];

    // Tạo mảng chứa tháng (7 tháng gần nhất)
    const months = [];
    const currentDate = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(currentDate.getMonth() - i);
        months.push(date.toLocaleString('vi-VN', { month: 'long' }));
    }

    // Tính doanh thu theo tháng
    const revenueData = Array(7).fill(0);
    const orderCountData = Array(7).fill(0);

    DeliveredOrders.forEach(order => {
        const orderDate = new Date(order.order_date);
        const monthDiff = (currentDate.getMonth() - orderDate.getMonth()) + 
                        (currentDate.getFullYear() - orderDate.getFullYear()) * 12;
        
        if (monthDiff >= 0 && monthDiff < 7) {
            const index = 6 - monthDiff;
            revenueData[index] += (order.total_amount || 0) / 1000000; // Quy đổi sang triệu đồng
            orderCountData[index]++;
        }
    });

    return {
        labels: months,
        datasets: [
            {
                label: 'Doanh thu (triệu đồng)',
                data: revenueData,
                fill: false,
                backgroundColor: '#2f4860',
                borderColor: '#2f4860',
                tension: 0.4
            },
            {
                label: 'Số đơn hàng',
                data: orderCountData,
                fill: false,
                backgroundColor: '#00bb7e',
                borderColor: '#00bb7e',
                tension: 0.4
            }
        ]
    };
};

/**
 * Tính toán sản phẩm bán chạy nhất
 * @param {Array} products - Dữ liệu sản phẩm
 * @param {Array} orders - Dữ liệu đơn hàng
 * @returns {Array} - Danh sách sản phẩm bán chạy
 */
export const getBestSellingProducts = (products, orders) => {
    if (!products || !orders) return [];

    // Lọc các đơn hàng đã hoàn thành
    const DeliveredOrders = orders.filter(order => order.status === "Delivered");

    // Tạo map đếm số lượng bán của từng sản phẩm
    const productSalesMap = {};

    // Duyệt qua từng đơn hàng và order item
    DeliveredOrders.forEach(order => {
        if (order.order_items) {
            order.order_items.forEach(item => {
                if (!productSalesMap[item.product_id]) {
                    productSalesMap[item.product_id] = 0;
                }
                productSalesMap[item.product_id] += item.quantity || 1;
            });
        }
    });

    // Kết hợp với thông tin sản phẩm
    const productsWithSales = products.map(product => ({
        ...product,
        sales: productSalesMap[product.product_id] || 0
    }));

    // Sắp xếp theo số lượng bán
    const sortedProducts = productsWithSales.sort((a, b) => b.sales - a.sales);

    // Tính phần trăm so với sản phẩm bán chạy nhất
    const topSales = sortedProducts[0]?.sales || 1;
    
    return sortedProducts.slice(0, 6).map(product => ({
        name: product.product_name,
        category: product.category_name,
        percentage: Math.round((product.sales / topSales) * 100)
    }));
};
/**
 * Lấy thông báo gần đây
 * @param {Array} orders - Dữ liệu đơn hàng
 * @param {Array} users - Dữ liệu người dùng
 * @param {Function} formatCurrency - Hàm định dạng tiền tệ
 * @returns {Object} - Danh sách thông báo
 */
export const getRecentNotifications = (orders, users, orderItems) => {
    // Đảm bảo orderItems là một mảng, nếu không sẽ trả về mảng rỗng
    const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];

    const formatCurrency = (value) => {
        if (value == null) return '0 đ'; 
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0 
        }).format(value).replace('₫', 'đ');
    };

    if (!orders || !users) return { today: [], yesterday: [] };

    // Sắp xếp đơn hàng theo ngày gần nhất
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.order_date) - new Date(a.order_date)
    );

    // Lấy 5 đơn hàng gần đây nhất
    const recentOrders = sortedOrders.slice(0, 5);

    // Phân loại theo ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayNotifications = [];
    const yesterdayNotifications = [];
    const olderNotifications = [];

    recentOrders.forEach(order => {
        const orderDate = new Date(order.order_date);
        orderDate.setHours(0, 0, 0, 0);
        
        // Tìm thông tin khách hàng
        const user = users.find(u => u.user_id === order.user_id) || 
                     { full_name: order.guest_name || 'Người dùng không xác định' };
        
        // Lấy order items của đơn hàng này - sử dụng phiên bản an toàn
        const orderItemsDetail = safeOrderItems.filter(item => item.order_id === order.order_id);
        
        const notification = {
            type: 'purchase',
            user: user.full_name,
            userId: user.user_id,
            orderId: order.order_id,
            value: formatCurrency(order.total_amount),
            date: new Date(order.order_date),
            icon: 'pi pi-dollar',
            iconClass: 'bg-blue-100',
            products: orderItemsDetail.map(item => ({
                name: item.product_name || 'Sản phẩm', // Đảm bảo có tên sản phẩm
                quantity: item.quantity || 1 // Đảm bảo có số lượng
            }))
        };
        
        if (orderDate.getTime() === today.getTime()) {
            todayNotifications.push(notification);
        } else if (orderDate.getTime() === yesterday.getTime()) {
            yesterdayNotifications.push(notification);
        } else {
            olderNotifications.push(notification);
        }
    });

    return {
        today: todayNotifications,
        yesterday: yesterdayNotifications,
        older: olderNotifications
    };
};


export const getInventoryStats = (products) => {
    let totalProducts = 0;
    let inStockProducts = 0;
    let totalVariants = 0;
    const lowStockProducts = [];

    products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
            totalProducts++;
            totalVariants += product.variants.length;

            // Kiểm tra từng variant
            const productVariants = product.variants;
            const variantsLowStock = productVariants.filter(variant => 
                variant.stock_quantity > 0 && variant.stock_quantity <= 5
            );

            // Nếu có variant sắp hết hàng
            if (variantsLowStock.length > 0) {
                lowStockProducts.push({
                    productName: product.product_name,
                    variants: variantsLowStock.map(variant => ({
                        variantSku: variant.variant_sku,
                        stockQuantity: variant.stock_quantity,
                        attributes: variant.variant_attributes
                    }))
                });
            }

            // Đếm sản phẩm có ít nhất 1 variant còn hàng
            if (productVariants.some(variant => variant.stock_quantity > 0)) {
                inStockProducts++;
            }
        }
    });

    return {
        totalProducts,
        totalVariants,
        inStockProducts,
        lowStockProducts
    };
};


export const getCategoryPerformanceStats = (products, orders, orderItems) => {
    // Lọc chỉ lấy đơn hàng đã hoàn thành
    const DeliveredOrders = orders.filter(order => order.status === "Delivered");
    
    // Lọc các orderItems chỉ thuộc các đơn hàng đã hoàn thành
    const DeliveredOrderIds = DeliveredOrders.map(order => order.order_id);
    const DeliveredOrderItems = orderItems.filter(item => 
        DeliveredOrderIds.includes(item.order_id)
    );

    // Tạo map để lưu thông tin danh mục
    const categoryPerformance = {};

    // Duyệt qua các order items đã lọc để tính toán
    DeliveredOrderItems.forEach(item => {
        // Tìm thông tin sản phẩm để lấy category
        const product = products.find(p => p.product_id === item.product_id);
        
        if (product) {
            const categoryName = product.category_name || 'Không phân loại';
            
            if (!categoryPerformance[categoryName]) {
                categoryPerformance[categoryName] = {
                    totalSales: 0,
                    totalQuantity: 0,
                    uniqueProducts: new Set(),
                    averageOrderValue: 0
                };
            }

            // Tính tổng doanh thu và số lượng
            categoryPerformance[categoryName].totalSales += 
                (item.price_at_time || 0) * item.quantity;
            categoryPerformance[categoryName].totalQuantity += item.quantity;
            
            // Thêm sản phẩm vào set sản phẩm duy nhất
            categoryPerformance[categoryName].uniqueProducts.add(item.product_id);
        }
    });

    // Chuyển đổi thành mảng để dễ sắp xếp
    const categoriesArray = Object.entries(categoryPerformance).map(([name, data]) => ({
        name,
        totalSales: data.totalSales,
        totalQuantity: data.totalQuantity,
        uniqueProducts: data.uniqueProducts.size,
        averageItemSales: data.totalSales / data.totalQuantity || 0
    }));    

    // Sắp xếp theo doanh thu giảm dần
    const sortedCategories = categoriesArray.sort((a, b) => b.totalSales - a.totalSales);

    return {
        categories: sortedCategories,
        topCategory: sortedCategories[0] || null,
        totalCategorySales: sortedCategories.reduce((sum, category) => sum + category.totalSales, 0)
    };
};