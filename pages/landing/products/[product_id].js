import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import PublicLayout from "../../../layout/PublicLayout"
import productsService from "../../Services/productsService"
import Product_SpecificationsService from "../../Services/Product_SpecificationsService"
import ProductCard from "../../components/productCard"
import Product_ImagesService from "../../Services/product_imagesService"
import cartService from "../../Services/cartService"
// PrimeReact components
import { Button } from "primereact/button"
import { TabView, TabPanel } from "primereact/tabview"
import { Dialog } from "primereact/dialog"
import { InputNumber } from "primereact/inputnumber"
import { Tag } from "primereact/tag"
import { Toast } from "primereact/toast"
import { Card } from "primereact/card"
import { Accordion, AccordionTab } from "primereact/accordion"
import { Galleria } from "primereact/galleria"
import { ProgressBar } from "primereact/progressbar"
import { Skeleton } from "primereact/skeleton"

// Product Gallery Component with Enhanced UI
const ProductGallery = ({ images, productName, onImageClick }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto rotate images every 5 seconds if there are multiple images
  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [images.length])

  if (!images || images.length === 0) {
    return (
      <div
        className="flex flex-column justify-content-center align-items-center p-4 bg-gray-100 rounded-lg"
        style={{ height: "400px" }}
      >
        <i className="pi pi-image text-6xl text-gray-300 mb-3"></i>
        <span className="text-gray-500 font-medium">Không có hình ảnh sản phẩm</span>
      </div>
    )
  }

  const itemTemplate = (item) => {
    return (
      <div className="flex justify-content-center p-2">
        <img
          src={item || "/placeholder.svg"}
          alt={productName}
          className="w-full cursor-pointer shadow-2 border-round-lg transition-all transition-duration-300 hover:shadow-8"
          style={{ maxHeight: "450px", objectFit: "contain" }}
          onClick={() => onImageClick(item)}
        />
      </div>
    )
  }

  const thumbnailTemplate = (item) => {
    return (
      <div className="flex justify-content-center p-1">
        <img
          src={item || "/placeholder.svg"}
          alt={productName}
          className="border-round-lg"
          style={{ width: "70px", height: "70px", objectFit: "cover" }}
        />
      </div>
    )
  }

  return (
    <div className="product-gallery">
      <Galleria
        value={images}
        activeIndex={activeIndex}
        onItemChange={(e) => setActiveIndex(e.index)}
        item={itemTemplate}
        thumbnail={thumbnailTemplate}
        numVisible={5}
        circular
        showItemNavigators
        showThumbnailNavigators={images.length > 5}
        showThumbnails={images.length > 1}
        className="custom-galleria"
      />

      {/* Image counter indicator */}
      {images.length > 1 && (
        <div className="image-counter flex align-items-center justify-content-center gap-2 mt-2">
          {images.map((_, index) => (
            <div
              key={index}
              className={`image-dot cursor-pointer transition-all transition-duration-300 ${index === activeIndex ? "bg-primary" : "bg-gray-300"}`}
              style={{ width: "8px", height: "8px", borderRadius: "50%" }}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Variant Attribute Display Component with Enhanced UI
const VariantAttributeDisplay = ({ variant }) => {
  if (!variant || !variant.variant_attributes || variant.variant_attributes === "Chưa có thuộc tính") {
    return null
  }

  let attributes = variant.variant_attributes

  // Parse attributes if it's a string
  if (typeof attributes === "string") {
    try {
      attributes = JSON.parse(attributes)
    } catch (e) {
      return null
    }
  }

  // Return null if attributes is not an object
  if (typeof attributes !== "object" || !Object.keys(attributes).length) {
    return null
  }

  return (
    <div className="mb-4 p-3 border-1 border-gray-200 rounded-lg bg-gray-50 shadow-1 transition-all transition-duration-300 hover:shadow-3">
      <h3 className="font-medium mb-3 text-primary">Thông số của phiên bản này:</h3>
      <div className="grid">
        {Object.entries(attributes).map(([key, value], index) => (
          <div key={index} className="col-12 sm:col-6 mb-2">
            <div className="flex align-items-center p-2 border-round-lg hover:bg-gray-100 transition-colors transition-duration-300">
              <i className="pi pi-check-circle text-green-500 mr-2"></i>
              <span className="font-medium text-gray-700 mr-2">{key}:</span>
              <span className="text-gray-800">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stock Status Component
const StockStatus = ({ quantity }) => {
  if (!quantity || quantity <= 0) {
    return (
      <div className="stock-status p-3 bg-red-50 border-round-lg border-left-3 border-red-500 mb-3">
        <div className="flex align-items-center">
          <i className="pi pi-times-circle text-red-500 mr-2 text-xl"></i>
          <span className="font-medium text-red-700">Hết hàng</span>
        </div>
        <small className="block mt-2 text-red-600">Vui lòng liên hệ để biết thêm thông tin</small>
      </div>
    )
  }

  let status = "Còn hàng"
  let color = "green"
  let percentage = 100

  if (quantity <= 5) {
    status = "Sắp hết hàng"
    color = "orange"
    percentage = 20
  } else if (quantity <= 10) {
    status = "Còn ít hàng"
    color = "blue"
    percentage = 40
  }

  return (
    <div className={`stock-status p-3 bg-${color}-50 border-round-lg border-left-3 border-${color}-500 mb-3`}>
      <div className="flex align-items-center justify-content-between">
        <div className="flex align-items-center">
          <i className={`pi pi-check-circle text-${color}-500 mr-2 text-xl`}></i>
          <span className={`font-medium text-${color}-700`}>{status}</span>
        </div>
        <Tag
          severity={color === "green" ? "success" : color === "orange" ? "warning" : "info"}
          value={`Còn ${quantity} sản phẩm`}
        />
      </div>
      <ProgressBar value={percentage} showValue={false} className="mt-2" style={{ height: "6px" }} />
    </div>
  )
}

// Price Display Component
const PriceDisplay = ({ variant, calculateDiscount }) => {
  if (!variant) return null

  const discount = calculateDiscount()
  const hasDiscount = variant.base_price > variant.final_price

  return (
    <div className="product-price-card p-3 rounded-lg bg-red-50 border-left-3 border-red-500 mb-4 shadow-2">
      <div className="flex flex-column">
        <div className="flex justify-content-between align-items-center">
          <span className="text-3xl font-bold text-red-600">
            {new Intl.NumberFormat("vi-VN").format(variant.final_price || 0)}₫
          </span>

          {hasDiscount && discount > 0 && (
            <div className="discount-badge bg-red-600 text-white px-3 py-2 border-round-lg text-lg font-bold flex align-items-center">
              <i className="pi pi-tag mr-2"></i>-{discount}%
            </div>
          )}
        </div>

        {hasDiscount && (
          <div className="flex align-items-center mt-2">
            <span className="text-gray-700 line-through text-xl mr-2">
              {new Intl.NumberFormat("vi-VN").format(variant.base_price)}₫
            </span>
            <span className="text-green-600 font-medium">
              Tiết kiệm: {new Intl.NumberFormat("vi-VN").format(variant.base_price - variant.final_price)}₫
            </span>
          </div>
        )}

        {/* Installment payment option */}
        <div className="mt-3 p-2 bg-blue-50 border-round-lg">
          <div className="flex align-items-center">
            <i className="pi pi-credit-card text-blue-500 mr-2"></i>
            <span className="font-medium text-blue-700">
              Trả góp chỉ từ {new Intl.NumberFormat("vi-VN").format(Math.round(variant.final_price / 12))}₫/tháng
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductDetailPage = () => {
  const router = useRouter()
  const { product_id } = router.query
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [variants, setVariants] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState(0)
  const [specifications, setSpecifications] = useState([])
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [productImages, setProductImages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const toastRef = useRef(null)

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!selectedVariant) return 0

    const { base_price, final_price } = selectedVariant
    if (!base_price || base_price <= 0 || final_price >= base_price) return 0

    return Math.round(((base_price - final_price) / base_price) * 100)
  }

  // Function to save viewed product to localStorage
  const saveViewedProduct = (product) => {
    if (!product) return

    try {
      // Get current viewed products from localStorage
      let viewedProducts = JSON.parse(localStorage.getItem("viewedproduct")) || []

      // Check if product already exists in the array
      const existingProductIndex = viewedProducts.findIndex((p) => p.product_id === product.product_id)

      // Save the view count before removing the product
      let currentViewCount = 1
      if (existingProductIndex !== -1) {
        // Get the current view count if it exists
        currentViewCount = (viewedProducts[existingProductIndex].view_count || 0) + 1

        // Remove the existing product so we can add it to the front (most recent)
        viewedProducts.splice(existingProductIndex, 1)
      }

      // Mock declarations for variables that should be imported or declared elsewhere
      // Replace these with actual imports or declarations in your project
      const productImages = product.images || []
      const variants = product.variants || []
      const selectedVariant = product.selectedVariant || null

      // Get the primary image
      const primaryImage = productImages && productImages.length > 0 ? productImages[0] : null

      // Create a simplified product object to save that's compatible with ProductCard
      const productToSave = {
        product_id: product.product_id,
        product_name: product.product_name,
        category_name: product.category_name || "",
        brand_name: product.brand_name || "",
        is_featured: product.is_featured || 0,

        // Save essential variant information
        variants: variants.map((variant) => ({
          variant_id: variant.variant_id || "default",
          variant_sku: variant.variant_sku || "Mặc định",
          is_featured: variant.is_featured || 0,
          is_default: selectedVariant && selectedVariant.variant_id === variant.variant_id ? 1 : variant.is_default || 0,
          final_price: variant.final_price || 0,
          base_price: variant.base_price || 0,
          stock_quantity: variant.stock_quantity || 0,
          variant_image: variant.variant_image || primaryImage || "/placeholder.svg",
          variant_attributes: variant.variant_attributes || null,
        })),

        // Save primary image
        image_url: primaryImage || "/placeholder.svg",

        // Save timestamp for sorting by recency
        viewed_at: new Date().toISOString(),

        // Use the saved view count
        view_count: currentViewCount,
      }

      // Add the new product to the beginning of the array
      viewedProducts.unshift(productToSave)

      // Limit to 20 products to prevent localStorage from growing too large
      if (viewedProducts.length > 20) {
        viewedProducts = viewedProducts.slice(0, 20)
      }

      // Save back to localStorage
      localStorage.setItem("viewedproduct", JSON.stringify(viewedProducts))
    } catch (error) {
      console.error("Error saving viewed product to localStorage:", error)
    }
  }


  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true)

    // Get current user from localStorage
    const user = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null
    setCurrentUser(user)
  }, [])

  // Reset quantity when changing variant
  useEffect(() => {
    if (selectedVariant) {
      setQuantity(1)
    }
  }, [selectedVariant])

  // Fetch product details when product_id changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product_id) return

      try {
        setLoading(true)

        // Lấy thông tin sản phẩm
        const productData = await productsService.getById(product_id)
        // Lấy ảnh sản phẩm
        const product_imageData = await Product_ImagesService.getById(product_id)

        // Kiểm tra xem productData có tồn tại không
        if (!productData) {
          console.error("Product data not found")
          setLoading(false)
          return
        }

        // Nếu API trả về một mảng, lấy phần tử đầu tiên
        const singleProduct = Array.isArray(productData) ? productData[0] : productData

        if (!singleProduct) {
          console.error("No product found in the response")
          setLoading(false)
          return
        }

        // Xử lý ảnh từ product_imageData
        let images = []
        if (product_imageData && Array.isArray(product_imageData) && product_imageData.length > 0) {
          images = product_imageData.map((img) => img.image_url)
        }

        // Xử lý variants
        let productVariants = []
        if (singleProduct.variants && Array.isArray(singleProduct.variants)) {
          productVariants = singleProduct.variants.map((variant) => {
            return {
              ...variant,
              variant_id: variant.variant_id || "default",
              final_price: Number.parseFloat(variant.final_price) || 0,
              base_price: Number.parseFloat(variant.base_price) || Number.parseFloat(singleProduct.base_price) || 0,
              variant_sku: variant.variant_sku || "Mặc định",
              variant_attributes: variant.variant_attributes,
            }
          })
        } else {
          productVariants = [
            {
              variant_id: "default",
              product_id: singleProduct.product_id,
              final_price: Number.parseFloat(singleProduct.base_price) || 0,
              base_price: Number.parseFloat(singleProduct.base_price) || 0,
              variant_sku: "Mặc định",
              is_default: 1,
              is_featured: singleProduct.is_featured || 0,
              stock_quantity: singleProduct.stock_quantity || 0,
              variant_attributes: singleProduct.variant_attributes || "Chưa có thuộc tính",
            },
          ]
        }

        // Tìm biến thể mặc định hoặc sử dụng biến thể đầu tiên
        const defaultVariant = productVariants.find((v) => v.is_default === 1) || productVariants[0]

        // Cập nhật state
        setProduct(singleProduct)
        setVariants(productVariants)
        setSelectedVariant(defaultVariant)
        setProductImages(images)

        // Lấy thông số kỹ thuật sản phẩm
        if (product_id) {
          try {
            const specs = await Product_SpecificationsService.getById(product_id)

            // Kiểm tra dữ liệu trả về là gì
            if (specs && !Array.isArray(specs)) {
              setSpecifications([specs])
            } else {
              setSpecifications(specs || [])
            }
          } catch (error) {
            // Không cần phải làm gì ở đây vì lỗi đã được xử lý trong service
            console.error("Error handling specifications:", error)
            setSpecifications([])
          }
        }

        // Lấy sản phẩm liên quan (cùng danh mục)
        try {
          const allProducts = await productsService.getAllVariant()
          const related = allProducts
            .filter((p) => p.category_name === singleProduct.category_name && p.product_id !== singleProduct.product_id)
            .slice(0, 5) // Giới hạn 5 sản phẩm liên quan

          setRelatedProducts(related)
          console.log("related:", related)
        } catch (error) {
          console.error("Error fetching related products:", error)
          setRelatedProducts([])
        }

        // Save this product to recently viewed products
        if (singleProduct) {
          saveViewedProduct(singleProduct)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching product details:", error)
        setLoading(false)
      }
    }

    if (product_id) {
      fetchProductDetails()
    }
  }, [product_id])

  // Xử lý khi chọn biến thể
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  // Hàm thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!selectedVariant) return

    try {
      setAddingToCart(true)

      const cartItem = {
        product_id: product.product_id,
        variant_id: selectedVariant.variant_id,
        variant_sku: selectedVariant.variant_sku,
        quantity: quantity,
      }

      if (currentUser && currentUser.user_id) {
        // User is logged in, add to database
        cartItem.user_id = currentUser.user_id
        await cartService.insert(cartItem)
      } else {
        // User is not logged in, add to localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || []
        localCart.push({
          ...cartItem,
          product_name: product.product_name,
          variant_image: productImages[0] || "",
          price: selectedVariant.final_price,
          added_at: new Date().toISOString(),
          is_active: true,
        })
        localStorage.setItem("cart", JSON.stringify(localCart))
      }

      if (toastRef.current) {
        toastRef.current.show({
          severity: "success",
          summary: "Thêm vào giỏ hàng thành công",
          detail: `Đã thêm ${quantity} ${product.product_name} ${selectedVariant.variant_sku !== "Mặc định" ? "- " + selectedVariant.variant_sku : ""} vào giỏ hàng`,
          life: 3000,
        })
      }

      setAddingToCart(false)
    } catch (error) {
      console.error("Error adding to cart:", error)
      if (toastRef.current) {
        toastRef.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Có lỗi xảy ra khi thêm vào giỏ hàng",
          life: 3000,
        })
      }
      setAddingToCart(false)
    }
  }

  // Hàm mua ngay
  const handleBuyNow = async () => {
    try {
      setAddingToCart(true)
      await handleAddToCart()
      router.push("/landing/payment")
    } catch (error) {
      console.error("Error in buy now flow:", error)
      setAddingToCart(false)
    }
  }

  // Danh sách tính năng chính
  const getMainFeatures = () => {
    const features = []

    if (
      selectedVariant &&
      selectedVariant.variant_attributes &&
      selectedVariant.variant_attributes !== "Chưa có thuộc tính"
    ) {
      let attributes = selectedVariant.variant_attributes

      // Parse attributes nếu là chuỗi
      if (typeof attributes === "string" && attributes !== "Chưa có thuộc tính") {
        try {
          attributes = JSON.parse(attributes)
          Object.entries(attributes).forEach(([key, value]) => {
            features.push(`${key}: ${value}`)
          })
        } catch (e) {
          // Nếu parse thất bại, thêm vào như một tính năng đơn
          if (attributes) features.push(attributes)
        }
      } else if (typeof attributes === "object") {
        Object.entries(attributes).forEach(([key, value]) => {
          features.push(`${key}: ${value}`)
        })
      }
    }

    if (specifications && specifications.length > 0) {
      specifications.slice(0, 6 - features.length).forEach((spec) => {
        features.push(`${spec.spec_name}: ${spec.spec_value}`)
      })
    }

    return features.length > 0 ? features.slice(0, 6) : []
  }

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="container">
      <div className="grid">
        <div className="col-12 lg:col-5 mb-4">
          <Card>
            <Skeleton height="400px" className="mb-2"></Skeleton>
            <div className="flex justify-content-center">
              <Skeleton width="70px" height="70px" className="mr-2"></Skeleton>
              <Skeleton width="70px" height="70px" className="mr-2"></Skeleton>
              <Skeleton width="70px" height="70px"></Skeleton>
            </div>
          </Card>
        </div>
        <div className="col-12 lg:col-7">
          <Card>
            <Skeleton width="85%" height="42px" className="mb-2"></Skeleton>
            <Skeleton width="65%" height="24px" className="mb-3"></Skeleton>
            <Skeleton height="100px" className="mb-3"></Skeleton>
            <Skeleton width="40%" height="36px" className="mb-2"></Skeleton>
            <div className="flex mb-3">
              <Skeleton width="100px" height="40px" className="mr-2"></Skeleton>
              <Skeleton width="100px" height="40px" className="mr-2"></Skeleton>
              <Skeleton width="100px" height="40px"></Skeleton>
            </div>
            <Skeleton height="120px" className="mb-3"></Skeleton>
            <div className="flex">
              <Skeleton width="48%" height="50px" className="mr-2"></Skeleton>
              <Skeleton width="48%" height="50px"></Skeleton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  // Product not found
  const renderProductNotFound = () => (
    <div className="flex flex-column align-items-center p-5 text-center">
      <div className="bg-gray-100 p-5 border-round-xl shadow-2 mb-4">
        <i className="pi pi-exclamation-triangle text-yellow-500 text-6xl mb-3"></i>
        <h2 className="text-2xl font-bold mb-3">Không tìm thấy sản phẩm</h2>
        <p className="text-gray-600 mb-4">Sản phẩm này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link href="/landing/collections/laptop">
          <Button label="Quay lại trang sản phẩm" icon="pi pi-arrow-left" className="p-button-primary" />
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <Head>
        <title>{product?.product_name || "Sản phẩm"} | GEARVN</title>
        <meta
          name="description"
          content={product?.description?.substring(0, 160) || `Mua sản phẩm chính hãng tại GEARVN`}
        />
        <style>{`
          /* Product Gallery Styles */
          .custom-galleria .p-galleria-item-wrapper {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 10px;
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .custom-galleria .p-galleria-item {
            display: flex;
            justify-content: center;
          }
          
          .custom-galleria .p-galleria-thumbnail-container {
            background-color: #f0f0f0;
            border-radius: 8px;
            padding: 10px 0;
          }
          
          .custom-galleria .p-galleria-thumbnail-item {
            opacity: 0.7;
            transition: all 0.3s;
          }
          
          .custom-galleria .p-galleria-thumbnail-item.p-galleria-thumbnail-item-active {
            opacity: 1;
            transform: scale(1.05);
          }
          
          .custom-galleria .p-galleria-thumbnail-item:hover {
            transform: translateY(-3px);
            opacity: 1;
          }
          
          /* Product Price Styles */
          .product-price-card {
            transition: all 0.3s ease;
          }
          
          .product-price-card:hover {
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }
          
          .discount-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-2deg);
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% {
              transform: rotate(-2deg) scale(1);
            }
            50% {
              transform: rotate(-2deg) scale(1.05);
            }
            100% {
              transform: rotate(-2deg) scale(1);
            }
          }
          
          /* Variant Selector Styles */
          .variant-button {
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
          }
          
          .variant-button:hover {
            transform: translateY(-2px);
          }
          
          .variant-button.selected {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          
          .variant-button.selected::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: var(--primary-color);
          }
          
          /* Feature Icons Animation */
          .feature-icon {
            transition: all 0.3s ease;
          }
          
          .feature-icon:hover {
            transform: translateY(-5px);
          }
          
          /* Tab Styles */
          .product-tabs .p-tabview-nav {
            border-radius: 8px;
            background-color: #f5f5f5;
            padding: 5px;
          }
          
          .product-tabs .p-tabview-nav li .p-tabview-nav-link {
            border-radius: 6px;
            margin: 3px;
          }
          
          .product-tabs .p-tabview-panels {
            padding: 1.5rem;
            border-radius: 8px;
          }
          
          /* Specifications Table */
          .specifications-table table {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .specifications-table tr:hover {
            background-color: #f0f7ff !important;
          }
          
          /* Related Products */
          .related-products-container {
            position: relative;
            padding: 2rem 0;
          }
          
          .related-products-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 3px;
            background-color: var(--primary-color);
            border-radius: 3px;
          }
        `}</style>
      </Head>

      <Toast ref={toastRef} position="top-right" />

      {loading ? (
        renderSkeleton()
      ) : !product ? (
        renderProductNotFound()
      ) : (
        <div className="container py-4 mt-4">
          {/* Breadcrumb */}
          <div className="mb-4 p-3 bg-gray-50 border-round-lg shadow-1">
            <div className="flex align-items-center flex-wrap">
              <Link href="/" className="text-blue-500 hover:underline flex align-items-center">
                <i className="pi pi-home mr-2"></i>
                <span>Trang chủ</span>
              </Link>
              <i className="pi pi-angle-right mx-2 text-gray-500"></i>
              <Link
                href={`/landing/collections/${
                  product.category_name
                    ? product.category_name.toLowerCase().replace(/\s+/g, "-").replace(/,/g, "-")
                    : "laptop"
                }`}
                className="text-blue-500 hover:underline"
              >
                {product.category_name || "Sản phẩm"}
              </Link>
              <i className="pi pi-angle-right mx-2 text-gray-500"></i>
              <span className="font-medium text-gray-700">{product.product_name}</span>
            </div>
          </div>

          {/* Main content */}
          <div className="grid">
            {/* Left column - Product images with auto-rotation */}
            <div className="col-12 lg:col-5 mb-4">
              <Card className="shadow-4 p-3 border-round-xl">
                <ProductGallery
                  images={productImages}
                  productName={product.product_name}
                  onImageClick={(img) => {
                    setSelectedImage(img)
                    setShowImageDialog(true)
                  }}
                />
              </Card>

              {/* Feature icons */}
              <div className="grid mt-3">
                <div className="col-4 p-2">
                  <div className="feature-icon flex flex-column align-items-center text-center p-3 bg-blue-50 border-round-lg shadow-2 h-full">
                    <i className="pi pi-shield text-2xl text-blue-500 mb-2"></i>
                    <span className="text-sm font-medium">Bảo hành chính hãng 12 tháng</span>
                  </div>
                </div>
                <div className="col-4 p-2">
                  <div className="feature-icon flex flex-column align-items-center text-center p-3 bg-green-50 border-round-lg shadow-2 h-full">
                    <i className="pi pi-truck text-2xl text-green-500 mb-2"></i>
                    <span className="text-sm font-medium">Giao hàng miễn phí toàn quốc</span>
                  </div>
                </div>
                <div className="col-4 p-2">
                  <div className="feature-icon flex flex-column align-items-center text-center p-3 bg-orange-50 border-round-lg shadow-2 h-full">
                    <i className="pi pi-sync text-2xl text-orange-500 mb-2"></i>
                    <span className="text-sm font-medium">Đổi trả trong 7 ngày</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Product info */}
            <div className="col-12 lg:col-7">
              <Card className="shadow-4 mb-4 border-round-xl">
                {/* Product header and price */}
                <div className="product-header mb-4" style={{ marginTop: "-40px" }}>
                  <div className="flex align-items-center mb-2">
                    {/* {product.brand_name && <Tag className="mr-2" severity="info" value={product.brand_name} */}
                    {product.is_featured && <Tag severity="warning" value="Nổi bật" icon="pi pi-star" />}
                  </div>
                  <h1 className="text-3xl font-bold mb-3">{product.product_name}</h1>

                  {/* Stock status */}
                  <StockStatus quantity={selectedVariant?.stock_quantity} />

                  {/* Price display */}
                  <PriceDisplay variant={selectedVariant} calculateDiscount={calculateDiscount} />
                </div>

                {/* Variant selector */}
                {variants.length > 1 && (
                  <div className="mb-4 p-3 bg-gray-50 border-round-lg shadow-1">
                    <h3 className="font-medium mb-3 text-gray-800">
                      <i className="pi pi-list mr-2 text-primary"></i>
                      Chọn phiên bản:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => {
                        const variantName = variant.variant_sku || "Mặc định"
                        const isSelected = selectedVariant?.variant_id === variant.variant_id
                        const isOutOfStock = variant.stock_quantity <= 0

                        return (
                          <Button
                            key={variant.variant_id || "default"}
                            label={variantName}
                            className={`variant-button p-button-${isSelected ? "raised" : "outlined"} ${isSelected ? "selected p-button-danger" : "p-button-secondary"}`}
                            onClick={() => handleVariantSelect(variant)}
                            disabled={isOutOfStock}
                            tooltip={isOutOfStock ? "Hết hàng" : ""}
                            tooltipOptions={{ position: "top" }}
                            icon={
                              isOutOfStock ? "pi pi-times-circle" : isSelected ? "pi pi-check-circle" : "pi pi-circle"
                            }
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Variant attributes display */}
                <VariantAttributeDisplay variant={selectedVariant} />

                {/* Main features */}
                <div className="mb-4 p-3 bg-gray-50 border-round-lg shadow-1">
                  <h3 className="font-medium mb-3 text-gray-800">
                    <i className="pi pi-star mr-2 text-primary"></i>
                    Tính năng nổi bật:
                  </h3>
                  <ul className="p-0 m-0 list-none">
                    {getMainFeatures().map((feature, index) => (
                      <li
                        key={index}
                        className="mb-2 p-2 flex align-items-center border-round-lg hover:bg-blue-50 transition-colors transition-duration-300"
                      >
                        <i className="pi pi-check-circle text-green-500 mr-2"></i>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {getMainFeatures().length === 0 && (
                      <li className="p-3 text-center text-gray-500">Chưa có thông tin về tính năng sản phẩm</li>
                    )}
                  </ul>
                </div>

                {/* Quantity */}
                <div className="mb-4 p-3 bg-gray-50 border-round-lg shadow-1">
                  <div className="flex align-items-center">
                    <span className="font-medium mr-3 text-gray-800">
                      <i className="pi pi-shopping-cart mr-2 text-primary"></i>
                      Số lượng:
                    </span>
                    <InputNumber
                      value={quantity}
                      onValueChange={(e) => setQuantity(e.value)}
                      showButtons
                      buttonLayout="horizontal"
                      decrementButtonClassName="p-button-danger"
                      incrementButtonClassName="p-button-danger"
                      incrementButtonIcon="pi pi-plus"
                      decrementButtonIcon="pi pi-minus"
                      min={1}
                      max={selectedVariant?.stock_quantity || 10}
                      disabled={selectedVariant?.stock_quantity <= 0}
                      style={{ width: "140px" }}
                      className="shadow-1"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-column sm:flex-row gap-3 mb-4">
                  <Button
                    label="MUA NGAY"
                    icon="pi pi-check"
                    className="p-button-danger p-button-raised p-button-lg shadow-4"
                    style={{ flex: "1" }}
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || selectedVariant.stock_quantity <= 0 || addingToCart}
                    loading={addingToCart}
                  />
                  <Button
                    label="THÊM VÀO GIỎ"
                    icon="pi pi-shopping-cart"
                    className="p-button-outlined p-button-danger p-button-lg shadow-2"
                    style={{ flex: "1" }}
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock_quantity <= 0 || addingToCart}
                    loading={addingToCart}
                  />
                </div>

                {/* Promotions */}
                <div className="bg-blue-50 p-3 border-1 border-blue-200 border-round-lg mb-4 shadow-2">
                  <h3 className="font-semibold mb-3 text-blue-800 flex align-items-center">
                    <i className="pi pi-gift mr-2"></i>
                    Khuyến mãi đặc biệt
                  </h3>
                  <ul className="p-0 m-0 list-none">
                    <li className="mb-2 flex align-items-center p-2 border-round-lg hover:bg-blue-100 transition-colors transition-duration-300">
                      <i className="pi pi-check text-green-500 mr-2"></i>
                      <span>Tặng voucher giảm giá 10% cho lần mua tiếp theo</span>
                    </li>
                    <li className="mb-2 flex align-items-center p-2 border-round-lg hover:bg-blue-100 transition-colors transition-duration-300">
                      <i className="pi pi-check text-green-500 mr-2"></i>
                      <span>Miễn phí giao hàng toàn quốc</span>
                    </li>
                    <li className="flex align-items-center p-2 border-round-lg hover:bg-blue-100 transition-colors transition-duration-300">
                      <i className="pi pi-check text-green-500 mr-2"></i>
                      <span>Tặng phần mềm bản quyền trị giá 1.200.000đ</span>
                    </li>
                  </ul>
                </div>

                {/* Contact */}
                <div className="flex flex-column md:flex-row gap-3">
                  <Button
                    label="Gọi ngay 1800 6975"
                    icon="pi pi-phone"
                    className="p-button-info p-button-raised shadow-2"
                    style={{ flex: "1" }}
                  />
                  <Button
                    label="Chat với tư vấn viên"
                    icon="pi pi-comments"
                    className="p-button-info p-button-outlined shadow-1"
                    style={{ flex: "1" }}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Product tabs */}
          <div className="mb-5">
            <TabView
              activeIndex={activeTab}
              onTabChange={(e) => setActiveTab(e.index)}
              className="product-tabs shadow-3 border-round-xl"
            >
              <TabPanel header="Thông tin sản phẩm" leftIcon="pi pi-info-circle mr-2">
                <Card className="mb-4 border-round-xl">
                  <h2 className="text-2xl font-bold mb-4 text-primary">Mô tả sản phẩm</h2>
                  <div
                    className="product-description p-3 border-round-lg bg-white"
                    style={{ maxWidth: "100%" }}
                    dangerouslySetInnerHTML={{
                      __html: product.description || "<p>Chưa có thông tin mô tả cho sản phẩm này.</p>",
                    }}
                  />
                </Card>
              </TabPanel>

              <TabPanel header="Thông số kỹ thuật" leftIcon="pi pi-cog mr-2">
                <Card className="border-round-xl">
                  <h2 className="text-2xl font-bold mb-4 text-primary">Thông số kỹ thuật</h2>
                  {specifications && specifications.length > 0 ? (
                    <div className="specifications-table">
                      <table className="w-full border-collapse">
                        <tbody>
                          {specifications.map((spec, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="p-3 border border-gray-200 font-medium" style={{ width: "30%" }}>
                                {spec.spec_name}
                              </td>
                              <td className="p-3 border border-gray-200">{spec.spec_value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-column align-items-center justify-content-center p-5 bg-gray-50 border-round-lg">
                      <i className="pi pi-info-circle text-4xl text-blue-300 mb-3"></i>
                      <p className="text-center text-gray-500">Sản phẩm này chưa có thông số kỹ thuật chi tiết.</p>
                    </div>
                  )}
                </Card>
              </TabPanel>

              <TabPanel header="Chính sách bảo hành" leftIcon="pi pi-shield mr-2">
                <Card className="border-round-xl">
                  <h2 className="text-2xl font-bold mb-4 text-primary">Chính sách bảo hành</h2>
                  <div className="p-3 border-round-lg bg-white">
                    <Accordion multiple>
                      <AccordionTab header="Thời gian bảo hành">
                        <p>Sản phẩm được bảo hành 12 tháng kể từ ngày mua hàng.</p>
                      </AccordionTab>
                      <AccordionTab header="Điều kiện bảo hành">
                        <ul className="m-0 p-0 pl-3">
                          <li className="mb-2">Sản phẩm còn trong thời hạn bảo hành</li>
                          <li className="mb-2">Tem bảo hành, mã vạch còn nguyên vẹn</li>
                          <li className="mb-2">Sản phẩm lỗi do nhà sản xuất</li>
                        </ul>
                      </AccordionTab>
                      <AccordionTab header="Trường hợp không được bảo hành">
                        <ul className="m-0 p-0 pl-3">
                          <li className="mb-2">Sản phẩm đã hết thời hạn bảo hành</li>
                          <li className="mb-2">Tem bảo hành, mã vạch bị rách, mờ, không xác định được</li>
                          <li className="mb-2">Sản phẩm bị lỗi do người sử dụng</li>
                        </ul>
                      </AccordionTab>
                    </Accordion>
                  </div>
                </Card>
              </TabPanel>
            </TabView>
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="related-products-container mb-0">
              <h2 className="text-2xl font-bold mb-4 text-center">Sản phẩm liên quan</h2>
              <div className="grid">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.product_id} product={relatedProduct} mounted={mounted} />
                ))}
              </div>
            </div>
          )}

          {/* Image dialog */}
          <Dialog
            visible={showImageDialog}
            onHide={() => setShowImageDialog(false)}
            dismissableMask
            style={{ width: "90vw", maxWidth: "500px" }}
            header={product.product_name}
            footer={
              <div className="flex justify-content-end">
                <Button
                  label="Đóng"
                  icon="pi pi-times"
                  onClick={() => setShowImageDialog(false)}
                  className="p-button-danger"
                />
              </div>
            }
            className="image-dialog"
          >
            {selectedImage && (
              <div className="flex justify-content-center p-3" style={{ backgroundColor: "#FFF" }}>
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt={product.product_name}
                  style={{ maxWidth: "50%", maxHeight: "80vh", objectFit: "contain" }}
                />
              </div>
            )}
          </Dialog>
        </div>
      )}
    </>
  )
}

ProductDetailPage.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>
}

export default ProductDetailPage
