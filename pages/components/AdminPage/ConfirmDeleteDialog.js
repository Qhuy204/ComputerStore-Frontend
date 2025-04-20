import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

function ConfirmDeleteDialog({
  visible,
  onHide,
  onConfirm,
  onSuccess,
  item,
  idField,
  multiple,
  title
}) {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const toast = useRef(null);

  // Tạo hàm xử lý để thực hiện xóa và hiển thị thông báo thành công
  const handleConfirmAndHide = async () => {
    try {
      await onConfirm();  // Thực hiện xác nhận xóa (giả định onConfirm trả về Promise)
      onHide();           // Ẩn dialog xác nhận
      setShowSuccessDialog(true); // Hiển thị dialog thành công
      
      // Nếu có hàm callback thành công, gọi nó
      if (onSuccess) {
        onSuccess();
      }
      
      // Hiển thị toast thông báo
      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: multiple ? 'Xóa các mục đã chọn thành công' : `Xóa mục (ID: ${item[idField]}) thành công`,
        life: 3000,
      });
    } catch (error) {
      // Xử lý lỗi
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa. Vui lòng thử lại sau.',
        life: 3000,
      });
    }
  };

  // Đóng dialog thành công và refresh dữ liệu
  const closeSuccessDialog = () => {
    setShowSuccessDialog(false);
  };

  return (
    <>
      <Toast ref={toast} />
      
      {/* Dialog xác nhận xóa */}
      <Dialog
        visible={visible}
        style={{ width: '32rem' }}
        header={title || "Xác nhận xóa"}
        modal
        footer={(
          <React.Fragment>
            <Button 
              label="Không" 
              icon="pi pi-times" 
              outlined 
              onClick={onHide} 
            />
            <Button 
              label="Có" 
              icon="pi pi-check" 
              severity="danger" 
              onClick={handleConfirmAndHide} 
            />
          </React.Fragment>
        )}
        onHide={onHide}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          {multiple ? (
            <span>Bạn có chắc muốn xóa các mục đã chọn?</span>
          ) : (
            item && idField && (
              <span>
                Bạn có chắc muốn xóa mục này (ID: {item[idField]})?
              </span>
            )
          )}
        </div>
      </Dialog>

      {/* Dialog thông báo xóa thành công */}
      <Dialog
        visible={showSuccessDialog}
        style={{ width: '32rem' }}
        header="Thành công"
        modal
        footer={(
          <React.Fragment>
            <Button 
              label="Đóng" 
              icon="pi pi-check" 
              onClick={closeSuccessDialog} 
              autoFocus
            />
          </React.Fragment>
        )}
        onHide={closeSuccessDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-check-circle mr-3 text-green-500" style={{ fontSize: '2rem' }} />
          <span>
            {multiple 
              ? 'Các mục đã được xóa thành công!' 
              : `Mục (ID: ${item?.[idField]}) đã được xóa thành công!`}
          </span>
        </div>
      </Dialog>
    </>
  );
}

export default ConfirmDeleteDialog;