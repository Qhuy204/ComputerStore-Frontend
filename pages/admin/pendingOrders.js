import ordersService from '../Services/ordersService';
import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import GenericTable from '../components/AdminPage/GenericTable';
import ConfirmDeleteDialog from '../components/AdminPage/ConfirmDeleteDialog';

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [order, setOrder] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedOrders, setSelectedOrders] = useState(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [confirmOrderDialog, setConfirmOrderDialog] = useState(false);
  const [deleteOrderDialog, setDeleteOrderDialog] = useState(false);
  const [deleteOrdersDialog, setDeleteOrdersDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const toast = useRef(null);

  // Trạng thái chờ xác nhận
  const pendingStatus = 'pending';
  
  const hienthi = async () => {
    try {
      const data = await ordersService.getAll();
      setOrders(data);
      
      // Lọc đơn hàng có trạng thái là 'processing'
      const pendingOrders = data.filter(order => 
        order.status && order.status.toLowerCase() === pendingStatus
      );
      setFilteredOrders(pendingOrders);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  let emptyOrder = {
    order_id: '',
    user_id: '',
    role: 'Manager',
    created_at: formattedToday,
    status: 'processing' // Mặc định trạng thái là Processing
  };

  const openNew = () => {
    setOrder(emptyOrder);
    setSubmitted(false);
    setOrderDialog(true);
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

  // Mở dialog xác nhận đơn hàng
  const confirmOrder = (rowData) => {
    setOrder(rowData);
    setConfirmOrderDialog(true);
  };
  
  // Xác nhận đơn hàng và chuyển trạng thái sang Shipped
  const handleConfirmOrder = () => {
    // Thay vì ghi đè toàn bộ đơn hàng, chỉ cập nhật trường status
    const updatedStatus = {
      order_id: order.order_id,
      status: 'Shipped' // Chuyển sang trạng thái đang vận chuyển
    };
    
    // Cập nhật trạng thái đơn hàng lên server
    ordersService.update(updatedStatus)
      .then(() => {
        hienthi();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã xác nhận đơn hàng và chuyển sang trạng thái đang vận chuyển',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error confirming order:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xác nhận đơn hàng thất bại: ' + (error.message || ''),
          life: 3000,
        });
      });
    
    setConfirmOrderDialog(false);
  };

  const confirmDeleteOrder = (rowData) => {
    setOrder(rowData);
    setDeleteOrderDialog(true);
  };

  const confirmDeleteSelected = () => {
    setDeleteOrdersDialog(true);
  };

  const deleteOrder = () => {
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
    setDeleteOrderDialog(false);
    setOrder(emptyOrder);
  };

  const deleteSelectedOrders = () => {
    if (selectedOrders && selectedOrders.length > 0) {
      const promises = selectedOrders.map(item => {
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
        
      setDeleteOrdersDialog(false);
      setSelectedOrders(null);
    }
  };

  // Template hiển thị trạng thái đơn hàng
  const statusTemplate = (rowData) => {
    return (
      <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 font-medium">
        Chờ xác nhận
      </span>
    );
  };
  
  // Template cho nút thao tác
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-check" 
          severity="success" 
          rounded 
          className="mr-2" 
          tooltip="Xác nhận" 
          tooltipOptions={{ position: 'top' }}
          onClick={() => confirmOrder(rowData)} 
        />
        <Button 
          icon="pi pi-trash" 
          severity="danger" 
          rounded 
          tooltip="Xóa" 
          tooltipOptions={{ position: 'top' }}
          onClick={() => confirmDeleteOrder(rowData)} 
        />
      </div>
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
    { header: 'Thao tác', body: actionBodyTemplate, style: { minWidth: '10rem' } }
  ];

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable
        data={filteredOrders}
        selectedItems={selectedOrders}
        setSelectedItems={setSelectedOrders}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={null}
        onDelete={null}
        hideActionsColumn={true} // Nếu GenericTable hỗ trợ props này
        onDeleteSelected={confirmDeleteSelected}
        openNew={openNew}
        dataKey="order_id"
        title="Danh sách đơn hàng chờ xác nhận"
        onRefresh={refreshData}
        />
            
      {/* Dialog xác nhận đơn hàng */}
      <Dialog
        visible={confirmOrderDialog}
        style={{ width: '450px' }}
        header="Xác nhận đơn hàng"
        modal
        footer={(
          <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={() => setConfirmOrderDialog(false)} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleConfirmOrder} />
          </React.Fragment>
        )}
        onHide={() => setConfirmOrderDialog(false)}
      >
        <div className="flex flex-column align-items-center">
          <i className="pi pi-exclamation-circle text-yellow-500" style={{ fontSize: '5rem' }}></i>
          <h3>Xác nhận đơn hàng?</h3>
          <p className="text-center">
            Bạn có chắc chắn muốn xác nhận đơn hàng <strong>#{order.order_id}</strong>?<br />
            Đơn hàng sẽ được chuyển sang trạng thái <span className="font-bold text-blue-600">"Đang vận chuyển"</span>.
          </p>
          
          <div className="mt-4 p-3 border-1 surface-border border-round w-full">
            <div className="flex justify-content-between mb-2">
              <span className="font-semibold">Mã đơn hàng:</span>
              <span>#{order.order_id}</span>
            </div>
            <div className="flex justify-content-between mb-2">
              <span className="font-semibold">Khách hàng:</span>
              <span>#{order.user_id}</span>
            </div>
            {order.total_amount && (
              <div className="flex justify-content-between mb-2">
                <span className="font-semibold">Tổng tiền:</span>
                <span>{order.total_amount} VNĐ</span>
              </div>
            )}
            {order.order_date && (
              <div className="flex justify-content-between">
                <span className="font-semibold">Ngày đặt hàng:</span>
                <span>{new Date(order.order_date).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>
      </Dialog>
      
      <ConfirmDeleteDialog
        visible={deleteOrderDialog}
        onHide={() => setDeleteOrderDialog(false)}
        onConfirm={deleteOrder}
        item={order}
        idField="order_id"
      />
      
      <ConfirmDeleteDialog
        visible={deleteOrdersDialog}
        onHide={() => setDeleteOrdersDialog(false)}
        onConfirm={deleteSelectedOrders}
        multiple={true}
        title="Xác nhận xóa"
      />
    </div>
  );
};

export default PendingOrders;