import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import productsService from '../Services/productsService';
import PublicLayout from '../../layout/PublicLayout';
import ProductCard from '../components/productCard';
import brandService from '../Services/brandService';
import categoriesService from '../Services/categoriesService';
import { Checkbox } from 'primereact/checkbox';

const SearchPage = () => {
  const router = useRouter();
  const { q: searchQuery } = router.query;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: 'all',
    price: 'all',
    category: 'all',
    hotProduct: false
  });
  const [sortOption, setSortOption] = useState('default');
  const [mounted, setMounted] = useState(false);
  const [originalProducts, setOriginalProducts] = useState([]);
  
  // State cho brandOptions và categoryOptions từ API
  const [brandOptions, setBrandOptions] = useState([
    { label: 'Tất cả', value: 'all' }
  ]);
  
  const [categoryOptions, setCategoryOptions] = useState([
    { label: 'Tất cả', value: 'all' }
  ]);

  const priceOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Dưới 5 triệu', value: '0-5000000' },
    { label: '5 - 10 triệu', value: '5000000-10000000' },
    { label: '10 - 20 triệu', value: '10000000-20000000' },
    { label: '20 - 30 triệu', value: '20000000-30000000' },
    { label: 'Trên 30 triệu', value: '30000000+' }
  ];

  const sortOptions = [
    { label: 'Mặc định', value: 'default' },
    { label: 'Giá: Thấp đến Cao', value: 'price-asc' },
    { label: 'Giá: Cao đến Thấp', value: 'price-desc' },
    { label: 'Giảm giá: Cao đến Thấp', value: 'discount-desc' }
  ];

  // Set mounted to true when component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch brands and categories on component mount
  useEffect(() => {
    const fetchBrandsAndCategories = async () => {
      try {
        // Fetch brands
        const brands = await brandService.getAll();
        const formattedBrands = [
          { label: 'Tất cả', value: 'all' },
          ...brands.map(brand => ({
            label: brand.brand_name,
            value: brand.brand_name.toLowerCase()
          }))
        ];
        setBrandOptions(formattedBrands);
        
        // Fetch categories
        const categories = await categoriesService.getAll();
        const formattedCategories = [
          { label: 'Tất cả', value: 'all' },
          ...categories.map(category => ({
            label: category.category_name,
            value: category.category_name
          }))
        ];
        setCategoryOptions(formattedCategories);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    
    if (mounted) {
      fetchBrandsAndCategories();
    }
  }, [mounted]);

  // Fetch products when search query changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchQuery) return;
      
      try {
        setLoading(true);
        const allProducts = await productsService.getAllVariant();
        
        // Tìm kiếm gần đúng dựa trên searchQuery
        let filteredProducts = allProducts.filter(product => {
          // Tìm kiếm trong tên sản phẩm, mô tả, brand_name
          const productName = product.product_name.toLowerCase();
          const description = product.description ? product.description.toLowerCase() : '';
          const brandName = product.brand_name ? product.brand_name.toLowerCase() : '';
          const model = product.model ? product.model.toLowerCase() : '';
          const query = searchQuery.toLowerCase();
          
          return (
            productName.includes(query) || 
            description.includes(query) || 
            brandName.includes(query) ||
            model.includes(query)
          );
        });

        // Xử lý biến thể sản phẩm để đảm bảo có base_price
        filteredProducts = filteredProducts.map(product => {
          const processedVariants = product.variants.map(variant => {
            // Đảm bảo base_price tồn tại
            if (!variant.base_price) {
              variant.base_price = product.base_price;
            }
            return variant;
          });
          
          return {
            ...product,
            variants: processedVariants
          };
        });

        setOriginalProducts(filteredProducts);
        setProducts(filteredProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setLoading(false);
      }
    };

    if (mounted && searchQuery) {
      fetchProducts();
    }
  }, [searchQuery, mounted]);

  // Apply filters when filter state changes
  useEffect(() => {
    if (originalProducts.length === 0) return;
    
    let filteredProducts = [...originalProducts];
    
    // Apply brand filter
    if (filters.brand !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.brand_name && product.brand_name.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category_name === filters.category
      );
    }
    
    // Apply price filter
    if (filters.price !== 'all') {
      filteredProducts = filteredProducts.filter(product => {
        // Get price from default variant or first variant
        const defaultVariant = product.variants.find(v => v.is_default === 1) || product.variants[0];
        const price = defaultVariant ? parseFloat(defaultVariant.final_price) : 0;
        
        if (filters.price === '30000000+') {
          return price > 30000000;
        }
        
        const [minPrice, maxPrice] = filters.price.split('-').map(parseFloat);
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Apply hot product filter
    if (filters.hotProduct) {
        filteredProducts = filteredProducts.filter(product => 
          product.variants.some(variant => variant.is_featured === 1)
        );
    }
      
    
    // Apply sorting
    if (sortOption !== 'default') {
      switch (sortOption) {
        case 'price-asc':
          filteredProducts.sort((a, b) => {
            const defaultVariantA = a.variants.find(v => v.is_default === 1) || a.variants[0];
            const defaultVariantB = b.variants.find(v => v.is_default === 1) || b.variants[0];
            const priceA = defaultVariantA ? parseFloat(defaultVariantA.final_price) : 0;
            const priceB = defaultVariantB ? parseFloat(defaultVariantB.final_price) : 0;
            return priceA - priceB;
          });
          break;
        case 'price-desc':
          filteredProducts.sort((a, b) => {
            const defaultVariantA = a.variants.find(v => v.is_default === 1) || a.variants[0];
            const defaultVariantB = b.variants.find(v => v.is_default === 1) || b.variants[0];
            const priceA = defaultVariantA ? parseFloat(defaultVariantA.final_price) : 0;
            const priceB = defaultVariantB ? parseFloat(defaultVariantB.final_price) : 0;
            return priceB - priceA;
          });
          break;
        case 'discount-desc':
          filteredProducts.sort((a, b) => {
            const defaultVariantA = a.variants.find(v => v.is_default === 1) || a.variants[0];
            const defaultVariantB = b.variants.find(v => v.is_default === 1) || b.variants[0];
            
            const finalPriceA = defaultVariantA ? parseFloat(defaultVariantA.final_price) : 0;
            const basePriceA = defaultVariantA ? parseFloat(defaultVariantA.base_price) : 0;
            const discountPercentA = basePriceA > 0 ? ((basePriceA - finalPriceA) / basePriceA) * 100 : 0;
            
            const finalPriceB = defaultVariantB ? parseFloat(defaultVariantB.final_price) : 0;
            const basePriceB = defaultVariantB ? parseFloat(defaultVariantB.base_price) : 0;
            const discountPercentB = basePriceB > 0 ? ((basePriceB - finalPriceB) / basePriceB) * 100 : 0;
            
            return discountPercentB - discountPercentA;
          });
          break;
      }
    }
    
    setProducts(filteredProducts);
  }, [filters, sortOption, originalProducts]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Head>
        <title>{searchQuery ? `Tìm kiếm: ${searchQuery}` : 'Tìm kiếm sản phẩm'} - GEARVN</title>
        <link rel="icon" href="/img_data/index/favicon.jpg" />
      </Head>

      <div className="p-4">
        <div className="mb-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h1 className="text-2xl font-bold">TÌM KIẾM</h1>
        {searchQuery && (
            <p className="text-lg">Tìm kiếm theo: <span className="font-semibold">{searchQuery}</span></p>
        )}
        </div>

        {/* Filters */}
        <div className="bg-white p-0 rounded shadow mb-0">
          <div className="grid">            
            <div className="col-12 md:col-3 mb-0">
              <label className="block mb-1">Hãng</label>
              <Dropdown 
                value={filters.brand} 
                options={brandOptions} 
                onChange={(e) => handleFilterChange('brand', e.value)} 
                className="w-full"
              />
            </div>
            
            <div className="col-12 md:col-3 mb-2">
              <label className="block mb-1">Khoảng giá</label>
              <Dropdown 
                value={filters.price} 
                options={priceOptions} 
                onChange={(e) => handleFilterChange('price', e.value)} 
                className="w-full"
              />
            </div>
            
            <div className="col-12 md:col-3 mb-2">
              <label className="block mb-1">Danh mục</label>
              <Dropdown 
                value={filters.category} 
                options={categoryOptions} 
                onChange={(e) => handleFilterChange('category', e.value)} 
                className="w-full"
              />
            </div>
            
            <div className="col-12 md:col-3 mb-2">
              <label className="block mb-1">Sắp xếp</label>
              <Dropdown 
                value={sortOption} 
                options={sortOptions} 
                onChange={(e) => setSortOption(e.value)} 
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div className="col-12 mt-0">
            <div className="flex align-items-center justify-start">
            <Checkbox 
                inputId="hotProduct" 
                checked={filters.hotProduct} 
                onChange={(e) => handleFilterChange('hotProduct', e.checked)} 
                className="mr-2"
            />
            <label htmlFor="hotProduct" className="mr-0 leading-normal">Chỉ hiển thị sản phẩm Hot</label>
            </div>
        </div>

        {/* Product List */}
        <div className="mb-4">
          <div className="flex justify-center items-center mb-1 mt-1">
            <h2 className="text-xl font-medium">Kết quả tìm kiếm ({products.length} sản phẩm)</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-content-center p-5">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
          ) : products.length > 0 ? (
            <div className="grid">
              {products.map(product => (
                <ProductCard key={product.product_id} product={product} mounted={mounted} />
              ))}
            </div>
          ) : (
            <div className="flex flex-column align-items-center p-5 bg-white rounded shadow">
              <i className="pi pi-search mb-3" style={{ fontSize: '2rem' }}></i>
              <span className="text-xl">Không tìm thấy sản phẩm nào phù hợp.</span>
              <p className="mt-2">Vui lòng thử lại với từ khóa khác hoặc bỏ bớt bộ lọc.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

SearchPage.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>;
};

export default SearchPage;