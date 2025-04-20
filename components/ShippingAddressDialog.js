import React, { useState, useRef } from "react"
import { Dialog } from "primereact/dialog"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { InputTextarea } from "primereact/inputtextarea"
import { Tag } from "primereact/tag"
import { Toast } from "primereact/toast"

const ShippingAddressDialog = ({ 
  visible, 
  onHide,
  addresses = [],
  onSave,
  onSetDefault 
}) => {
  const toast = useRef(null)
  const [addressDialogVisible, setAddressDialogVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)

  const handleEditAddress = (address) => {
    setEditingAddress(
      address
        ? {
            ...address,
            address_type: address.address_type || "Nhà riêng",
            is_default: address.is_default === 1 || address.is_default === true,
          }
        : {
            recipient_name: "",
            phone_number: "",
            address: "",
            city: "",
            province: "",
            district: "",
            country: "Việt Nam",
            address_type: "Nhà riêng",
            is_default: false,
          },
    )
    setAddressDialogVisible(true)
  }

  const handleSaveAddress = async () => {
    try {
      // Validate required fields
      if (
        !editingAddress.recipient_name ||
        !editingAddress.phone_number ||
        !editingAddress.address ||
        !editingAddress.city ||
        !editingAddress.province ||
        !editingAddress.country
      ) {
        toast.current.show({
          severity: "warn",
          summary: "Thiếu thông tin",
          detail: "Vui lòng điền đầy đủ thông tin địa chỉ",
          life: 3000,
        })
        return
      }

      // Convert boolean is_default to 0/1
      const addressData = {
        ...editingAddress,
        is_default: editingAddress.is_default ? 1 : 0,
      }

      await onSave(addressData)
      setAddressDialogVisible(false)

    } catch (error) {
      console.error("Error saving address:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể lưu địa chỉ",
        life: 3000,
      })
    }
  }

  const renderAddressDialog = () => (
    <Dialog
      visible={addressDialogVisible}
      style={{ width: "600px" }}
      modal
      onHide={() => setAddressDialogVisible(false)}
      header={editingAddress?.address_id ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setAddressDialogVisible(false)}
          />
          <Button label="Lưu" icon="pi pi-check" onClick={handleSaveAddress} />
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

  return (
    <>
      <Toast ref={toast} />
      
      <Dialog
        visible={visible}
        style={{ width: "600px" }}
        modal
        onHide={onHide}
        header="Chọn địa chỉ giao hàng"
      >
        <div className="address-selection-container">
          {(!addresses || addresses.length === 0) && (
            <div className="p-3 text-center">
              <p>Không có địa chỉ nào</p>
            </div>
          )}

          {Array.isArray(addresses) &&
            addresses.map((address) => (
              <div
                key={address.address_id}
                className={`address-item p-3 mb-3 border-1 border-round ${
                  address.is_default ? "border-primary bg-primary-50" : "border-300"
                }`}
              >
                <div className="address-details">
                  <div className="address-header flex justify-content-between align-items-center mb-2">
                    <div className="flex align-items-center">
                      <span className="recipient-name font-medium">{address.recipient_name}</span>
                      {address.is_default && <Tag severity="success" value="Mặc định" className="ml-2" />}
                    </div>
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-text p-button-rounded"
                      onClick={() => handleEditAddress(address)}
                    />
                  </div>
                  <div className="address-info mb-3">
                    <div>{address.address}</div>
                    <div>{`${address.district ? address.district + ", " : ""}${address.city}, ${address.province}, ${
                      address.country
                    }`}</div>
                    <div>{address.phone_number}</div>
                  </div>
                  <div className="address-actions">
                    {!address.is_default && (
                      <Button
                        label="Chọn làm địa chỉ mặc định"
                        className="p-button-outlined p-button-success"
                        onClick={() => onSetDefault(address.address_id)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          <div className="mt-3">
            <Button
              label="Thêm địa chỉ mới"
              icon="pi pi-plus"
              className="p-button-outlined"
              onClick={() => handleEditAddress(null)}
            />
          </div>
        </div>
      </Dialog>

      {renderAddressDialog()}
    </>
  )
}

export default ShippingAddressDialog 