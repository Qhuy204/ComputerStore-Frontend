import Link from "next/link"
import { Card } from "primereact/card"
import { Tag } from "primereact/tag"

const UserProfileProductCard = ({ product, mounted }) => {
  if (!mounted) return null

  // Fallback values for missing data
  const productName = product?.product_name || "Sản phẩm"
  const productId = product?.product_id || "0"
  
  // Handle missing variants
  let finalPrice = 0
  let basePrice = 0
  let discountPercent = 0
  let imageUrl = "/placeholder.svg"
  let isFeatured = false

  // Check if product has variants
  if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    // Get featured or default variant
    const featuredVariant = product.variants.find((v) => v.is_featured === 1)
    const defaultVariant = product.variants.find((v) => v.is_default === 1) || product.variants[0]
    const selectedVariant = featuredVariant || defaultVariant

    // Get prices and image from variant
    finalPrice = selectedVariant?.final_price || 0
    basePrice = selectedVariant?.base_price || 0
    imageUrl = selectedVariant?.variant_image || "/placeholder.svg"
    isFeatured = selectedVariant?.is_featured === 1
  } else {
    // Fallback to product level data
    finalPrice = product?.price || 0
    basePrice = product?.base_price || product?.price || 0
    imageUrl = product?.image_url || product?.image || "/placeholder.svg"
    isFeatured = product?.is_featured === 1
  }

  // Calculate discount percentage
  discountPercent = basePrice > 0 ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0

  // Format price with Vietnamese currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫"
  }

  return (
    <div className="user-profile-product-card">
      <Link href={`/landing/products/${productId}`} className="user-profile-product-link">
        <div className="user-profile-image-container">
          <div className="user-profile-image-wrapper">
            <img 
              src={imageUrl || "/placeholder.svg"} 
              alt={productName} 
              className="user-profile-product-image"
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
            />
            {isFeatured && (
              <Tag
                className="user-profile-hot-tag"
                severity="danger"
                value="Hot"
              />
            )}
          </div>
        </div>
        
        <div className="user-profile-product-details">
          <h3 className="user-profile-product-title">{productName}</h3>
          
          <div className="user-profile-price-section">
            {basePrice > finalPrice && (
              <p className="user-profile-base-price">{formatPrice(basePrice)}</p>
            )}
            <div className="user-profile-final-price-container">
              <p className="user-profile-final-price">{formatPrice(finalPrice)}</p>
              {discountPercent > 0 && (
                <Tag
                  severity="danger"
                  value={`-${discountPercent}%`}
                />
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default UserProfileProductCard
