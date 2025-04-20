import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { AutoComplete } from 'primereact/autocomplete';

import ordersService from '../../Services/ordersService';
import orderItemsService from '../../Services/orderItemsService';
import productsService from '../../Services/productsService';
import usersService from '../../Services/usersService';
import paymentmethodService from '../../Services/paymentMethodService';
import addressService from '../../Services/addressService';

function OrderDetail() {
  const router = useRouter();
  const { order_id } = router.query;
  const toast = useRef(null);

  // State for order details
  const [orderDetails, setOrderDetails] = useState({
    user_id: null,
    guest_email: '',
    guest_phone: '',
    guest_name: '',
    total_amount: 0,
    shipping_address: '',
    payment_method_id: null,
    payment_status: 'Pending',
    note: ''
  });

  // State for order items
  const [orderItems, setOrderItems] = useState([]);

  // State for dropdowns and selections
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDisplayText, setCustomerDisplayText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Payment status options
  const paymentStatusOptions = [
    { label: 'Chờ thanh toán', value: 'Pending' },
    { label: 'Đã thanh toán', value: 'Completed' },
    { label: 'Thanh toán thất bại', value: 'Failed' }
  ];

  // Calculate total amount
  const calculateTotalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const price = parseFloat(item.price_at_time) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  }, [orderItems]);

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      if (!order_id) return;

      // Fetch order details
      const orderData = await ordersService.getById(order_id);
      if (!orderData) {
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không tìm thấy đơn hàng',
          life: 3000
        });
        return;
      }

      // Fetch order items
      const items = await orderItemsService.getById(order_id);
      setOrderItems(items);

      // Set order details
      setOrderDetails({
        user_id: orderData.user_id,
        guest_email: orderData.guest_email,
        guest_phone: orderData.guest_phone,
        guest_name: orderData.guest_name,
        total_amount: parseFloat(orderData.total_amount) || calculateTotalAmount,
        shipping_address: orderData.shipping_address,
        payment_method_id: orderData.payment_method_id,
        payment_status: orderData.payment_status,
        note: orderData.note
      });

      // If user exists, fetch customer details
      if (orderData.user_id) {
        const customerDetails = await usersService.getById(orderData.user_id);
        setSelectedCustomer({
          user_id: customerDetails.user_id,
          name: customerDetails.full_name || `${customerDetails.first_name} ${customerDetails.last_name}`,
          email: customerDetails.email,
          phone: customerDetails.phone_number
        });
        setCustomerDisplayText(`${customerDetails.full_name} - ${customerDetails.phone_number}`);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải chi tiết đơn hàng',
        life: 3000
      });
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch customers
        const customersData = await usersService.getAll();
        const formattedCustomers = customersData.map(user => ({
          user_id: user.user_id,
          name: user.full_name || `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone_number || user.phone
        }));
        setCustomers(formattedCustomers);

        // Fetch payment methods
        const paymentMethodsData = await paymentmethodService.getAll();
        setPaymentMethods(paymentMethodsData.map(method => ({
          payment_method_id: method.payment_method_id,
          name: method.payment_method_name,
          description: method.description
        })));
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    if (order_id) {
      fetchInitialData();
      fetchOrderDetails();
    }
  }, [order_id]);

  // Update order method
  const updateOrder = async () => {
    try {
      // Validate required fields
      if (!orderDetails.shipping_address) {
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Vui lòng nhập địa chỉ giao hàng',
          life: 3000
        });
        return;
      }

      if (!orderDetails.payment_method_id) {
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Vui lòng chọn phương thức thanh toán',
          life: 3000
        });
        return;
      }

      // Prepare order update data
      const orderUpdateData = {
        order_id: order_id,
        user_id: orderDetails.user_id,
        guest_email: orderDetails.guest_email,
        guest_phone: orderDetails.guest_phone,
        guest_name: orderDetails.guest_name,
        total_amount: calculateTotalAmount,
        shipping_address: orderDetails.shipping_address,
        payment_method_id: orderDetails.payment_method_id,
        payment_status: orderDetails.payment_status,
        note: orderDetails.note
      };

      // Update order
      await ordersService.update(orderUpdateData);

      // Update order items
      for (const item of orderItems) {
        const orderItemUpdateData = {
          order_id: order_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          variant_sku: item.variant_sku || '',
          quantity: item.quantity,
          price_at_time: item.price_at_time
        };

        // Assuming orderItemsService has an update method
        await orderItemsService.update(orderItemUpdateData);
      }

      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đơn hàng đã được cập nhật',
        life: 3000
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể cập nhật đơn hàng',
        life: 3000
      });
    }
  };

  // ... (rest of the previous component code remains the same)

  return (
    <div className="card">
      <Toast ref={toast} />
      
      <Card title={`Chi tiết Đơn hàng #${order_id}`} className="mb-3">
        <div className="grid">
          {/* ... (previous component code) ... */}

          {/* Payment Summary Section */}
          <div className="col-12">
            <Card title="Thanh toán" className="mb-3">
              <div className="flex justify-content-between mb-3">
                <span>Tổng tiền sản phẩm:</span>
                <span className="font-bold">{calculateTotalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <Divider />
              <div className="flex justify-content-between">
                <span className="font-bold text-xl">Tổng thanh toán:</span>
                <span className="font-bold text-xl text-primary">{calculateTotalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </Card>
          </div>

          {/* Button Section */}
          <div className="col-12 flex justify-content-end gap-2">
            <Button 
              label="Hủy" 
              icon="pi pi-times" 
              className="p-button-secondary"
              onClick={() => router.push('/orders')}
            />
            <Button 
              label="Lưu thay đổi" 
              icon="pi pi-check" 
              onClick={updateOrder} 
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default OrderDetail;