import React, { useState, useEffect, useRef } from 'react';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import ConfirmDeleteDialog from '../components/AdminPage/ConfirmDeleteDialog';
import categoriesService from '../Services/categoriesService';
import Attribute_TypesService from '../Services/Attribute_TypesService';
import Attribute_ValuesService from '../Services/Attribute_ValuesService';
import category_attributesService from '../Services/Category_AttributesService';

const Index = () => {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState(false);
  const [deleteCategoriesDialog, setDeleteCategoriesDialog] = useState(false);
  const [attributeDialog, setAttributeDialog] = useState(false);
  const [attributeValueDialog, setAttributeValueDialog] = useState(false);
  const [deleteAttributeDialog, setDeleteAttributeDialog] = useState(false);
  const [deleteAttributeValueDialog, setDeleteAttributeValueDialog] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState({});
  const [currentAttributeValue, setCurrentAttributeValue] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedAttributes, setExpandedAttributes] = useState([]);
  
  // New states for existing attributes selection
  const [selectAttributeDialog, setSelectAttributeDialog] = useState(false);
  const [allAttributes, setAllAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [currentCategoryForAttributes, setCurrentCategoryForAttributes] = useState(null);
  const [attributeRequired, setAttributeRequired] = useState(false);
  
  const toast = useRef(null);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAll();
      // Đảm bảo data là một mảng
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách danh mục',
        life: 3000,
      });
    }
  };

  // Fetch all attributes for selection dialog
  const fetchAllAttributes = async () => {
    try {
      const data = await Attribute_TypesService.getAll();
      setAllAttributes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setAllAttributes([]);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách thuộc tính',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAllAttributes();
  }, []);

  let emptyCategory = {
    category_id: '',
    category_name: '',
    description: ''
  };

  let emptyAttribute = {
    attribute_type_id: '',
    type_name: '',
    display_order: 0,
    is_required: false
  };

  let emptyAttributeValue = {
    attribute_value_id: '',
    attribute_type_id: '',
    value_name: ''
  };

  const openNew = () => {
    setCategory(emptyCategory);
    setSubmitted(false);
    setCategoryDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setCategoryDialog(false);
  };

  const hideAttributeDialog = () => {
    setSubmitted(false);
    setAttributeDialog(false);
  };

  const hideAttributeValueDialog = () => {
    setSubmitted(false);
    setAttributeValueDialog(false);
  };

  const hideSelectAttributeDialog = () => {
    setSubmitted(false);
    setSelectAttributeDialog(false);
    setSelectedAttributes([]);
    setAttributeRequired(false);
  };

  const refreshData = () => {
    fetchCategories();
    toast.current.show({
      severity: 'info',
      summary: 'Đã làm mới',
      detail: 'Dữ liệu đã được làm mới',
      life: 1000,
    });
  };

  const saveCategory = () => {
    setSubmitted(true);
  
    if (!category.category_name) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền tên danh mục',
        life: 3000,
      });
      return;
    }
  
    if (category.category_id) {
      const updateData = {
        category_id: category.category_id,
        category_name: category.category_name,
        description: category.description || ''
      };
    
      categoriesService.update(updateData)
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật danh mục thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error updating category:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật danh mục thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    }
     else {
      const newCategory = {
        category_name: category.category_name,
        description: category.description || ''
      };
      
      categoriesService.insert(newCategory)
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm danh mục mới thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error creating category:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thêm danh mục thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    }
  
    setCategoryDialog(false);
    setCategory(emptyCategory);
  };

  const saveAttribute = () => {
    setSubmitted(true);
  
    if (!currentAttribute.type_name) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền tên thuộc tính',
        life: 3000,
      });
      return;
    }
  
    const attributeData = {
      type_name: currentAttribute.type_name,
      display_order: currentAttribute.display_order || 0
    };
  
    if (currentAttribute.attribute_type_id) {
      Attribute_TypesService.update({
        ...attributeData,
        attribute_type_id: currentAttribute.attribute_type_id
      })
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật thuộc tính thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error updating attribute:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật thuộc tính thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    } else {
      Attribute_TypesService.insert(attributeData)
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm thuộc tính mới thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error creating attribute:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thêm thuộc tính thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    }
  
    setAttributeDialog(false);
    setCurrentAttribute(emptyAttribute);
  };

  const saveAttributeValue = () => {
    setSubmitted(true);
  
    if (!currentAttributeValue.value_name) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền tên giá trị thuộc tính',
        life: 3000,
      });
      return;
    }
  
    const valueData = {
      attribute_type_id: currentAttributeValue.attribute_type_id,
      value_name: currentAttributeValue.value_name
    };
  
    if (currentAttributeValue.attribute_value_id) {
      Attribute_ValuesService.update({
        ...valueData,
        attribute_value_id: currentAttributeValue.attribute_value_id
      })
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật giá trị thuộc tính thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error updating attribute value:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật giá trị thuộc tính thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    } else {
      Attribute_ValuesService.insert(valueData)
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm giá trị thuộc tính mới thành công',
            life: 3000,
          });
        })
        .catch(error => {
          console.error('Error creating attribute value:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thêm giá trị thuộc tính thất bại: ' + (error.message || ''),
            life: 3000,
          });
        });
    }
  
    setAttributeValueDialog(false);
    setCurrentAttributeValue(emptyAttributeValue);
  };

  // Add selected attributes to category
  const saveSelectedAttributes = () => {
    if (!selectedAttributes || selectedAttributes.length === 0) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng chọn ít nhất một thuộc tính',
        life: 3000,
      });
      return;
    }

    // Create an array of promises to add each selected attribute
    const promises = selectedAttributes.map(attribute => {
      const categoryAttributeData = {
        category_id: currentCategoryForAttributes,
        attribute_type_id: attribute.attribute_type_id,
        is_required: attributeRequired
      };
      
      return category_attributesService.insert(categoryAttributeData);
    });
    
    // Execute all promises
    Promise.all(promises)
      .then(() => {
        fetchCategories();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Thêm thuộc tính vào danh mục thành công',
          life: 3000,
        });
        hideSelectAttributeDialog();
      })
      .catch(error => {
        console.error('Error adding attributes to category:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Thêm thuộc tính vào danh mục thất bại',
          life: 3000,
        });
      });
  };

  const editCategory = (rowData) => {
    setCategory({ ...rowData });
    setCategoryDialog(true);
  };

  const editAttribute = (rowData) => {
    setCurrentAttribute({ ...rowData });
    setAttributeDialog(true);
  };

  const editAttributeValue = (rowData) => {
    setCurrentAttributeValue({ ...rowData });
    setAttributeValueDialog(true);
  };

  const openNewAttribute = (categoryData) => {
    setCurrentAttribute({
      ...emptyAttribute,
      category_id: categoryData.category_id
    });
    setAttributeDialog(true);
  };

  const openNewAttributeValue = (attributeData) => {
    setCurrentAttributeValue({
      ...emptyAttributeValue,
      attribute_type_id: attributeData.attribute_type_id
    });
    setAttributeValueDialog(true);
  };

  // Open dialog to select existing attributes
  const openSelectAttribute = (categoryData) => {
    setCurrentCategoryForAttributes(categoryData.category_id);
    
    // Filter out attributes that are already assigned to this category
    const existingAttributeIds = (categoryData.attributes || []).map(attr => attr.attribute_type_id);
    const availableAttributes = allAttributes.filter(attr => !existingAttributeIds.includes(attr.attribute_type_id));
    
    setAllAttributes(availableAttributes);
    setSelectedAttributes([]);
    setAttributeRequired(false);
    setSelectAttributeDialog(true);
  };

  const confirmDeleteCategory = (rowData) => {
    setCategory(rowData);
    setDeleteCategoryDialog(true);
  };

  const confirmDeleteAttribute = (rowData) => {
    setCurrentAttribute(rowData);
    setDeleteAttributeDialog(true);
  };

  const confirmDeleteAttributeValue = (rowData) => {
    setCurrentAttributeValue(rowData);
    setDeleteAttributeValueDialog(true);
  };

  const confirmDeleteSelected = () => {
    setDeleteCategoriesDialog(true);
  };

  const deleteCategory = () => {
    categoriesService.delete(category.category_id)
      .then(() => {
        fetchCategories();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa danh mục thành công',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error deleting category:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xóa danh mục thất bại',
          life: 3000,
        });
      });
    setDeleteCategoryDialog(false);
    setCategory(emptyCategory);
  };

  const deleteAttribute = () => {
    Attribute_TypesService.delete(currentAttribute.attribute_type_id)
      .then(() => {
        fetchCategories();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa thuộc tính thành công',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error deleting attribute:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xóa thuộc tính thất bại',
          life: 3000,
        });
      });
    setDeleteAttributeDialog(false);
    setCurrentAttribute(emptyAttribute);
  };

  const deleteAttributeValue = () => {
    Attribute_ValuesService.delete(currentAttributeValue.attribute_value_id)
      .then(() => {
        fetchCategories();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa giá trị thuộc tính thành công',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error deleting attribute value:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xóa giá trị thuộc tính thất bại',
          life: 3000,
        });
      });
    setDeleteAttributeValueDialog(false);
    setCurrentAttributeValue(emptyAttributeValue);
  };

  const deleteSelectedCategories = () => {
    if (selectedCategories && selectedCategories.length > 0) {
      const promises = selectedCategories.map(item => {
        return categoriesService.delete(item.category_id);
      });
      
      Promise.all(promises)
        .then(() => {
          fetchCategories();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các danh mục đã chọn thành công',
            life: 3500,
          });
        })
        .catch(error => {
          console.error('Error deleting categories:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa danh mục thất bại',
            life: 3500,
          });
        });
        
      setDeleteCategoriesDialog(false);
      setSelectedCategories([]);
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setCategory(prev => ({ ...prev, [name]: val }));
  };

  const onAttributeInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setCurrentAttribute(prev => ({ ...prev, [name]: val }));
  };

  const onAttributeValueInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setCurrentAttributeValue(prev => ({ ...prev, [name]: val }));
  };

  const onCheckboxChange = (e, name) => {
    const checked = e.checked;
    setCurrentAttribute(prev => ({ ...prev, [name]: checked }));
  };

  const onNumberInputChange = (e, name) => {
    const val = e.value || 0;
    setCurrentAttribute(prev => ({ ...prev, [name]: val }));
  };

  // Mẫu mở rộng cho các thuộc tính
  const attributeRowExpansionTemplate = (attributeData) => {
    return (
      <div className="p-3">
        <div className="flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Giá trị thuộc tính: {attributeData.type_name}</h5>
          <Button 
            icon="pi pi-plus" 
            className="p-button-success p-button-rounded" 
            onClick={() => openNewAttributeValue(attributeData)}
            tooltip="Thêm giá trị thuộc tính"
          />
        </div>
        
        <DataTable 
          value={attributeData.values || []} 
          stripedRows
          emptyMessage="Không có giá trị nào"
        >
          <Column field="attribute_value_id" header="ID" style={{ width: '10%', textAlign: 'center' }} />
          <Column field="value_name" header="Tên giá trị" style={{ width: '60%' }} />
          <Column 
            body={(rowData) => (
              <div className="flex justify-content-end">
                <Button
                  icon="pi pi-pencil"
                  className="p-button-rounded p-button-success mr-2"
                  onClick={() => editAttributeValue(rowData)}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-danger"
                  onClick={() => confirmDeleteAttributeValue(rowData)}
                />
              </div>
            )}
            style={{ width: '30%', textAlign: 'center' }}
          />
        </DataTable>
      </div>
    );
  };

  // Mẫu mở rộng cho danh mục
  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <div className="flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Thuộc tính của danh mục: {data.category_name}</h5>
          <div className="flex">
            <Button 
              icon="pi pi-plus" 
              className="p-button-success p-button-rounded mr-2" 
              onClick={() => openNewAttribute(data)}
              tooltip="Thêm thuộc tính mới"
            />
            <Button 
              icon="pi pi-list" 
              className="p-button-info p-button-rounded" 
              onClick={() => openSelectAttribute(data)}
              tooltip="Chọn thuộc tính có sẵn"
            />
          </div>
        </div>
        
        <DataTable 
          value={data.attributes || []} 
          stripedRows
          expandedRows={expandedAttributes}
          onRowToggle={(e) => setExpandedAttributes(e.data)}
          rowExpansionTemplate={attributeRowExpansionTemplate}
          emptyMessage="Không có thuộc tính nào"
        >
          <Column expander style={{ width: '3rem' }} />
          <Column field="attribute_type_id" header="ID" style={{ width: '5%', textAlign: 'center' }} />
          <Column field="type_name" header="Tên thuộc tính" style={{ width: '40%' }} />
          <Column 
            field="is_required" 
            header="Bắt buộc" 
            style={{ width: '15%', textAlign: 'center' }}
            body={(rowData) => (
              <Tag 
                severity={rowData.is_required ? 'danger' : 'success'} 
                value={rowData.is_required ? 'Bắt buộc' : 'Tùy chọn'} 
              />
            )} 
          />
          <Column 
            field="values" 
            header="Số giá trị" 
            style={{ width: '15%', textAlign: 'center' }}
            body={(rowData) => (rowData.values?.length || 0) + ' giá trị'} 
          />
          <Column 
            body={(rowData) => (
              <div className="flex justify-content-end">
                <Button
                  icon="pi pi-pencil"
                  className="p-button-rounded p-button-success mr-2"
                  onClick={() => editAttribute(rowData)}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-danger"
                  onClick={() => confirmDeleteAttribute(rowData)}
                />
              </div>
            )}
            style={{ width: '25%', textAlign: 'center' }}
          />
        </DataTable>
      </div>
    );
  };

  // Tạo cột hiển thị số lượng thuộc tính
  const attributesCountTemplate = (rowData) => {
    const count = rowData.attributes?.length || 0;
    return (
      <div>
        <span>{count} thuộc tính</span>
      </div>
    );
  };

  // Hàm toggle hàng mở rộng
  const toggleRow = (rowData) => {
    let _expandedRows = { ...expandedRows };
    if (_expandedRows[rowData.category_id]) {
      delete _expandedRows[rowData.category_id];
    } else {
      _expandedRows[rowData.category_id] = true;
    }
    setExpandedRows(_expandedRows);
  };

  // Định nghĩa các cột và template tùy chỉnh
  const columns = [
    { 
      field: 'category_name', 
      header: 'Tên danh mục', 
      sortable: true, 
      style: { minWidth: '15rem', maxWidth:'20rem' }
    },
    { 
      field: 'description', 
      header: 'Mô tả', 
      sortable: true, 
      style: { minWidth: '15rem', maxWidth:'25rem' } 
    },
    { 
      field: 'attributes', 
      header: 'Thuộc tính', 
      body: attributesCountTemplate,
      style: { minWidth: '8rem', maxWidth: '10rem', textAlign: 'center' } 
    },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Danh sách Danh mục sản phẩm</h4>
      <div>
        <Button 
          icon="pi pi-plus" 
          severity="success" 
          tooltip="Thêm mới" 
          className="mr-2" 
          rounded 
          onClick={openNew} 
        />
        <Button 
          icon="pi pi-refresh" 
          tooltip="Làm mới" 
          className="mr-2" 
          rounded 
          onClick={refreshData} 
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          tooltip="Xóa đã chọn"
          rounded
          onClick={confirmDeleteSelected}
          disabled={!selectedCategories || selectedCategories.length === 0}
        />
      </div>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Tìm kiếm..."
        />
      </span>
    </div>
  );

  return (
    <div>
      <Toast ref={toast} />
      
      <div className="card">
        <DataTable
          value={categories}
          selection={selectedCategories}
          onSelectionChange={(e) => setSelectedCategories(e.value || [])}
          dataKey="category_id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} danh mục"
          globalFilter={globalFilter}
          header={header}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data || {})}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column expander style={{ width: '3rem' }} />
          {columns.map((col, i) => (
            <Column 
              key={i} 
              field={col.field} 
              header={col.header} 
              sortable={col.sortable} 
              style={col.style}
              body={col.body}
            />
          ))}
          <Column
            body={(rowData) => (
              <div className="flex justify-content-end">
                <Button
                  icon="pi pi-pencil"
                  className="p-button-rounded p-button-success mr-2"
                  onClick={() => editCategory(rowData)}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-danger"
                  onClick={() => confirmDeleteCategory(rowData)}
                />
              </div>
            )}
            exportable={false}
            style={{ width: '8rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>
      
      {/* Dialog thêm/sửa danh mục */}
      <Dialog
        visible={categoryDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={category.category_id ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        modal
        className="p-fluid"
        footer={(
          <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveCategory} />
          </React.Fragment>
        )}
        onHide={hideDialog}
      >
        {category.category_id && (
          <div className="field">
            <label htmlFor="category_id" className="font-bold">
              Mã danh mục
            </label>
            <InputText
              id="category_id"
              value={category.category_id}
              disabled
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="category_name" className="font-bold">
            Tên danh mục <span className="text-red-500">*</span>
          </label>
          <InputText
            id="category_name"
            value={category.category_name}
            onChange={(e) => onInputChange(e, 'category_name')}
            required
            autoFocus
            className={classNames({ 'p-invalid': submitted && !category.category_name })}
          />
          {submitted && !category.category_name && <small className="p-error">Tên danh mục là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="description" className="font-bold">
            Mô tả
          </label>
          <InputTextarea
            id="description"
            value={category.description || ''}
            onChange={(e) => onInputChange(e, 'description')}
            rows={5}
          />
        </div>
      </Dialog>
      
      {/* Dialog thêm/sửa thuộc tính */}
      <Dialog
        visible={attributeDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={currentAttribute.attribute_type_id ? "Chỉnh sửa thuộc tính" : "Thêm thuộc tính mới"}
        modal
        className="p-fluid"
        footer={(
          <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideAttributeDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveAttribute} />
          </React.Fragment>
        )}
        onHide={hideAttributeDialog}
      >
        {currentAttribute.attribute_type_id && (
          <div className="field">
            <label htmlFor="attribute_type_id" className="font-bold">
              Mã thuộc tính
            </label>
            <InputText
              id="attribute_type_id"
              value={currentAttribute.attribute_type_id}
              disabled
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="type_name" className="font-bold">
            Tên thuộc tính <span className="text-red-500">*</span>
          </label>
          <InputText
            id="type_name"
            value={currentAttribute.type_name}
            onChange={(e) => onAttributeInputChange(e, 'type_name')}
            required
            autoFocus
            className={classNames({ 'p-invalid': submitted && !currentAttribute.type_name })}
          />
          {submitted && !currentAttribute.type_name && <small className="p-error">Tên thuộc tính là bắt buộc</small>}
        </div>

        <div className="field">
          <label htmlFor="display_order" className="font-bold">
            Thứ tự hiển thị
          </label>
          <InputNumber
            id="display_order"
            value={currentAttribute.display_order}
            onValueChange={(e) => onNumberInputChange(e, 'display_order')}
            min={0}
          />
        </div>

        <div className="field-checkbox">
          <Checkbox
            inputId="is_required"
            checked={currentAttribute.is_required}
            onChange={(e) => onCheckboxChange(e, 'is_required')}
          />
          <label htmlFor="is_required" className="font-bold ml-2">
            Thuộc tính bắt buộc
          </label>
        </div>
      </Dialog>
      
      {/* Dialog thêm/sửa giá trị thuộc tính */}
      <Dialog
        visible={attributeValueDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={currentAttributeValue.attribute_value_id ? "Chỉnh sửa giá trị thuộc tính" : "Thêm giá trị thuộc tính mới"}
        modal
        className="p-fluid"
        footer={(
          <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideAttributeValueDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveAttributeValue} />
          </React.Fragment>
        )}
        onHide={hideAttributeValueDialog}
      >
        {currentAttributeValue.attribute_value_id && (
          <div className="field">
            <label htmlFor="attribute_value_id" className="font-bold">
              Mã giá trị thuộc tính
            </label>
            <InputText
              id="attribute_value_id"
              value={currentAttributeValue.attribute_value_id}
              disabled
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="value_name" className="font-bold">
            Tên giá trị <span className="text-red-500">*</span>
          </label>
          <InputText
            id="value_name"
            value={currentAttributeValue.value_name}
            onChange={(e) => onAttributeValueInputChange(e, 'value_name')}
            required
            autoFocus
            className={classNames({ 'p-invalid': submitted && !currentAttributeValue.value_name })}
          />
          {submitted && !currentAttributeValue.value_name && <small className="p-error">Tên giá trị thuộc tính là bắt buộc</small>}
        </div>
      </Dialog>
      
      {/* Dialog chọn thuộc tính có sẵn */}
      <Dialog
        visible={selectAttributeDialog}
        style={{ width: '50rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header="Chọn thuộc tính có sẵn"
        modal
        className="p-fluid"
        footer={(
          <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideSelectAttributeDialog} />
            <Button label="Thêm vào danh mục" icon="pi pi-check" onClick={saveSelectedAttributes} />
          </React.Fragment>
        )}
        onHide={hideSelectAttributeDialog}
      >
        <div className="field-checkbox mb-3">
          <Checkbox
            inputId="attribute_required"
            checked={attributeRequired}
            onChange={(e) => setAttributeRequired(e.checked)}
          />
          <label htmlFor="attribute_required" className="font-bold ml-2">
            Đặt các thuộc tính được chọn là bắt buộc
          </label>
        </div>
        
        <DataTable
          value={allAttributes}
          selection={selectedAttributes}
          onSelectionChange={(e) => setSelectedAttributes(e.value)}
          dataKey="attribute_type_id"
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="Không có thuộc tính nào có sẵn"
          className="mt-2"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column field="attribute_type_id" header="ID" style={{ width: '10%' }} />
          <Column field="type_name" header="Tên thuộc tính" style={{ width: '50%' }} />
          <Column 
            field="values" 
            header="Số giá trị" 
            style={{ width: '20%', textAlign: 'center' }}
            body={(rowData) => (rowData.values?.length || 0) + ' giá trị'} 
          />
        </DataTable>
      </Dialog>
      
      {/* Các dialog xác nhận xóa */}
      <ConfirmDeleteDialog
        visible={deleteCategoryDialog}
        onHide={() => setDeleteCategoryDialog(false)}
        onConfirm={deleteCategory}
        item={category}
        idField="category_id"
        title="Xác nhận xóa danh mục"
      />
      
      <ConfirmDeleteDialog
        visible={deleteCategoriesDialog}
        onHide={() => setDeleteCategoriesDialog(false)}
        onConfirm={deleteSelectedCategories}
        multiple={true}
        title="Xác nhận xóa các danh mục đã chọn"
      />
      
      <ConfirmDeleteDialog
        visible={deleteAttributeDialog}
        onHide={() => setDeleteAttributeDialog(false)}
        onConfirm={deleteAttribute}
        item={currentAttribute}
        idField="attribute_type_id"
        title="Xác nhận xóa thuộc tính"
        message="Xóa thuộc tính này cũng sẽ xóa tất cả giá trị thuộc tính liên quan. Bạn có chắc chắn muốn tiếp tục?"
      />
      
      <ConfirmDeleteDialog
        visible={deleteAttributeValueDialog}
        onHide={() => setDeleteAttributeValueDialog(false)}
        onConfirm={deleteAttributeValue}
        item={currentAttributeValue}
        idField="attribute_value_id"
        title="Xác nhận xóa giá trị thuộc tính"
      />
    </div>
  );
};

export default Index;