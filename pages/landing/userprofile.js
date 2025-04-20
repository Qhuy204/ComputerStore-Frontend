import { useState, useEffect, useRef } from "react"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { RadioButton } from "primereact/radiobutton"
import { Toast } from "primereact/toast"
import { Card } from "primereact/card"
import { TabView, TabPanel } from "primereact/tabview"
import PublicLayout from "../../layout/PublicLayout"
import usersService from "../Services/usersService"
import addressService from "../Services/addressService"
import { formatDateToYYYYMMDD, parseDateToComponents } from "../utilities/dateformatter"
import { Divider } from "primereact/divider"
import dynamic from "next/dynamic"
import moment from "moment"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { Paginator } from "primereact/paginator"
import { Checkbox } from "primereact/checkbox"
import { Tag } from "primereact/tag"
// Dynamic import Button với ssr: false để tránh lỗi hydration
import UserProfileProductCard from "../components/viewedProductCard"
const Button = dynamic(() => import("primereact/button").then((mod) => mod.Button), {
  ssr: false,
})

const UserProfile = () => {
  const [user, setUser] = useState({
    user_id: null,
    full_name: "",
    gender: "male",
    phone_number: "",
    email: "",
    birthday: {
      day: null,
      month: null,
      year: null,
    },
  })

  const [realOrders, setRealOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [searchOrderId, setSearchOrderId] = useState("")

  // State for pagination
  const [first, setFirst] = useState(0)
  const [rows, setRows] = useState(3)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // State for addresses
  const [addresses, setAddresses] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressDialog, setAddressDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [selectedDefaultAddress, setSelectedDefaultAddress] = useState(null)

  // State để kiểm soát client-side rendering
  const [isBrowser, setIsBrowser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeOrderTab, setActiveOrderTab] = useState(0)
  const toast = useRef(null)

  // state để quản lý đơn hàng chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false)

  // State để quản lý đơn hàng
  const [orders, setOrders] = useState({
    all: [],
    new: [],
    pending: [],
    shipped: [],
    delivered: [],
    cancelled: [],
  })

  useEffect(() => {
    if (activeIndex === 2 && user.user_id && isBrowser) {
      fetchUserOrders()
    }
  }, [activeIndex, user.user_id, isBrowser])

  // Hàm xem chi tiết đơn hàng
  const viewOrderDetails = (order) => {
    setSelectedOrder(order)
    setOrderDetailsVisible(true)
  }

  // Hàm fetch đơn hàng từ API
  const fetchUserOrders = async () => {
    if (!user.user_id) return

    try {
      setOrderLoading(true)

      // Lấy đơn hàng của người dùng hiện tại
      const userOrders = await usersService.getOrdersByUserID(user.user_id)

      // Cập nhật state với đơn hàng thực
      setRealOrders(userOrders)
      setFilteredOrders(userOrders)

      // Phân loại đơn hàng theo trạng thái
      const categorizedOrders = {
        all: userOrders,
        new: userOrders.filter((order) => order.status && order.status.toLowerCase() === "new"),
        pending: userOrders.filter((order) => order.status && order.status.toLowerCase() === "pending"),
        shipped: userOrders.filter((order) => order.status && order.status.toLowerCase() === "shipped"),
        delivered: userOrders.filter((order) => order.status && order.status.toLowerCase() === "delivered"),
        cancelled: userOrders.filter((order) => order.status && order.status.toLowerCase() === "cancelled"),
      }

      // Cập nhật state orders với đơn hàng đã phân loại
      setOrders(categorizedOrders)

      // Cập nhật tổng số trang dựa trên số lượng đơn hàng và rows trên mỗi trang
      setTotalPages(Math.ceil(userOrders.length / rows))
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error)

      // Kiểm tra nếu là lỗi 404
      if (error.response && error.response.status === 404) {
        // Không có đơn hàng, set về mảng rỗng
        setRealOrders([])
        setFilteredOrders([])
        setOrders({
          all: [],
          new: [],
          pending: [],
          shipped: [],
          delivered: [],
          cancelled: [],
        })
        setTotalPages(0)

        // Hiển thị thông báo không có đơn hàng
        toast.current.show({
          severity: "info",
          summary: "Thông báo",
          detail: "Bạn chưa có đơn hàng nào",
          life: 3000,
        })
      } else {
        // Xử lý các lỗi khác
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải danh sách đơn hàng",
          life: 3000,
        })
      }
    } finally {
      setOrderLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace("₫", "đ")
  }

  // Cập nhật hàm tìm kiếm để hoạt động theo mã đơn hàng
  const searchOrder = () => {
    try {
      const currentOrders = getOrdersByTab()

      if (!searchOrderId.trim()) {
        // Nếu không có từ khóa tìm kiếm, hiển thị tất cả đơn hàng của tab hiện tại
        setFilteredOrders(currentOrders)
        // Reset pagination
        setFirst(0)
        setCurrentPage(1)
        setTotalPages(Math.ceil(currentOrders.length / rows))
        return
      }

      const searchTerm = searchOrderId.trim().toLowerCase()

      // Tìm kiếm trong danh sách đơn hàng
      const filtered = currentOrders.filter((order) => {
        // Tìm theo ID đơn hàng
        const matchOrderId = order.order_id && order.order_id.toString().toLowerCase().includes(searchTerm)

        return matchOrderId
      })

      // Cập nhật danh sách đơn hàng đã lọc
      setFilteredOrders(filtered)

      // Reset pagination
      setFirst(0)
      setCurrentPage(1)
      setTotalPages(Math.ceil(filtered.length / rows))
    } catch (error) {
      console.error("Lỗi khi tìm kiếm đơn hàng:", error)
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Đã xảy ra lỗi khi tìm kiếm đơn hàng",
          life: 3000,
        })
      }
    }
  }

  // Xử lý sự kiện khi thay đổi giá trị tìm kiếm
  const handleSearchChange = (e) => {
    setSearchOrderId(e.target.value)

    // Tìm kiếm ngay khi giá trị thay đổi
    if (e.target.value === "") {
      // Nếu xóa hết, hiển thị lại tất cả đơn hàng
      const currentOrders = getOrdersByTab()
      setFilteredOrders(currentOrders)
      // Reset pagination
      setFirst(0)
      setCurrentPage(1)
      setTotalPages(Math.ceil(currentOrders.length / rows))
    } else {
      // Thực hiện tìm kiếm
      const currentOrders = getOrdersByTab()
      const searchTerm = e.target.value.trim().toLowerCase()

      const filtered = currentOrders.filter((order) => {
        return order.order_id && order.order_id.toString().toLowerCase().includes(searchTerm)
      })

      setFilteredOrders(filtered)
      // Reset pagination
      setFirst(0)
      setCurrentPage(1)
      setTotalPages(Math.ceil(filtered.length / rows))
    }
  }

  // Xử lý sự kiện thay đổi trang
  const onPageChange = (event) => {
    setFirst(event.first)
    setRows(event.rows)
    setCurrentPage(event.page + 1)
  }

  // Hàm lấy đơn hàng theo tab đang chọn
  const getOrdersByTab = () => {
    switch (activeOrderTab) {
      case 0:
        return orders.all
      case 1:
        return orders.new
      case 2:
        return orders.pending
      case 3:
        return orders.shipped
      case 4:
        return orders.delivered
      case 5:
        return orders.cancelled
      default:
        return orders.all
    }
  }

  // Cập nhật list đơn hàng khi thay đổi tab
  useEffect(() => {
    if (orders) {
      const currentOrders = getOrdersByTab()
      setFilteredOrders(currentOrders)
      setSearchOrderId("")
      // Reset pagination
      setFirst(0)
      setCurrentPage(1)
      setTotalPages(Math.ceil(currentOrders.length / rows))
    }
  }, [activeOrderTab, orders])

  // data for viewed products
  const [viewedProducts, setViewedProducts] = useState([])
  const [viewedProductsLoading, setViewedProductsLoading] = useState(false)

  // Component sản phẩm đã xem
  // const [viewedProductsLoading, setViewedProductsLoading] = useState(false);
  // const [viewedProductsData, setViewedProductsData] = useState([]);

  // Xác định khi nào component đang chạy ở client
  useEffect(() => {
    setIsBrowser(true)
  }, [])

  // Khởi tạo tùy chọn cho dropdown ngày/tháng/năm
  const days = Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))
  const months = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => ({
    label: `${currentYear - i}`,
    value: currentYear - i,
  }))

  // Items cho tab menu chính
  const items = [
    { label: "Thông tin tài khoản", icon: "pi pi-user" },
    { label: "Sổ địa chỉ", icon: "pi pi-map-marker" },
    { label: "Quản lý đơn hàng", icon: "pi pi-shopping-bag" },
    { label: "Sản phẩm đã xem", icon: "pi pi-eye" },
  ]

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false)

  const handleLogoutClick = () => {
    setLogoutDialogVisible(true)
  }
  const confirmLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    window.location.href = "/" // Chuyển hướng về trang chủ sau khi đăng xuất
  }
  const cancelLogout = () => {
    setTimeout(() => {
      setLogoutDialogVisible(false)
    }, 50)
  }
  const renderLogoutDialog = () => (
    <Dialog
      visible={logoutDialogVisible} // Điều kiện hiển thị dialog
      style={{ width: "350px" }}
      header="Xác nhận đăng xuất"
      modal
      footer={
        <div>
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={cancelLogout} // Đóng dialog khi nhấn Hủy
          />
          <Button
            label="Đăng xuất"
            icon="pi pi-sign-out"
            className="p-button-danger"
            onClick={confirmLogout} // Thực hiện đăng xuất khi nhấn Đăng xuất
          />
        </div>
      }
      onHide={cancelLogout} // Đóng dialog khi nhấn ngoài
    >
      <div className="confirmation-content">
        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem", color: "#f39c12" }} />
        <span>Bạn có chắc chắn muốn đăng xuất?</span>
      </div>
    </Dialog>
  )

  // Items cho tab quản lý đơn hàng
  const orderTabItems = [
    { label: `TẤT CẢ`, count: orders.all.length },
    { label: `MỚI`, count: orders.new.length },
    { label: `CHỜ XÁC NHẬN`, count: orders.pending.length },
    { label: `ĐANG VẬN CHUYỂN`, count: orders.shipped.length },
    { label: `HOÀN THÀNH`, count: orders.delivered.length },
    { label: `HỦY`, count: orders.cancelled.length },
  ]

  // Fetch user data when component mounts
  useEffect(() => {
    if (isBrowser) {
      fetchUserData()
    }
  }, [isBrowser])

  // Fetch addresses when tab changes to address book
  useEffect(() => {
    if (activeIndex === 1 && user.user_id && isBrowser) {
      fetchAddresses()
    }
  }, [activeIndex, user.user_id, isBrowser])

  // Fetch user data from localStorage
  const fetchUserData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData")) || {}

      // Parse birthday components if available
      const birthdayComponents = userData.birthday
        ? parseDateToComponents(userData.birthday)
        : { day: null, month: null, year: null }

      setUser({
        user_id: userData.user_id || null,
        full_name: userData.full_name || "",
        gender: userData.gender || "male",
        phone_number: userData.phone_number || "",
        email: userData.email || "",
        birthday: birthdayComponents,
      })
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error)
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải thông tin người dùng",
          life: 3000,
        })
      }
    }
  }

  // Fetch addresses for the current user
  const fetchAddresses = async () => {
    if (!user.user_id) return

    try {
      setAddressLoading(true)
      const addressList = await addressService.getById(user.user_id)

      // Xử lý kết quả phản hồi để đảm bảo chúng ta có một mảng các địa chỉ
      let addressesArray = []

      if (Array.isArray(addressList)) {
        // Nếu đã là một mảng, sử dụng nó trực tiếp
        addressesArray = addressList
      } else if (addressList && typeof addressList === "object") {
        // Nếu là một đối tượng hoặc phản hồi được bao bọc, xử lý phù hợp
        if ("data" in addressList && Array.isArray(addressList.data)) {
          // Xử lý phản hồi được bao bọc (như { data: [...] })
          addressesArray = addressList.data
        } else if ("address_id" in addressList) {
          // Xử lý phản hồi đối tượng đơn
          addressesArray = [addressList]
        } else if (Object.keys(addressList).length > 0) {
          // Xử lý đối tượng-của-đối tượng hoặc các định dạng khác
          addressesArray = Object.values(addressList)
        }
      }

      // Cập nhật state với danh sách địa chỉ
      setAddresses(addressesArray)

      // Tìm địa chỉ mặc định
      const defaultAddress = addressesArray.find((address) => address.is_default === 1 || address.is_default === true)
      setSelectedDefaultAddress(defaultAddress || null)
    } catch (error) {
      console.error("Lỗi khi lấy địa chỉ:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách địa chỉ",
        life: 3000,
      })
      setAddresses([])
    } finally {
      setAddressLoading(false)
    }
  }

  // Hàm xử lý thêm địa chỉ mới
  const handleAddNewAddress = () => {
    setEditingAddress({
      recipient_name: user.full_name || "",
      phone_number: user.phone_number || "",
      address: "",
      city: "",
      province: "",
      district: "",
      country: "Việt Nam",
      address_type: "Nhà riêng",
      is_default: addresses.length === 0, // Nếu không có địa chỉ nào, địa chỉ mới sẽ là mặc định
    })
    setAddressDialog(true)
  }

  // Hàm xử lý cập nhật địa chỉ
  const handleUpdateAddress = (address) => {
    setEditingAddress({
      ...address,
      is_default: address.is_default === 1 || address.is_default === true,
    })
    setAddressDialog(true)
  }

  // Hàm xử lý lưu địa chỉ
  const saveAddress = async () => {
    try {
      // Xác thực các trường bắt buộc
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

      // Chuẩn bị dữ liệu địa chỉ - chuyển đổi boolean thành 0/1
      const addressData = {
        user_id: user.user_id,
        recipient_name: editingAddress.recipient_name,
        phone_number: editingAddress.phone_number,
        address: editingAddress.address,
        city: editingAddress.city,
        province: editingAddress.province,
        district: editingAddress.district || "",
        country: editingAddress.country,
        address_type: editingAddress.address_type || "Nhà riêng",
        is_default: editingAddress.is_default ? 1 : 0, // Chuyển đổi boolean thành 0/1
      }

      // Nếu đang đặt địa chỉ này là mặc định, cập nhật tất cả địa chỉ khác trước
      if (addressData.is_default === 1) {
        const addressesArray = Array.isArray(addresses) ? addresses : []

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

      // Cập nhật hoặc thêm mới địa chỉ
      if (editingAddress.address_id) {
        addressData.address_id = editingAddress.address_id
        await addressService.update(addressData)
      } else {
        await addressService.insert(addressData)
      }

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: editingAddress.address_id ? "Cập nhật địa chỉ thành công" : "Thêm địa chỉ mới thành công",
        life: 3000,
      })

      // Đóng dialog và làm mới danh sách địa chỉ
      setAddressDialog(false)
      fetchAddresses()
    } catch (error) {
      console.error("Lỗi khi lưu địa chỉ:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể lưu địa chỉ",
        life: 3000,
      })
    }
  }

  // Hàm xử lý đặt địa chỉ mặc định
  const handleSetDefaultAddress = async (addressId) => {
    try {
      setLoading(true)

      // Cập nhật tất cả địa chỉ của người dùng thành không mặc định (0)
      const updatePromises = addresses.map((address) =>
        addressService.update({
          address_id: address.address_id,
          is_default: 0,
        }),
      )

      // Đợi tất cả các địa chỉ được cập nhật thành không mặc định
      await Promise.all(updatePromises)

      // Sau đó mới cập nhật địa chỉ được chọn thành mặc định (1)
      await addressService.update({
        address_id: addressId,
        is_default: 1,
      })

      // Làm mới danh sách địa chỉ
      fetchAddresses()

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Đã cập nhật địa chỉ mặc định",
        life: 3000,
      })
    } catch (error) {
      console.error("Lỗi khi đặt địa chỉ mặc định:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể đặt địa chỉ mặc định",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Lấy sản phẩm đã xem từ localStorage
  const fetchViewedProducts = () => {
    if (!isBrowser) return

    try {
      setViewedProductsLoading(true)

      // Lấy danh sách sản phẩm đã xem từ localStorage
      const viewedProductsData = JSON.parse(localStorage.getItem("viewedproduct")) || []

      if (viewedProductsData.length === 0) {
        setViewedProducts([])
        setViewedProductsLoading(false)
        return
      }

      // Cập nhật state với dữ liệu từ localStorage
      setViewedProducts(viewedProductsData)
    } catch (error) {
      console.error("Error fetching viewed products:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải sản phẩm đã xem",
        life: 3000,
      })
      setViewedProducts([])
    } finally {
      setViewedProductsLoading(false)
    }
  }

  // Update the useEffect to fetch viewed products when the tab changes
  useEffect(() => {
    if (activeIndex === 3 && isBrowser) {
      fetchViewedProducts()
    }
  }, [activeIndex, isBrowser])

  // Update user profile
  const saveProfile = async () => {
    if (!user.user_id) {
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại",
        life: 3000,
      })
      return
    }

    try {
      setLoading(true)

      // Format birthday to YYYY-MM-DD if all components are present
      let formattedBirthday = null
      if (user.birthday.day && user.birthday.month && user.birthday.year) {
        formattedBirthday = formatDateToYYYYMMDD(
          new Date(user.birthday.year, user.birthday.month - 1, user.birthday.day),
        )
      }

      const userData = {
        user_id: user.user_id,
        full_name: user.full_name,
        gender: user.gender,
        phone_number: user.phone_number,
        birthday: formattedBirthday,
      }

      // Gọi API cập nhật thông tin
      await usersService.update(userData)

      // Cập nhật lại localStorage
      const currentUserData = JSON.parse(localStorage.getItem("userData")) || {}
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...currentUserData,
          ...userData,
        }),
      )

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Cập nhật thông tin thành công",
        life: 3000,
      })
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể cập nhật thông tin",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Fix: Hàm để hiển thị trạng thái đơn hàng đúng
  const getStatusText = (status) => {
    if (!status) return "Không xác định"

    switch (status.toLowerCase()) {
      case "pending":
        return "Chờ xác nhận"
      case "shipped":
        return "Đang vận chuyển"
      case "delivered":
        return "Hoàn thành"
      case "cancelled":
        return "Đã hủy"
      default:
        return status
    }
  }

  // Hàm lấy icon cho trạng thái
  const getStatusIcon = (status) => {
    if (!status) return "pi-circle"

    switch (status.toLowerCase()) {
      case "new":
        return "pi-inbox"
      case "pending":
        return "pi-sync"
      case "shipped":
        return "pi-truck"
      case "delivered":
        return "pi-check-circle"
      case "cancelled":
        return "pi-times-circle"
      default:
        return "pi-circle"
    }
  }

  // Hàm lấy màu cho trạng thái
  const getStatusColor = (status) => {
    if (!status) return "text-secondary"

    switch (status.toLowerCase()) {
      case "new":
        return "text-primary"
      case "pending":
        return "text-info"
      case "shipped":
        return "text-warning"
      case "delivered":
        return "text-success"
      case "cancelled":
        return "text-danger"
      default:
        return "text-secondary"
    }
  }

  // Component thông tin tài khoản
  const renderProfileInfo = () => {
    return (
      <Card title="Thông tin tài khoản" className="profile-card" style={{ paddingLeft: "16px", paddingRight: "150px" }}>
        <div className="p-fluid">
          <div className="field mb-3">
            <div className="flex align-items-center">
              <label
                htmlFor="fullName"
                className="font-medium block"
                style={{ width: "120px", textAlign: "right", marginRight: "16px" }}
              >
                Họ Tên
              </label>
              <InputText
                id="fullName"
                value={user.full_name}
                onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                className="flex-grow-1"
              />
            </div>
          </div>

          <div className="field mb-3">
            <div className="flex align-items-center">
              <label
                className="font-medium block"
                style={{ width: "120px", textAlign: "right", marginRight: "16px", paddingRight: "20px" }}
              >
                Giới tính
              </label>
              <div className="flex flex-wrap gap-3">
                <div className="flex align-items-center">
                  <RadioButton
                    inputId="male"
                    name="gender"
                    value="male"
                    onChange={(e) => setUser({ ...user, gender: e.value })}
                    checked={user.gender === "male"}
                  />
                  <label htmlFor="male" className="ml-2">
                    Nam
                  </label>
                </div>
                <div className="flex align-items-center">
                  <RadioButton
                    inputId="female"
                    name="gender"
                    value="female"
                    onChange={(e) => setUser({ ...user, gender: e.value })}
                    checked={user.gender === "female"}
                  />
                  <label htmlFor="female" className="ml-2">
                    Nữ
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="field mb-3">
            <div className="flex align-items-center">
              <label
                htmlFor="phoneNumber"
                className="font-medium block"
                style={{ width: "120px", textAlign: "right", marginRight: "16px" }}
              >
                Số điện thoại
              </label>
              <InputText
                id="phoneNumber"
                value={user.phone_number}
                onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
                className="flex-grow-1"
              />
            </div>
          </div>

          <div className="field mb-3">
            <div className="flex align-items-center">
              <label
                htmlFor="email"
                className="font-medium block"
                style={{ width: "120px", textAlign: "right", marginRight: "16px" }}
              >
                Email
              </label>
              <InputText id="email" value={user.email} disabled className="p-disabled flex-grow-1" />
            </div>
          </div>

          <div className="field mb-4">
            <div className="flex align-items-center">
              <label
                className="font-medium block"
                style={{ width: "120px", textAlign: "right", marginRight: "16px", paddingRight: "20px" }}
              >
                Ngày sinh
              </label>
              <div className="flex flex-wrap gap-2" style={{ marginLeft: "-24px" }}>
                <Dropdown
                  value={user.birthday.day}
                  options={days}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      birthday: { ...user.birthday, day: e.value },
                    })
                  }
                  placeholder="Ngày"
                  className="w-full md:w-8rem"
                />
                <Dropdown
                  value={user.birthday.month}
                  options={months}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      birthday: { ...user.birthday, month: e.value },
                    })
                  }
                  placeholder="Tháng"
                  className="w-full md:w-8rem"
                />
                <Dropdown
                  value={user.birthday.year}
                  options={years}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      birthday: { ...user.birthday, year: e.value },
                    })
                  }
                  placeholder="Năm"
                  className="w-full md:w-8rem"
                />
              </div>
            </div>
          </div>

          <div className="field mt-4 flex justify-content-center mb-0">
            {isBrowser ? (
              <Button
                label="LƯU THAY ĐỔI"
                className="p-button-danger"
                loading={loading}
                onClick={saveProfile}
                style={{ width: "200px", color: "white" }}
              />
            ) : (
              <button
                type="button"
                className="p-button p-button-danger"
                style={{ width: "200px", color: "white" }}
                disabled
              >
                LƯU THAY ĐỔI
              </button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Dialog component cho địa chỉ
  const addressDialogFooter = (
    <div>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={() => setAddressDialog(false)} />
      <Button label="Lưu" icon="pi pi-check" className="p-button-primary" onClick={saveAddress} />
    </div>
  )

  // Component sổ địa chỉ
  const renderAddressBook = () => {
    // Render address list or empty state
    const renderAddressList = () => {
      if (addressLoading) {
        return (
          <div className="text-center p-5" style={{ height: "100%" }}>
            <i className="pi pi-spin pi-spinner text-5xl text-primary mb-3"></i>
            <p>Đang tải danh sách địa chỉ...</p>
          </div>
        )
      }

      if (!addresses || addresses.length === 0) {
        return (
          <div className="text-center p-5">
            <i className="pi pi-map-marker text-5xl text-500 mb-3"></i>
            <p className="text-700">Bạn chưa có địa chỉ nào</p>
            <Button label="Thêm địa chỉ mới" className="p-button-primary mt-3" onClick={() => handleAddNewAddress()} />
          </div>
        )
      }

      return (
        <div>
          {addresses.map((address) => (
            <Card
              key={address.address_id}
              className={`mb-3 address-card ${address.is_default === 1 || address.is_default === true ? "border-primary" : ""}`}
              style={{
                height: "100%",
                backgroundColor: address.is_default === 1 || address.is_default === true ? "#f0f7ff" : "white",
                borderColor: address.is_default === 1 || address.is_default === true ? "#2196F3" : "#dee2e6",
              }}
            >
              <div className="flex justify-content-between align-items-start">
                <div>
                  <div className="flex align-items-center mb-2">
                    <h4 className="mt-0 mb-0 mr-2">{address.recipient_name || user.full_name}</h4>
                    {(address.is_default === 1 || address.is_default === true) && (
                      <Tag severity="success" value="Mặc định" />
                    )}
                  </div>
                  <p className="mt-0 mb-2 text-600">{address.phone_number || user.phone_number}</p>
                  <p className="mt-0 mb-2 text-600">
                    {[address.address, address.district, address.province, address.city, address.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {address.address_type && (
                    <p className="mt-0 mb-2 text-600">
                      <i className="pi pi-home mr-2"></i>
                      {address.address_type}
                    </p>
                  )}
                </div>
                <div className="flex flex-column">
                <Button
                  label="Cập nhật"
                  className="text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded mb-2"
                  icon="pi pi-pencil"
                  onClick={() => handleUpdateAddress(address)}
                />

                  {!(address.is_default === 1 || address.is_default === true) && (
                    <Button
                      label="Đặt làm mặc định"
                      className="p-button-text p-button-success"
                      icon="pi pi-check-circle"
                      onClick={() => handleSetDefaultAddress(address.address_id)}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <Card className="profile-card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h3 className="m-0">Sổ địa chỉ</h3>
          <Button label="+ Thêm địa chỉ mới" className="p-button-primary" onClick={() => handleAddNewAddress()} />
        </div>

        {renderAddressList()}

        {/* Dialog Form Địa chỉ */}
        <Dialog
          visible={addressDialog}
          style={{ width: "600px" }}
          header={editingAddress?.address_id ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          modal
          footer={addressDialogFooter}
          onHide={() => setAddressDialog(false)}
        >
          <div className="p-fluid">
            <div className="field mb-3">
              <label htmlFor="recipientName" className="font-medium mb-2 block">
                Người nhận <span className="text-red-500">*</span>
              </label>
              <InputText
                id="recipientName"
                value={editingAddress?.recipient_name || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, recipient_name: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div className="field mb-3">
              <label htmlFor="phoneNumber" className="font-medium mb-2 block">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <InputText
                id="phoneNumber"
                value={editingAddress?.phone_number || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, phone_number: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div className="field mb-3">
              <label htmlFor="address" className="font-medium mb-2 block">
                Địa chỉ cụ thể <span className="text-red-500">*</span>
              </label>
              <InputText
                id="address"
                value={editingAddress?.address || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div className="formgrid grid">
              <div className="field col-12 md:col-6 mb-3">
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

              <div className="field col-12 md:col-6 mb-3">
                <label htmlFor="city" className="font-medium mb-2 block">
                  Thành phố <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="city"
                  value={editingAddress?.city || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="formgrid grid">
              <div className="field col-12 md:col-6 mb-3">
                <label htmlFor="province" className="font-medium mb-2 block">
                  Tỉnh/Thành <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="province"
                  value={editingAddress?.province || ""}
                  onChange={(e) => setEditingAddress({ ...editingAddress, province: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              <div className="field col-12 md:col-6 mb-3">
                <label htmlFor="country" className="font-medium mb-2 block">
                  Quốc gia <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="country"
                  value={editingAddress?.country || "Việt Nam"}
                  onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="field mb-3">
              <label htmlFor="addressType" className="font-medium mb-2 block">
                Loại địa chỉ
              </label>
              <div className="flex gap-4">
                <div className="flex align-items-center">
                  <RadioButton
                    inputId="typeHome"
                    name="addressType"
                    value="Nhà riêng"
                    checked={editingAddress?.address_type === "Nhà riêng"}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address_type: e.value })}
                  />
                  <label htmlFor="typeHome" className="ml-2">
                    Nhà riêng
                  </label>
                </div>
                <div className="flex align-items-center">
                  <RadioButton
                    inputId="typeOffice"
                    name="addressType"
                    value="Văn phòng"
                    checked={editingAddress?.address_type === "Văn phòng"}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address_type: e.value })}
                  />
                  <label htmlFor="typeOffice" className="ml-2">
                    Văn phòng
                  </label>
                </div>
              </div>
            </div>

            <div className="field mb-3">
              <div className="flex align-items-center">
                <Checkbox
                  inputId="isDefault"
                  checked={editingAddress?.is_default}
                  onChange={(e) => setEditingAddress({ ...editingAddress, is_default: e.checked })}
                />
                <label htmlFor="isDefault" className="ml-2">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>
            </div>
          </div>
        </Dialog>
      </Card>
    )
  }

  // Component render chi tiết đơn hàng
  const renderOrderDetails = () => {
    if (!selectedOrder) return null

    // Format date for order details
    const formatOrderDate = (dateString) => {
      if (!dateString) return "N/A"
      return moment(dateString).format("HH:mm DD/MM/YYYY")
    }

    // Footer button for returning to order list
    const orderDetailsFooter = (
      <div className="dialog-footer" style={{ textAlign: "center" }}>
        <Button
          label="Quay lại danh sách đơn hàng"
          icon="pi pi-arrow-left"
          className="p-button-primary"
          onClick={() => setOrderDetailsVisible(false)}
        />
      </div>
    )

    return (
      <Dialog
        visible={orderDetailsVisible}
        style={{ width: "90%", maxWidth: "1000px" }}
        onHide={() => setOrderDetailsVisible(false)}
        header={
          <div className="order-detail-header" style={{ padding: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0" }}>
                Chi tiết đơn hàng #{selectedOrder.order_id || selectedOrder.id} -{" "}
                <span style={{ color: "#ff6a00" }}>{getStatusText(selectedOrder.status)}</span>
              </h3>
              <div>Đặt lúc: {formatOrderDate(selectedOrder.order_date)}</div>
            </div>
          </div>
        }
        footer={orderDetailsFooter}
      >
        <div className="order-details-content">
          {/* Thông tin khách hàng và địa chỉ */}
          <div className="grid mb-3">
            {/* Thông tin khách hàng */}
            <div className="col-12 md:col-6">
              <div className="p-card mb-3" style={{ borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div
                  className="p-card-header"
                  style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f8f9fa", padding: "10px 15px" }}
                >
                  <div className="flex align-items-center">
                    <i className="pi pi-user mr-2" style={{ color: "#ff6a00" }}></i>
                    <h4 className="m-0">Thông tin khách hàng</h4>
                  </div>
                </div>
                <div className="p-card-body" style={{ padding: "15px" }}>
                  <p className="mb-2">
                    <strong>Người nhận:</strong> {selectedOrder.guest_name || user.full_name || "Trương Quốc Huy"}
                  </p>
                  <p className="mb-2">
                    <strong>Số điện thoại:</strong> {selectedOrder.guest_phone || user.phone_number || "0987654321"}
                  </p>
                  <p className="mb-0">
                    <strong>Email:</strong> {selectedOrder.guest_email || user.email || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Địa chỉ nhận hàng */}
            <div className="col-12 md:col-6">
              <div className="p-card" style={{ borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div
                  className="p-card-header"
                  style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f8f9fa", padding: "10px 15px" }}
                >
                  <div className="flex align-items-center">
                    <i className="pi pi-map-marker mr-2" style={{ color: "#ff6a00" }}></i>
                    <h4 className="m-0">Địa chỉ nhận hàng</h4>
                  </div>
                </div>
                <div className="p-card-body" style={{ padding: "15px" }}>
                  <p className="mb-0">{selectedOrder.shipping_address || "123"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hình thức thanh toán */}
          <div className="p-card mb-3" style={{ borderRadius: "4px", border: "1px solid #e0e0e0" }}>
            <div
              className="p-card-header"
              style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f8f9fa", padding: "10px 15px" }}
            >
              <div className="flex align-items-center">
                <i className="pi pi-credit-card mr-2" style={{ color: "#ff6a00" }}></i>
                <h4 className="m-0">Hình thức thanh toán</h4>
              </div>
            </div>
            <div className="p-card-body" style={{ padding: "15px" }}>
              <p className="mb-0">{selectedOrder.payment_method_name || "Tiền mặt khi nhận hàng"}</p>
              <p className="mt-2 mb-0">
                <span
                  style={{
                    color:
                      selectedOrder.payment_status && selectedOrder.payment_status.toLowerCase() === "completed"
                        ? "#4caf50"
                        : "#ff6a00",
                  }}
                >
                  <i
                    className={`pi ${selectedOrder.payment_status && selectedOrder.payment_status.toLowerCase() === "completed" ? "pi-check-circle" : "pi-info-circle"} mr-2`}
                  ></i>
                  {selectedOrder.payment_status === "Completed" ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </p>
            </div>
          </div>

          {/* Thông tin sản phẩm */}
          <div className="p-card mb-3" style={{ borderRadius: "4px", border: "1px solid #e0e0e0" }}>
            <div
              className="p-card-header"
              style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f8f9fa", padding: "10px 15px" }}
            >
              <div className="flex align-items-center">
                <i className="pi pi-shopping-cart mr-2" style={{ color: "#ff6a00" }}></i>
                <h4 className="m-0">Thông tin sản phẩm</h4>
              </div>
            </div>
            <div className="p-card-body" style={{ padding: "0" }}>
              <div className="product-list">
                {/* Sử dụng danh sách sản phẩm từ đơn hàng */}
                {(selectedOrder.products || selectedOrder.items || []).map((product, index) => (
                  <div
                    key={index}
                    className="product-item p-3"
                    style={{
                      display: "flex",
                      borderBottom:
                        index < (selectedOrder.products || selectedOrder.items || []).length - 1
                          ? "1px solid #e0e0e0"
                          : "none",
                      backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                    }}
                  >
                    <div className="product-image mr-3" style={{ width: "60px", height: "60px", flexShrink: 0 }}>
                      <img
                        src={product.product_image || product.image || "/images/products/default.jpg"}
                        alt={product.product_name || product.name}
                        style={{ width: "100%", height: "auto", borderRadius: "4px", objectFit: "cover" }}
                      />
                    </div>
                    <div className="product-details" style={{ flex: "1" }}>
                      <div className="flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mt-0 mb-1" style={{ fontWeight: "bold" }}>
                            {product.product_name || product.name}
                          </h5>
                          <p className="mt-0 mb-1 text-sm">
                            {product.model && `Model: ${product.model}`}
                            {product.brand_name && ` | Thương hiệu: ${product.brand_name}`}
                          </p>
                          <div className="quantity">Số lượng: {product.quantity || 1}</div>
                        </div>
                        <div className="price text-right">
                          <div>{formatCurrency(product.price || 0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tổng kết đơn hàng */}
          <div className="p-card" style={{ borderRadius: "4px", border: "1px solid #e0e0e0" }}>
            <div
              className="p-card-header"
              style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f8f9fa", padding: "10px 15px" }}
            >
              <div className="flex align-items-center">
                <i className="pi pi-calculator mr-2" style={{ color: "#ff6a00" }}></i>
                <h4 className="m-0">Tổng kết đơn hàng</h4>
              </div>
            </div>
            <div className="p-card-body" style={{ padding: "15px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ minWidth: "250px" }}>
                  <div className="flex justify-content-between mb-2">
                    <span>Giá tạm tính:</span>
                    <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount || 0)}</span>
                  </div>
                  <div className="flex justify-content-between mb-2">
                    <span>Phí vận chuyển:</span>
                    <span>{formatCurrency(selectedOrder.shipping_fee || 0)}</span>
                  </div>
                  <div className="flex justify-content-between pt-2" style={{ borderTop: "1px solid #e0e0e0" }}>
                    <span style={{ fontWeight: "bold" }}>Tổng tiền:</span>
                    <span style={{ fontWeight: "bold", color: "#ff6a00", fontSize: "1.1rem" }}>
                      {formatCurrency(selectedOrder.total_amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-content-between mt-2">
                    <span>Số tiền đã thanh toán:</span>
                    <span style={{ color: "#4caf50" }}>
                      {selectedOrder.payment_status === "Completed"
                        ? formatCurrency(selectedOrder.total_amount || 0)
                        : "0đ"}
                    </span>
                  </div>
                  <div className="flex justify-content-between mt-2">
                    <span>Số tiền cần thanh toán:</span>
                    <span style={{ color: "#ff6a00" }}>
                      {selectedOrder.payment_status === "Completed"
                        ? "0đ"
                        : formatCurrency(selectedOrder.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    )
  }

  // Component quản lý đơn hàng
  const renderOrderManagement = () => {
    // Lấy đơn hàng đã lọc cho trang hiện tại
    const paginatedOrders = filteredOrders.slice(first, first + rows)

    // Render một đơn hàng theo mẫu trong ảnh
    const renderOrder = (order) => {
      return (
        <Card key={order.order_id || order.id} className="order-card p-0">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <div className="flex align-items-center">
              <i className={`pi ${getStatusIcon(order.status)} ${getStatusColor(order.status)} mr-2`}></i>
              <span className="font-medium">{getStatusText(order.status)}</span>
            </div>
            <span className="font-bold">#{order.order_id || order.id}</span>
          </div>

          {/* Sử dụng DataTable của PrimeReact để hiển thị danh sách sản phẩm */}
          <div className="order-items" style={{ padding: "10px 16px" }}>
            <DataTable value={order.products || order.items || []} className="p-datatable-gridlines" scrollable>
              <Column
                field="product_image"
                header="Hình ảnh"
                style={{ width: "60px", maxHeight: "60px" }}
                body={(rowData) => (
                  <img
                    src={rowData.product_image || rowData.image || "/images/products/default.jpg"}
                    alt={rowData.product_name || rowData.name}
                    style={{ width: "100%", height: "auto", maxHeight: "50px", borderRadius: "4px" }}
                  />
                )}
              />
              <Column
                field="product_name"
                header="Sản phẩm"
                body={(rowData) => (
                  <div style={{ maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {rowData.product_name || rowData.name}
                  </div>
                )}
              />
              <Column field="model" header="Model" style={{ maxHeight: "60px", overflow: "hidden" }} />
              <Column field="quantity" header="Số lượng" style={{ maxHeight: "60px", overflow: "hidden" }} />
              <Column
                field="price"
                header="Giá"
                style={{ maxHeight: "60px", overflow: "hidden" }}
                body={(rowData) => formatCurrency(rowData.price)}
              />
            </DataTable>
          </div>

          <div
            className="order-summary"
            style={{
              display: "flex",
              justifyContent: "left",
              alignItems: "left",
              padding: "10px 16px",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <div className="total-price" style={{ flex: "1" }}>
              <span style={{ color: "#212121" }}>Tổng tiền: </span>
              <span className="total-price" style={{ fontWeight: "bold", color: "#ff6a00" }}>
                {formatCurrency(order.total_amount || order.total || 0)}
              </span>
            </div>
            <Button
              label="Xem chi tiết"
              className="p-button-primary"
              style={{ marginLeft: "auto", color: "white", marginBottom: "-20px" }}
              onClick={() => viewOrderDetails(order)}
            />
          </div>
        </Card>
      )
    }

    return (
      <Card title="Quản lý đơn hàng" className="profile-card">
        <TabView activeIndex={activeOrderTab} onTabChange={(e) => setActiveOrderTab(e.index)} className="order-tabs">
          {orderTabItems.map((item, index) => (
            <TabPanel
              key={index}
              header={
                <span>
                  {item.label} {item.count > 0 ? `(${item.count})` : ""}
                </span>
              }
            >
              <div className="flex mb-4">
                <div className="p-inputgroup flex-1">
                  <InputText
                    placeholder="Tìm đơn hàng theo Mã đơn hàng"
                    value={searchOrderId}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => e.key === "Enter" && searchOrder()}
                  />
                  {searchOrderId && (
                    <Button
                      icon="pi pi-times"
                      className="p-button-outlined"
                      onClick={() => {
                        setSearchOrderId("")
                        const currentOrders = getOrdersByTab()
                        setFilteredOrders(currentOrders)
                        setFirst(0)
                        setCurrentPage(1)
                        setTotalPages(Math.ceil(currentOrders.length / rows))
                      }}
                    />
                  )}
                  <Button label="Tìm đơn hàng" className="p-button-primary w-4" onClick={searchOrder} />
                </div>
              </div>

              {orderLoading ? (
                <div className="text-center p-5">
                  <i className="pi pi-spin pi-spinner text-5xl text-primary mb-3"></i>
                  <p>Đang tải danh sách đơn hàng...</p>
                </div>
              ) : filteredOrders.length > 0 ? (
                <>
                  {paginatedOrders.map((order) => renderOrder(order))}
                  <div className="mt-3 d-flex justify-content-center">
                    <Paginator
                      first={first}
                      rows={rows}
                      totalRecords={filteredOrders.length}
                      rowsPerPageOptions={[3, 5, 10]}
                      onPageChange={onPageChange}
                      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-inbox text-5xl text-500 mb-3"></i>
                  <p className="text-700">Không có đơn hàng nào trong mục này</p>
                </div>
              )}
            </TabPanel>
          ))}
        </TabView>

        {/* Modal xem chi tiết đơn hàng */}
        {renderOrderDetails()}
      </Card>
    )
  }

  // Component sản phẩm đã xem
  const renderViewedProducts = () => {
    // Function to create a compatible product object for ProductCard
    const prepareProductForCard = (product) => {
      // If product is empty or invalid, return null
      if (!product || !product.product_id) {
        return null
      }

      // Ensure variants is an array
      if (!product.variants || !Array.isArray(product.variants)) {
        // Create a default variant if none exists
        return {
          ...product,
          variants: [
            {
              is_featured: product.is_featured || 0,
              is_default: 1,
              final_price: product.price || 0,
              base_price: product.base_price || product.price || 0,
              variant_image: product.image_url || "/placeholder.svg",
              stock_quantity: 10, // Default stock quantity
            },
          ],
        }
      }
      return product
    }

    return (
      <Card title="Sản phẩm đã xem" className="profile-card">
        {viewedProductsLoading ? (
          <div className="text-center p-5">
            <i className="pi pi-spin pi-spinner text-5xl text-primary mb-3"></i>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : viewedProducts.length === 0 ? (
          <div className="text-center p-5">
            <i className="pi pi-eye text-5xl text-500 mb-3"></i>
            <p className="text-700">Bạn chưa xem sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid">
            {viewedProducts.map((product, index) => {
              const preparedProduct = prepareProductForCard(product)
              return (
                <div key={index} className="col-12 sm:col-6 md:col-4 lg:col-3 p-2">
                  <div className="h-full">
                    {preparedProduct ? (
                      <UserProfileProductCard product={preparedProduct} mounted={true} />
                    ) : (
                      <EmptyProductCard />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {viewedProducts.length > 0 && (
          <div className="flex justify-content-center mt-3">
            <Button
              label="Xóa lịch sử xem"
              icon="pi pi-trash"
              className="p-button-outlined p-button-danger"
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử xem sản phẩm?")) {
                  localStorage.removeItem("viewedproduct")
                  setViewedProducts([])
                  toast.current.show({
                    severity: "success",
                    summary: "Thành công",
                    detail: "Đã xóa lịch sử xem sản phẩm",
                    life: 3000,
                  })
                }
              }}
            />
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="grid">
      {isBrowser && <Toast ref={toast} />}

      <div className="col-12 md:col-3 lg:col-3" style={{ margin: "0 auto" }}>
        <Card className="profile-sidebar" style={{ height: "100%" }}>
          <div className="flex flex-column align-items-center">
            <div className="avatar mb-0">
              {user.full_name ? (
                <div
                  className="avatar-circle flex align-items-center justify-content-center"
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#e91e63",
                    color: "white",
                    fontSize: "32px",
                    fontWeight: "bold",
                    borderRadius: "50%",
                  }}
                >
                  {user.full_name.split(" ").pop().charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  src="/images/default-avatar.png"
                  alt="Avatar"
                  className="rounded-circle"
                  style={{ width: "80px", height: "80px", borderRadius: "50%" }}
                />
              )}
            </div>
            <h3 className="mb-2 mt-1">{user.full_name}</h3>
          </div>
          <Divider className="my-2" />
          <div className="profile-menu mt-4">
            <ul className="list-none p-0 m-0">
              {items.map((item, index) => (
                <li
                  key={index}
                  className={`mb-2 ${activeIndex === index ? "active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    backgroundColor: activeIndex === index ? "#f8f9fa" : "transparent",
                    color: activeIndex === index ? "#e91e63" : "inherit",
                    transition: "all 0.3s ease",
                  }}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  <span>{item.label}</span>
                </li>
              ))}
              <li
                className="mb-0"
                onClick={handleLogoutClick}
                style={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  transition: "all 0.3s ease",
                }}
              >
                <i className="pi pi-sign-out mr-2"></i>
                <span>Đăng xuất</span>
                {renderLogoutDialog()}
              </li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="col-12 md:col-9 mb-0" style={{ margin: "0 auto" }}>
        <div className="transition-content" style={{ transition: "all 0.3s ease", height: "100%" }}>
          {activeIndex === 0 && renderProfileInfo()}
          {activeIndex === 1 && renderAddressBook()}
          {activeIndex === 2 && renderOrderManagement()}
          {activeIndex === 3 && renderViewedProducts()}
          {activeIndex === 3 && renderLogoutDialog()}
        </div>
      </div>
    </div>
  )
}

UserProfile.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>
}

export default UserProfile
