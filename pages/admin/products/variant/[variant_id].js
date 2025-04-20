import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import productsService from "../../../Services/productsService"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
import { Divider } from "primereact/divider"
import { TabView, TabPanel } from "primereact/tabview"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Toast } from "primereact/toast"
import { InputNumber } from "primereact/inputnumber"
import Select from "react-select"

import "primereact/resources/themes/lara-light-indigo/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

export default function ProductDetailPage({ params }) {
  const router = useRouter()
  const [productId, setProductId] = useState(null)
  const [productData, setProductData] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [image, setImage] = useState(null)
  const toast = useRef(null)

  const brands = [
    { value: "apple", label: "Apple" },
    { value: "samsung", label: "Samsung" },
    { value: "other", label: "Khác" },
  ]

  const categories = [
    { value: "electronics", label: "Điện tử" },
    { value: "fashion", label: "Thời trang" },
    { value: "home", label: "Gia dụng" },
  ]

  // Fetch product data
  const fetchProductData = async (id) => {
    try {
      setLoading(true)
      const data = await productsService.getById(id)
      setProductData(data)

      if (data && data.length > 0) {
        const defaultVariant = data[0]
        setSelectedVariant(defaultVariant)

        // Set selected brand and category if available
        if (defaultVariant.brand_name) {
          const brand = brands.find(
            (b) => b.value.toLowerCase() === defaultVariant.brand_name.toLowerCase()
          )
          setSelectedBrand(brand || null)
        }

        if (defaultVariant.category_name) {
          const category = categories.find(
            (c) =>
              c.value.toLowerCase() === defaultVariant.category_name.toLowerCase() ||
              c.label.toLowerCase() === defaultVariant.category_name.toLowerCase()
          )
          setSelectedCategory(category || null)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải dữ liệu sản phẩm",
          life: 3000,
        })
      }
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedProductId = localStorage.getItem("productId")

    if (storedProductId) {
      const productIdInt = Number.parseInt(storedProductId, 10)
      if (!isNaN(productIdInt)) {
        setProductId(productIdInt)
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (productId !== null) {
      fetchProductData(productId)
    }
  }, [productId])

  const handleGoBack = () => {
    router.back()
  }

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant)
  }

  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption)
  }

  const handleBrandChange = (selectedOption) => {
    setSelectedBrand(selectedOption)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(URL.createObjectURL(file))
      // You can upload the image to the server here and update the selected variant
      if (selectedVariant) {
        setSelectedVariant({ ...selectedVariant, variant_image: file })
      }
    }
  }

  const formatCurrency = (value) => {
    if (!value) return "0 ₫"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleUpdateProduct = () => {
    if (toast.current) {
      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Thông tin sản phẩm đã được cập nhật",
        life: 3000,
      })
    }
  }

  const handleDeleteProduct = () => {
    if (toast.current) {
      toast.current.show({
        severity: "warn",
        summary: "Xác nhận",
        detail: "Bạn có chắc chắn muốn xóa sản phẩm này?",
        life: 3000,
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <div className="text-center p-5">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
          <div className="mt-3">Đang tải thông tin sản phẩm...</div>
        </div>
      </div>
    )
  }

  if (!productData || productData.length === 0) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <Button icon="pi pi-arrow-left" label="Quay lại" className="mb-4" onClick={handleGoBack} />
        <div className="text-center p-5">
          <i className="pi pi-exclamation-triangle" style={{ fontSize: "2rem", color: "#FFA500" }}></i>
          <div className="mt-3 text-xl">Không tìm thấy thông tin sản phẩm</div>
        </div>
      </div>
    )
  }

  const productInfo = productData[0]

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <Button
        icon="pi pi-arrow-left"
        label="Quay lại"
        className="mb-4 p-button-outlined"
        style={{ color: "#e30019", borderColor: "#e30019" }}
        onClick={handleGoBack}
      />

      {/* Giao diện hiển thị thông tin sản phẩm */}
      <div className="main-container">
        <div className="grid">
          <div className="col-12 lg:col-7">
            <Card>
              <div>
                <h2 className="text-2xl font-bold mb-1">{productInfo.product_name}</h2>
                <div className="text-500 mb-3">Mã sản phẩm: {productInfo.product_id}</div>
                {productInfo.is_featured === 1 && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 border-round text-sm">
                    <i className="pi pi-star mr-1"></i>
                    Sản phẩm nổi bật
                  </span>
                )}

                <Divider />

                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <label className="block font-medium mb-1">Thương hiệu:</label>
                      <Select
                        value={selectedBrand}
                        onChange={handleBrandChange}
                        options={brands}
                        isClearable
                        placeholder={productInfo.brand_name}
                        className="w-full"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block font-medium mb-1">Model:</label>
                      <input
                        type="text"
                        value={productInfo.model || ""}
                        onChange={(e) => {
                          if (selectedVariant) {
                            handleVariantClick({ ...selectedVariant, model: e.target.value })
                          }
                        }}
                        className="p-inputtext w-full"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block font-medium mb-1">Danh mục:</label>
                      <Select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        options={categories}
                        isClearable
                        placeholder={productInfo.category_name}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <label className="block font-medium mb-1">Ảnh biến thể:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="p-inputtext w-full"
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="mb-3">
                  <label className="block text-lg font-medium mb-2">Thông tin biến thể</label>
                  <input
                    type="text"
                    value={selectedVariant?.variant_attributes || ""}
                    onChange={(e) => {
                      if (selectedVariant) {
                        handleVariantClick({ ...selectedVariant, variant_attributes: e.target.value })
                      }
                    }}
                    className="p-inputtext w-full"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-lg font-medium mb-2">Giá bán</label>
                  <div className="p-inputgroup">
                    <InputNumber
                      value={selectedVariant?.final_price || 0}
                      onValueChange={(e) => {
                        if (selectedVariant) {
                          handleVariantClick({ ...selectedVariant, final_price: e.value })
                        }
                      }}
                      mode="currency"
                      currency="VND"
                      locale="vi-VN"
                      minFractionDigits={0}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    label="Cập nhật"
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={handleUpdateProduct}
                  />
                  <Button label="Xóa" icon="pi pi-trash" className="p-button-danger" onClick={handleDeleteProduct} />
                </div>
              </div>
            </Card>

            <Card className="mt-3">
              <TabView>
                <TabPanel header="Tất cả biến thể">
                  <DataTable value={productData} stripedRows responsiveLayout="scroll">
                    <Column
                      header="Biến thể"
                      body={(rowData) => (
                        <div>
                          <div>{rowData.variant_sku}</div>
                          <small className="text-600">{rowData.variant_attributes}</small>
                        </div>
                      )}
                    />
                    <Column
                      field="stock_quantity"
                      header="Tồn kho"
                      body={(rowData) => (
                        <span className={rowData.stock_quantity > 0 ? "text-green-500" : "text-red-500"}>
                          {rowData.stock_quantity}
                        </span>
                      )}
                      style={{ width: "120px" }}
                    />
                    <Column
                      field="final_price"
                      header="Giá bán"
                      body={(rowData) => formatCurrency(rowData.final_price)}
                      style={{ width: "150px" }}
                    />
                    <Column
                      body={(rowData) => (
                        <Button
                          icon="pi pi-check"
                          outlined={selectedVariant?.variant_id !== rowData.variant_id}
                          rounded
                          onClick={() => handleVariantClick(rowData)}
                          className="p-button-sm"
                        />
                      )}
                      style={{ width: "80px" }}
                    />
                  </DataTable>
                </TabPanel>
              </TabView>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
