import { useState, useEffect, useRef } from "react"
import { InputText } from "primereact/inputtext"
import { RadioButton } from "primereact/radiobutton"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
import { Divider } from "primereact/divider"
import { Message } from "primereact/message"
import { InputTextarea } from "primereact/inputtextarea"
import { Checkbox } from "primereact/checkbox"
import { Toast } from "primereact/toast"
import { Dialog } from "primereact/dialog"
import { useRouter } from "next/router"
import { Tag } from "primereact/tag"
import { Badge } from "primereact/badge"
import { Avatar } from "primereact/avatar"
import { Timeline } from "primereact/timeline"
import { Steps } from "primereact/steps"
import Head from "next/head"
import Link from "next/link"
import PublicLayout from "../../layout/PublicLayout"
import cartService from "../Services/cartService"
import paymentMethodService from "../Services/paymentMethodService"
import addressService from "../Services/addressService"
import ordersService from "../Services/ordersService"
import orderItemsService from "../Services/orderItemsService"
import productsService from "../Services/productsService"

// PrimeReact checkout component with enhanced styling
const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressDialogVisible, setAddressDialogVisible] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const router = useRouter()
  const toast = useRef(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    city: "",
    shipping: "delivery",
    payment: "",
    notes: "",
    invoice: false,
    gender: "male",
  })

  // New address form state
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone_number: "",
    address: "",
    province: "",
    district: "",
    city: "",
    country: "Việt Nam",
    address_type: "Nhà riêng",
    is_default: false,
  })

  // Current step in checkout process
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Steps items for the Steps component
  const steps = [
    { label: "Giỏ hàng", icon: "pi pi-shopping-cart" },
    { label: "Thông tin giao hàng", icon: "pi pi-user" },
    { label: "Thanh toán", icon: "pi pi-wallet" },
    { label: "Xác nhận", icon: "pi pi-check" },
  ]

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check for user login and fetch data
  useEffect(() => {
    if (!isClient) return

    // Check if user is logged in - only use localStorage
    const userData = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null
    setCurrentUser(userData)

    if (userData && userData.user_id) {
      // Pre-fill form with user data
      setFormData((prev) => ({
        ...prev,
        name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone_number || "",
      }))

      // Fetch user's addresses
      fetchUserAddresses(userData.user_id)

      // Fetch cart items
      fetchCartItems(userData)

      // Fetch payment methods
      fetchPaymentMethods()
    } else {
      // For guest users, fetch cart from localStorage
      fetchCartItems(null)

      // Still fetch payment methods for guests
      fetchPaymentMethods()
    }
  }, [isClient])

  // Fetch user's addresses
  const fetchUserAddresses = async (userId) => {
    if (!userId) return

    try {
      setLoadingAddresses(true)
      const addressList = await addressService.getById(userId)

      // Process addresses to ensure we have an array
      let addressesArray = []

      if (Array.isArray(addressList)) {
        addressesArray = addressList
      } else if (addressList && typeof addressList === "object") {
        if ("data" in addressList && Array.isArray(addressList.data)) {
          addressesArray = addressList.data
        } else if ("address_id" in addressList) {
          addressesArray = [addressList]
        } else if (Object.keys(addressList).length > 0) {
          addressesArray = Object.values(addressList)
        }
      }

      setAddresses(addressesArray)

      // Find default address if exists
      const defaultAddress = addressesArray.find((address) => address.is_default === 1 || address.is_default === true)

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.address_id)

        // Pre-fill shipping address from default address
        setFormData((prev) => ({
          ...prev,
          address: defaultAddress.address,
          province: defaultAddress.province,
          district: defaultAddress.district,
          city: defaultAddress.city,
        }))
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách địa chỉ",
        life: 3000,
      })
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Fetch available payment methods
  const fetchPaymentMethods = async () => {
    try {
      const methods = await paymentMethodService.getAll()
      setPaymentMethods(methods)

      // Set default payment method if available
      if (methods && methods.length > 0) {
        setFormData((prev) => ({
          ...prev,
          payment: methods[0].payment_method_id,
        }))
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải phương thức thanh toán",
        life: 3000,
      })
    }
  }


  // Fetch cart items - from database for logged-in users, localStorage for guests
  const fetchCartItems = async (userData) => {
    try {
      let items = [];
      let total = 0;

      if (userData && userData.user_id) {
        // User is logged in - fetch from database
        try {
          const cartData = await cartService.getById(userData.user_id);
          console.log("cart data user:", cartData);

          if (cartData && Array.isArray(cartData)) {
            // For each cart item, fetch the product details to get stock quantity
            const itemsWithDetails = await Promise.all(
              cartData.map(async (item) => {
                try {
                  // Get product details including stock quantities
                  const productData = await productsService.getById(item.product_id);
                  const product = Array.isArray(productData) ? productData[0] : productData;

                  // Find the specific variant
                  const variant = product.variants.find((v) => v.variant_id === item.variant_id) || product.variants[0];

                  // Get available stock quantity
                  const stockQuantity = variant ? variant.stock_quantity : 0;

                  // If requested quantity exceeds stock, adjust it
                  const adjustedQuantity = stockQuantity < item.quantity ? stockQuantity : item.quantity;

                  // If quantities were adjusted, update the cart in the database
                  if (adjustedQuantity !== item.quantity && adjustedQuantity > 0) {
                    await cartService.update({
                      cart_id: item.cart_id,
                      user_id: userData.user_id,
                      product_id: item.product_id,
                      variant_id: item.variant_id,
                      quantity: adjustedQuantity,
                      is_active: true,
                    });
                  }

                  // Return the item with adjusted quantity and stock info
                  return {
                    ...item,
                    product_name: product.product_name || "Sản phẩm",
                    price: Number.parseFloat(variant.final_price) || Number.parseFloat(product.base_price) || 0,
                    photo: variant.variant_image || "/Image/cart/default-product.png",
                    quantity: adjustedQuantity,
                    max_quantity: stockQuantity,
                    stock_status: stockQuantity > 0 ? "in_stock" : "out_of_stock",
                  };
                } catch (error) {
                  console.error("Error fetching product details:", error);
                  return null;
                }
              })
            );

            // Filter out any null items
            items = itemsWithDetails.filter((item) => item !== null && item.quantity > 0);
          }
        } catch (error) {
          console.error("Error fetching cart items:", error);
          
          // Ignore 404 errors - it means the cart is empty
          if (error.response && error.response.status === 404) {
            console.log("User has empty cart - setting empty array");
            // Set empty cart items - handled gracefully
            items = [];
          } else {
            // For other errors, we'll re-throw to handle in the outer catch block
            throw error;
          }
        }
      } else {
        // Guest user - get from localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];

        // For each item in localStorage, fetch product details to check stock
        if (localCart.length > 0) {
          const itemsWithDetails = await Promise.all(
            localCart.map(async (item) => {
              try {
                // Get product details including stock quantities
                const productData = await productsService.getById(item.product_id);
                const product = Array.isArray(productData) ? productData[0] : productData;

                // Find the specific variant
                const variant = product.variants.find((v) => v.variant_id === item.variant_id) || product.variants[0];

                // Get available stock quantity
                const stockQuantity = variant ? variant.stock_quantity : 0;

                // If requested quantity exceeds stock, adjust it
                const adjustedQuantity = stockQuantity < item.quantity ? stockQuantity : item.quantity;

                // If quantities were adjusted, update localStorage
                if (adjustedQuantity !== item.quantity && adjustedQuantity > 0) {
                  item.quantity = adjustedQuantity;
                }

                // Return the item with adjusted quantity and stock info
                return {
                  ...item,
                  product_name: product.product_name || "Sản phẩm",
                  price: Number.parseFloat(variant.final_price) || Number.parseFloat(product.base_price) || 0,
                  photo: product.image_url || "/Image/cart/default-product.png",
                  quantity: adjustedQuantity,
                  max_quantity: stockQuantity,
                  stock_status: stockQuantity > 0 ? "in_stock" : "out_of_stock",
                };
              } catch (error) {
                console.error("Error fetching product details:", error);
                return null;
              }
            })
          );

          // Filter out any null items and update localStorage
          items = itemsWithDetails.filter((item) => item !== null && item.quantity > 0);
          localStorage.setItem("cart", JSON.stringify(items));
        }
      }

      // Calculate total price
      total = items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      setCartItems(items);
      setTotalPrice(total);
    } catch (error) {
      console.error("Error in fetchCartItems:", error);
      
      // Set empty cart regardless of error type
      setCartItems([]);
      setTotalPrice(0);
      
      // Only show toast for non-404 errors
      if (!error.response || error.response.status !== 404) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải giỏ hàng",
          life: 3000,
        });
      }
    }
  };

  // Update cart quantity - in database for logged-in users, localStorage for guests
  const updateQuantity = async (productId, variantId, newQuantity) => {
    try {
      if (newQuantity < 1) newQuantity = 1

      if (currentUser && currentUser.user_id) {
        // User is logged in - update in database
        const cartItem = cartItems.find((item) => item.product_id === productId && item.variant_id === variantId)

        if (cartItem) {
          await cartService.update({
            cart_id: cartItem.cart_id,
            user_id: currentUser.user_id,
            product_id: productId,
            variant_id: variantId,
            quantity: newQuantity,
            is_active: true,
          })
        }
      } else {
        // Guest user - update in localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || []

        const updatedCart = localCart.map((item) => {
          if (item.product_id === productId && item.variant_id === variantId) {
            return { ...item, quantity: newQuantity }
          }
          return item
        })

        localStorage.setItem("cart", JSON.stringify(updatedCart))
      }

      // Update local state
      const updatedItems = cartItems.map((item) => {
        if (item.product_id === productId && item.variant_id === variantId) {
          return { ...item, quantity: newQuantity }
        }
        return item
      })

      setCartItems(updatedItems)

      // Recalculate total price
      const total = updatedItems.reduce((sum, item) => {
        return sum + item.price * item.quantity
      }, 0)

      setTotalPrice(total)
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể cập nhật số lượng",
        life: 3000,
      })
    }
  }

  // Remove item from cart - from database for logged-in users, localStorage for guests
  const removeProduct = async (productId, variantId) => {
    try {
      if (currentUser && currentUser.user_id) {
        // User is logged in - remove from database
        const cartItem = cartItems.find((item) => item.product_id === productId && item.variant_id === variantId)

        if (cartItem && cartItem.cart_id) {
          await cartService.delete(cartItem.cart_id)
        }
      } else {
        // Guest user - remove from localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || []

        const updatedCart = localCart.filter(
          (item) => !(item.product_id === productId && item.variant_id === variantId),
        )

        localStorage.setItem("cart", JSON.stringify(updatedCart))
      }

      // Update local state
      const updatedItems = cartItems.filter((item) => !(item.product_id === productId && item.variant_id === variantId))

      setCartItems(updatedItems)

      // Recalculate total price
      const total = updatedItems.reduce((sum, item) => {
        return sum + item.price * item.quantity
      }, 0)

      setTotalPrice(total)

      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Đã xóa sản phẩm khỏi giỏ hàng",
        life: 3000,
      })
    } catch (error) {
      console.error("Error removing product:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể xóa sản phẩm",
        life: 3000,
      })
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Xử lý các loại input khác nhau
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Sử dụng functional update để đảm bảo cập nhật state đúng
    setFormData(prevData => ({
      ...prevData,
      [name]: inputValue
    }));
  };
  // Handle change for new address form
  const handleNewAddressChange = (e) => {
    const { name, value, checked, type } = e.target || {}
    const inputValue = type === "checkbox" ? checked : value

    setNewAddress((prev) => {
      if (prev[name] === inputValue) return prev
      return { ...prev, [name]: inputValue }
    })
  }

  // Handle address selection
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId)

    // Find the selected address
    const selectedAddress = addresses.find((addr) => addr.address_id === addressId)

    if (selectedAddress) {
      // Update form data with selected address
      setFormData((prev) => ({
        ...prev,
        address: selectedAddress.address,
        province: selectedAddress.province,
        district: selectedAddress.district,
        city: selectedAddress.city,
      }))
    }
  }

  // Save new address
  const saveNewAddress = async () => {
    try {
      // Validate required fields
      if (
        !newAddress.recipient_name ||
        !newAddress.phone_number ||
        !newAddress.address ||
        !newAddress.city ||
        !newAddress.province
      ) {
        toast.current.show({
          severity: "warn",
          summary: "Thiếu thông tin",
          detail: "Vui lòng điền đầy đủ thông tin địa chỉ",
          life: 3000,
        })
        return
      }

      if (!currentUser || !currentUser.user_id) {
        // If guest user, just use the address in the form
        setFormData((prev) => ({
          ...prev,
          name: newAddress.recipient_name,
          phone: newAddress.phone_number,
          address: newAddress.address,
          province: newAddress.province,
          district: newAddress.district,
          city: newAddress.city,
        }))

        setAddressDialogVisible(false)
        return
      }

      // Prepare address data
      const addressData = {
        user_id: currentUser.user_id,
        recipient_name: newAddress.recipient_name,
        phone_number: newAddress.phone_number,
        address: newAddress.address,
        city: newAddress.city,
        province: newAddress.province,
        district: newAddress.district || "",
        country: newAddress.country,
        address_type: newAddress.address_type || "Nhà riêng",
        is_default: newAddress.is_default ? 1 : 0,
      }

      // If setting as default, update other addresses
      if (addressData.is_default === 1) {
        const updatePromises = addresses.map((addr) =>
          addressService.update({
            address_id: addr.address_id,
            is_default: 0,
          }),
        )

        await Promise.all(updatePromises)
      }

      // Save new address
      const result = await addressService.insert(addressData)

      if (result && result.address_id) {
        // Update addresses list
        fetchUserAddresses(currentUser.user_id)

        // Select the new address
        setSelectedAddressId(result.address_id)

        // Update form with new address
        setFormData((prev) => ({
          ...prev,
          address: newAddress.address,
          province: newAddress.province,
          district: newAddress.district,
          city: newAddress.city,
        }))

        toast.current.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã thêm địa chỉ mới",
          life: 3000,
        })
      }

      setAddressDialogVisible(false)
    } catch (error) {
      console.error("Error saving address:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể lưu địa chỉ mới",
        life: 3000,
      })
    }
  }

  // Proceed to next step
  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Cart validation
      if (cartItems.length === 0) {
        toast.current.show({
          severity: "warn",
          summary: "Giỏ hàng trống",
          detail: "Vui lòng thêm sản phẩm vào giỏ hàng",
          life: 3000,
        })
        return
      }
    } else if (currentStep === 2) {
      // Shipping info validation
      if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.province) {
        toast.current.show({
          severity: "warn",
          summary: "Thiếu thông tin",
          detail: "Vui lòng điền đầy đủ thông tin giao hàng",
          life: 3000,
        })
        return
      }
    }

    setCurrentStep(currentStep + 1)
    window.scrollTo(0, 0)
  }

  // Go back to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo(0, 0)
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "₫"
  }

  // Handle order completion
  const handleCompleteOrder = async () => {
    try {
      setLoading(true)

      if (cartItems.length === 0) {
        toast.current.show({
          severity: "warn",
          summary: "Giỏ hàng trống",
          detail: "Không thể tạo đơn hàng với giỏ hàng trống",
          life: 3000,
        })
        setLoading(false)
        return
      }

      // Find selected payment method
      const selectedMethod = paymentMethods.find((method) => method.payment_method_id === formData.payment)
      const isCOD = selectedMethod && selectedMethod.payment_method_name.toLowerCase().includes("khi giao hàng")

      // Set payment status based on method
      const paymentStatus = isCOD ? "Pending" : "Completed"

      // Format shipping address
      const shippingAddress = [formData.address, formData.district, formData.province, formData.city, "Việt Nam"]
        .filter(Boolean)
        .join(", ")

      // Create order data
      const orderData = {
        user_id: currentUser ? currentUser.user_id : null,
        guest_name: formData.name,
        guest_email: formData.email || null,
        guest_phone: formData.phone,
        total_amount: totalPrice,
        shipping_address: shippingAddress,
        payment_method_id: formData.payment,
        payment_status: paymentStatus,
        status: "Pending",
        note: formData.notes || "",
      }

      // Create order
      const orderResult = await ordersService.insert(orderData)
      const order_id_result = await ordersService.getAll()
      const maxOrderId = order_id_result.reduce((max, order) => {
        return order.order_id > max ? order.order_id : max
      }, 0)
      localStorage.removeItem("cart")

      // Create order items
      const orderItemPromises = cartItems.map((item) =>
        orderItemsService.insert({
          order_id: maxOrderId,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price_at_time: item.price,
        }),
      )

      await Promise.all(orderItemPromises)

      // Clear cart after successful order
      if (currentUser && currentUser.user_id) {
        // For logged-in users, clear cart in database
        const deletePromises = cartItems.map((item) => cartService.delete(item.cart_id))

        await Promise.all(deletePromises)
      } else {
        // For guests, clear localStorage cart
        localStorage.removeItem("cart")
      }

      // Show success message
      toast.current.show({
        severity: "success",
        summary: "Đặt hàng thành công",
        detail: "Đơn hàng của bạn đã được tạo thành công",
        life: 3000,
      })

      // Move to confirmation step
      setCurrentStep(4)

      // Store order ID for confirmation
      sessionStorage.setItem("lastOrderId", orderResult.order_id)
    } catch (error) {
      console.error("Error creating order:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tạo đơn hàng. Vui lòng thử lại",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Cart step
  const CartStep = () => {
    return (
      <div className="grid checkout-step-container">
        <div className="col-12">
          {cartItems.length === 0 ? (
            <div className="empty-cart-container text-center p-5">
              <i className="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
              <h3 className="mb-3">Giỏ hàng của bạn đang trống</h3>
              <p className="mb-4">Thêm sản phẩm vào giỏ hàng để tiến hành thanh toán</p>
              <Link href="/">
                <Button
                  label="Tiếp tục mua hàng"
                  icon="pi pi-shopping-bag"
                  className="p-button-primary p-button-raised"
                />
              </Link>
            </div>
          ) : (
            <>
              <Card className="cart-items-card mb-4">
                <div className="cart-header flex justify-content-between align-items-center border-bottom-1 border-gray-200 pb-3 mb-3">
                  <span className="font-bold text-lg" style={{ width: "20%" }}>
                    Sản phẩm
                  </span>
                  <span className="font-bold text-lg" style={{ width: "40%" }}>
                    Mô Tả
                  </span>
                  <span className="font-bold text-lg text-center" style={{ width: "15%" }}>
                    Đơn giá
                  </span>
                  <span className="font-bold text-lg text-center" style={{ width: "15%" }}>
                    Số lượng
                  </span>
                  <span className="font-bold text-lg text-right" style={{ width: "10%" }}>
                    Tổng
                  </span>
                </div>

                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="cart-item flex justify-content-between align-items-center border-bottom-1 border-gray-200 py-4  hover:bg-gray-50"
                  >
                    <div style={{ width: "20%" }} className="product-image-container">
                      <img
                        src={item.variant_image || item.photo || "/placeholder.svg"}
                        alt={item.product_name}
                        className="w-10 h-auto border-round shadow-2"
                      />
                    </div>
                    <div style={{ width: "40%" }} className="product-details">
                      <div className="font-medium mb-2 text-primary">{item.product_name}</div>
                      {item.variant_sku !== "Mặc định" && (
                        <Tag severity="info" value={item.variant_sku} className="mr-2" />
                      )}
                      {item.stock_status === "in_stock" ? (
                        <Tag severity="success" value="Còn hàng" icon="pi pi-check" />
                      ) : (
                        <Tag severity="danger" value="Hết hàng" icon="pi pi-times" />
                      )}
                    </div>
                    <div className="text-center" style={{ width: "15%" }}>
                      <span className="text-lg font-medium text-red-600">{formatCurrency(item.price)}</span>
                    </div>
                    <div className="text-center" style={{ width: "15%" }}>
                      <div className="quantity-control flex align-items-center justify-content-center p-2 border-round bg-gray-100">
                        <Button
                          icon="pi pi-minus"
                          className="p-button-rounded p-button-text p-button-sm"
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          // disabled={item.quantity <= 1}
                        />
                        <span className="mx-2 font-medium">{item.quantity}</span>
                        <Button
                          icon="pi pi-plus"
                          className="p-button-rounded p-button-text p-button-sm"
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          disabled={item.quantity >= item.max_quantity}
                        />
                      </div>
                      <Button
                        label="Xóa"
                        icon="pi pi-trash"
                        className="p-button-text p-button-danger p-button-sm mt-2"
                        onClick={() => removeProduct(item.product_id, item.variant_id)}
                      />
                    </div>
                    <div className="text-right" style={{ width: "10%" }}>
                      <span className="text-lg font-bold text-red-700">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>

              <div className="cart-summary">
                <Card className="p-3">
                  <div className="flex justify-content-end">
                    <div className="w-full md:w-6">
                      <div className="flex justify-content-between mb-3">
                        <span className="font-medium text-gray-700">Tạm tính:</span>
                        <span className="font-medium">{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex justify-content-between mb-3">
                        <span className="font-medium text-gray-700">Phí vận chuyển:</span>
                        <span className="text-green-500 font-medium">Miễn phí</span>
                      </div>
                      <Divider />
                      <div className="flex justify-content-between">
                        <span className="font-bold text-lg">Tổng tiền:</span>
                        <span className="font-bold text-xl text-red-600">{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="cart-actions flex justify-content-between mt-4">
                <Button
                  label="Tiếp tục mua hàng"
                  icon="pi pi-arrow-left"
                  className="p-button-outlined p-button-secondary"
                  onClick={() => router.push("/")}
                />

                <Button
                  label="Tiếp tục thanh toán"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  className="p-button-danger p-button-raised"
                  onClick={nextStep}
                />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Shipping information step
  const ShippingInfoStep = () => {
    return (
      <div className="grid checkout-step-container">
        <div className="col-12 lg:col-8">
          <Card title="Thông tin khách mua hàng" className="mb-4 shipping-info-card">
            <div className="grid">
              <div className="col-6 mb-3">
                <div
                  className="gender-option p-3 border-round-lg hover:bg-gray-100 cursor-pointer flex align-items-center"
                  onClick={() => handleInputChange({ target: { name: "gender", value: "male" } })}
                >
                  <RadioButton
                    inputId="gender1"
                    name="gender"
                    value="male"
                    onChange={(e) => handleInputChange({ target: { name: "gender", value: e.value } })}
                    checked={formData.gender === "male"}
                  />
                  <label htmlFor="gender1" className="ml-2 cursor-pointer">
                    Anh
                  </label>
                </div>
              </div>
              <div className="col-6 mb-3">
                <div
                  className="gender-option p-3 border-round-lg hover:bg-gray-100 cursor-pointer flex align-items-center"
                  onClick={() => handleInputChange({ target: { name: "gender", value: "female" } })}
                >
                  <RadioButton
                    inputId="gender2"
                    name="gender"
                    value="female"
                    onChange={(e) => handleInputChange({ target: { name: "gender", value: e.value } })}
                    checked={formData.gender === "female"}
                  />
                  <label htmlFor="gender2" className="ml-2 cursor-pointer">
                    Chị
                  </label>
                </div>
              </div>

              <div className="col-12 mb-3">
                <span className="p-float-label">
                <InputText
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-inputtext-lg"
              />
                  <label htmlFor="name">Nhập họ và tên của bạn</label>
                </span>
              </div>

              <div className="col-12 mb-3">
                <span className="p-float-label">
                  <InputText
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-inputtext-lg"
                  />
                  <label htmlFor="phone">Nhập số điện thoại của bạn</label>
                </span>
              </div>

              <div className="col-12 mb-3">
                <span className="p-float-label">
                  <InputText
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-inputtext-lg"
                  />
                  <label htmlFor="email">Nhập email của bạn (không bắt buộc)</label>
                </span>
              </div>
            </div>
          </Card>

          <Card title="Chọn cách nhận hàng" className="mb-4 shipping-method-card">
            <div
              className="shipping-option p-3 border-round-lg hover:bg-gray-100 cursor-pointer flex align-items-center mb-3"
              onClick={() => handleInputChange({ target: { name: "shipping", value: "delivery" } })}
            >
              <RadioButton
                inputId="delivery1"
                name="shipping"
                value="delivery"
                onChange={(e) => handleInputChange({ target: { name: "shipping", value: e.value } })}
                checked={formData.shipping === "delivery"}
              />
              <label htmlFor="delivery1" className="ml-2 cursor-pointer flex align-items-center">
                <i className="pi pi-truck mr-2 text-primary"></i>
                <span>Giao hàng tận nơi</span>
              </label>
            </div>

            {/* Address selection for logged-in users */}
            {currentUser && addresses.length > 0 && (
              <div className="address-selection mb-4">
                <Button
                  label="Chọn địa chỉ có sẵn"
                  icon="pi pi-map-marker"
                  className="p-button-outlined p-button-info mb-3"
                  onClick={() => setAddressDialogVisible(true)}
                />

                {selectedAddressId && (
                  <div className="selected-address p-3 border-1 border-blue-300 bg-blue-50 border-round-lg shadow-1">
                    <div className="flex justify-content-between align-items-center">
                      <h4 className="mb-2 mt-0 text-blue-800">
                        <i className="pi pi-map-marker mr-2"></i>
                        Địa chỉ giao hàng đã chọn
                      </h4>
                      <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text p-button-sm"
                        onClick={() => setSelectedAddressId(null)}
                      />
                    </div>
                    {addresses.find((addr) => addr.address_id === selectedAddressId) && (
                      <div className="address-details p-2">
                        <p className="mb-1">
                          <strong>
                            {addresses.find((addr) => addr.address_id === selectedAddressId).recipient_name}
                          </strong>
                        </p>
                        <p className="mb-1">
                          <i className="pi pi-phone mr-2 text-blue-500"></i>
                          {addresses.find((addr) => addr.address_id === selectedAddressId).phone_number}
                        </p>
                        <p className="mb-1">
                          <i className="pi pi-home mr-2 text-blue-500"></i>
                          {[
                            addresses.find((addr) => addr.address_id === selectedAddressId).address,
                            addresses.find((addr) => addr.address_id === selectedAddressId).district,
                            addresses.find((addr) => addr.address_id === selectedAddressId).province,
                            addresses.find((addr) => addr.address_id === selectedAddressId).city,
                            "Việt Nam",
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses dialog */}
                <Dialog
                  visible={addressDialogVisible}
                  style={{ width: "80%" }}
                  header="Chọn địa chỉ giao hàng"
                  modal
                  onHide={() => setAddressDialogVisible(false)}
                  footer={
                    <div>
                      <Button
                        label="Thêm địa chỉ mới"
                        icon="pi pi-plus"
                        className="p-button-outlined p-button-success mr-2"
                        onClick={() => {
                          setNewAddress({
                            recipient_name: formData.name || currentUser.full_name || "",
                            phone_number: formData.phone || currentUser.phone_number || "",
                            address: "",
                            province: "",
                            district: "",
                            city: "",
                            country: "Việt Nam",
                            address_type: "Nhà riêng",
                            is_default: false,
                          })
                          setAddressDialogVisible(false)
                          setTimeout(() => {
                            document.getElementById("newAddressDialog").style.display = "block"
                          }, 100)
                        }}
                      />
                      <Button
                        label="Đóng"
                        icon="pi pi-times"
                        className="p-button-text"
                        onClick={() => setAddressDialogVisible(false)}
                      />
                    </div>
                  }
                >
                  {loadingAddresses ? (
                    <div className="text-center p-5">
                      <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
                      <p>Đang tải địa chỉ...</p>
                    </div>
                  ) : (
                    <div className="grid">
                      {addresses.map((address) => (
                        <div key={address.address_id} className="col-12 md:col-6 lg:col-4 p-2">
                          <Card
                            className={`address-card cursor-pointer hover:shadow-4 ${selectedAddressId === address.address_id ? "border-2 border-blue-500 bg-blue-50" : "border-1 border-gray-300"}`}
                            onClick={() => handleAddressSelect(address.address_id)}
                          >
                            <div className="flex align-items-start mb-3">
                              <Avatar
                                icon="pi pi-map-marker"
                                className="mr-2"
                                style={{ backgroundColor: "#2196F3", color: "#ffffff" }}
                              />
                              <div>
                                <h4 className="m-0">{address.recipient_name}</h4>
                                <p className="m-0">{address.phone_number}</p>
                              </div>
                              {address.is_default === 1 && <Tag className="ml-auto" value="Mặc định" severity="info" />}
                            </div>
                            <p className="address-text m-0">
                              {[address.address, address.district, address.province, address.city, "Việt Nam"]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </Dialog>

                {/* New Address dialog */}
                <Dialog
                  id="newAddressDialog"
                  visible={!addressDialogVisible && newAddress.recipient_name !== ""}
                  style={{ width: "600px" }}
                  header="Thêm địa chỉ mới"
                  modal
                  onHide={() => setNewAddress({ recipient_name: "" })}
                  footer={
                    <div>
                      <Button
                        label="Hủy"
                        icon="pi pi-times"
                        className="p-button-text"
                        onClick={() => setNewAddress({ recipient_name: "" })}
                      />
                      <Button
                        label="Lưu địa chỉ"
                        icon="pi pi-check"
                        className="p-button-success"
                        onClick={saveNewAddress}
                      />
                    </div>
                  }
                >
                  <div className="p-fluid">
                    <div className="field mb-3">
                      <label htmlFor="newName" className="font-medium">
                        Người nhận <span className="text-red-500">*</span>
                      </label>
                      <InputText
                        id="newName"
                        name="recipient_name"
                        value={newAddress.recipient_name}
                        onChange={handleNewAddressChange}
                        className="w-full"
                      />
                    </div>

                    <div className="field mb-3">
                      <label htmlFor="newPhone" className="font-medium">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <InputText
                        id="newPhone"
                        name="phone_number"
                        value={newAddress.phone_number}
                        onChange={handleNewAddressChange}
                        className="w-full"
                      />
                    </div>

                    <div className="field mb-3">
                      <label htmlFor="newAddress" className="font-medium">
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <InputText
                        id="newAddress"
                        name="address"
                        value={newAddress.address}
                        onChange={handleNewAddressChange}
                        className="w-full"
                      />
                    </div>

                    <div className="formgrid grid">
                      <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="newDistrict" className="font-medium">
                          Quận/Huyện
                        </label>
                        <InputText
                          id="newDistrict"
                          name="district"
                          value={newAddress.district}
                          onChange={handleNewAddressChange}
                          className="w-full"
                        />
                      </div>

                      <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="newProvince" className="font-medium">
                          Tỉnh/Thành <span className="text-red-500">*</span>
                        </label>
                        <InputText
                          id="newProvince"
                          name="province"
                          value={newAddress.province}
                          onChange={handleNewAddressChange}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="formgrid grid">
                      <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="newCity" className="font-medium">
                          Thành phố <span className="text-red-500">*</span>
                        </label>
                        <InputText
                          id="newCity"
                          name="city"
                          value={newAddress.city}
                          onChange={handleNewAddressChange}
                          className="w-full"
                        />
                      </div>

                      <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="newCountry" className="font-medium">
                          Quốc gia
                        </label>
                        <InputText
                          id="newCountry"
                          name="country"
                          value={newAddress.country}
                          onChange={handleNewAddressChange}
                          className="w-full"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="field mb-3">
                      <label className="font-medium d-block mb-2">Loại địa chỉ</label>
                      <div className="flex gap-4">
                        <div className="flex align-items-center">
                          <RadioButton
                            inputId="typeHome"
                            name="address_type"
                            value="Nhà riêng"
                            checked={newAddress.address_type === "Nhà riêng"}
                            onChange={handleNewAddressChange}
                          />
                          <label htmlFor="typeHome" className="ml-2">
                            Nhà riêng
                          </label>
                        </div>
                        <div className="flex align-items-center">
                          <RadioButton
                            inputId="typeOffice"
                            name="address_type"
                            value="Văn phòng"
                            checked={newAddress.address_type === "Văn phòng"}
                            onChange={handleNewAddressChange}
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
                          name="is_default"
                          checked={newAddress.is_default}
                          onChange={handleNewAddressChange}
                        />
                        <label htmlFor="isDefault" className="ml-2">
                          Đặt làm địa chỉ mặc định
                        </label>
                      </div>
                    </div>
                  </div>
                </Dialog>
              </div>
            )}

            {/* Manual address input */}
            {(!currentUser || !selectedAddressId) && (
              <div className="manual-address-input grid">
                <div className="col-12 md:col-6 mb-3">
                  <span className="p-float-label">
                    <InputText
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <label htmlFor="address">Số nhà, tên đường</label>
                  </span>
                </div>

                <div className="col-12 md:col-6 mb-3">
                  <span className="p-float-label">
                    <InputText
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <label htmlFor="district">Quận/Huyện</label>
                  </span>
                </div>

                <div className="col-12 md:col-6 mb-3">
                  <span className="p-float-label">
                    <InputText
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <label htmlFor="province">Tỉnh/Thành</label>
                  </span>
                </div>

                <div className="col-12 md:col-6 mb-3">
                  <span className="p-float-label">
                    <InputText
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <label htmlFor="city">Thành phố</label>
                  </span>
                </div>
              </div>
            )}

            <div className="notes-section mb-3">
              <label htmlFor="notes" className="block mb-2 font-medium">
                Ghi chú đơn hàng
              </label>
              <InputTextarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full"
                placeholder="Lưu ý yêu cầu khác (Không bắt buộc)"
              />
            </div>

            <div
              className="invoice-option p-3 border-round-lg hover:bg-gray-100 cursor-pointer flex align-items-center"
              onClick={() => handleInputChange({ target: { name: "invoice", value: !formData.invoice } })}
            >
              <Checkbox inputId="invoice" name="invoice" checked={formData.invoice} onChange={handleInputChange} />
              <label htmlFor="invoice" className="ml-2 cursor-pointer">
                Xuất hóa đơn cho đơn hàng
              </label>
            </div>
          </Card>

          <div className="shipping-actions flex justify-content-between mt-4">
            <Button
              label="Quay lại giỏ hàng"
              icon="pi pi-arrow-left"
              className="p-button-outlined p-button-secondary"
              onClick={prevStep}
            />
            <Button
              label="Tiếp tục thanh toán"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="p-button-danger p-button-raised"
              onClick={nextStep}
            />
          </div>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Đơn hàng của bạn" className="order-summary-card sticky-top">
            <div className="order-items">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-content-between align-items-center border-bottom-1 border-gray-200 py-3"
                >
                  <div className="flex align-items-center">
                    <div className="relative">
                      <img
                        src={item.photo || "/placeholder.svg"}
                        alt={item.product_name}
                        style={{ width: "60px", height: "60px", objectFit: "contain" }}
                        className="border-round shadow-1"
                      />
                      <Badge
                        value={item.quantity}
                        severity="danger"
                        className="absolute"
                        style={{ top: "-8px", right: "-8px" }}
                      ></Badge>
                    </div>
                    <div className="ml-2">
                      <div className="font-medium text-primary">{item.product_name}</div>
                      {item.variant_sku !== "Mặc định" && <small className="text-gray-600">{item.variant_sku}</small>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-red-600">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals mt-4 p-3 bg-gray-50 border-round-lg">
              <div className="flex justify-content-between mb-2">
                <span className="text-gray-700">Tạm tính:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="text-gray-700">Phí vận chuyển:</span>
                <span className="text-green-500">Miễn phí</span>
              </div>
              <Divider />
              <div className="flex justify-content-between">
                <span className="font-bold">Tổng tiền:</span>
                <span className="font-bold text-xl text-red-600">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="shipping-guarantee mt-4">
              <div className="flex align-items-center mb-2">
                <i className="pi pi-shield text-green-500 mr-2"></i>
                <span className="font-medium">Bảo hành chính hãng 12 tháng</span>
              </div>
              <div className="flex align-items-center mb-2">
                <i className="pi pi-truck text-blue-500 mr-2"></i>
                <span className="font-medium">Giao hàng miễn phí toàn quốc</span>
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-sync text-orange-500 mr-2"></i>
                <span className="font-medium">Đổi trả trong vòng 7 ngày</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Payment step
  const PaymentStep = () => {
    return (
      <div className="grid checkout-step-container">
        <div className="col-12 lg:col-8">
          <Card title="Thông tin đặt hàng" className="mb-4 order-info-card">
            <div className="grid">
              <div className="col-12 mb-3">
                <div className="p-3 border-round-lg bg-blue-50 border-left-3 border-blue-500">
                  <div className="flex align-items-center mb-2">
                    <Avatar
                      icon="pi pi-user"
                      className="mr-2"
                      style={{ backgroundColor: "#2196F3", color: "#ffffff" }}
                    />
                    <h3 className="m-0">Thông tin khách hàng</h3>
                  </div>
                  <div className="grid">
                    <div className="col-12 md:col-6 mb-2">
                      <span className="font-semibold text-blue-800">Khách hàng:</span>
                      <span className="ml-2">
                        {formData.gender === "male" ? "Anh" : "Chị"} {formData.name}
                      </span>
                    </div>

                    <div className="col-12 md:col-6 mb-2">
                      <span className="font-semibold text-blue-800">Số điện thoại:</span>
                      <span className="ml-2">{formData.phone}</span>
                    </div>

                    {formData.email && (
                      <div className="col-12 mb-2">
                        <span className="font-semibold text-blue-800">Email:</span>
                        <span className="ml-2">{formData.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 mb-3">
                <div className="p-3 border-round-lg bg-green-50 border-left-3 border-green-500">
                  <div className="flex align-items-center mb-2">
                    <Avatar
                      icon="pi pi-map-marker"
                      className="mr-2"
                      style={{ backgroundColor: "#4CAF50", color: "#ffffff" }}
                    />
                    <h3 className="m-0">Địa chỉ giao hàng</h3>
                  </div>
                  <p className="m-0">
                    {[formData.address, formData.district, formData.province, formData.city, "Việt Nam"]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>

              {formData.notes && (
                <div className="col-12 mb-3">
                  <div className="p-3 border-round-lg bg-yellow-50 border-left-3 border-yellow-500">
                    <div className="flex align-items-center mb-2">
                      <Avatar
                        icon="pi pi-comment"
                        className="mr-2"
                        style={{ backgroundColor: "#FF9800", color: "#ffffff" }}
                      />
                      <h3 className="m-0">Ghi chú</h3>
                    </div>
                    <p className="m-0">{formData.notes}</p>
                  </div>
                </div>
              )}

              <div className="col-12">
                <div className="p-3 border-round-lg bg-purple-50 border-left-3 border-purple-500">
                  <div className="flex align-items-center mb-2">
                    <Avatar
                      icon="pi pi-shopping-cart"
                      className="mr-2"
                      style={{ backgroundColor: "#9C27B0", color: "#ffffff" }}
                    />
                    <h3 className="m-0">Thông tin đơn hàng</h3>
                  </div>
                  <div className="grid">
                    <div className="col-12 md:col-6 mb-2">
                      <span className="font-semibold text-purple-800">Tạm tính:</span>
                      <span className="ml-2">{formatCurrency(totalPrice)}</span>
                    </div>

                    <div className="col-12 md:col-6 mb-2">
                      <span className="font-semibold text-purple-800">Phí vận chuyển:</span>
                      <span className="ml-2 text-green-500">Miễn phí</span>
                    </div>

                    <div className="col-12 mb-2">
                      <span className="font-semibold text-purple-800">Tổng tiền:</span>
                      <span className="ml-2 text-red-600 font-bold">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Chọn hình thức thanh toán" className="mb-4 payment-method-card">
            {paymentMethods.length === 0 ? (
              <div className="text-center p-3">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: "1.5rem" }}></i>
                <p>Đang tải phương thức thanh toán...</p>
              </div>
            ) : (
              <div className="payment-methods-container">
                {paymentMethods.map((method) => (
                  <div
                    className={`payment-method-option p-3 border-round-lg  hover:bg-gray-100 cursor-pointer mb-3 ${
                      Number.parseInt(formData.payment) === method.payment_method_id
                        ? "border-2 border-blue-500 bg-blue-50"
                        : "border-1 border-gray-200"
                    }`}
                    key={method.payment_method_id}
                    onClick={() => handleInputChange({ target: { name: "payment", value: method.payment_method_id } })}
                  >
                    <div className="flex align-items-center">
                      <RadioButton
                        inputId={`payment${method.payment_method_id}`}
                        name="payment"
                        value={method.payment_method_id}
                        onChange={(e) => handleInputChange({ target: { name: "payment", value: e.value } })}
                        checked={Number.parseInt(formData.payment) === method.payment_method_id}
                      />
                      <label
                        htmlFor={`payment${method.payment_method_id}`}
                        className="ml-2 cursor-pointer flex align-items-center"
                      >
                        {method.payment_method_name.toLowerCase().includes("khi giao hàng") && (
                          <i className="pi pi-money-bill text-green-500 mr-2"></i>
                        )}
                        {method.payment_method_name.toLowerCase().includes("chuyển khoản") && (
                          <i className="pi pi-credit-card text-blue-500 mr-2"></i>
                        )}
                        {method.payment_method_name.toLowerCase().includes("momo") && (
                          <i className="pi pi-wallet text-pink-500 mr-2"></i>
                        )}
                        {method.payment_method_name.toLowerCase().includes("visa") && (
                          <i className="pi pi-credit-card text-blue-800 mr-2"></i>
                        )}
                        <span>{method.payment_method_name}</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.payment &&
              paymentMethods
                .find((m) => m.payment_method_id === Number.parseInt(formData.payment))
                ?.payment_method_name.toLowerCase()
                .includes("khi giao hàng") && (
                <Message severity="info" className="mb-3 border-round-lg" style={{ borderLeft: "6px solid #2196F3" }}>
                  <div className="flex align-items-center">
                    <i className="pi pi-info-circle mr-2 text-xl"></i>
                    <span>Lưu ý: Vui lòng kiểm tra và xác nhận đơn hàng trước khi thanh toán!</span>
                  </div>
                </Message>
              )}

            {formData.payment &&
              paymentMethods
                .find((m) => m.payment_method_id === Number.parseInt(formData.payment))
                ?.payment_method_name.toLowerCase()
                .includes("chuyển khoản") && (
                <div className="p-4 border-1 border-gray-300 mt-3 border-round-lg bg-gray-50 shadow-1">
                  <h4 className="mt-0 mb-3 text-blue-800">
                    <i className="pi pi-info-circle mr-2"></i>
                    Thông tin tài khoản
                  </h4>
                  <div className="bank-info">
                    <div className="flex align-items-center mb-2">
                      <i className="pi pi-building text-blue-500 mr-2"></i>
                      <span className="font-medium">Ngân hàng:</span>
                      <span className="ml-2">Vietcombank</span>
                    </div>
                    <div className="flex align-items-center mb-2">
                      <i className="pi pi-id-card text-blue-500 mr-2"></i>
                      <span className="font-medium">Số tài khoản:</span>
                      <span className="ml-2">1234567890</span>
                    </div>
                    <div className="flex align-items-center mb-2">
                      <i className="pi pi-user text-blue-500 mr-2"></i>
                      <span className="font-medium">Chủ tài khoản:</span>
                      <span className="ml-2">CÔNG TY TNHH GEARVN</span>
                    </div>
                    <div className="flex align-items-center">
                      <i className="pi pi-comment text-blue-500 mr-2"></i>
                      <span className="font-medium">Nội dung:</span>
                      <span className="ml-2">Thanh toán đơn hàng [{formData.phone}]</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 border-round-lg border-left-3 border-yellow-500">
                    <i className="pi pi-exclamation-triangle text-yellow-500 mr-2"></i>
                    <span>Vui lòng chuyển khoản đúng nội dung để đơn hàng được xử lý nhanh chóng!</span>
                  </div>
                </div>
              )}
          </Card>

          <div className="payment-actions flex justify-content-between mt-4">
            <Button
              label="Quay lại"
              icon="pi pi-arrow-left"
              className="p-button-outlined p-button-secondary"
              onClick={prevStep}
            />
            <Button
              label="Hoàn tất đặt hàng"
              icon="pi pi-check"
              iconPos="right"
              className="p-button-danger p-button-raised"
              onClick={handleCompleteOrder}
              loading={loading}
              disabled={!formData.payment}
            />
          </div>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Đơn hàng của bạn" className="order-summary-card sticky-top">
            <div className="order-items">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-content-between align-items-center border-bottom-1 border-gray-200 py-3"
                >
                  <div className="flex align-items-center">
                    <div className="relative">
                      <img
                        src={item.photo || "/placeholder.svg"}
                        alt={item.product_name}
                        style={{ width: "60px", height: "60px", objectFit: "contain" }}
                        className="border-round shadow-1"
                      />
                      <Badge
                        value={item.quantity}
                        severity="danger"
                        className="absolute"
                        style={{ top: "-8px", right: "-8px" }}
                      ></Badge>
                    </div>
                    <div className="ml-2">
                      <div className="font-medium text-primary">{item.product_name}</div>
                      {item.variant_sku !== "Mặc định" && <small className="text-gray-600">{item.variant_sku}</small>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-red-600">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals mt-4 p-3 bg-gray-50 border-round-lg">
              <div className="flex justify-content-between mb-2">
                <span className="text-gray-700">Tạm tính:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="text-gray-700">Phí vận chuyển:</span>
                <span className="text-green-500">Miễn phí</span>
              </div>
              <Divider />
              <div className="flex justify-content-between">
                <span className="font-bold">Tổng tiền:</span>
                <span className="font-bold text-xl text-red-600">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="shipping-guarantee mt-4">
              <div className="flex align-items-center mb-2">
                <i className="pi pi-shield text-green-500 mr-2"></i>
                <span className="font-medium">Bảo hành chính hãng 12 tháng</span>
              </div>
              <div className="flex align-items-center mb-2">
                <i className="pi pi-truck text-blue-500 mr-2"></i>
                <span className="font-medium">Giao hàng miễn phí toàn quốc</span>
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-sync text-orange-500 mr-2"></i>
                <span className="font-medium">Đổi trả trong vòng 7 ngày</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Confirmation step
  const ConfirmationStep = () => {
    const orderId = sessionStorage.getItem("lastOrderId") || Math.floor(100000 + Math.random() * 900000).toString()

    const events = [
      {
        status: "Đặt hàng",
        date: new Date().toLocaleDateString("vi-VN"),
        icon: "pi pi-shopping-cart",
        color: "#607D8B",
      },
      { status: "Xác nhận", date: "Đang chờ", icon: "pi pi-check", color: "#FF9800" },
      { status: "Đóng gói", date: "Đang chờ", icon: "pi pi-box", color: "#8BC34A" },
      { status: "Vận chuyển", date: "Đang chờ", icon: "pi pi-truck", color: "#03A9F4" },
      { status: "Giao hàng", date: "Đang chờ", icon: "pi pi-home", color: "#4CAF50" },
    ]

    return (
      <div className="grid checkout-step-container">
        <div className="col-12 text-center">
          <div className="confirmation-header p-5 bg-green-50 border-round-lg shadow-4 mb-4">
            <i className="pi pi-check-circle text-green-500" style={{ fontSize: "5rem" }}></i>
            <h2 className="text-green-700 text-3xl mt-3">Đặt hàng thành công</h2>
            <p className="text-green-600 text-xl">Cảm ơn quý Khách đã cho GEARVN có cơ hội được phục vụ.</p>
            <p className="text-gray-600">Nhân viên GEARVN sẽ liên hệ với quý khách trong thời gian sớm nhất.</p>
          </div>
        </div>

        <div className="col-12 lg:col-8">
          <Card className="order-details-card mb-4">
            <div className="flex justify-content-between align-items-center mb-4">
              <h3 className="m-0">
                {/* <i className="pi pi-shopping-bag mr-2 text-primary"></i> */}
                ĐANG CHỜ XÁC NHẬN
              </h3>
              <Button
                label="Quản lý đơn hàng"
                icon="pi pi-list"
                className="p-button-outlined p-button-info"
                onClick={() => router.push("/landing/userprofile")}
              />
            </div>

            <div className="order-timeline mb-4">
              <Timeline
                value={events}
                align="horizontal"
                className="customized-timeline"
                content={(item) => item.status}
                marker={(item) => (
                  <span className="custom-marker shadow-2" style={{ backgroundColor: item.color }}>
                    <i className={item.icon}></i>
                  </span>
                )}
                opposite={(item) => <small className="p-text-secondary">{item.date}</small>}
              />
            </div>

            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <div className="p-3 border-round-lg bg-blue-50">
                  <h4 className="mt-0 mb-3 text-blue-800">
                    <i className="pi pi-user mr-2"></i>
                    Thông tin khách hàng
                  </h4>
                  <div className="customer-info">
                    <div className="flex mb-2">
                      <span className="font-medium w-6">Họ tên:</span>
                      <span>{formData.name}</span>
                    </div>
                    <div className="flex mb-2">
                      <span className="font-medium w-6">Số điện thoại:</span>
                      <span>{formData.phone}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-6">Email:</span>
                      <span>{formData.email || "không có"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-6 mb-3">
                <div className="p-3 border-round-lg bg-green-50">
                  <h4 className="mt-0 mb-3 text-green-800">
                    <i className="pi pi-map-marker mr-2"></i>
                    Địa chỉ giao hàng
                  </h4>
                  <p className="m-0">
                    {[formData.address, formData.district, formData.province, formData.city, "Việt Nam"]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>

              <div className="col-12 md:col-6 mb-3">
                <div className="p-3 border-round-lg bg-orange-50">
                  <h4 className="mt-0 mb-3 text-orange-800">
                    <i className="pi pi-wallet mr-2"></i>
                    Thông tin thanh toán
                  </h4>
                  <div className="payment-info">
                    <div className="flex mb-2">
                      <span className="font-medium w-6">Tổng tiền:</span>
                      <span className="text-red-600 font-bold">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-6">Hình thức:</span>
                      <span>
                        {paymentMethods.find((m) => m.payment_method_id === Number.parseInt(formData.payment))
                          ?.payment_method_name || "Tiền mặt khi nhận hàng"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-6 mb-3">
                <div className="p-3 border-round-lg bg-purple-50">
                  <h4 className="mt-0 mb-3 text-purple-800">
                    <i className="pi pi-clock mr-2"></i>
                    Thông tin đơn hàng
                  </h4>
                  <div className="order-info">
                    <div className="flex mb-2">
                      <span className="font-medium w-6">Mã đơn hàng:</span>
                      <span>#{orderId}</span>
                    </div>
                    <div className="flex mb-2">
                      <span className="font-medium w-6">Ngày đặt:</span>
                      <span>{new Date().toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-6">Trạng thái:</span>
                      <Tag severity="warning" value="Đang xử lý" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Message severity="warning" className="mt-4 border-round-lg" style={{ borderLeft: "6px solid #FF9800" }}>
              <div className="flex align-items-center">
                <i className="pi pi-exclamation-triangle mr-2 text-xl"></i>
                <span className="font-medium">Tuyệt đối không chuyển khoản cho Shipper trước khi nhận hàng.</span>
              </div>
            </Message>

            <div className="p-3 border-1 border-gray-300 mt-3 text-center border-round-lg bg-gray-50">
              <span className="font-medium text-xl">
                {paymentMethods
                  .find((m) => m.payment_method_id === Number.parseInt(formData.payment))
                  ?.payment_method_name.toLowerCase()
                  .includes("khi giao hàng") ? (
                  <span className="text-orange-500">
                    <i className="pi pi-clock mr-2"></i>Đơn hàng chưa được thanh toán
                  </span>
                ) : (
                  <span className="text-green-500">
                    <i className="pi pi-check-circle mr-2"></i>Đơn hàng đã thanh toán
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-content-center mt-4 gap-3">
              <Button
                label="Tiếp tục mua hàng"
                icon="pi pi-shopping-cart"
                className="p-button-raised p-button-success"
                onClick={() => router.push("/")}
              />
              <Button
                label="Theo dõi đơn hàng"
                icon="pi pi-search"
                className="p-button-outlined p-button-info"
                onClick={() => router.push("/user/profile")}
              />
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Chi tiết đơn hàng" className="order-items-card sticky-top">
            <div className="order-items">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-content-between align-items-center border-bottom-1 border-gray-200 py-3"
                >
                  <div className="flex align-items-center">
                    <div className="relative">
                      <img
                        src={item.photo || "/placeholder.svg"}
                        alt={item.product_name}
                        style={{ width: "60px", height: "60px", objectFit: "contain" }}
                        className="border-round shadow-1"
                      />
                      <Badge
                        value={item.quantity}
                        severity="danger"
                        className="absolute"
                        style={{ top: "-8px", right: "-8px" }}
                      ></Badge>
                    </div>
                    <div className="ml-2">
                      <div className="font-medium text-primary">{item.product_name}</div>
                      {item.variant_sku !== "Mặc định" && <small className="text-gray-600">{item.variant_sku}</small>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-red-600">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals mt-4 p-3 bg-gray-50 border-round-lg">
              <div className="flex justify-content-between mb-2">
                <span className="text-gray-700">Tạm tính:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="text-gray-700">Phí vận chuyển:</span>
                <span className="text-green-500">Miễn phí</span>
              </div>
              <Divider />
              <div className="flex justify-content-between">
                <span className="font-bold">Tổng tiền:</span>
                <span className="font-bold text-xl text-red-600">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="contact-support mt-4 p-3 border-round-lg bg-blue-50 border-left-3 border-blue-500">
              <h4 className="mt-0 mb-2 text-blue-800">
                <i className="pi pi-phone mr-2"></i>
                Hỗ trợ khách hàng
              </h4>
              <p className="mb-2">Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi:</p>
              <div className="flex align-items-center mb-2">
                <i className="pi pi-phone text-blue-500 mr-2"></i>
                <span className="font-medium">Hotline: 1800 6975</span>
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-envelope text-blue-500 mr-2"></i>
                <span className="font-medium">Email: support@gearvn.com</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Render the appropriate step based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CartStep />
      case 2:
        return <ShippingInfoStep />
      case 3:
        return <PaymentStep />
      case 4:
        return <ConfirmationStep />
      default:
        return <CartStep />
    }
  }
  // If not client-side yet, show loading
  if (!isClient) {
    return (
      <div className="checkout-loading p-4 border-round shadow-2 surface-card">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
          <h3>Đang tải...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      <Head>
        <title>Thanh toán - GEARVN</title>
        <link rel="icon" href="/img_data/index/favicon.png" type="image/png" />
      </Head>

      <Toast ref={toast} position="top-right" />

      <div className="surface-card p-4 border-round shadow-4 mt-4 mb-4">
        <div className="checkout-header text-center mb-4">
          <h1 className="text-3xl font-bold text-primary mb-3">Thanh toán</h1>
          <p className="text-gray-600 mb-4">Hoàn tất đơn hàng của bạn chỉ với vài bước đơn giản</p>
        </div>

        <Steps model={steps} activeIndex={currentStep - 1} className="mb-5" />

        {renderStep()}
      </div>
    </div>
  )
}

CheckoutPage.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>
}

export default CheckoutPage;

