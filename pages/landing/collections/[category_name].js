"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import PublicLayout from "../../../layout/PublicLayout"
import Head from "next/head.js"
import productsService from "../../Services/productsService"
import ProductCard from "../../components/productCard"
import categoriesService from "../../Services/categoriesService"
import brandService from "../../Services/brandService"
import dynamic from "next/dynamic"

// Dynamically import PrimeReact components with SSR disabled
const DataView = dynamic(() => import("primereact/dataview").then((mod) => mod.DataView), { ssr: false })
const Dropdown = dynamic(() => import("primereact/dropdown").then((mod) => mod.Dropdown), { ssr: false })
const Panel = dynamic(() => import("primereact/panel").then((mod) => mod.Panel), { ssr: false })
const Slider = dynamic(() => import("primereact/slider").then((mod) => mod.Slider), { ssr: false })
const Button = dynamic(() => import("primereact/button").then((mod) => mod.Button), { ssr: false })

function ProductListPage() {
  const router = useRouter()
  const { category_name } = router.query // Lấy category_name từ URL

  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [categoryBrands, setCategoryBrands] = useState([])
  const [categoryAttributes, setCategoryAttributes] = useState([])
  const [attributeOptions, setAttributeOptions] = useState({})

  // Filter states
  const [sortOption, setSortOption] = useState("default")
  const [filters, setFilters] = useState({
    brand: "default",
    price: "default",
  })

  // Add state for price range
  const [priceRange, setPriceRange] = useState([0, 50000000])
  const [usePriceSlider, setUsePriceSlider] = useState(false)

  // Mapping từ URL-friendly category name sang category name thực tế
  const categoryMapping = {
    laptop: "Laptop",
    "may-tinh-ban": "Máy tính bàn",
    "man-hinh": "Màn hình",
    "ban-phim": "Bàn phím",
    "phu-kien": "Phụ kiện",
    "ban-phim-chuot": "Bàn phím, Chuột",
    "main-cpu": "Main, CPU",
    "case-nguon-tan": "Case, Nguồn, Tản",
    "o-cung-ram": "Ổ cứng, RAM",
    "loa-tai-nghe":"Loa, Tai nghe",
    cpu: "CPU",
    "card-do-hoa": "Card đồ họa",
    main: "Main",
    case: "Case",
    nguon: "Nguồn",
    "o-cung": "Ổ cứng",
    ram: "RAM",
    chuot: "Chuột",
    "tai-nghe":"Tai nghe",
    "o-cung": "Ổ cứng"
  }

  // Empty template for DataView
  const emptyTemplate = () => {
    return (
      <div className="flex flex-column align-items-center p-5">
        <i className="pi pi-search mb-3" style={{ fontSize: "2rem" }}></i>
        <span>Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn.</span>
      </div>
    )
  }

  // Use the ProductCard component
  const itemTemplate = (product) => {
    return <ProductCard product={product} mounted={mounted} />
  }

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const allBrands = await brandService.getAll()
        setBrands(allBrands)
      } catch (error) {
        console.error("Error fetching brands:", error)
      }
    }

    fetchBrands()
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await categoriesService.getAll()
        setCategories(allCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Set mounted to true when component mounts on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Process category attributes and create filter options
  useEffect(() => {
    if (!categoryInfo || !categoryInfo.attributes) return

    setCategoryAttributes(categoryInfo.attributes)

    // Initialize dynamic filters based on category attributes
    const newFilters = { ...filters }
    const newAttributeOptions = {}

    categoryInfo.attributes.forEach((attribute) => {
      const attributeKey = attribute.type_name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents

      // Add default value to filters
      newFilters[attributeKey] = "default"

      // Create options for dropdown
      const options = [
        { label: `Tất cả ${attribute.type_name}`, value: "default" },
        ...attribute.values.map((val) => ({
          label: val.value_name,
          value: val.attribute_value_id.toString(),
        })),
      ]

      newAttributeOptions[attributeKey] = options
    })

    setFilters(newFilters)
    setAttributeOptions(newAttributeOptions)
  }, [categoryInfo])

  const fetchProductsByMultiCategory = async (categoriesArray) => {
    try {
      // Get all products
      const allProducts = await productsService.getAllVariant()

      // Filter products that belong to any of the specified categories
      const filteredProducts = allProducts.filter((product) =>
        categoriesArray.some((cat) => product.category_name.toLowerCase() === cat.toLowerCase().trim()),
      )

      return filteredProducts
    } catch (error) {
      console.error("Error fetching multi-category products:", error)
      return []
    }
  }

  // Fetch products when category changes
  useEffect(() => {
    if (!category_name || !categories.length || !brands.length) return

    const fetchProductsByCategory = async () => {
      try {
        setLoading(true)

        // Get the actual category name from mapping
        const actualCategoryName = categoryMapping[category_name]

        if (!actualCategoryName) {
          console.error("Invalid category name:", category_name)
          setProducts([])
          setFilteredProducts([])
          setLoading(false)
          return
        }

        // Find the category info
        const categoryDetails = categories.find((cat) => cat.category_name === actualCategoryName)

        setCategoryInfo(categoryDetails)

        let processedProducts = []

        // Check if category name contains commas (multiple categories)
        if (actualCategoryName.includes(",")) {
          // Split by comma and trim each category name
          const categoriesArray = actualCategoryName.split(",").map((cat) => cat.trim())

          // Fetch products that belong to any of these categories
          const multiCategoryProducts = await fetchProductsByMultiCategory(categoriesArray)
          processedProducts = multiCategoryProducts
        } else {
          // Original single category logic
          const allProducts = await productsService.getAllVariant()
          const filteredProducts = allProducts.filter((product) => product.category_name === actualCategoryName)
          processedProducts = filteredProducts
        }

        // Process variants as before
        const productsWithProcessedVariants = processedProducts.map((product) => {
          const processedVariants = product.variants.map((variant) => {
            if (!variant.base_price) {
              variant.base_price = product.base_price
            }
            return variant
          })

          return {
            ...product,
            variants: processedVariants,
          }
        })

        // Get brands for these products
        const brandsInCategory = [...new Set(productsWithProcessedVariants.map((p) => p.brand_name))]
        const categoryBrandsList = brands
          .filter((brand) => brandsInCategory.includes(brand.brand_name))
          .map((brand) => ({
            label: brand.brand_name,
            value: brand.brand_name.toLowerCase(),
          }))

        categoryBrandsList.unshift({ label: "Tất cả hãng", value: "default" })

        setCategoryBrands(categoryBrandsList)
        setProducts(productsWithProcessedVariants)
        setFilteredProducts(productsWithProcessedVariants)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching products by category:", error)
        setProducts([])
        setFilteredProducts([])
        setLoading(false)
      }
    }

    fetchProductsByCategory()
  }, [category_name, categories, brands])

  // Apply filters and sorting
  useEffect(() => {
    if (!mounted || products.length === 0) return

    const applyFiltersAndSort = () => {
      let result = [...products]

      // Apply brand filter
      if (filters.brand !== "default") {
        result = result.filter((p) => p.brand_name.toLowerCase().includes(filters.brand.toLowerCase()))
      }

      // Apply price filter
      if (usePriceSlider) {
        // Use price range slider
        result = result.filter((p) => {
          // Lấy giá từ biến thể mặc định hoặc biến thể đầu tiên
          const defaultVariant = p.variants.find((v) => v.is_default === 1) || p.variants[0]
          const price = defaultVariant ? Number.parseFloat(defaultVariant.final_price) : 0
          return price >= priceRange[0] && price <= priceRange[1]
        })
      } else if (filters.price !== "default") {
        // Use dropdown price filter
        result = result.filter((p) => {
          // Lấy giá từ biến thể mặc định hoặc biến thể đầu tiên
          const defaultVariant = p.variants.find((v) => v.is_default === 1) || p.variants[0]
          const price = defaultVariant ? Number.parseFloat(defaultVariant.final_price) : 0

          if (filters.price === "30000000+") {
            return price > 30000000
          }

          const [minPrice, maxPrice] = filters.price.split("-").map(Number.parseFloat)
          return price >= minPrice && price <= maxPrice
        })
      }

      // Apply dynamic attribute filters
      if (categoryAttributes && categoryAttributes.length > 0) {
        categoryAttributes.forEach((attribute) => {
          const attributeKey = attribute.type_name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          if (filters[attributeKey] && filters[attributeKey] !== "default") {
            const attributeValueId = Number.parseInt(filters[attributeKey])

            // Find the attribute value name for this ID
            const attributeValue = attribute.values.find((val) => val.attribute_value_id === attributeValueId)

            if (attributeValue) {
              const valueName = attributeValue.value_name
              const attributeName = attribute.type_name // Tên thuộc tính gốc (ví dụ: "Màu sắc")

              result = result.filter((p) => {
                // Check if the filter value is in the product name
                if (p.product_name.toLowerCase().includes(valueName.toLowerCase())) {
                  return true
                }

                return p.variants.some((v) => {
                  // Kiểm tra trong variant_attributes
                  if (v.variant_attributes) {
                    // Kiểm tra trực tiếp với tên thuộc tính gốc
                    if (v.variant_attributes[attributeName] !== undefined) {
                      // Kiểm tra xem giá trị thuộc tính có chứa giá trị được chọn hay không
                      return v.variant_attributes[attributeName].toLowerCase().includes(valueName.toLowerCase())
                    }
                  }
                  return false
                })
              })
            }
          }
        })
      }

      // Apply sorting
      if (sortOption !== "default") {
        switch (sortOption) {
          case "price-asc":
            result.sort((a, b) => {
              const defaultVariantA = a.variants.find((v) => v.is_default === 1) || a.variants[0]
              const defaultVariantB = b.variants.find((v) => v.is_default === 1) || b.variants[0]
              const priceA = defaultVariantA ? Number.parseFloat(defaultVariantA.final_price) : 0
              const priceB = defaultVariantB ? Number.parseFloat(defaultVariantB.final_price) : 0
              return priceA - priceB
            })
            break
          case "price-desc":
            result.sort((a, b) => {
              const defaultVariantA = a.variants.find((v) => v.is_default === 1) || a.variants[0]
              const defaultVariantB = b.variants.find((v) => v.is_default === 1) || b.variants[0]
              const priceA = defaultVariantA ? Number.parseFloat(defaultVariantA.final_price) : 0
              const priceB = defaultVariantB ? Number.parseFloat(defaultVariantB.final_price) : 0
              return priceB - priceA
            })
            break
          case "discount-desc":
            result.sort((a, b) => {
              const defaultVariantA = a.variants.find((v) => v.is_default === 1) || a.variants[0]
              const defaultVariantB = b.variants.find((v) => v.is_default === 1) || b.variants[0]

              const finalPriceA = defaultVariantA ? Number.parseFloat(defaultVariantA.final_price) : 0
              const basePriceA = defaultVariantA ? Number.parseFloat(defaultVariantA.base_price) : 0
              const discountPercentA = basePriceA > 0 ? ((basePriceA - finalPriceA) / basePriceA) * 100 : 0

              const finalPriceB = defaultVariantB ? Number.parseFloat(defaultVariantB.final_price) : 0
              const basePriceB = defaultVariantB ? Number.parseFloat(defaultVariantB.base_price) : 0
              const discountPercentB = basePriceB > 0 ? ((basePriceB - finalPriceB) / basePriceB) * 100 : 0

              return discountPercentB - discountPercentA
            })
            break
        }
      }

      setFilteredProducts(result)
    }

    applyFiltersAndSort()
  }, [filters, sortOption, products, mounted, categoryAttributes, priceRange, usePriceSlider])

  // Update filters state from URL query params
  useEffect(() => {
    if (mounted && Object.keys(router.query).length > 0) {
      updateFiltersFromQuery(router.query)
    }
  }, [router.query, mounted])

  // Update filters state from URL query params
  const updateFiltersFromQuery = (queryParams) => {
    const newFilters = { ...filters }

    // Map URL params to filter state
    Object.keys(queryParams).forEach((key) => {
      if (key !== "category_name" && key !== "sort") {
        newFilters[key] = queryParams[key]
      }
    })

    if (queryParams.sort) {
      setSortOption(queryParams.sort)
    }

    if (queryParams.price && queryParams.price.includes("-")) {
      const [min, max] = queryParams.price.split("-").map(Number)
      //setPriceRange([min, max])
      //setUsePriceSlider(true)
    }

    if (queryParams.priceRange && queryParams.priceRange.includes("-")) {
      const [min, max] = queryParams.priceRange.split("-").map(Number)
      setPriceRange([min, max])
      setUsePriceSlider(true)
    }

    setFilters(newFilters)
  }

  // Add useEffect to update filters when price range changes
  useEffect(() => {
    if (mounted && products.length > 0 && usePriceSlider) {
      updateURLWithFilters({ ...filters, priceRange: `${priceRange[0]}-${priceRange[1]}` }, sortOption)
    }
  }, [priceRange, usePriceSlider])

  // Update URL with filter parameters
  const updateURLWithFilters = (newFilters, newSortOption) => {
    const query = { ...router.query }

    // Update query object with new filter values
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== "default") {
        query[key] = value
      } else {
        delete query[key]
      }
    })

    // Handle sort option
    if (newSortOption !== "default") {
      query.sort = newSortOption
    } else {
      delete query.sort
    }

    // Update URL without reloading the page
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true },
    )
  }

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    updateURLWithFilters(newFilters, sortOption)
  }

  // Handle sort change
  const handleSortChange = (value) => {
    setSortOption(value)
    updateURLWithFilters(filters, value)
  }

  // Reset all filters
  const resetAllFilters = () => {
    // Create default filters object
    const defaultFilters = { brand: "default", price: "default" }

    // Add default values for dynamic attribute filters
    if (categoryAttributes && categoryAttributes.length > 0) {
      categoryAttributes.forEach((attribute) => {
        const attributeKey = attribute.type_name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")

        defaultFilters[attributeKey] = "default"
      })
    }

    // Reset all states
    setFilters(defaultFilters)
    setSortOption("default")
    setPriceRange([0, 50000000])
    setUsePriceSlider(false)

    // Update URL to remove all query parameters except category_name
    router.push(
      {
        pathname: router.pathname,
        query: { category_name: router.query.category_name },
      },
      undefined,
      { shallow: true },
    )
  }

  // Price filter options
  const priceOptions = [
    { label: "Tất cả mức giá", value: "default" },
    { label: "Dưới 5 triệu", value: "0-5000000" },
    { label: "5-10 triệu", value: "5000000-10000000" },
    { label: "10-20 triệu", value: "10000000-20000000" },
    { label: "20-30 triệu", value: "20000000-30000000" },
    { label: "Trên 30 triệu", value: "30000000+" },
  ]

  // Sort options
  const sortOptions = [
    { label: "Mặc định", value: "default" },
    { label: "Giá: Thấp đến Cao", value: "price-asc" },
    { label: "Giá: Cao đến Thấp", value: "price-desc" },
    { label: "Giảm giá: Cao đến Thấp", value: "discount-desc" },
  ]

  // Lấy category name hiển thị
  const displayCategoryName =
    categoryInfo?.category_name || (category_name ? categoryMapping[category_name] : "Sản phẩm")

  return (
    <>
      <Head>
        <link rel="icon" href="/img_data/index/favicon.jpg" />
        <title>GEARVN - {displayCategoryName}</title>
      </Head>

      <div className="flex align-items-center mb-3 text-sm" style={{ paddingTop: "20px", paddingLeft: "20px" }}>
        <Link href="/" className="text-blue-500 hover:underline">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span>{displayCategoryName}</span>
      </div>

      <Panel header="Bộ lọc sản phẩm" toggleable className="mb-3" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
        <div className="grid">
          {/* Bộ lọc Brand - động theo category */}
          <div className="col-12 md:col-6 lg:col-3 mb-2">
            <label className="block mb-1">Hãng</label>
            <Dropdown
              value={filters.brand}
              options={categoryBrands.length > 0 ? categoryBrands : [{ label: "Đang tải...", value: "default" }]}
              onChange={(e) => handleFilterChange("brand", e.value)}
              className="w-full"
              placeholder="Chọn hãng"
            />
          </div>

          {/* Bộ lọc Price - Dropdown */}
          <div className="col-12 md:col-6 lg:col-3 mb-2">
            <label className="block mb-1">Giá</label>
            <Dropdown
              value={filters.price}
              options={priceOptions}
              onChange={(e) => {
                handleFilterChange("price", e.value)
                setUsePriceSlider(false)
              }}
              className="w-full"
              placeholder="Chọn giá"
            />
          </div>

          {/* Bộ lọc Price - Slider */}
          <div className="col-12 mb-4">
            <div className="flex justify-content-between align-items-center mb-2">
              <label className="block">
                Khoảng giá:{" "}
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(priceRange[0])} -{" "}
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(priceRange[1])}
              </label>
              <div className="flex gap-2">
                <button
                  className="p-button p-button-sm p-button-text"
                  onClick={() => {
                    setUsePriceSlider(true)
                    handleFilterChange("price", "default")
                  }}
                >
                  Áp dụng
                </button>
                <Button
                  label="Xóa tất cả bộ lọc"
                  icon="pi pi-filter-slash"
                  className="p-button-sm p-button-danger"
                  onClick={resetAllFilters}
                />
              </div>
            </div>
            <Slider
              value={priceRange}
              onChange={(e) => setPriceRange(e.value)}
              range
              min={0}
              max={50000000}
              step={100000}
              className="mt-3"
            />
          </div>

          {/* Dynamic attribute filters */}
          {categoryAttributes &&
            categoryAttributes.map((attribute) => {
              const attributeKey = attribute.type_name
                .toLowerCase()
                .replace(/\s+/g, "_")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")

              return (
                <div key={attribute.attribute_type_id} className="col-12 md:col-6 lg:col-3 mb-2">
                  <label className="block mb-1">{attribute.type_name}</label>
                  <Dropdown
                    value={filters[attributeKey]}
                    options={attributeOptions[attributeKey] || [{ label: "Đang tải...", value: "default" }]}
                    onChange={(e) => handleFilterChange(attributeKey, e.value)}
                    className="w-full"
                    placeholder={`Chọn ${attribute.type_name.toLowerCase()}`}
                  />
                </div>
              )
            })}
        </div>
      </Panel>

      <div
        className="flex justify-content-between align-items-center mb-4"
        style={{ paddingRight: "20px", paddingLeft: "20px" }}
      >
        <h2 className="text-2xl font-medium m-0">{displayCategoryName}</h2>
        <div className="flex align-items-center">
          <span className="mr-2">Sắp xếp theo:</span>
          <Dropdown value={sortOption} options={sortOptions} onChange={(e) => handleSortChange(e.value)} />
        </div>
      </div>

      <DataView
        value={filteredProducts}
        layout="grid"
        itemTemplate={itemTemplate}
        emptyMessage={emptyTemplate()}
        paginator
        rows={30}
        loading={loading}
      />
    </>
  )
}

ProductListPage.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>
}

export default ProductListPage

