import { classNames } from "primereact/utils"
import Link from "next/link"
import { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from "react"
import { LayoutContext } from "./context/layoutcontext"
import Head from "next/head"
import { Button } from "primereact/button"
import Image from "next/image"
import { useRouter } from "next/router"
import Sidebar from "../pages/components/Sidebar" // Import Sidebar component
import cartService from "../pages/Services/cartService" // Import cartService

const LandingHeader = forwardRef((props, ref) => {
  const router = useRouter()
  const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext)
  const menubuttonRef = useRef(null)
  const topbarmenuRef = useRef(null)
  const topbarmenubuttonRef = useRef(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarPosition, setSidebarPosition] = useState(null)
  const [cartItemCount, setCartItemCount] = useState(0)

  useImperativeHandle(ref, () => ({
    menubutton: menubuttonRef.current,
    topbarmenu: topbarmenuRef.current,
    topbarmenubutton: topbarmenubuttonRef.current,
  }))

  // Kiểm tra trạng thái đăng nhập khi component được mount
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData)
      setUserData(parsedUserData)
      setIsLoggedIn(true)
    }
  }, [])

  // Xử lý đếm số lượng biến thể/sản phẩm trong giỏ hàng
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        // Kiểm tra nếu đã đăng nhập
        const storedUserData = localStorage.getItem("userData")

        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData)

          // Nếu có user_id, lấy giỏ hàng từ API
          if (parsedUserData && parsedUserData.user_id) {
            try {
              const cartItems = await cartService.getById(parsedUserData.user_id)

              // Kiểm tra nếu cartItems là mảng
              if (Array.isArray(cartItems)) {
                // Đếm số lượng biến thể/sản phẩm khác nhau
                const itemCount = cartItems.length
                setCartItemCount(itemCount)
              } else {
                console.error("Dữ liệu giỏ hàng không phải là mảng:", cartItems)
                setCartItemCount(0)
              }
            } catch (error) {
              console.error("Lỗi khi lấy giỏ hàng từ API:", error)
              setCartItemCount(0)
            }
          }
        } else {
          // Nếu không đăng nhập, lấy giỏ hàng từ localStorage
          const localCart = localStorage.getItem("cart")

          if (localCart) {
            try {
              const parsedCart = JSON.parse(localCart)

              if (Array.isArray(parsedCart)) {
                // Đếm số lượng biến thể/sản phẩm khác nhau
                const itemCount = parsedCart.length
                setCartItemCount(itemCount)
              } else {
                console.error("Dữ liệu giỏ hàng local không phải là mảng:", parsedCart)
                setCartItemCount(0)
              }
            } catch (error) {
              console.error("Lỗi khi parse giỏ hàng từ localStorage:", error)
              setCartItemCount(0)
            }
          } else {
            setCartItemCount(0)
          }
        }
      } catch (error) {
        console.error("Lỗi khi xử lý giỏ hàng:", error)
        setCartItemCount(0)
      }
    }

    fetchCartItems()

    // Thêm event listener để cập nhật giỏ hàng khi có thay đổi
    window.addEventListener("storage", fetchCartItems)

    // Tạo một custom event để cập nhật giỏ hàng khi thêm/xóa sản phẩm
    window.addEventListener("cartUpdated", fetchCartItems)

    return () => {
      window.removeEventListener("storage", fetchCartItems)
      window.removeEventListener("cartUpdated", fetchCartItems)
    }
  }, [])

  // Hàm xử lý đăng xuất đã cập nhật
  const handleLogout = () => {
    // Lưu lại biến is_admin từ userData trong localStorage
    let is_admin = 0
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}")
      is_admin = userData.is_admin || 0
    } catch (error) {
      console.error("Lỗi khi đọc userData:", error)
    }

    // Xóa token xác thực
    localStorage.removeItem("authToken")
    sessionStorage.removeItem("authToken")

    // Xóa cookie
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Xóa các thông tin khác
    localStorage.removeItem("userData")
    sessionStorage.removeItem("hasCheckedAuth")

    // Hard redirect dựa vào giá trị is_admin
    if (is_admin === 1) {
      window.location.href = "/auth/login"
    } else {
      window.location.href = "/"
    }
  }

  // Hàm xử lý tìm kiếm
  const handleSearch = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault()
      if (searchTerm.trim()) {
        router.push(`/landing/search?q=${encodeURIComponent(searchTerm.trim())}`)
      }
    }
  }

  // Hàm xử lý hiển thị/ẩn sidebar
  const toggleSidebar = (e) => {
    e.preventDefault()
    const buttonRect = menubuttonRef.current.getBoundingClientRect()

    // Thiết lập vị trí cho sidebar dựa trên vị trí của nút
    setSidebarPosition({
      top: buttonRect.bottom + 30 + "px",
      left: buttonRect.left + -125 + "px",
      zIndex: 1000,
    })

    setShowSidebar((prevState) => !prevState)

    // Nếu sử dụng onMenuToggle từ LayoutContext
    if (onMenuToggle) {
      onMenuToggle(e)
    }
  }

  // Đóng sidebar khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSidebar &&
        !event.target.closest("#sidebar") &&
        !event.target.closest(".landing-topbar-menu") &&
        !event.target.closest(".layout-menu-button")
      ) {
        setShowSidebar(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSidebar])

  return (
    <>
      <Head>
        <title>GEARVN</title>
        <link rel="icon" href="/img_data/index/favicon.png" />
      </Head>

      {/* Overlay */}
      {showSidebar && (
        <div
          className="sidebar-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent gray
            zIndex: 999,
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className="landing-topbar">
        <div className="landing-row-header">
          <div className="landing-topbar-left-action">
            <Link href="/" className="landing-topbar-logo">
              <Image
                src="/img_data/index/logo_fd11946b31524fbe98765f34f3de0628.svg"
                width={140}
                height={50}
                alt="logo"
              />
            </Link>
            <a className="landing-topbar-menu" onClick={toggleSidebar}>
              <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button">
                <i className="pi pi-bars" />
              </button>
              <span className="landing-topbar-menu-text">Danh mục</span>
            </a>
          </div>

          <div className="landing-topbar-right-action">
            <div className="landing-topbar-search">
              <input
                type="text"
                className="input-search"
                placeholder="Bạn cần tìm gì?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
              />
              <button type="button" className="landing-topbar-button-search" onClick={handleSearch}>
                <i className="pi pi-search"></i>
              </button>
            </div>
            <a className="header-action_link" href="tel:19005301">
              <span className="box-icon">
                <i className="pi pi-phone icon-large"></i>
              </span>
              <span className="box-text">
                <span className="landing-topbar-menu-text">Hotline</span>
                <span className="landing-topbar-menu-text">1900.5301</span>
              </span>
            </a>
            <a className="header-action_link" href="/">
              <span className="box-icon">
                <i className="pi pi-map-marker icon-large"></i>
              </span>
              <span className="box-text">
                <span className="landing-topbar-menu-text">Hệ thống</span>
                <span className="landing-topbar-menu-text">Showroom</span>
              </span>
            </a>
            <a className="header-action_link" href="/landing/userprofile">
              <span className="box-icon">
                <i className="pi pi-shopping-bag icon-large"></i>
              </span>
              <span className="box-text">
                <span className="landing-topbar-menu-text">Tra cứu</span>
                <span className="landing-topbar-menu-text">đơn hàng</span>
              </span>
            </a>
            <a className="header-action_link" href="/landing/payment">
              <span className="box-icon">
                <i className="pi pi-shopping-cart icon-large"></i>
                <span className="cart-badge">{cartItemCount > 0 ? cartItemCount : 0}</span>
              </span>
              <span className="box-text">
                <span className="landing-topbar-menu-text">Giỏ</span>
                <span className="landing-topbar-menu-text">hàng</span>
              </span>
            </a>

            {isLoggedIn ? (
              <a className="header-action_link user-profile" href="/landing/userprofile">
                <span className="box-icon">
                  <i className="pi pi-user icon-large"></i>
                </span>
                <span className="box-text">
                  <span className="landing-topbar-menu-text">Xin chào</span>
                  <span className="landing-topbar-menu-text">{userData?.full_name}</span>
                </span>
                <Button
                  icon="pi pi-sign-out"
                  className="p-button-rounded p-button-text p-button-sm"
                  tooltip="Đăng xuất"
                  onClick={handleLogout}
                />
              </a>
            ) : (
              <a className="header-action_link login" href="/login">
                <span className="box-icon">
                  <i className="pi pi-user icon-large"></i>
                </span>
                <span className="box-text">
                  <span className="landing-topbar-menu-text">Đăng</span>
                  <span className="landing-topbar-menu-text">nhập</span>
                </span>
              </a>
            )}
          </div>
        </div>
        <div
          ref={topbarmenuRef}
          className={classNames("layout-topbar-header", {
            "layout-topbar-menu-mobile-active": layoutState.profileSidebarVisible,
          })}
        ></div>
      </div>
      <div className="landing-menu">
        <div className="landing-menu-content">
          <a
            className="landing-menu-item"
            href="/landing/blogs/huong-dan-chi-tiet-tung-buoc-cach-build-pc-cho-nguoi-moi-bat-dau"
          >
            <span className="landing-menu-icon">
              <i className="pi pi-tags"></i>
            </span>
            <span className="landing-menu-text">Tự build PC theo ý bạn</span>
          </a>
          <a className="landing-menu-item" href="/landing/blogs">
            <span className="landing-menu-icon">
              <i className="pi pi-book"></i>
            </span>
            <span className="landing-menu-text">Tin công nghệ</span>
          </a>
          <a
            className="landing-menu-item"
            href="/landing/blogs/thong-bao-hop-tac-cung-cap-dich-vu-sua-chua-gearvn-vs-nese"
          >
            <span className="landing-menu-icon">
              <i className="pi pi-wrench"></i>
            </span>
            <span className="landing-menu-text">Dịch vụ sửa chữa</span>
          </a>
          <a
            className="landing-menu-item"
            href="/landing/blogs/gearvn-hop-tac-voi-ald-service-cung-cap-dich-vu-ky-thuat-tai-nha"
          >
            <span className="landing-menu-icon">
              <i className="pi pi-home"></i>
            </span>
            <span className="landing-menu-text">Dịch vụ kỹ thuật tại nhà</span>
          </a>
          <a className="landing-menu-item" href="/landing/blogs/gearvn-chinh-sach-bang-gia-thu-san-pham-da-qua-su-dung">
            <span className="landing-menu-icon">
              <i className="pi pi-money-bill"></i>
            </span>
            <span className="landing-menu-text">Thu cũ đổi mới</span>
          </a>
          <a className="landing-menu-item" href="/landing/blogs/tra-cuu-bao-hanh-ladipage">
            <span className="landing-menu-icon">
              <i className="pi pi-shield"></i>
            </span>
            <span className="landing-menu-text">Tra cứu bảo hành</span>
          </a>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          position={sidebarPosition}
          className="sidebar-menu"
          style={{
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "5px",
            width: "220px",
            position: "fixed",
            zIndex: 1000,
          }}
        />
      )}
    </>
  )
})

export default LandingHeader

