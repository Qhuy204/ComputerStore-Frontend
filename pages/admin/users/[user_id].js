import React, { useState, useEffect, useRef } from "react"
import { Card } from "primereact/card"
import { TabView, TabPanel } from "primereact/tabview"
import { Button } from "primereact/button"
import { InputTextarea } from "primereact/inputtextarea"
import { Avatar } from "primereact/avatar"
import { Tag } from "primereact/tag"
import { Toast } from "primereact/toast"
import { useRouter } from "next/navigation"
import { Dialog } from "primereact/dialog"
import { InputText } from "primereact/inputtext" 
import usersService from "../../Services/usersService"
import ordersService from "../../Services/ordersService"
import addressService from "../../Services/addressService"
import AddressDialog from "../../components/AddressDialog"

const UserDetails = () => {
  const router = useRouter()
  const toast = useRef(null)
  const [activeTab, setActiveTab] = useState(0)
  const [user, setUser] = useState(null)
  const [userId, setUserId] = useState(null)
  const [orders, setOrders] = useState([])
  const [unpaidOrders, setUnpaidOrders] = useState([])
  const [paidOrders, setPaidOrders] = useState([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [addressDialogVisible, setAddressDialogVisible] = useState(false)
  const [addressSelectionDialogVisible, setAddressSelectionDialogVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [userAddresses, setUserAddresses] = useState([])
  const [selectedDefaultAddress, setSelectedDefaultAddress] = useState(null)
  const [editContactDialog, setEditContactDialog] = useState(false)
  const [editingContact, setEditingContact] = useState({
    email: "",
    phone_number: "",
    full_name: "",
    birthday: "",
    gender: "",
  })
  const [isValidUserId, setIsValidUserId] = useState(true)

  // Fetch user addresses when userId is available
  useEffect(() => {
    const fetchUserAddresses = async () => {    
      if (!userId || !isValidUserId) return
      try {
        console.log("Fetching addresses for userId:", userId)

        // Explicitly convert userId to number to ensure exact matching
        const numericUserId = Number.parseInt(userId, 10)
        const addresses = await addressService.getById(numericUserId)

        console.log("Raw fetched addresses:", addresses)

        let addressesArray = []

        if (Array.isArray(addresses)) {
          // If it's already an array, use it directly
          addressesArray = addresses
        } else if (addresses && typeof addresses === "object") {
          // If it's a single object or wrapped response, handle accordingly
          if ("data" in addresses && Array.isArray(addresses.data)) {
            // Handle wrapped response (like { data: [...] })
            addressesArray = addresses.data
          } else if ("address_id" in addresses) {
            // Handle single object response
            addressesArray = [addresses]
          } else if (Object.keys(addresses).length > 0) {
            // Handle object-of-objects or other formats
            addressesArray = Object.values(addresses)
          }
        }

        console.log("Processed addresses array:", addressesArray)

        // Set all addresses in state
        if (addressesArray.length > 0) {
          setUserAddresses(addressesArray)
        } else {
          console.log("No addresses found")
          setUserAddresses([])
        }

        // Set default address
        const defaultAddress = addressesArray.find((address) => address.is_default === 1 || address.is_default === true)
        setSelectedDefaultAddress(defaultAddress || null)
      } catch (error) {
        console.error("Error fetching user addresses:", error)

        if (toast.current) {
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải địa chỉ",
            life: 3000,
          })
        }
      }
    }

    fetchUserAddresses()
  }, [userId, isValidUserId])

  // Handle setting a new default address with 1/0 values for is_default
  const handleSetDefaultAddress = async (addressId) => {
    try {
      setLoading(true)

      // Cập nhật tất cả địa chỉ của người dùng thành không mặc định (0)
      const addressesArray = Array.isArray(userAddresses) ? userAddresses : []
      const updatePromises = addressesArray.map((address) =>
        addressService.update({
          address_id: address.address_id,
          is_default: 0, // Sử dụng 0 thay vì false
        }),
      )

      // Đợi tất cả các địa chỉ được cập nhật thành không mặc định
      await Promise.all(updatePromises)

      // Sau đó mới cập nhật địa chỉ được chọn thành mặc định (1)
      await addressService.update({
        address_id: addressId,
        is_default: 1, // Sử dụng 1 thay vì true
      })

      // Refresh addresses list after update
      const updatedAddresses = await addressService.getById(userId)

      // Process response to ensure we have an array of addresses
      let updatedAddressesArray = []
      if (Array.isArray(updatedAddresses)) {
        updatedAddressesArray = updatedAddresses
      } else if (updatedAddresses && typeof updatedAddresses === "object") {
        if ("data" in updatedAddresses && Array.isArray(updatedAddresses.data)) {
          updatedAddressesArray = updatedAddresses.data
        } else if ("address_id" in updatedAddresses) {
          updatedAddressesArray = [updatedAddresses]
        } else if (Object.keys(updatedAddresses).length > 0) {
          updatedAddressesArray = Object.values(updatedAddresses)
        }
      }

      // Update local state with refreshed data
      setUserAddresses(updatedAddressesArray)

      // Find and set the new default address
      const newDefaultAddress = updatedAddressesArray.find(
        (address) => address.is_default === 1 || address.is_default === true,
      )
      setSelectedDefaultAddress(newDefaultAddress)

      // Kiểm tra toast tồn tại trước khi sử dụng
      if (toast && toast.current) {
        toast.current.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã cập nhật địa chỉ mặc định",
          life: 3000,
        })
      }
    } catch (error) {
      console.error("Error setting default address:", error)
      // Kiểm tra toast tồn tại trước khi sử dụng
      if (toast && toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể đặt địa chỉ mặc định",
          life: 3000,
        })
      }
    } finally {
      setLoading(false)
    }
  }
  // Address selection dialog
  const renderAddressSelectionDialog = () => (
    <Dialog
      visible={addressSelectionDialogVisible}
      style={{ width: "600px" }}
      modal
      onHide={() => setAddressSelectionDialogVisible(false)}
      header="Quản lý địa chỉ"
    >
      <div className="address-selection-container">
        {(!userAddresses || userAddresses.length === 0) && (
          <div className="p-3 text-center">
            <p>Không có địa chỉ nào</p>
          </div>
        )}

        {Array.isArray(userAddresses) &&
          userAddresses.map((address) => (
            <div
              key={address.address_id}
              className={`address-item p-3 mb-3 border-1 border-round ${address.is_default ? "border-primary bg-primary-50" : "border-300"}`}
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
                    onClick={() => {
                      setEditingAddress(address)
                      setAddressSelectionDialogVisible(false)
                      setAddressDialogVisible(true)
                    }}
                  />
                </div>
                <div className="address-info mb-3">
                  <div>{address.address}</div>
                  <div>{`${address.district ? address.district + ", " : ""}${address.city}, ${address.province}, ${address.country}`}</div>
                  <div>{address.phone_number}</div>
                </div>
                <div className="address-actions">
                  {!address.is_default && (
                    <Button
                      label="Chọn làm địa chỉ mặc định"
                      className="p-button-outlined p-button-success"
                      onClick={() => handleSetDefaultAddress(address.address_id)}
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
            onClick={() => {
              setAddressSelectionDialogVisible(false)
              handleEditAddress(null)
            }}
          />
        </div>
      </div>
    </Dialog>
  )

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      
      if (storedUserId) {
        // Check if userId is a valid integer
        const numericUserId = Number.parseInt(storedUserId, 10)
        
        if (!isNaN(numericUserId) && String(numericUserId) === storedUserId) {
          setUserId(numericUserId)
          setIsValidUserId(true)
        } else {
          setIsValidUserId(false)
          if (toast.current) {
            toast.current.show({ 
              severity: "error", 
              summary: "Lỗi", 
              detail: "ID người dùng không hợp lệ. ID phải là một số nguyên.", 
              life: 3000 
            })
          }
          // Redirect back to users list after a short delay
          setTimeout(() => {
            router.push("/admin/users")
          }, 3000)
        }
      } else if (toast.current) {
        toast.current.show({ 
          severity: "error", 
          summary: "Lỗi", 
          detail: "Không tìm thấy ID người dùng", 
          life: 3000 
        })
      }
    }
  }, [router])

  const formatBirthdayForDateInput = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Phân tích chuỗi ngày tháng
      let parts;
      
      // Kiểm tra xem chuỗi có định dạng dd/mm/yyyy hoặc d/m/yyyy không
      if (dateString.includes('/')) {
        parts = dateString.split('/');
        
        // Đảm bảo định dạng ngày tháng đúng
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Tạo chuỗi YYYY-MM-DD cho input type="date"
        // Thêm số 0 phía trước nếu cần
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
      
      // Nếu đã ở định dạng YYYY-MM-DD
      if (dateString.includes('-') && dateString.length >= 10) {
        // Kiểm tra xem đã đúng định dạng YYYY-MM-DD chưa
        const regex = /^\d{4}-\d{2}-\d{2}/;
        if (regex.test(dateString)) {
          return dateString.substring(0, 10);
        }
        
        // Nếu là định dạng DD-MM-YYYY
        parts = dateString.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // Đã là YYYY-MM-DD
            return dateString.substring(0, 10);
          } else {
            // Là DD-MM-YYYY, cần chuyển thành YYYY-MM-DD
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      
      // Nếu là định dạng ISO hoặc định dạng khác, sử dụng Date nhưng tránh trượt ngày
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Tạo chuỗi YYYY-MM-DD với các thành phần ngày tháng riêng lẻ
        // Điều này tránh được vấn đề múi giờ
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() trả về 0-11
        const day = date.getDate();
        
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error("Error formatting birthday:", error);
    }
    
    return dateString; // Trả về nguyên bản nếu không thể chuyển đổi
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isValidUserId) return
      
      try {
        setLoading(true)
        const userData = await usersService.getById(userId)
        
        // Check if we got valid user data back
        if (!userData) {
          setLoading(false)
          if (toast.current) {
            toast.current.show({
              severity: "error",
              summary: "Lỗi",
              detail: "Không tìm thấy thông tin khách hàng",
              life: 3000,
            })
          }
          return
        }
        
        setUser(userData)
        
        // Sử dụng hàm mới để định dạng ngày sinh
        const formattedBirthday = formatBirthdayForDateInput(userData.birthday);
        
        setEditingContact({
          email: userData.email || "",
          phone_number: userData.phone_number || "",
          full_name: userData.full_name || "",
          birthday: formattedBirthday,
          gender: userData.gender || "",
        })
        
        const allOrders = await ordersService.getAll()
        const userOrders = allOrders.filter((order) => order.user_id === Number.parseInt(userId))
        
        // Group orders by status instead of payment status
        const pendingOrders = userOrders.filter(order => 
          order.status === "Pending" || order.status === "Processing"
        )
        
        const shippedOrders = userOrders.filter(order => 
          order.status === "Shipped"
        )
        
        const deliveredOrders = userOrders.filter(order => 
          order.status === "Delivered"
        )
        
        const cancelledOrders = userOrders.filter(order => 
          order.status === "Cancelled"
        )
        
        setOrders(userOrders)
        setPaidOrders(deliveredOrders) // Use deliveredOrders for calculations instead of payment status
        setUnpaidOrders(pendingOrders) // Use pendingOrders for the "unpaid" tab which will be renamed
        
        setNotes(userData.notes || "")
        setLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        if (toast.current)
          toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể tải thông tin khách hàng",
            life: 3000,
          })
        setLoading(false)
      }
    }
    
    if (userId && isValidUserId) fetchUserData()
  }, [userId, isValidUserId])

  // Helper function to get tag severity based on order status
  const getStatusSeverity = (status) => {
    switch(status) {
      case 'Pending':
      case 'Processing':
        return 'warning';
      case 'Shipped':
        return 'info';
      case 'Delivered':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Helper function to get status display text in Vietnamese
  const getStatusDisplayText = (status) => {
    switch(status) {
      case 'Pending':
      case 'Processing':
        return 'Chờ xác nhận';
      case 'Shipped':
        return 'Đang vận chuyển';
      case 'Delivered':
        return 'Đã giao hàng';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };


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
        if (toast && toast.current) {
          toast.current.show({
            severity: "warn",
            summary: "Thiếu thông tin",
            detail: "Vui lòng điền đầy đủ thông tin địa chỉ",
            life: 3000,
          })
        }
        return
      }

      // Prepare address data - convert boolean to 0/1
      const addressData = {
        user_id: userId,
        recipient_name: editingAddress.recipient_name,
        phone_number: editingAddress.phone_number,
        address: editingAddress.address,
        city: editingAddress.city,
        province: editingAddress.province,
        district: editingAddress.district || "",
        country: editingAddress.country,
        address_type: editingAddress.address_type || "Nhà riêng",
        is_default: editingAddress.is_default ? 1 : 0, // Convert boolean to 0/1
      }

      // Nếu đang đặt địa chỉ này là mặc định, cập nhật tất cả địa chỉ khác trước
      if (addressData.is_default === 1) {
        const addressesArray = Array.isArray(userAddresses) ? userAddresses : []

        // Nếu đang chỉnh sửa địa chỉ hiện có
        if (editingAddress.address_id) {
          // Cập nhật các địa chỉ khác thành không mặc định
          const updatePromises = addressesArray
            .filter((addr) => addr.address_id !== editingAddress.address_id)
            .map((addr) =>
              addressService.update({
                address_id: addr.address_id,
                is_default: 0,
              }),
            )

          await Promise.all(updatePromises)
        } else {
          // Nếu thêm mới và muốn đặt làm mặc định, cập nhật tất cả địa chỉ khác thành không mặc định
          const updatePromises = addressesArray.map((addr) =>
            addressService.update({
              address_id: addr.address_id,
              is_default: 0,
            }),
          )

          await Promise.all(updatePromises)
        }
      }

      // Update or insert address
      if (editingAddress.address_id) {
        addressData.address_id = editingAddress.address_id
        await addressService.update(addressData)
      } else {
        await addressService.insert(addressData)
      }

      if (toast && toast.current) {
        toast.current.show({
          severity: "success",
          summary: "Thành công",
          detail: editingAddress.address_id ? "Cập nhật địa chỉ thành công" : "Thêm địa chỉ mới thành công",
          life: 3000,
        })
      }

      // Close dialog and refresh addresses
      setAddressDialogVisible(false)

      // Refresh addresses
      const updatedAddresses = await addressService.getById(userId)

      // Process response to ensure we have an array of addresses
      let updatedAddressesArray = []
      if (Array.isArray(updatedAddresses)) {
        updatedAddressesArray = updatedAddresses
      } else if (updatedAddresses && typeof updatedAddresses === "object") {
        if ("data" in updatedAddresses && Array.isArray(updatedAddresses.data)) {
          updatedAddressesArray = updatedAddresses.data
        } else if ("address_id" in updatedAddresses) {
          updatedAddressesArray = [updatedAddresses]
        } else if (Object.keys(updatedAddresses).length > 0) {
          updatedAddressesArray = Object.values(updatedAddresses)
        }
      }

      setUserAddresses(updatedAddressesArray)

      // Update default address
      const newDefaultAddress = updatedAddressesArray.find((addr) => addr.is_default === 1 || addr.is_default === true)
      setSelectedDefaultAddress(newDefaultAddress)
    } catch (error) {
      console.error("Error saving address:", error)
      if (toast && toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể lưu địa chỉ",
          life: 3000,
        })
      }
    }
  }

  const handleEditAddress = (address) => {
    // Khi mở form chỉnh sửa địa chỉ, chuyển đổi is_default từ 0/1 thành boolean để checkbox hoạt động đúng
    setEditingAddress(
      address
        ? {
            ...address,
            address_type: address.address_type || "Nhà riêng",
            // Chuyển đổi 0/1 thành boolean cho giao diện form
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

  const handleEditContact = () => {
    // Sử dụng hàm mới để định dạng ngày sinh
    const formattedBirthday = formatBirthdayForDateInput(user.birthday);
    
    setEditingContact({
      email: user.email || "",
      phone_number: user.phone_number || "",
      full_name: user.full_name || "",
      birthday: formattedBirthday,
      gender: user.gender || "",
    });
    setEditContactDialog(true);
  };

  const handleSaveContact = async () => {
    try {
      // Only include the necessary fields to avoid issues with date formats
      const updatedUserData = {
        user_id: user.user_id,
        email: editingContact.email,
        phone_number: editingContact.phone_number,
        full_name: editingContact.full_name,
        birthday: editingContact.birthday, // Đã ở định dạng YYYY-MM-DD
        gender: editingContact.gender,
      };

      await usersService.update(updatedUserData);

      // Update local user state with only the changed fields
      setUser({
        ...user,
        email: editingContact.email,
        phone_number: editingContact.phone_number,
        full_name: editingContact.full_name,
        birthday: editingContact.birthday,
        gender: editingContact.gender,
      });

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Cập nhật thông tin liên hệ thành công",
        life: 3000,
      });

      setEditContactDialog(false);
    } catch (error) {
      console.error("Error updating contact info:", error);
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể cập nhật thông tin liên hệ",
        life: 3000,
      });
    }
  };

  const handleBackClick = () => {
    router.push("/admin/users")
  }

  const handleDeleteClick = () => {
    setDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await usersService.delete(userId)

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Đã xóa khách hàng",
        life: 3000,
      })

      // Navigate back after deletion
      setTimeout(() => {
        router.push("/admin/users")
      }, 1000)
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể xóa khách hàng",
        life: 3000,
      })
    } finally {
      setDeleteDialog(false)
    }
  }

  const saveNotes = async () => {
    try {
      // Only include the necessary fields to avoid issues with date formats
      const updatedNotes = {
        user_id: user.user_id,
        notes: notes,
      }

      await usersService.update(updatedNotes)

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Lưu ghi chú thành công",
        life: 3000,
      })
    } catch (error) {
      console.error("Error saving notes:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể lưu ghi chú",
        life: 3000,
      })
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
      .format(value)
      .replace("₫", "đ")
  }

  const calculateStats = () => {
    if (!user || !paidOrders || paidOrders.length === 0) {
      return {
        lastOrderDate: "N/A",
        totalDays: 0,
        totalOrders: orders.length || 0,
        ordersPerMonth: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      }
    }

    // Find most recent order from all orders
    const allSortedOrders = [...orders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
    const lastOrder = allSortedOrders[0]
    
    // Only use paid orders for financial calculations
    const sortedPaidOrders = [...paidOrders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date))

    const lastOrderDate = new Date(lastOrder.order_date)

    // Calculate days from first order using all orders
    const firstOrderDate = new Date(allSortedOrders[allSortedOrders.length - 1].order_date)
    const currentDate = new Date()
    const totalDays = Math.floor((currentDate - firstOrderDate) / (1000 * 60 * 60 * 24)) || 1

    // Calculate total spending from paid orders only
    const totalSpent = paidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // Calculate average orders per month
    const monthsDiff =
      (currentDate.getFullYear() - firstOrderDate.getFullYear()) * 12 +
        currentDate.getMonth() -
        firstOrderDate.getMonth() || 1

    const ordersPerMonth = Math.round(orders.length / monthsDiff) || orders.length

    return {
      lastOrderDate: lastOrderDate.toLocaleDateString("vi-VN"),
      totalDays: totalDays,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      ordersPerMonth: ordersPerMonth,
      totalSpent: totalSpent,
      averageOrderValue: paidOrders.length > 0 ? totalSpent / paidOrders.length : 0,
      totalUnpaid: unpaidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    }
  }

  const stats = calculateStats()

  if (loading) {
    return <div className="p-5 text-center">Đang tải thông tin khách hàng...</div>
  }

  if (!isValidUserId) {
    return <div className="p-5 text-center">ID người dùng không hợp lệ. Đang chuyển về trang danh sách...</div>
  }

  if (!user) {
    return <div className="p-5 text-center">Không tìm thấy thông tin khách hàng</div>
  }

  const deleteDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialog(false)} />
      <Button label="Xóa" icon="pi pi-trash" className="p-button-danger" onClick={confirmDelete} />
    </React.Fragment>
  )

  return (
    <div className="user-details-container p-4">
      <Toast ref={toast} />

      <div className="flex flex-column">
        <Button
          icon="pi pi-arrow-left"
          label="Quay lại"
          className="p-button-text mb-3 align-self-start"
          onClick={handleBackClick}
        />

        <div className="flex justify-content-between align-items-center mb-3">
          <h1 className="text-xl font-bold m-0">Thông tin khách hàng</h1>
          <Button label="Xóa khách hàng" icon="pi pi-trash" className="p-button-danger" onClick={handleDeleteClick} />
        </div>
      </div>

      <Card className="mb-4">
        <div className="flex align-items-center mb-4">
          <Avatar label={user.full_name?.charAt(0) || "HD"} size="large" shape="circle" className="bg-primary mr-3" />
          <h2 className="text-xl font-bold">{user.full_name || "Haravan Demo"}</h2>
        </div>

        <div className="grid">
          {/* Left column */}
          <div className="col-12 md:col-6 lg:col-4">
            <div className="flex align-items-start mb-4">
              <i className="pi pi-heart text-primary mr-2 mt-1"></i>
              <div>
                <div className="font-medium mb-2">Đã gắn bó với cửa hàng</div>
                <div className="text-lg font-bold">{stats.totalDays} ngày</div>
                <div className="text-sm text-500">Ngày mua gần nhất {stats.lastOrderDate}</div>
              </div>
            </div>

            <div className="flex align-items-start mb-4">
              <i className="pi pi-file text-primary mr-2 mt-1"></i>
              <div>
                <div className="font-medium mb-2">Tổng số đơn đã mua</div>
                <div className="text-lg font-bold">{stats.totalOrders} đơn</div>
                <div className="text-sm text-500">Mua {stats.ordersPerMonth} đơn/tháng</div>
              </div>
            </div>

            <div className="flex align-items-start">
              <i className="pi pi-dollar text-primary mr-2 mt-1"></i>
              <div>
                <div className="font-medium mb-2">Tổng chi tiêu (đã thanh toán)</div>
                <div className="text-lg font-bold">{formatCurrency(stats.totalSpent)}</div>
                <div className="text-sm text-500">Trung bình {formatCurrency(stats.averageOrderValue)}/đơn</div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-12 md:col-6 lg:col-8">
            <div className="flex align-items-start">
              <i className="pi pi-chart-line text-primary mr-2 mt-1"></i>
              <div className="w-full">
                <div className="font-medium mb-3">Số đơn và chi tiêu thời gian gần đây</div>

                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="text-sm text-500 mb-1">Số đơn đã mua</div>
                    <div className="text-sm mb-1">Tổng cộng</div>
                    <div className="text-lg font-bold mb-1">{stats.totalOrders} đơn</div>
                    <div className="text-sm text-500">Đã thanh toán: {stats.paidOrders} đơn</div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="text-sm text-500 mb-1">Chi tiêu</div>
                    <div className="text-lg font-bold mb-1">{formatCurrency(stats.totalSpent)}</div>
                    <div className="text-sm text-500">
                      Trung bình {formatCurrency(stats.averageOrderValue)}/đơn
                    </div>
                    {stats.totalUnpaid > 0 && (
                      <div className="text-sm text-orange-500 mt-2">
                        Chưa thanh toán: {formatCurrency(stats.totalUnpaid)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid">
        {/* Left column */}
        <div className="col-12 lg:col-8">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header="Đơn hàng">
            {orders.length > 0 ? (
              <>
                {orders.map((order) => (
                  <div key={order.order_id} className="border-bottom-1 border-300 py-3">
                    <div className="flex justify-content-between align-items-center">
                      <div>
                        <div className="mb-2">
                          <a href={`/admin/orders/${order.order_id}`} className="text-primary font-medium">
                            Mã đơn hàng #{order.order_id}
                          </a>
                          <Tag 
                            severity={getStatusSeverity(order.status)} 
                            value={getStatusDisplayText(order.status)} 
                            className="ml-2" 
                          />
                        </div>
                        <div className="text-lg font-bold">{formatCurrency(order.total_amount)}</div>
                      </div>
                      <div className="flex align-items-center">
                        <span className="text-500 mr-3">
                          {new Date(order.order_date).toLocaleDateString("vi-VN")}
                        </span>
                        <Button
                          icon="pi pi-chevron-right"
                          className="p-button-text p-button-rounded"
                          onClick={() => {
                            // Save the current order ID to localStorage
                            localStorage.setItem('currentOrderId', order.order_id);
                            // Navigate to the specific order details page
                            router.push(`/admin/orders/${order.order_id}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-content-end mt-3">
                  <Button
                    label="Xem tất cả"
                    className="p-button-outlined p-button-secondary"
                    icon="pi pi-external-link"
                  />
                </div>
              </>
            ) : (
              <div className="p-3 text-center">
                <p>Khách hàng chưa có đơn hàng nào</p>
              </div>
            )}
          </TabPanel>
          <TabPanel header="Chờ xử lý">
            {unpaidOrders.length > 0 ? (
              <>
                {unpaidOrders.map((order) => (
                  <div key={order.order_id} className="border-bottom-1 border-300 py-3">
                    <div className="flex justify-content-between align-items-center">
                      <div>
                        <div className="mb-2">
                          <a href={`/admin/orders/${order.order_id}`} className="text-primary font-medium">
                            Mã đơn hàng #{order.order_id}
                          </a>
                          <Tag 
                            severity="warning" 
                            value="Chờ xác nhận" 
                            className="ml-2" 
                          />
                        </div>
                        <div className="text-lg font-bold text-orange-500">{formatCurrency(order.total_amount)}</div>
                      </div>
                      <div className="flex align-items-center">
                        <span className="text-500 mr-3">
                          {new Date(order.order_date).toLocaleDateString("vi-VN")}
                        </span>
                        <Button
                          icon="pi pi-chevron-right"
                          className="p-button-text p-button-rounded"
                          onClick={() => router.push(`/admin/orders/${order.order_id}`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {unpaidOrders.length > 0 && (
                  <div className="flex justify-content-between align-items-center p-3 mt-3 bg-orange-50 border-round">
                    <div className="text-lg font-bold">Tổng giá trị đơn chờ xử lý:</div>
                    <div className="text-xl font-bold text-orange-500">
                      {formatCurrency(unpaidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 text-center">
                <p>Không có đơn hàng nào đang chờ xử lý</p>
              </div>
            )}
          </TabPanel>
        </TabView>
        </div>

        {/* Right column */}
        <div className="col-12 lg:col-4">
          <Card className="mb-3">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Thông tin liên hệ</h3>
              <Button icon="pi pi-pencil" className="p-button-text p-button-rounded" onClick={handleEditContact} />
            </div>
            {user.email && (
              <div className="mb-3">
                <a href={`mailto:${user.email}`} className="text-primary">
                  {user.email}
                </a>
              </div>
            )}
            {user.phone_number && (
              <div className="mb-3">
                <a href={`tel:${user.phone_number}`} className="text-primary">
                  {user.phone_number}
                </a>
              </div>
            )}
            {user.birthday && (
              <div className="mb-3">
                <span className="text-500 mr-2">Ngày sinh:</span>
                <span>{new Date(user.birthday).toLocaleDateString("vi-VN")}</span>
              </div>
            )}
            {user.gender && (
              <div className="mb-3">
                <span className="text-500 mr-2">Giới tính:</span>
                <span>{user.gender}</span>
              </div>
            )}
            <div className="mb-3">
              <Tag
                severity={user.email_verified ? "success" : "warning"}
                icon={user.email_verified ? "pi pi-check-circle" : "pi pi-times-circle"}
                value={user.email_verified ? "Email đã xác thực" : "Email chưa xác thực"}
              />
            </div>
          </Card>

          <Card className="mb-3">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Địa chỉ mặc định</h3>
              <Button
                icon="pi pi-pencil"
                className="p-button-text p-button-rounded"
                onClick={() => setAddressSelectionDialogVisible(true)}
              />
            </div>
            {selectedDefaultAddress ? (
              <div>
                <div className="mb-1 font-medium">{selectedDefaultAddress.recipient_name}</div>
                <div className="mb-1">{selectedDefaultAddress.address}</div>
                <div className="mb-1">
                  {`${selectedDefaultAddress.district ? selectedDefaultAddress.district + ", " : ""}${selectedDefaultAddress.city}, ${selectedDefaultAddress.province}`}
                </div>
                <div className="mb-1">{selectedDefaultAddress.country}</div>
                <div className="mb-1">{selectedDefaultAddress.phone_number}</div>
              </div>
            ) : (
              <div className="text-500">
                Chưa có địa chỉ mặc định
                <div className="mt-2">
                  <Button
                    label="Thêm địa chỉ mới"
                    icon="pi pi-plus"
                    className="p-button-text p-button-sm"
                    onClick={() => handleEditAddress(null)}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog
        visible={editContactDialog}
        style={{ width: "450px" }}
        header="Chỉnh sửa thông tin liên hệ"
        modal
        onHide={() => setEditContactDialog(false)}
        footer={
          <div>
            <Button
              label="Hủy"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setEditContactDialog(false)}
            />
            <Button label="Lưu" icon="pi pi-check" onClick={handleSaveContact} />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field mb-3">
            <label htmlFor="fullName" className="font-medium mb-2 block">
              Họ và tên
            </label>
            <InputText
              id="fullName"
              value={editingContact.full_name || ""}
              onChange={(e) => setEditingContact({ ...editingContact, full_name: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="email" className="font-medium mb-2 block">
              Email
            </label>
            <InputText
              id="email"
              value={editingContact.email || ""}
              onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="phone" className="font-medium mb-2 block">
              Số điện thoại
            </label>
            <InputText
              id="phone"
              value={editingContact.phone_number || ""}
              onChange={(e) => setEditingContact({ ...editingContact, phone_number: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="dateOfBirth" className="font-medium mb-2 block">
              Ngày sinh
            </label>
            <InputText
              id="dateOfBirth"
              type="date"
              value={editingContact.birthday || ""}
              onChange={(e) => setEditingContact({ ...editingContact, birthday: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="gender" className="font-medium mb-2 block">
              Giới tính
            </label>
            <div className="flex gap-4">
              <div className="flex align-items-center">
                <input
                  type="radio"
                  id="genderMale"
                  name="gender"
                  value="Nam"
                  checked={editingContact.gender === "Nam"}
                  onChange={(e) => setEditingContact({ ...editingContact, gender: e.target.value })}
                  className="mr-2"
                />
                <label htmlFor="genderMale">Nam</label>
              </div>
              <div className="flex align-items-center">
                <input
                  type="radio"
                  id="genderFemale"
                  name="gender"
                  value="Nữ"
                  checked={editingContact.gender === "Nữ"}
                  onChange={(e) => setEditingContact({ ...editingContact, gender: e.target.value })}
                  className="mr-2"
                />
                <label htmlFor="genderFemale">Nữ</label>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Xác nhận xóa"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          <span>
            Bạn có chắc chắn muốn xóa khách hàng <b>{user.full_name}</b> không?
          </span>
        </div>
      </Dialog>

      {/* Address Dialog Component */}
      <AddressDialog
        visible={addressDialogVisible}
        onHide={() => setAddressDialogVisible(false)}
        editingAddress={editingAddress}
        setEditingAddress={setEditingAddress}
        onSave={handleSaveAddress}
        isEditing={editingAddress && editingAddress.address_id}
      />

      {/* Render Address Selection Dialog */}
      {renderAddressSelectionDialog()}
    </div>
  )};

export default UserDetails