import React, { useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

function GenericTable({
  data,
  selectedItems,
  setSelectedItems,
  globalFilter,
  setGlobalFilter,
  columns,
  onEdit,
  onDelete,
  onDeleteSelected,
  openNew,
  dataKey,
  title,
  onRefresh
}) {
  const dt = useRef(null);
  
  // Kiểm tra xem một chuỗi có phải là đường dẫn ảnh không
  const isImagePath = (path) => {
    if (!path || typeof path !== 'string') return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  };
  
  // Kiểm tra xem giá trị có phải là số không
  const isNumber = (value) => {
    return typeof value === 'number' || (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value)));
  };
  
  // Kiểm tra xem giá trị có phải là tiền VND không
  const isCurrency = (value, field) => {
    // Kiểm tra theo tên trường - chỉ những từ khóa rõ ràng liên quan đến tiền
    const currencyFields = [
      'price', 'cost', 'gia', 'tien', 'thanhtien', 'tongtien', 'sotien', 
      'giaban', 'gianhap', 'dongia', 'giatri', 'chiphi', 'thue', 'vat', 
      'phiphatsinh', 'doanhthu', 'loinhuan', 'thunhap', 'luong', 'salary', 'amount', 'payment', 'spend'
    ];
    
    // Từ khóa số lượng (không phải tiền tệ)
    const quantityFields = [
      'quantity', 'soluong', 'amount', 'count', 'number', 'qty', 'sl', 
      'tonkho', 'conlai', 'total', 'sum'
    ];
    
    const fieldLower = field.toLowerCase();
    
    // Nếu tên trường rõ ràng là tiền tệ và giá trị là số
    if (currencyFields.some(cf => fieldLower.includes(cf) || fieldLower === cf) && isNumber(value)) {
      return true;
    }
    
    // Nếu tên trường rõ ràng là số lượng thì không phải tiền tệ
    if (quantityFields.some(qf => fieldLower.includes(qf) || fieldLower === qf)) {
      return false;
    }
    
    // Nếu trường có chứa từ "money" hoặc "value" nhưng không có từ khóa số lượng
    if ((fieldLower.includes('money') || fieldLower.includes('value')) && isNumber(value)) {
      return true;
    }
    
    return false;
  };
  
  // Định dạng số tiền VND (đơn vị nghìn, thêm đuôi "đ")
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    return numValue.toLocaleString('vi-VN') + ' đ';
  };
  
  // Kiểm tra xem giá trị có phải là ngày không
  const isDate = (value) => {
    if (!value) return false;
    
    // Kiểm tra chuỗi định dạng ngày tháng (VD: 2023-01-01, 01/01/2023)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    if (typeof value === 'string' && dateRegex.test(value)) return true;
    
    // Kiểm tra đối tượng Date
    if (value instanceof Date && !isNaN(value)) return true;
    
    return false;
  };

  // Kiểm tra xem giá trị có phải là datetime không
  const isDateTime = (value) => {
    if (!value) return false;
    
    // Kiểm tra chuỗi định dạng datetime (VD: 2023-01-01T12:30:45, 2023-01-01 12:30:45)
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
    if (typeof value === 'string' && dateTimeRegex.test(value)) return true;
    
    // Kiểm tra đối tượng Date có giờ phút giây không phải 00:00:00
    if (value instanceof Date && !isNaN(value)) {
      return value.getHours() !== 0 || value.getMinutes() !== 0 || value.getSeconds() !== 0;
    }
    
    return false;
  };

  // Định dạng giá trị datetime thành chuỗi
  const formatDateTime = (value) => {
    if (!value) return '';
    
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date)) return value;
      
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    } catch (error) {
      console.error('Lỗi khi định dạng datetime:', error);
      return value;
    }
  };
  
  // Template mặc định để hiển thị dữ liệu dựa vào loại
  const defaultBodyTemplate = (rowData, col) => {
    const value = rowData[col.field];
    
    // Nếu là đường dẫn ảnh, hiển thị ảnh
    if (isImagePath(value)) {
      return <img src={value} alt={`${col.header}`} style={{ width: '50px', height: 'auto' }} />;
    }
    
    // Nếu là tiền VND, định dạng tiền tệ và căn phải
    if (isCurrency(value, col.field)) {
      return <div style={{ textAlign: 'right' }}>{formatCurrency(value)}</div>;
    }
    
    // Nếu là datetime, định dạng và căn phải
    if (isDateTime(value)) {
      return <div style={{ textAlign: 'right' }}>{formatDateTime(value)}</div>;
    }
    
    // Nếu là ngày, căn phải
    if (isDate(value)) {
      return <div style={{ textAlign: 'right' }}>{value}</div>;
    }
    
    // Nếu là số, căn phải
    if (isNumber(value)) {
      return <div style={{ textAlign: 'right' }}>{value}</div>;
    }
    
    // Nếu là kiểu dữ liệu khác, hiển thị bình thường
    return value;
  };
  
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        {onEdit !== null && <Button icon="pi pi-pencil" className="mr-2" rounded outlined onClick={() => onEdit(rowData)} />}
        {onDelete !== null && <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => onDelete(rowData)} />}    
      </React.Fragment>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">{title}</h4>
      <div style={{ float: 'right' }}>
        <Button
          label=""
          icon="pi pi-plus"
          severity="success"
          tooltip="Thêm mới"
          onClick={openNew}
        />{' '}
        &nbsp;&nbsp;
        {/* <Button
          label=""
          icon="pi pi-trash"
          severity="danger"
          tooltip="Xóa đã chọn"
          onClick={onDeleteSelected}
          disabled={!selectedItems || !selectedItems.length}
        />{' '} */}
        &nbsp;&nbsp;
        <Button
          label=""
          icon="pi pi-upload"
          tooltip="Xuất Excel"
          className="p-button-help"
          onClick={() => dt.current.exportCSV()}
        />{' '}
        {onRefresh && (
          <>
            &nbsp;&nbsp;
            <Button
              label=""
              icon="pi pi-refresh"
              tooltip="Làm mới"
              severity="info"
              onClick={onRefresh}
            />
            {' '}
          </>
        )}
        &nbsp;
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            onInput={(e) => setGlobalFilter(e.target.value)}
            placeholder="Tìm kiếm..."
          />
        </span>
      </div>
    </div>
  );

  return (
    <div className="card">
      <DataTable
        ref={dt}
        value={data}
        selection={selectedItems}
        onSelectionChange={(e) => setSelectedItems(e.value)}
        dataKey={dataKey}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        globalFilter={globalFilter}
        header={header}
      >
        <Column selectionMode="multiple" exportable={false}></Column>
        {columns.map((col) => {
          const determineStyle = () => {
            if (col.style) return col.style;

            if (data && data.length > 0) {
              const sampleValue = data[0][col.field];
              if (isNumber(sampleValue) || isDate(sampleValue) || isDateTime(sampleValue) || 
                  isCurrency(sampleValue, col.field)) {
                return { textAlign: 'right' };
              }
            }

            return {};
          };

          const determineHeaderStyle = () => {
            return col.headerStyle || { textAlign: 'center' };
          };

          return (
            <Column 
              key={col.field} 
              field={col.field} 
              header={col.header} 
              sortable={col.sortable !== false}
              style={determineStyle()}
              headerStyle={determineHeaderStyle()}
              body={col.body || ((rowData) => defaultBodyTemplate(rowData, col))}
            />
          );
        })}

        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '1rem' }}></Column>
      </DataTable>
    </div>
  );
}

export default GenericTable;