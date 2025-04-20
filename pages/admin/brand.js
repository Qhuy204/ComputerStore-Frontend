import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import brandService from '../Services/brandService';
import GenericTable from '../components/AdminPage/GenericTable';
import ConfirmDeleteDialog from '../components/AdminPage/ConfirmDeleteDialog';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]); 
  const [brand, setBrand] = useState({}); 
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [brandDialog, setBrandDialog] = useState(false);
  const [deleteBrandDialog, setDeleteBrandDialog] = useState(false);
  const [deleteBrandsDialog, setDeleteBrandsDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const toast = useRef(null);
  const dt = useRef(null);

  const emptybrand = {
    brand_id: '',
    brand_name: ''
  };

  const fetchBrands = async () => {
    try {
      const data = await brandService.getAll();
      setBrands(data);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách nhãn hiệu',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openNew = () => {
    setBrand(emptybrand);
    setSubmitted(false);
    setBrandDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setBrandDialog(false);
  };

  const saveBrand = async () => {
    setSubmitted(true);

    // Validate required fields
    if (!brand.brand_name) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền tên nhãn hiệu',
        life: 3000,
      });
      return;
    }

    try {
      if (brand.brand_id) {
        // Cập nhật nhãn hiệu
        await brandService.update(brand);
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật nhãn hiệu thành công',
          life: 3000,
        });
      } else {
        // Thêm mới nhãn hiệu - chỉ gửi brand_name
        await brandService.insert({ brand_name: brand.brand_name });
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Tạo nhãn hiệu mới thành công',
          life: 3000,
        });
      }

      fetchBrands();
      setBrandDialog(false);
      setBrand(emptybrand);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể thực hiện thao tác: ' + (error.response?.data?.message || error.message),
        life: 3000,
      });
    }
  };

  const editBrand = (rowData) => {
    setBrand({...rowData});
    setBrandDialog(true);
  };

  const confirmDeleteBrand = (brand) => {
    setBrand(brand);
    setDeleteBrandDialog(true);
  };

  const deleteBrand = async () => {
    try {
      await brandService.delete(brand.brand_id);
      fetchBrands();
      setDeleteBrandDialog(false);
      setSelectedBrands(null);
      return true;
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa nhãn hiệu',
        life: 3000,
      });
      return false;
    }
  };

  const confirmDeleteSelected = () => {
    setDeleteBrandsDialog(true);
  };

  const deleteSelectedBrands = async () => {
    try {
      const deletePromises = selectedBrands.map(brand => 
        brandService.delete(brand.brand_id)
      );
      
      await Promise.all(deletePromises);
      
      fetchBrands();
      setDeleteBrandsDialog(false);
      setSelectedBrands(null);
      return true;
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa các nhãn hiệu đã chọn',
        life: 3000,
      });
      return false;
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setBrand(prev => ({ ...prev, [name]: val }));
  };

  const columns = [
    // { field: 'brand_id', header: 'Mã nhãn hiệu', sortable: true },
    { field: 'brand_name', header: 'Tên nhãn hiệu', sortable: true }
  ];

  // Footer dialog với nút Lưu và Hủy
  const brandDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button 
        label={brand.brand_id ? "Cập nhật" : "Thêm mới"} 
        icon="pi pi-check" 
        onClick={saveBrand} 
      />
    </React.Fragment>
  );

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable 
        data={brands}
        selectedItems={selectedBrands}
        setSelectedItems={setSelectedBrands}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={editBrand}
        onDelete={confirmDeleteBrand}
        onDeleteSelected={confirmDeleteSelected}
        openNew={openNew}
        dataKey="brand_id"
        title="Quản lý Nhãn Hiệu"
        onRefresh={fetchBrands}
      />
      
      {/* Custom dialog form tương tự như trong nhanvien/index.js */}
      <Dialog
        visible={brandDialog}
        style={{ width: '600px' }}
        header={brand.brand_id ? "Chỉnh sửa nhãn hiệu" : "Thêm nhãn hiệu mới"}
        modal
        className="p-fluid"
        footer={brandDialogFooter}
        onHide={hideDialog}
      >
        <div className="grid">
          <div className="col-12">
            <Panel header="Thông tin nhãn hiệu">
              <div className="field">
                <label htmlFor="brand_name">Tên nhãn hiệu</label>
                <InputText
                  id="brand_name"
                  value={brand.brand_name || ''}
                  onChange={(e) => onInputChange(e, 'brand_name')}
                  autoFocus
                  placeholder="Nhập tên nhãn hiệu"
                  className={submitted && !brand.brand_name ? 'p-invalid' : ''}
                />
                {submitted && !brand.brand_name && (
                  <small className="p-error">Tên nhãn hiệu là bắt buộc.</small>
                )}
              </div>
              
              {brand.brand_id && (
                <div className="field">
                  <label htmlFor="brand_id">Mã nhãn hiệu</label>
                  <InputText
                    id="brand_id"
                    value={brand.brand_id}
                    disabled
                    className="p-disabled"
                  />
                  <small className="text-muted">Mã nhãn hiệu không thể thay đổi</small>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </Dialog>

      <ConfirmDeleteDialog 
        visible={deleteBrandDialog}
        onHide={() => setDeleteBrandDialog(false)}
        onConfirm={deleteBrand}
        onSuccess={fetchBrands}
        item={brand}
        idField="brand_id"
        itemName={brand.brand_name}
        title="Xác nhận xóa nhãn hiệu"
      />

      <ConfirmDeleteDialog 
        visible={deleteBrandsDialog}
        onHide={() => setDeleteBrandsDialog(false)}
        onConfirm={deleteSelectedBrands}
        onSuccess={fetchBrands}
        multiple={true}
        title="Xác nhận xóa các nhãn hiệu đã chọn"
      />
    </div>
  );
};

export default BrandManagement;