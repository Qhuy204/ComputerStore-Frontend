import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import productsService from '../Services/productsService';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/productCard';

const Slideshow = () => {
  const [slideIndex, setSlideIndex] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const interval = setInterval(() => {
      setSlideIndex(prevIndex => prevIndex < 3 ? prevIndex + 1 : 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isClient) {
      showSlides(slideIndex);
    }
  }, [slideIndex, isClient]);

  const showSlides = (n) => {
    if (typeof document === 'undefined') return;
    
    const slides = document.getElementsByClassName("mySlides");
    const dots = document.getElementsByClassName("dot");
    
    if (!slides.length || !dots.length) return;
    
    for (let i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    
    for (let i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
  };
  
  const plusSlides = (n) => {
    setSlideIndex(prevIndex => {
      let newIndex = prevIndex + n;
      if (newIndex > 3) newIndex = 1;
      if (newIndex < 1) newIndex = 3;
      return newIndex;
    });
  };
  
  const currentSlide = (n) => {
    setSlideIndex(n);
  };

  return (
    <div className="ads1">
      <div className="slideshow-container">
        <div className="mySlides fade">
          <a href="/landing/collections/laptop">
            <img
              src="img_data/index/banner_homepage_acer_rtx_5000.jpg"
              alt="Main Banner 1"
              className="block w-full"
            />
          </a>
        </div>

        <div className="mySlides fade">
          <a href="/landing/collections/laptop">
            <img
              src="img_data/index/banner_homepage_msi_rtx_5000.jpg"
              alt="Main Banner 2"
              className="block w-full"
            />
          </a>
        </div>

        <div className="mySlides fade">
          <a href="/landing/collections/laptop">
            <img
              src="img_data/index/banner_web_slider_800x400_1199a3adfc23489798d4163a97f3bc62.jpg"
              alt="Main Banner 3"
              className="block w-full"
            />
          </a>
        </div>

        
        <a className="prev" onClick={() => plusSlides(-1)}>&#10094;</a>
        <a className="next" onClick={() => plusSlides(1)}>&#10095;</a>
      </div>
      
      <br />
      
      <div style={{ textAlign: 'center', marginTop: '-20px' }}>
        <span className="dot" onClick={() => currentSlide(1)}></span> 
        <span className="dot" onClick={() => currentSlide(2)}></span> 
        <span className="dot" onClick={() => currentSlide(3)}></span> 
      </div>
    </div>
  );
};

const ProductList = ({ title, menuItems, products }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Giới hạn hiển thị chỉ 5 sản phẩm
  const limitedProducts = products.slice(0, 5);

  return (
    <div className="product-list">
      <div className="product-banner">
        <span>{title}</span>
        <div className="menu">
          {menuItems.map((item, index) => (
            <a key={index} href={item.link}>{item.text}</a>
          ))}
        </div>
      </div>
      <div className="product-content">
        {limitedProducts.map((product, index) => (
          <ProductCard key={index} product={product} mounted={isMounted} />
        ))}
      </div>
    </div>
  );
};
const CategorySection = () => {
  const categories = [
    { name: 'Card màn hình', image: 'Image/Icon2/showinfozmimg1.png', link: '/landing/collections/card-do-hoa' },
    { name: 'Bộ vi xử lý', image: 'Image/Icon2/showinfozmimg3.png', link: '/landing/collections/cpu' },
    { name: 'RAM', image: 'Image/Icon2/showinfozmimg4.png', link: '/landing/collections/ram' },
    { name: 'Bo mạch chủ', image: 'Image/Icon2/showinfozmimg2.png', link: '/landing/collections/mainboard' },
    { name: 'Ổ cứng', image: 'Image/Icon2/showinfozmimg9.png', link: '/landing/collections/o-cung' },
    { name: 'Nguồn', image: 'Image/Icon2/showinfozmimg11.png', link: '/landing/collections/nguon' },
    { name: 'Vỏ case', image: 'Image/Icon2/showinfozmimg10.png', link: '/landing/collections/case' },
    { name: 'Màn hình', image: 'Image/Icon2/showinfozmimg8.png', link: '/landing/collections/man-hinh' },
    { name: 'Bàn phím', image: 'Image/Icon2/showinfozmimg12.png', link: '/landing/collections/ban-phim' },
    { name: 'Chuột', image: 'Image/Icon2/showinfozmimg13.png', link: '/landing/collections/chuot' },
    { name: 'Tai nghe', image: 'Image/Icon2/showinfozmimg14.png', link: '/landing/collections/tai-nghe' },
    { name: 'Loa', image: 'Image/Icon2/showinfozmimg16.png', link: '/landing/collections/loa' },
    { name: 'Webcam', image: 'Image/Icon2/showinfozmimg20.png', link: '/landing/collections/webcam' },
    { name: 'Ghế Gaming', image: 'Image/Icon2/showinfozmimg15.png', link: '/landing/collections/ghe' },
  ];

  return (
    <div className="category-container">
      <div className="category-header">
        <h2>DANH MỤC SẢN PHẨM</h2>
        <div className="menu">
          <a href="#">Xem tất cả</a>
        </div>
      </div>
      <div className="category-list">
        {categories.map((category, index) => (
          <div className="category-item" key={index}>
            <img src={category.image} alt={category.name} /><br />
            <a href={category.link}>{category.name}</a>
          </div>
        ))}
      </div>
    </div>
  );
};

const PromotionSection = () => {
  const promotions = [
    {
      image: 'img_data/index/thang_02_laptop_asus_800x400.jpg',
      title: 'ASUS AI - TIÊN PHONG CÔNG NGHỆ',
      link: '/landing/blogs/nang-cap-laptop-ai-don-nam-moi-ruc-ro-cung-chuong-trinh-asus-ai-tien-phong-cong-nghe-xuan-moi-dot-pha'
    },
    {
      image: 'img_data/index/thang_12_thu_cu_ve_sinh_banner_web_slider_800x400.png',
      title: 'THU CŨ ĐỔI MỚI - VỆ SINH MIỄN PHÍ',
      link: '/landing/blogs/gearvn-chinh-sach-bang-gia-thu-san-pham-da-qua-su-dung'
    },
    {
      image: 'img_data/index/thang_12_laptop_acer_swift_800x400.png',
      title: 'ACER SWIFT SERIES - ƯU ĐÃI MÊ LY!',
      link: '/landing/blogs/acer-swift-series-uu-dai-me-ly'
    }
  ];

  return (
    <div className="promotion-section">
      {promotions.map((promo, index) => (
        <div className="promotion" key={index}>
          <img src={promo.image} alt={promo.title} />
          <div className="promotion-info">
            <h3>{promo.title}</h3>
            <p>{promo.description}</p>
            <a href={promo.link}>Xem thêm »</a>
          </div>
        </div>
      ))}
    </div>
  );
};

const GEARVN = () => {
  const [pcGamingProducts, setPCGamingProducts] = useState([]);
  const [pcOfficeProducts, setPCOfficeProducts] = useState([]);
  const [laptopProducts, setLaptopProducts] = useState([]);
  const [monitorProducts, setMonitorProducts] = useState([]);
  const [mouseProducts, setMouseProducts] = useState([]);
  const [VGAProducts, setVGAProducts] = useState([]);


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await productsService.getAllVariant();
        
        // Chuyển đổi dữ liệu để phù hợp với cấu trúc ProductCard
        const formatProductData = (products) => {
          return products.map(product => {
            const defaultVariant = Array.isArray(product.variants)
              ? product.variants.find(v => v.is_default === 1) || product.variants[0]
              : null;
        
            if (!defaultVariant) {
              console.warn(`Không tìm thấy biến thể cho sản phẩm:`, product.product_name);
              return { ...product, variants: [] };
            }
        
            // Gắn base_price nếu thiếu
            if (!defaultVariant.base_price) {
              console.log(`Gán base_price cho biến thể của sản phẩm: ${product.product_name}`);
              defaultVariant.base_price = product.base_price;
            }
        
            const formattedProduct = {
              ...product,
              variants: [defaultVariant]
            };
        
            console.log("Sản phẩm đã xử lý:", formattedProduct);
            return formattedProduct;
          });
        };
        
        
        const pcGaming = formatProductData(
          allProducts.filter(p => 
            p.category_name === 'Máy tính bàn'
          ).slice(0, 5)
        );

        const cpu = formatProductData(
          allProducts.filter(p => 
            p.category_name === 'CPU'
          ).slice(0, 5)
        );

        const laptops = formatProductData(
          allProducts.filter(p => 
            p.category_name === 'Laptop'
          ).slice(0, 5)
        );

        const monitors = formatProductData(
          allProducts.filter(p => 
            p.category_name === 'Màn hình'
          ).slice(0, 5)
        );

        const vga = formatProductData(
          allProducts.filter(p => 
            p.category_name === 'Card đồ họa'
          ).slice(0, 5)
        );

        const mouse = formatProductData(
          allProducts.filter(p => 
            p.category_name === 'Chuột'
          ).slice(0, 5)
        );

        setPCGamingProducts(pcGaming);
        setPCOfficeProducts(cpu);
        setLaptopProducts(laptops);
        setMonitorProducts(monitors);
        setVGAProducts(vga);
        setMouseProducts(mouse);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <div id="header"></div>
      
      <main>
        <div id="main-body">
          <div id="main-top">
            <div id="main-ads1">
              <Sidebar />
            </div>
            
            <div id="main-ads2">
              <div id="ads-top">
                <Slideshow />
                <div className="ads2">
                  <div className="ads-right space-y-4">
                    <a href="/landing/collections/laptop">
                      <img
                        src="img_data/index/thang_02_layout_web_01.png"
                        alt="Right Banner 1"
                        className="block w-full cursor-pointer"
                      />
                    </a>
                    <a href="/landing/collections/laptop">
                      <img
                        src="img_data/index/thang_02_layout_web_02.png"
                        alt="Right Banner 2"
                        className="block w-full cursor-pointer"
                      />
                    </a>
                  </div>

                </div>
              </div>
              <div id="ads-bottom" >
                <a href="/landing/collections/laptop">
                  <img
                    src="img_data/index/thang_02_layout_web_05.png"
                    alt="Bottom Banner 1"
                    className="block w-full cursor-pointer"
                  />
                </a>
                <a href="/landing/collections/laptop">
                  <img
                    src="img_data/index/thang_02_layout_web_04.png"
                    alt="Bottom Banner 2"
                    className="block w-full cursor-pointer"
                  />
                </a>
                <a href="/landing/collections/may-tinh-ban">
                  <img
                    src="img_data/index/thang_02_layout_web_03.png"
                    alt="Bottom Banner 3"
                    className="block w-full cursor-pointer"
                  />
                </a>
              </div>

            </div>
          </div>
          
          <div id="mid-banner">
            <a href="/landing/collections/may-tinh-ban">
              <img src="img_data/index/gearvnwinner2025slider.jpg" alt="Mid Banner 1" />
            </a>
            <a href="/landing/collections/man-hinh">
              <img src="img_data/index/thang_02_layout_web_08.png" alt="Mid Banner 2" />
            </a>
            <a href="/landing/collections/chuot">
              <img src="img_data/index/thang_02_layout_web_07.png" alt="Mid Banner 3" />
            </a>
            <a href="/landing/collections/may-tinh-ban">
              <img src="img_data/index/thang_02_layout_web_06.png" alt="Mid Banner 4" />
            </a>
          </div>

          
          {/* PC Gaming Section */}
          <ProductList 
            title="PC"
            menuItems={[
              { text: 'PC Gaming Standard', link: '/landing/collections/may-tinh-ban' },
              { text: 'PC Thiết kế/ Đồ họa', link: '/landing/collections/may-tinh-ban' },
              { text: 'PC Giả lập NOX', link: '/landing/collections/may-tinh-ban' },
              { text: 'Xem tất cả', link: '/landing/collections/may-tinh-ban' }
            ]}
            products={pcGamingProducts}
          />
          
          {/* PC Office Section */}
          <ProductList 
            title="VI XỬ LÝ"
            menuItems={[
              { text: 'Intel', link: '/landing/collections/cpu?brand=intel' },
              { text: 'AMD', link: '/landing/collections/cpu?brand=amd' },
              { text: 'Xem tất cả', link: '/landing/collections/cpu' }
            ]}
            products={pcOfficeProducts}
          />
          
          {/* Laptop Gaming Section */}
          <ProductList 
            title="LAPTOP"
            menuItems={[
              { text: 'Laptop MSI', link: '/landing/collections/laptop?brand=msi' },
              { text: 'Laptop Lenovo', link: '/landing/collections/laptop?brand=lenovo' },
              { text: 'Laptop Acer', link: '/landing/collections/laptop?brand=acer' },
              { text: 'Laptop Gigabyte', link: '/landing/collections/laptop?brand=gigabyte' },
              { text: 'Laptop Dell', link: '/landing/collections/laptop?brand=dell' },
              { text: 'Laptop Asus', link: '/landing/collections/laptop?brand=asus' },
              { text: 'Xem tất cả', link: '/landing/collections/laptop' }
            ]}
            products={laptopProducts}
          />
          
          {/* Monitor Section */}
          <ProductList 
            title="MÀN HÌNH"
            menuItems={[
              { text: 'Màn hình 22"', link: '/landing/collections/man-hinh' },
              { text: 'Màn hình 24"', link: '/landing/collections/man-hinh' },
              { text: 'Màn hình 27"', link: '/landing/collections/man-hinh' },
              { text: 'Màn hình 75Hz', link: '/landing/collections/man-hinh' },
              { text: 'Màn hình 100Hz', link: '/landing/collections/man-hinh' },
              { text: 'Màn hình 144Hz', link: '/landing/collections/man-hinh' },
              { text: 'Xem tất cả', link: '/landing/collections/man-hinh' }
            ]}
            products={monitorProducts}
          />

          {/* Mouse Section */}
          <ProductList 
            title="CHUỘT"
            menuItems={[
              { text: 'Chuột Razer', link: '/landing/collections/chuot' },
              { text: 'Chuột Asus', link: '/landing/collections/chuot' },
              { text: 'Xem tất cả', link: '/landing/collections/chuot' }
            ]}
            products={mouseProducts}
          />

          {/* Keyboard Section */}
          <ProductList 
            title="VGA"
            menuItems={[
              { text: 'Xem tất cả', link: '/landing/collections/card-do-hoa' }
            ]}
            products={VGAProducts}
          />
          
          {/* Category Section */}
          <CategorySection />
          
          {/* Promotion Section */}
          <div className="product-list">
            <div className="product-banner">
              <span>ƯU ĐÃI HOT</span>
              <div className="menu">
                <a href="#">Xem tất cả</a>
              </div>
            </div>
            <PromotionSection />
          </div>
        </div>
      </main>
      
      <div id="footer"></div>
    </>
  );
};

// Export the component only, no data fetching methods
export default GEARVN;