import productsService from '../Services/productsService';
import React, { useState, useEffect, useRef } from 'react';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/navigation';
import GenericTable from '../components/AdminPage/GenericTable';
import ConfirmDeleteDialog from '../components/AdminPage/ConfirmDeleteDialog';

const Index = () => {
  const [products, setproducts] = useState([]);
  const [product, setproduct] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedproducts, setSelectedproducts] = useState(null);
  const [productDialog, setproductDialog] = useState(false);
  const [deleteproductDialog, setDeleteproductDialog] = useState(false);
  const [deleteproductsDialog, setDeleteproductsDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const toast = useRef(null);
  const router = useRouter();

  const hienthi = async () => {
    try {
      const data = await productsService.getAll();
      setproducts(data);
    } catch (error) {
      console.error('Error fetching datas:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách sản phẩm',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    hienthi();
  }, []);

  // Hàm xử lý khi click vào tên sản phẩm
  const handleProductNameClick = (productId) => {
    localStorage.setItem('productId', productId);
    // Hiển thị product_id đã chọn trước khi chuyển hướng
    toast.current.show({
      severity: 'info',
      summary: 'Thông báo',
      detail: `Đang chuyển đến sản phẩm có ID: ${productId}`,
      life: 100
    });

    // Thêm một độ trễ nhỏ để cho phép thông báo hiển thị
    setTimeout(() => {
      router.push({
        pathname: `/admin/products/${productId}`,
        state: { productId: productId }, // Truyền state
      });
    }, 100);
  };

  // Lấy ngày hiện tại dưới dạng YYYY-MM-DD
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let emptyproduct = {
    product_id: '',
    user_id: '',
    role: 'Manager', // Mặc định theo yêu cầu
    created_at: formattedToday // Định dạng YYYY-MM-DD
  };

  const openNew = () => {
    setproduct(emptyproduct);
    setSubmitted(false);
    setproductDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setproductDialog(false);
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

  const saveproduct = () => {
    setSubmitted(true);

    // Validate required fields
    if (!product.product_id || !product.user_id || !product.role) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        life: 3000,
      });
      return;
    }

    let _product = { ...product };
    
    // Đảm bảo created_at có định dạng YYYY-MM-DD
    if (_product.created_at) {
      const date = new Date(_product.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      _product.created_at = `${year}-${month}-${day}`;
    }
    
    // Chuyển đổi product_id và user_id thành số
    _product.product_id = parseInt(_product.product_id, 10);
    _product.user_id = parseInt(_product.user_id, 10);
    
    // In ra console để kiểm tra
    console.log('Data sending to server:', JSON.stringify(_product));
    
    // Kiểm tra xem đây là thêm mới hay cập nhật
    const isUpdate = products.some(item => item.product_id === _product.product_id);
    
    if (isUpdate) {
      // Cập nhật record hiện có
      productsService.update(_product)
        .then(() => {
          hienthi();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật sản phẩm thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error updating product:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật sản phẩm thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    } else {
      // Thêm record mới
      productsService.insert(_product)
        .then(() => {
          hienthi();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm sản phẩm mới thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error creating product:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thêm sản phẩm thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    }

    setproductDialog(false);
    setproduct(emptyproduct);
  };

  const editproduct = (rowData) => {
    // Clone dữ liệu từ row được chọn
    let _product = { ...rowData };
    setproduct(_product);
    setproductDialog(true);
  };

  const confirmDeleteproduct = (rowData) => {
    setproduct(rowData);
    setDeleteproductDialog(true);
  };

  const confirmDeleteSelected = () => {
    setDeleteproductsDialog(true);
  };

  const deleteproduct = () => {
    productsService.delete(product.product_id)
      .then(() => {
        hienthi();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa sản phẩm thành công',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error deleting record:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xóa sản phẩm thất bại',
          life: 3000,
        });
      });
    setDeleteproductDialog(false);
    setproduct(emptyproduct);
  };

  const deleteSelectedproducts = () => {
    if (selectedproducts && selectedproducts.length > 0) {
      const promises = selectedproducts.map(item => {
        return productsService.delete(item.product_id);
      });
      
      Promise.all(promises)
        .then(() => {
          hienthi();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các sản phẩm đã chọn thành công',
            life: 3500,
          });
        })
        .catch(error => {
          console.error('Error deleting records:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa sản phẩm thất bại',
            life: 3500,
          });
        });
        
      setDeleteproductsDialog(false);
      setSelectedproducts(null);
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setproduct(prev => ({ ...prev, [name]: val }));
  };

  const onDateChange = (e, name) => {
    let _item = { ...product };
    if (e.value) {
      // Chuyển đổi thành định dạng YYYY-MM-DD
      const date = new Date(e.value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      _item[name] = `${year}-${month}-${day}`;
    } else {
      _item[name] = null;
    }
    setproduct(_item);
  };

  // Role options for dropdown
  const roleOptions = [
    { label: 'SuperAdmin', value: 'SuperAdmin' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Support', value: 'Support' }
  ];

  // Định nghĩa các cột và template tùy chỉnh
  const columns = [
    { 
      field: 'primary_image_url', 
      header: '', 
      style: { minWidth: '4rem', maxWidth: '12rem' },
      body: (data) => <img src={data.primary_image_url} alt="Product Img" style={{ width: '30%' }} />
    },
    // { field: 'product_id', header: 'Mã sản phẩm', style: { minWidth: '4rem', maxWidth:'12rem' } },
    { 
      field: 'product_name', 
      header: 'Tên sản phẩm', 
      style: { minWidth: '4rem', maxWidth:'12rem' },
      body: (rowData) => (
        <div 
          onClick={() => handleProductNameClick(rowData.product_id)} 
          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
        >
          {rowData.product_name}
        </div>
      )
    },
    { field: 'total_stock_quantity', header: 'Số lượng tồn kho', style: { minWidth: '4rem', maxWidth:'12rem' } },
    { field: 'category_name', header: 'Loại sản phẩm', style: { minWidth: '4rem', maxWidth:'12rem' } },
    { field: 'brand_name', header: 'Nhà cung cấp', style: { minWidth: '4rem' } },
  ];

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable
        data={products}
        selectedItems={selectedproducts}
        setSelectedItems={setSelectedproducts}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={editproduct}
        onDelete={confirmDeleteproduct}
        onDeleteSelected={confirmDeleteSelected}
        openNew={openNew}
        dataKey="product_id"
        title="Danh sách Sản phẩm"
        onRefresh={refreshData}
      />
      
      <Dialog
        visible={productDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={products.some(item => item.product_id === product.product_id) ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        modal
        className="p-fluid"
        footer={(
          <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveproduct} />
          </React.Fragment>
        )}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="product_id" className="font-bold">
            Product ID <span className="text-red-500">*</span>
          </label>
          <InputText
            id="product_id"
            value={product.product_id}
            onChange={(e) => onInputChange(e, 'product_id')}
            required
            autoFocus
            disabled={products.some(item => item.product_id === product.product_id)}
            className={classNames({ 'p-invalid': submitted && !product.product_id })}
          />
          {submitted && !product.product_id && <small className="p-error">Product ID là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="user_id" className="font-bold">
            User ID <span className="text-red-500">*</span>
          </label>
          <InputText
            id="user_id"
            value={product.user_id}
            onChange={(e) => onInputChange(e, 'user_id')}
            required
            className={classNames({ 'p-invalid': submitted && !product.user_id })}
          />
          {submitted && !product.user_id && <small className="p-error">User ID là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="role" className="font-bold">
            Role <span className="text-red-500">*</span>
          </label>
          <Dropdown
            id="role"
            value={product.role}
            options={roleOptions}
            onChange={(e) => onInputChange(e, 'role')}
            placeholder="Chọn vai trò"
            className={classNames({ 'p-invalid': submitted && !product.role })}
          />
          {submitted && !product.role && <small className="p-error">Role là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="created_at" className="font-bold">
            Created At
          </label>
          <Calendar
            id="created_at"
            value={product.created_at ? new Date(product.created_at) : null}
            onChange={(e) => onDateChange(e, 'created_at')}
            dateFormat="yy-mm-dd"
            showIcon
          />
        </div>
      </Dialog>
      
      <ConfirmDeleteDialog
        visible={deleteproductDialog}
        onHide={() => setDeleteproductDialog(false)}
        onConfirm={deleteproduct}
        item={product}
        idField="product_id"
      />
      
      <ConfirmDeleteDialog
        visible={deleteproductsDialog}
        onHide={() => setDeleteproductsDialog(false)}
        onConfirm={deleteSelectedproducts}
        multiple={true}
        title="Xác nhận xóa"
      />
    </div>
  );
};

export default Index;