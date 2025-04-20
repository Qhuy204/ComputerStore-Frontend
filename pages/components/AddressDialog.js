import React from "react"
import { Dialog } from "primereact/dialog"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { InputTextarea } from "primereact/inputtextarea"

const AddressDialog = ({
  visible,
  onHide,
  editingAddress,
  setEditingAddress,
  onSave,
  isEditing,
}) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: "600px" }}
      modal
      onHide={onHide}
      header={isEditing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onHide}
          />
          <Button label="Lưu" icon="pi pi-check" onClick={onSave} />
        </div>
      }
    >
      <div className="p-fluid grid formgrid">
        <div className="field col-12 md:col-6">
          <label htmlFor="recipientName" className="font-medium mb-2 block">
            Tên người nhận
          </label>
          <InputText
            id="recipientName"
            value={editingAddress?.recipient_name || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, recipient_name: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="phoneNumber" className="font-medium mb-2 block">
            Số điện thoại
          </label>
          <InputText
            id="phoneNumber"
            value={editingAddress?.phone_number || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, phone_number: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12">
          <label htmlFor="address" className="font-medium mb-2 block">
            Địa chỉ chi tiết
          </label>
          <InputTextarea
            id="address"
            autoResize
            rows={2}
            value={editingAddress?.address || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="city" className="font-medium mb-2 block">
            Thành phố
          </label>
          <InputText
            id="city"
            value={editingAddress?.city || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="province" className="font-medium mb-2 block">
            Tỉnh
          </label>
          <InputText
            id="province"
            value={editingAddress?.province || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, province: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="district" className="font-medium mb-2 block">
            Quận/Huyện
          </label>
          <InputText
            id="district"
            value={editingAddress?.district || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, district: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="country" className="font-medium mb-2 block">
            Quốc gia
          </label>
          <InputText
            id="country"
            value={editingAddress?.country || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="addressType" className="font-medium mb-2 block">
            Loại địa chỉ
          </label>
          <InputText
            id="addressType"
            value={editingAddress?.address_type || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, address_type: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6 flex align-items-center">
          <div className="p-field-checkbox">
            <input
              type="checkbox"
              id="isDefault"
              checked={editingAddress?.is_default}
              onChange={(e) => setEditingAddress({ ...editingAddress, is_default: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isDefault">Đặt làm địa chỉ mặc định</label>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default AddressDialog