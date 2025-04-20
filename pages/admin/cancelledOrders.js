import ordersService from '../Services/ordersService';
import React, { useState, useEffect, useRef } from 'react';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import GenericTable from '../components/AdminPage/GenericTable';
import ConfirmDeleteDialog from '../components/AdminPage/ConfirmDeleteDialog';

const Index = () => {
  const [orders, setorders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [order, setorder] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedorders, setSelectedorders] = useState(null);
  const [orderDialog, setorderDialog] = useState(false);
  const [deleteorderDialog, setDeleteorderDialog] = useState(false);
  const [deleteordersDialog, setDeleteordersDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const toast = useRef(null);

  const hienthi = async () => {
    try {
      const data = await ordersService.getAll();
      setorders(data);
      
      // Lọc đơn hàng có trạng thái "cancelled"
      const cancelledOrders = data.filter(order => order.status && order.status.toLowerCase() === 'cancelled');
      setFilteredOrders(cancelledOrders);
    } catch (error) {
      console.error('Error fetching datas:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách đơn hàng',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    hienthi();
  }, []);

  // Lấy ngày hiện tại dưới dạng YYYY-MM-DD
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let emptyorder = {
    order_id: '',
    user_id: '',
    role: 'Manager', // Mặc định theo yêu cầu
    created_at: formattedToday, // Định dạng YYYY-MM-DD
    status: 'cancelled' // Mặc định trạng thái là cancelled
  };

  const openNew = () => {
    setorder(emptyorder);
    setSubmitted(false);
    setorderDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setorderDialog(false);
    hienthi();
  };

  const refreshData = () => {
    hienthi();
    toast.current.show({
      severity: 'info',
      summary: 'Đã làm mới',
      detail: 'Dữ liệu đã được làm mới',
      life: 1000,
    });
  };

  const saveorder = () => {
    setSubmitted(true);

    // Validate required fields
    if (!order.order_id || !order.user_id || !order.role) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        life: 3000,
      });
      return;
    }

    let _order = { ...order };
    
    // Đảm bảo created_at có định dạng YYYY-MM-DD
    if (_order.created_at) {
      const date = new Date(_order.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      _order.created_at = `${year}-${month}-${day}`;
    }
    
    // Đảm bảo status là cancelled
    _order.status = 'cancelled';
    
    // Chuyển đổi order_id và user_id thành số
    _order.order_id = parseInt(_order.order_id, 10);
    _order.user_id = parseInt(_order.user_id, 10);
    
    // In ra console để kiểm tra
    console.log('Data sending to server:', JSON.stringify(_order));
    
    // Kiểm tra xem đây là thêm mới hay cập nhật
    const isUpdate = orders.some(item => item.order_id === _order.order_id);
    
    if (isUpdate) {
      // Cập nhật record hiện có
      ordersService.update(_order)
        .then(() => {
          hienthi();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật đơn hàng thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error updating order:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật đơn hàng thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    } else {
      // Thêm record mới
      ordersService.insert(_order)
        .then(() => {
          hienthi();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm đơn hàng mới thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error creating order:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thêm đơn hàng thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    }

    setorderDialog(false);
    setorder(emptyorder);
  };

  const confirmDeleteSelected = () => {
    setDeleteordersDialog(true);
  };

  const deleteorder = () => {
    ordersService.delete(order.order_id)
      .then(() => {
        hienthi();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa đơn hàng thành công',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error deleting record:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xóa đơn hàng thất bại',
          life: 3000,
        });
      });
    setDeleteorderDialog(false);
    setorder(emptyorder);
  };

  const deleteSelectedorders = () => {
    if (selectedorders && selectedorders.length > 0) {
      const promises = selectedorders.map(item => {
        return ordersService.delete(item.order_id);
      });
      
      Promise.all(promises)
        .then(() => {
          hienthi();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các đơn hàng đã chọn thành công',
            life: 3500,
          });
        })
        .catch(error => {
          console.error('Error deleting records:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa đơn hàng thất bại',
            life: 3500,
          });
        });
        
      setDeleteordersDialog(false);
      setSelectedorders(null);
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setorder(prev => ({ ...prev, [name]: val }));
  };

  // Template hiển thị trạng thái đơn hàng
  const statusTemplate = (rowData) => {
    return (
      <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 font-medium">
        {rowData.status || 'cancelled'}
      </span>
    );
  };

  const columns = [
    { field: 'order_id', header: 'Mã đơn hàng', style: { minWidth: '12rem' } },
    { field: 'guest_name', header: 'Khách hàng', style: { minWidth: '12rem' } },
    { field: 'total_amount', header: 'Tổng tiền', style: { minWidth: '12rem' } },
    { field: 'order_date', header: 'Ngày đặt hàng', style: { minWidth: '12rem' } },
    { field: 'status', header: 'Trạng thái', style: { minWidth: '12rem' }, body: statusTemplate },
    { field: 'shipping_address', header: 'Địa chỉ ship', style: { minWidth: '12rem' } },
    // { field: 'payment_method_id', header: 'Mã phương thức thanh toán', style: { minWidth: '12rem' } },
  ];

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable
        data={filteredOrders} // Sử dụng danh sách đã lọc
        selectedItems={selectedorders}
        setSelectedItems={setSelectedorders}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={null}
        onDelete={null}
        onDeleteSelected={confirmDeleteSelected}
        openNew={openNew}
        dataKey="order_id"
        title="Danh sách đơn hàng bị hủy"
        onRefresh={refreshData}
      />
      
      <Dialog
        visible={orderDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={orders.some(item => item.order_id === order.order_id) ? "Chỉnh sửa đơn hàng" : "Thêm đơn hàng mới"}
        modal
        className="p-fluid"
        footer={(
          <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveorder} />
          </React.Fragment>
        )}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="order_id" className="font-bold">
            Mã đơn hàng <span className="text-red-500">*</span>
          </label>
          <InputText
            id="order_id"
            value={order.order_id}
            onChange={(e) => onInputChange(e, 'order_id')}
            required
            autoFocus
            disabled={orders.some(item => item.order_id === order.order_id)}
            className={classNames({ 'p-invalid': submitted && !order.order_id })}
          />
          {submitted && !order.order_id && <small className="p-error">Mã đơn hàng là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="user_id" className="font-bold">
            Mã khách hàng <span className="text-red-500">*</span>
          </label>
          <InputText
            id="user_id"
            value={order.user_id}
            onChange={(e) => onInputChange(e, 'user_id')}
            required
            className={classNames({ 'p-invalid': submitted && !order.user_id })}
          />
          {submitted && !order.user_id && <small className="p-error">Mã khách hàng là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="total_amount" className="font-bold">
            Tổng tiền
          </label>
          <InputText
            id="total_amount"
            value={order.total_amount}
            onChange={(e) => onInputChange(e, 'total_amount')}
          />
        </div>

        <div className="field">
          <label htmlFor="order_date" className="font-bold">
            Ngày đặt hàng
          </label>
          <Calendar
            id="order_date"
            value={order.order_date ? new Date(order.order_date) : null}
            onChange={(e) => setorder(prev => ({ ...prev, order_date: e.value }))}
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>

        <div className="field">
          <label htmlFor="shipping_address" className="font-bold">
            Địa chỉ giao hàng
          </label>
          <InputText
            id="shipping_address"
            value={order.shipping_address}
            onChange={(e) => onInputChange(e, 'shipping_address')}
          />
        </div>

        <div className="field">
          <label htmlFor="payment_method_id" className="font-bold">
            Phương thức thanh toán
          </label>
          <InputText
            id="payment_method_id"
            value={order.payment_method_id}
            onChange={(e) => onInputChange(e, 'payment_method_id')}
          />
        </div>

        <div className="field">
          <label className="font-bold">Trạng thái</label>
          <div className="mt-2 px-3 py-2 text-sm rounded-md bg-red-100 text-red-800 font-medium inline-block">
            Cancelled
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Đơn hàng này luôn có trạng thái là "cancelled"
          </div>
        </div>
      </Dialog>
      
      <ConfirmDeleteDialog
        visible={deleteorderDialog}
        onHide={() => setDeleteorderDialog(false)}
        onConfirm={deleteorder}
        item={order}
        idField="order_id"
      />
      
      <ConfirmDeleteDialog
        visible={deleteordersDialog}
        onHide={() => setDeleteordersDialog(false)}
        onConfirm={deleteSelectedorders}
        multiple={true}
        title="Xác nhận xóa"
      />
    </div>
  );
};

export default Index;