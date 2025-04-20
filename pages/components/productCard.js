import React from 'react';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';

const ProductCard = ({ product, mounted }) => {
  if (!mounted) return null;
  
  // Lấy biến thể có is_featured = 1 hoặc biến thể mặc định hoặc biến thể đầu tiên
  const featuredVariant = product.variants.find(v => v.is_featured === 1);
  const defaultVariant = product.variants.find(v => v.is_default === 1) || product.variants[0];
  
  // Ưu tiên dùng biến thể featured nếu có, nếu không thì dùng biến thể mặc định
  const selectedVariant = featuredVariant || defaultVariant;
  
  // Lấy giá từ biến thể
  const finalPrice = selectedVariant ? selectedVariant.final_price : 0;
  const basePrice = selectedVariant ? selectedVariant.base_price : 0;
  
  // Tính phần trăm giảm giá (hiển thị kể cả khi 0%)
  const discountPercent = basePrice > 0 ? Math.round((basePrice - finalPrice) / basePrice * 100) : 0;
  
  // Lấy hình ảnh từ biến thể
  const imageUrl = selectedVariant?.variant_image || "/Image/Chitietsp/placeholder.png";
  
  // Kiểm tra xem sản phẩm có được đánh dấu là nổi bật không
  const isFeatured = selectedVariant?.is_featured === 1;

  return (
    <div className="product-card-wrapper">
      <Card className="product-card">
        <Link href={`/landing/products/${product.product_id}`} className="product-link">
          <div className="product-image-container">
            <div className="product-image-wrapper">
              <img 
                src={imageUrl || "/placeholder.svg"} 
                alt={product.product_name} 
                className="product-image" 
              />

              {isFeatured && (
                <Tag 
                  className="hot-tag"
                  severity="danger"
                  style={{ fontSize: '13px', padding: '2px 4px', marginTop:'-20px' }}
                >
                  Hot
                </Tag>
              )}
            </div>
          </div>
          
          <div className="product-details-container">
            <div className="product-details">
              <h3 className="product-title">{product.product_name}</h3>
              <Divider className="my-2" />
                           
              
              {/* Price section */}
              <div className="price-section">
                {(
                  <p className="base-price">
                    {new Intl.NumberFormat('vi-VN').format(product.base_price )}₫
                  </p>
                )}
                <div className="final-price-container">
                  <p className="final-price">
                    {new Intl.NumberFormat('vi-VN').format(finalPrice)}₫
                  </p>
                  {discountPercent >= 0 && (
                    <Tag 
                      severity="danger" 
                      style={{ fontSize: '12px', padding: '2px 2px', height: '30px', borderRadius: '4px' }}
                    >
                      -{discountPercent}%
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </div>
  );
};

export default ProductCard;
