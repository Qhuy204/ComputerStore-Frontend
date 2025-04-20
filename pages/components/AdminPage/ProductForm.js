"use client"

import { useState, useRef, useEffect } from "react"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { Editor } from "primereact/editor"
import { Button } from "primereact/button"
import { InputNumber } from "primereact/inputnumber"
import { Tooltip } from "primereact/tooltip"
import { Card } from "primereact/card"
import { Dialog } from "primereact/dialog"
import { FileUpload } from "primereact/fileupload"
import { InputSwitch } from "primereact/inputswitch"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Toast } from "primereact/toast"
import { Checkbox } from "primereact/checkbox"
import { Tag } from "primereact/tag"
import { MultiSelect } from "primereact/multiselect"
import { Chip } from "primereact/chip"

// Service imports
import Attribute_TypesService from "../../Services/Attribute_TypesService"
import Attribute_ValuesService from "../../Services/Attribute_ValuesService"
import Variant_Attribute_ValuesService from "../../Services/Variant_Attribute_ValuesService"
import productsService from "../../Services/productsService"
import Product_SpecificationsService from "../../Services/Product_SpecificationsService"
import Product_ImagesService from "../../Services/product_imagesService"
import brandService from "../../Services/brandService"
import categoriesService from "../../Services/categoriesService"
import Product_VariantsService from "../../Services/Product_VariantsService"

const ProductForm = ({ productId, onSave, onCancel }) => {
  const toast = useRef(null)
  const isEditMode = !!productId

  // State for product based on database schema
  const [product, setProduct] = useState({
    product_id: null,
    product_name: "",
    brand_id: null,
    brand_name: "",
    model: "",
    category_id: null,
    description: "",
    base_price: 0,
    is_featured: false,
    specifications: [], // [{spec_name, spec_value, display_order}]
    images: [], // [{image_url, is_primary}]
    hasVariants: false,
  })

  // State for product variants
  const [productVariants, setProductVariants] = useState([])

  // State for categories and their attributes
  const [categories, setCategories] = useState([])
  const [categoryAttributes, setCategoryAttributes] = useState([])
  const [variantAttributeTypes, setVariantAttributeTypes] = useState([])
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState([])

  // Dialog states
  const [displayUrlDialog, setDisplayUrlDialog] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [displayDeviceDialog, setDisplayDeviceDialog] = useState(false)
  const [displaySpecDialog, setDisplaySpecDialog] = useState(false)
  const [specInput, setSpecInput] = useState({ spec_name: "", spec_value: "", display_order: 0 })
  const [specValueOptions, setSpecValueOptions] = useState([])
  const [displayAttributeDialog, setDisplayAttributeDialog] = useState(false)
  const [attributeInput, setAttributeInput] = useState({ type_name: "", values: [], display_order: 0 })
  const [newAttributeValue, setNewAttributeValue] = useState("")
  const [displayAttributeValueDialog, setDisplayAttributeValueDialog] = useState(false)
  const [currentAttributeType, setCurrentAttributeType] = useState(null)
  const [displayVariantImageDialog, setDisplayVariantImageDialog] = useState(false)
  const [currentVariant, setCurrentVariant] = useState(null)

  // Options for dropdowns
  const [categoryOptions, setCategoryOptions] = useState([])
  const [brandOptions, setBrandOptions] = useState([])
  const [attributeTypeOptions, setAttributeTypeOptions] = useState([])
  const [loading, setLoading] = useState(false)

  // State for variant values
  const [selectedVariantValues, setSelectedVariantValues] = useState({})
  const [newVariantValue, setNewVariantValue] = useState("")
  const [showVariantPreview, setShowVariantPreview] = useState(false)
  const [previewVariants, setPreviewVariants] = useState([])
  const [selectedPreviewVariants, setSelectedPreviewVariants] = useState([])

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch categories with their attributes
        const categoriesData = await categoriesService.getAll()
        setCategories(categoriesData)
        setCategoryOptions(
          categoriesData.map((cat) => ({
            label: cat.category_name,
            value: cat.category_id,
          })),
        )

        // Fetch brands
        const brandsData = await brandService.getAll()
        setBrandOptions(
          brandsData.map((brand) => ({
            label: brand.brand_name,
            value: brand.brand_id,
            name: brand.brand_name,
          })),
        )

        // If in edit mode, fetch product data
        if (isEditMode && productId) {
          await fetchProductData(productId)
        }
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải dữ liệu ban đầu: " + error.message,
        })
        console.error("Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isEditMode, productId])

  // Fetch product data for editing
  const fetchProductData = async (id) => {
    try {
      // Fetch product basic info
      const productData = await productsService.getById(id)

      // Fetch product specifications
      const specifications = await Product_SpecificationsService.getByProductId(id)

      // Fetch product images
      const images = await Product_ImagesService.getByProductId(id)

      // Fetch product variants
      const variants = await Product_VariantsService.getByProductId(id)

      // Check if product has variants
      const hasVariants = variants && variants.length > 0

      // Set product state
      setProduct({
        ...productData,
        specifications: specifications || [],
        images: images || [],
        hasVariants,
      })

      // If product has variants, fetch variant attributes
      if (hasVariants && variants.length > 0) {
        // Process variants
        const processedVariants = await Promise.all(
          variants.map(async (variant) => {
            // Fetch variant attribute values
            const variantAttributeValues = await Variant_Attribute_ValuesService.getByVariantId(variant.variant_id)

            return {
              ...variant,
              attributes: variantAttributeValues || [],
            }
          }),
        )

        setProductVariants(processedVariants)

        // Set selected variant attributes based on existing variants
        if (processedVariants.length > 0 && processedVariants[0].attributes.length > 0) {
          // Extract unique attribute types from variants
          const attributeTypeIds = new Set()
          const attributeValuesByType = {}

          processedVariants.forEach((variant) => {
            variant.attributes.forEach((attr) => {
              attributeTypeIds.add(attr.attribute_type_id)

              if (!attributeValuesByType[attr.attribute_type_id]) {
                attributeValuesByType[attr.attribute_type_id] = new Set()
              }

              attributeValuesByType[attr.attribute_type_id].add(attr.attribute_value_id)
            })
          })

          // Set selected variant attributes
          if (productData.category_id) {
            // Wait for category attributes to be loaded
            await new Promise((resolve) => setTimeout(resolve, 500))

            const selectedAttrs = variantAttributeTypes.filter((attr) => attributeTypeIds.has(attr.attribute_type_id))

            setSelectedVariantAttributes(selectedAttrs)

            // Set selected variant values
            const selectedValues = {}
            Object.entries(attributeValuesByType).forEach(([typeId, valueSet]) => {
              selectedValues[Number(typeId)] = Array.from(valueSet)
            })

            setSelectedVariantValues(selectedValues)
          }
        }
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải thông tin sản phẩm: " + error.message,
      })
      console.error("Error fetching product data:", error)
    }
  }

  // Update category attributes when category changes
  useEffect(() => {
    if (product.category_id) {
      const selectedCategory = categories.find((cat) => cat.category_id === product.category_id)
      if (selectedCategory && selectedCategory.attributes) {
        setCategoryAttributes(selectedCategory.attributes)

        // Classify attributes
        const requiredAttrs = selectedCategory.attributes.filter((attr) => attr.is_required)
        const optionalAttrs = selectedCategory.attributes.filter((attr) => !attr.is_required)

        // Set up attributes for specifications
        const specOptions = requiredAttrs.map((attr) => ({
          label: attr.type_name,
          value: attr.type_name,
          attribute: attr,
        }))

        // Set up attributes for variants
        const variantOptions = [...requiredAttrs, ...optionalAttrs].map((attr) => ({
          label: attr.type_name,
          value: attr.attribute_type_id,
          attribute: attr,
        }))

        setAttributeTypeOptions(variantOptions)
        setVariantAttributeTypes(selectedCategory.attributes)

        // Only reset selected attributes if not in edit mode or if changing category in edit mode
        if (!isEditMode || (isEditMode && product.product_id && selectedVariantAttributes.length === 0)) {
          setSelectedVariantAttributes([])
          setSelectedVariantValues({})
        }
      } else {
        setCategoryAttributes([])
        setAttributeTypeOptions([])
        setVariantAttributeTypes([])
      }
    }
  }, [product.category_id, categories, isEditMode, product.product_id, selectedVariantAttributes.length])

  // Handlers for input changes
  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || ""
    setProduct((prevState) => ({
      ...prevState,
      [name]: val,
    }))
  }

  const onNumberChange = (e, name) => {
    const val = e.value || 0
    setProduct((prevState) => ({
      ...prevState,
      [name]: val,
    }))
  }

  const onCheckboxChange = (e, name) => {
    const checked = e.checked
    setProduct((prevState) => ({
      ...prevState,
      [name]: checked,
    }))
  }

  const onBrandChange = (e) => {
    const selectedBrand = brandOptions.find((brand) => brand.value === e.value)
    setProduct((prevState) => ({
      ...prevState,
      brand_id: e.value,
      brand_name: selectedBrand ? selectedBrand.name : "",
    }))
  }

  // Handle spec name change to load available values
  const onSpecNameChange = (e) => {
    const specName = e.value
    setSpecInput((prev) => ({ ...prev, spec_name: specName }))

    // Find attribute type with this name
    const attrType = categoryAttributes.find((attr) => attr.type_name === specName)
    if (attrType && attrType.values && attrType.values.length > 0) {
      // Set values for dropdown
      const valueOptions = attrType.values.map((val) => ({
        label: val.value_name,
        value: val.value_name,
      }))
      setSpecValueOptions(valueOptions)
    } else {
      setSpecValueOptions([])
    }
  }

  // Handle adding specification
  const handleAddSpecification = () => {
    if (specInput.spec_name.trim() && specInput.spec_value.trim()) {
      setProduct((prev) => ({
        ...prev,
        specifications: [...prev.specifications, specInput],
      }))
      setSpecInput({ spec_name: "", spec_value: "", display_order: 0 })
      setSpecValueOptions([])
      setDisplaySpecDialog(false)
    } else {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng nhập đầy đủ thông tin" })
    }
  }

  // Handle adding new variant value to an attribute type
  const handleAddNewVariantValue = async (attributeType) => {
    if (newVariantValue.trim() && attributeType) {
      try {
        setLoading(true)

        // Check if the value already exists
        const existingValue = await checkAttributeValueExists(attributeType.attribute_type_id, newVariantValue.trim())

        if (existingValue) {
          // If value exists, add it to selected values
          toast.current?.show({
            severity: "info",
            summary: "Thông báo",
            detail: "Giá trị này đã tồn tại, đã được thêm vào danh sách",
          })

          // Auto-select existing value
          setSelectedVariantValues((prev) => {
            const currentValues = prev[attributeType.attribute_type_id] || []
            if (!currentValues.includes(existingValue.attribute_value_id)) {
              return {
                ...prev,
                [attributeType.attribute_type_id]: [...currentValues, existingValue.attribute_value_id],
              }
            }
            return prev
          })
        } else {
          // Add new value
          const newValue = {
            attribute_type_id: attributeType.attribute_type_id,
            value_name: newVariantValue.trim(),
          }

          const responseData = await Attribute_ValuesService.insert(newValue)

          // Reload categories and attributes
          const categoriesData = await categoriesService.getAll()
          setCategories(categoriesData)

          // Update category attributes
          const updatedCategory = categoriesData.find((cat) => cat.category_id === product.category_id)
          if (updatedCategory) {
            setCategoryAttributes(updatedCategory.attributes)
            setVariantAttributeTypes(updatedCategory.attributes)

            // Update selected variant attributes
            const updatedSelectedAttributes = updatedCategory.attributes.filter((attr) =>
              selectedVariantAttributes.some(
                (selectedAttr) => selectedAttr.attribute_type_id === attr.attribute_type_id,
              ),
            )
            setSelectedVariantAttributes(updatedSelectedAttributes)
          }

          // Auto-select new value
          setSelectedVariantValues((prev) => {
            const currentValues = prev[attributeType.attribute_type_id] || []
            return {
              ...prev,
              [attributeType.attribute_type_id]: [...currentValues, responseData.attribute_value_id],
            }
          })

          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Đã thêm giá trị thuộc tính mới",
          })
        }

        setNewVariantValue("")
      } catch (error) {
        // Handle duplicate entry error
        if (error.message && error.message.includes("Duplicate entry")) {
          toast.current?.show({
            severity: "warn",
            summary: "Cảnh báo",
            detail: "Giá trị này đã tồn tại trong cơ sở dữ liệu",
          })
        } else {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể thêm giá trị thuộc tính: " + error.message,
          })
        }
        console.error("Error adding variant attribute value:", error)
      } finally {
        setLoading(false)
      }
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Vui lòng nhập giá trị thuộc tính",
      })
    }
  }

  // Handle adding image from URL
  const handleAddUrlImage = () => {
    if (urlInput.trim() !== "") {
      // Use fixed URL instead of Blob URL
      const newImage = { image_url: urlInput.trim(), is_primary: product.images.length === 0 }

      // Add image to images array
      setProduct((prev) => ({
        ...prev,
        images: [...prev.images, newImage],
      }))

      setUrlInput("") // Clear the input field
      setDisplayUrlDialog(false) // Close the dialog
    } else {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng nhập URL hình ảnh" })
    }
  }

  // Handle upload image from device
  const handleDeviceUpload = (e) => {
    const uploadedImages = e.files.map((file, index) => ({
      image_url: URL.createObjectURL(file),
      is_primary: product.images.length === 0 && index === 0,
      file: file, // Store the actual file for later upload
    }))
    setProduct((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedImages],
    }))
    setDisplayDeviceDialog(false)
  }

  // Handle set primary image
  const handleSetPrimary = (index) => {
    setProduct((prev) => {
      const newImages = prev.images.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
      return { ...prev, images: newImages }
    })
  }

  // Handle selecting variant attributes
  const handleVariantAttributeSelect = (e) => {
    const selectedAttributeIds = e.value

    // Find full attribute objects for the selected IDs
    const selectedAttrs = variantAttributeTypes.filter((attr) => selectedAttributeIds.includes(attr.attribute_type_id))

    // Filter out removed attributes
    const removedAttributeIds = selectedVariantAttributes
      .filter((attr) => !selectedAttributeIds.includes(attr.attribute_type_id))
      .map((attr) => attr.attribute_type_id)

    // Remove selected values for removed attributes
    const newSelectedValues = { ...selectedVariantValues }
    removedAttributeIds.forEach((id) => {
      delete newSelectedValues[id]
    })

    setSelectedVariantValues(newSelectedValues)
    setSelectedVariantAttributes(selectedAttrs)
  }

  // Open dialog to add values to an attribute type
  const openAddAttributeValueDialog = (attributeType) => {
    setCurrentAttributeType(attributeType)
    setNewAttributeValue("")
    setDisplayAttributeValueDialog(true)
  }

  // Check if value exists
  const checkAttributeValueExists = async (attribute_type_id, value_name) => {
    try {
      // Check in current data first
      const existingAttr = categoryAttributes.find((attr) => attr.attribute_type_id === attribute_type_id)
      if (existingAttr && existingAttr.values) {
        const existingValue = existingAttr.values.find((v) => v.value_name.toLowerCase() === value_name.toLowerCase())
        if (existingValue) {
          return existingValue
        }
      }
    } catch (error) {
      console.error("Error checking if attribute value exists:", error)
      return null
    }
  }

  // Handle adding attribute value to existing type
  const handleAddAttributeValue = async () => {
    if (newAttributeValue.trim() && currentAttributeType) {
      try {
        setLoading(true)

        // Check if value already exists
        const existingValue = await checkAttributeValueExists(
          currentAttributeType.attribute_type_id,
          newAttributeValue.trim(),
        )

        if (existingValue) {
          // If value exists, add to selected list
          toast.current?.show({
            severity: "info",
            summary: "Thông báo",
            detail: "Giá trị này đã tồn tại, đã được thêm vào danh sách",
          })

          // Auto-select existing value
          setSelectedVariantValues((prev) => {
            const currentValues = prev[currentAttributeType.attribute_type_id] || []
            if (!currentValues.includes(existingValue.attribute_value_id)) {
              return {
                ...prev,
                [currentAttributeType.attribute_type_id]: [...currentValues, existingValue.attribute_value_id],
              }
            }
            return prev
          })

          setNewAttributeValue("")
          return
        }

        // If value doesn't exist, add new
        const newValue = {
          attribute_type_id: currentAttributeType.attribute_type_id,
          value_name: newAttributeValue.trim(),
        }

        const responseData = await Attribute_ValuesService.insert(newValue)

        // Reload attribute list
        const categoriesData = await categoriesService.getAll()

        // Update categories
        setCategories(categoriesData)

        // Update categoryAttributes
        const updatedCategory = categoriesData.find((cat) => cat.category_id === product.category_id)
        if (updatedCategory) {
          setCategoryAttributes(updatedCategory.attributes)

          // Update variantAttributeTypes
          setVariantAttributeTypes(updatedCategory.attributes)

          // Update selectedVariantAttributes
          const updatedSelectedAttributes = updatedCategory.attributes.filter((attr) =>
            selectedVariantAttributes.some((selectedAttr) => selectedAttr.attribute_type_id === attr.attribute_type_id),
          )
          setSelectedVariantAttributes(updatedSelectedAttributes)
        }

        // Auto-select new value
        setSelectedVariantValues((prev) => {
          const currentValues = prev[currentAttributeType.attribute_type_id] || []
          return {
            ...prev,
            [currentAttributeType.attribute_type_id]: [...currentValues, responseData.attribute_value_id],
          }
        })

        setNewAttributeValue("")
        toast.current?.show({ severity: "success", summary: "Thành công", detail: "Đã thêm giá trị thuộc tính" })
      } catch (error) {
        // Handle duplicate entry error
        if (error.message && error.message.includes("Duplicate entry")) {
          toast.current?.show({
            severity: "warn",
            summary: "Cảnh báo",
            detail: "Giá trị này đã tồn tại trong cơ sở dữ liệu",
          })
        } else {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể thêm giá trị thuộc tính: " + error.message,
          })
        }
        console.error("Error adding attribute value:", error)
      } finally {
        setLoading(false)
      }
    } else {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng nhập giá trị thuộc tính" })
    }
  }

  // Handle adding new attribute type
  const handleSaveAttribute = async () => {
    if (attributeInput.type_name && attributeInput.values.length > 0) {
      try {
        setLoading(true)
        // Save new attribute type
        const newType = {
          type_name: attributeInput.type_name,
          display_order: attributeInput.display_order || 0,
        }

        const newTypeData = await Attribute_TypesService.insert(newType)

        // Save attribute values
        const newValuesData = []
        for (const value of attributeInput.values) {
          try {
            const valueData = await Attribute_ValuesService.insert({
              attribute_type_id: newTypeData.attribute_type_id,
              value_name: value,
            })
            newValuesData.push(valueData)
          } catch (error) {
            console.error("Error adding attribute value:", error)
            // Continue with next value if error
          }
        }

        // Reload attribute list
        const categoriesData = await categoriesService.getAll()
        setCategories(categoriesData)

        if (product.category_id) {
          // Update categoryAttributes
          const updatedCategory = categoriesData.find((cat) => cat.category_id === product.category_id)
          if (updatedCategory) {
            setCategoryAttributes(updatedCategory.attributes)

            // Update variantAttributeTypes
            setVariantAttributeTypes(updatedCategory.attributes)

            // Update selectedVariantAttributes
            const updatedSelectedAttributes = updatedCategory.attributes.filter(
              (attr) =>
                selectedVariantAttributes.some(
                  (selectedAttr) => selectedAttr.attribute_type_id === attr.attribute_type_id,
                ) || attr.attribute_type_id === newTypeData.attribute_type_id,
            )
            setSelectedVariantAttributes(updatedSelectedAttributes)

            // Update attributeTypeOptions
            const updatedOptions = updatedCategory.attributes.map((attr) => ({
              label: attr.type_name,
              value: attr.attribute_type_id,
              attribute: attr,
            }))
            setAttributeTypeOptions(updatedOptions)

            // Auto-select new attribute
            const newAttributeInCategory = updatedCategory.attributes.find(
              (attr) => attr.attribute_type_id === newTypeData.attribute_type_id,
            )
            if (newAttributeInCategory) {
              setSelectedVariantAttributes((prev) => [...prev, newAttributeInCategory])

              // Select all values of new attribute
              if (newAttributeInCategory.values && newAttributeInCategory.values.length > 0) {
                setSelectedVariantValues((prev) => ({
                  ...prev,
                  [newTypeData.attribute_type_id]: newAttributeInCategory.values.map((v) => v.attribute_value_id),
                }))
              }
            }
          }
        }

        setAttributeInput({ type_name: "", values: [], display_order: 0 })
        setDisplayAttributeDialog(false)
        toast.current?.show({ severity: "success", summary: "Thành công", detail: "Đã thêm thuộc tính mới" })
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể thêm thuộc tính mới: " + error.message,
        })
        console.error("Error adding attribute type:", error)
      } finally {
        setLoading(false)
      }
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Vui lòng nhập tên thuộc tính và ít nhất một giá trị",
      })
    }
  }

  // Open dialog to add/select image for variant
  const openVariantImageDialog = (variant) => {
    setCurrentVariant(variant)
    setDisplayVariantImageDialog(true)
  }

  // Handle selecting image for variant
  const handleSelectVariantImage = (imageUrl) => {
    if (currentVariant) {
      const updatedVariants = productVariants.map((variant) =>
        variant.variant_id === currentVariant.variant_id ? { ...variant, image_url: imageUrl } : variant,
      )
      setProductVariants(updatedVariants)
      setDisplayVariantImageDialog(false)
    }
  }

  // Handle removing a variant
  const handleRemoveVariant = (variantId) => {
    setProductVariants(productVariants.filter((v) => v.variant_id !== variantId))
  }

  // Validate product data
  const validateProduct = () => {
    if (!product.product_name) {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng nhập tên sản phẩm" })
      return false
    }

    if (!product.brand_id) {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng chọn thương hiệu" })
      return false
    }

    if (!product.category_id) {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng chọn danh mục sản phẩm" })
      return false
    }

    if (product.base_price <= 0) {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Giá sản phẩm phải lớn hơn 0" })
      return false
    }

    if (product.images.length === 0) {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Vui lòng thêm ít nhất một hình ảnh" })
      return false
    }

    // Check required specifications
    if (product.category_id) {
      const requiredAttrs = categoryAttributes.filter((attr) => attr.is_required)

      for (const attr of requiredAttrs) {
        const specExists = product.specifications.some((spec) => spec.spec_name === attr.type_name)
        if (!specExists) {
          toast.current?.show({
            severity: "error",
            summary: "Thông số bắt buộc",
            detail: `Vui lòng thêm thông số "${attr.type_name}" vào sản phẩm`,
          })
          return false
        }
      }
    }

    // Check variants
    if (product.hasVariants && productVariants.length === 0) {
      toast.current?.show({
        severity: "error",
        summary: "Biến thể",
        detail: "Vui lòng tạo biến thể cho sản phẩm",
      })
      return false
    }

    return true
  }

  // Get latest product ID after adding product
  const getLatestProductId = async () => {
    try {
      const products = await productsService.getAll()
      if (products && products.length > 0) {
        // Find max product_id
        const maxProductId = Math.max(...products.map((p) => p.product_id))
        return maxProductId
      }
      return null
    } catch (error) {
      console.error("Error getting latest product ID:", error)
      return null
    }
  }

  // Handle save product
  const handleSave = async () => {
    if (!validateProduct()) {
      return
    }

    try {
      setLoading(true)
      // 1. Save product basic info
      const productData = {
        product_name: product.product_name,
        brand_id: product.brand_id,
        brand_name: product.brand_name,
        model: product.model,
        category_id: product.category_id,
        description: product.description,
        base_price: product.base_price,
        is_featured: product.is_featured,
      }

      let productId

      if (isEditMode && product.product_id) {
        // Update existing product
        await productsService.update(product.product_id, productData)
        productId = product.product_id

        // Delete existing specifications and images to replace with new ones
        await Product_SpecificationsService.deleteByProductId(productId)
        await Product_ImagesService.deleteByProductId(productId)

        // If has variants, delete existing variants
        if (product.hasVariants) {
          // Get existing variants
          const existingVariants = await Product_VariantsService.getByProductId(productId)

          // Delete variant attribute values for each variant
          for (const variant of existingVariants) {
            await Variant_Attribute_ValuesService.deleteByVariantId(variant.variant_id)
          }

          // Delete variants
          await Product_VariantsService.deleteByProductId(productId)
        }
      } else {
        // Create new product
        const productResponse = await productsService.insert(productData)
        productId = productResponse.product_id

        // If didn't get product_id from response, get latest
        if (!productId) {
          productId = await getLatestProductId()
          if (!productId) {
            throw new Error("Không thể xác định ID sản phẩm")
          }
        }
      }

      // 2. Save product specifications with product_id
      for (const spec of product.specifications) {
        await Product_SpecificationsService.insert({
          product_id: productId,
          spec_name: spec.spec_name,
          spec_value: spec.spec_value,
          display_order: spec.display_order,
        })
      }

      // 3. Save product images
      for (const img of product.images) {
        await Product_ImagesService.insert({
          product_id: productId,
          image_url: img.image_url,
          is_primary: img.is_primary,
        })
      }

      // 4. Save product variants if any
      if (product.hasVariants && productVariants.length > 0) {
        for (const variant of productVariants) {
          try {
            // Create variant
            await Product_VariantsService.insert({
              product_id: productId,
              variant_sku: variant.variant_sku,
              price_adjustment: variant.price_adjustment || 0,
              stock_quantity: variant.stock_quantity || 0,
              is_default: variant.is_default,
              image_url: variant.image_url || product.images.find((img) => img.is_primary)?.image_url || "",
            })

            // Get latest variant_id
            const allVariants = await Product_VariantsService.getAll()
            if (!allVariants || allVariants.length === 0) {
              throw new Error("Không thể lấy thông tin biến thể sau khi tạo")
            }

            // Get max variant_id
            const maxVariantId = Math.max(...allVariants.map((v) => v.variant_id))

            // Create variant attribute values
            for (const attr of variant.attributes) {
              const attributeValueId = attr.valueId || attr.attribute_value_id

              if (!attributeValueId) {
                console.warn("Bỏ qua thuộc tính không có attribute_value_id", attr)
                continue
              }

              await Variant_Attribute_ValuesService.insert({
                variant_id: maxVariantId,
                attribute_value_id: attributeValueId,
              })
            }
          } catch (error) {
            console.error("Error inserting variant:", error)
            throw new Error("Lỗi khi lưu biến thể: " + error.message)
          }
        }
      }

      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: `Sản phẩm đã được ${isEditMode ? "cập nhật" : "lưu"} thành công`,
      })

      // Call onSave callback if provided
      if (onSave) {
        onSave(product)
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: `Không thể ${isEditMode ? "cập nhật" : "lưu"} sản phẩm: ` + error.message,
      })
      console.error(`Error ${isEditMode ? "updating" : "saving"} product:`, error)
    } finally {
      setLoading(false)
    }
  }

  // Handle selecting values for variant attribute
  const handleVariantValueSelect = (attributeTypeId, values) => {
    setSelectedVariantValues((prev) => ({
      ...prev,
      [attributeTypeId]: values,
    }))
  }

  // Check if attributes and values are selected enough to generate variants
  const canGenerateVariants = () => {
    if (selectedVariantAttributes.length === 0) return false

    // Check each selected attribute must have at least 1 value
    return selectedVariantAttributes.every((attr) => {
      const values = selectedVariantValues[attr.attribute_type_id]
      return values && values.length > 0
    })
  }

  // Show variant preview
  const handleShowVariantPreview = () => {
    if (!canGenerateVariants()) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng chọn ít nhất một giá trị cho mỗi thuộc tính",
      })
      return
    }

    // Get selected values for each attribute
    const attributeValues = selectedVariantAttributes.map((attr) => {
      const selectedIds = selectedVariantValues[attr.attribute_type_id] || []
      const values = attr.values.filter((val) => selectedIds.includes(val.attribute_value_id))

      if (values.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Cảnh báo",
          detail: `Vui lòng chọn ít nhất một giá trị cho thuộc tính "${attr.type_name}"`,
        })
        return null
      }

      return {
        attributeTypeId: attr.attribute_type_id,
        typeName: attr.type_name,
        values: values,
      }
    })

    // Check if any attribute has no values
    if (attributeValues.some((attr) => attr === null)) {
      return
    }

    // Generate all possible combinations
    const generateCombinations = (lists, current = [], index = 0) => {
      if (index === lists.length) {
        return [current]
      }

      const results = []
      for (const item of lists[index].values) {
        results.push(
          ...generateCombinations(
            lists,
            [
              ...current,
              {
                attributeTypeId: lists[index].attributeTypeId,
                typeName: lists[index].typeName,
                valueId: item.attribute_value_id,
                valueName: item.value_name,
              },
            ],
            index + 1,
          ),
        )
      }

      return results
    }

    const combinations = generateCombinations(attributeValues)

    if (combinations.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Không thể tạo biến thể với các thuộc tính đã chọn",
      })
      return
    }

    // Create preview variants list
    const variantsList = combinations.map((combo, index) => {
      // Create variant name with format: Product name/Value 1/Value 2/...
      const variantName = product.product_name + "/" + combo.map((item) => item.valueName).join("/")

      // Create object with attribute info
      const attributes = {}
      combo.forEach((item) => {
        attributes[`attr_${item.attributeTypeId}`] = item.valueName
      })

      return {
        id: index,
        name: variantName,
        attributes: combo,
        ...attributes,
      }
    })

    setPreviewVariants(variantsList)
    setSelectedPreviewVariants(variantsList) // Select all by default
    setShowVariantPreview(true)
  }

  // Generate variants from selected list
  const generateVariants = () => {
    if (!selectedPreviewVariants || selectedPreviewVariants.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng chọn ít nhất một biến thể",
      })
      return
    }

    const variants = selectedPreviewVariants.map((variant, index) => {
      // Create SKU from selected attributes
      const removeVietnameseTones = (str) => {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
      }

      const skuParts = [
        removeVietnameseTones(product.brand_name)
          .toUpperCase()
          .replace(/\s+/g, ""), // ASUS
        removeVietnameseTones(product.product_name.split(" ")[2] || "").toUpperCase(), // ROG, Strix,...
        ...variant.attributes.map((attr) => removeVietnameseTones(attr.valueName).toUpperCase().replace(/\s+/g, "-")),
      ]

      return {
        variant_id: `temp-${Date.now()}-${index}`,
        product_id: null,
        variant_sku: skuParts.join("-"),
        price_adjustment: 0,
        stock_quantity: 0,
        is_default: index === 0,
        image_url: "",
        name: variant.name,
        attributes: variant.attributes,
        // Add read-only field for display
        readOnlyInfo: {
          priceAdjustment: 0,
          stockQuantity: 0,
        },
      }
    })

    setProductVariants(variants)
    setShowVariantPreview(false)
  }

  // Display selected values
  const renderSelectedValues = (attributeTypeId) => {
    const selectedIds = selectedVariantValues[attributeTypeId] || []
    const attribute = selectedVariantAttributes.find((attr) => attr.attribute_type_id === attributeTypeId)

    if (!attribute || !attribute.values) return null

    const selectedValueNames = attribute.values
      .filter((val) => selectedIds.includes(val.attribute_value_id))
      .map((val) => val.value_name)

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedValueNames.map((name, index) => (
          <Chip
            key={index}
            label={name}
            removable
            onRemove={() => {
              const newSelectedIds = selectedIds.filter(
                (id, idx) => attribute.values[idx] && attribute.values[idx].value_name !== name,
              )
              handleVariantValueSelect(attributeTypeId, newSelectedIds)
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="product-form-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <Toast ref={toast} />
      <div className="product-header">
        <h2>{isEditMode ? "Cập nhật sản phẩm" : "Tạo sản phẩm mới"}</h2>
      </div>

      <div className="grid" style={{ justifyContent: "center", width: "100%" }}>
        <div className="col-12 lg:col-8" style={{ width: "100%" }}>
          <Card className="mb-3">
            <h3>Thông tin chung</h3>

            <div className="field">
              <label htmlFor="product_name" className="font-bold block mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <InputText
                id="product_name"
                value={product.product_name}
                onChange={(e) => onInputChange(e, "product_name")}
                placeholder="Nhập tên sản phẩm"
                className="w-full"
                required
              />
            </div>

            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="brand_id" className="font-bold block mb-2">
                    Thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="brand_id"
                    value={product.brand_id}
                    options={brandOptions}
                    onChange={onBrandChange}
                    placeholder="Chọn thương hiệu"
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="model" className="font-bold block mb-2">
                    Model
                  </label>
                  <InputText
                    id="model"
                    value={product.model}
                    onChange={(e) => onInputChange(e, "model")}
                    placeholder="Nhập model sản phẩm"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="category_id" className="font-bold block mb-2">
                Loại sản phẩm <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="category_id"
                value={product.category_id}
                options={categoryOptions}
                onChange={(e) => onInputChange(e, "category_id")}
                placeholder="Chọn loại sản phẩm"
                className="w-full"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="description" className="font-bold block mb-2">
                Mô tả sản phẩm
              </label>
              <Editor
                style={{ height: "200px" }}
                value={product.description}
                onTextChange={(e) => setProduct((prev) => ({ ...prev, description: e.htmlValue || "" }))}
              />
            </div>

            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="base_price" className="font-bold block mb-2">
                    Giá cơ bản <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    id="base_price"
                    value={product.base_price}
                    onValueChange={(e) => onNumberChange(e, "base_price")}
                    mode="currency"
                    currency="VND"
                    locale="vi-VN"
                    minFractionDigits={0}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="field flex align-items-center mt-4">
                  <Checkbox
                    inputId="is_featured"
                    checked={product.is_featured}
                    onChange={(e) => setProduct((prev) => ({ ...prev, is_featured: e.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="is_featured" className="font-bold cursor-pointer">
                    Nổi bật
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mb-3">
            <div className="flex justify-content-between align-items-center">
              <h3>Hình ảnh sản phẩm</h3>
              <Tooltip target=".image-help-icon" />
              <i
                className="pi pi-question-circle image-help-icon"
                data-pr-tooltip="Thêm hình ảnh sản phẩm. Ảnh đầu tiên sẽ là ảnh đại diện"
              ></i>
            </div>
            <div className="product-images-container grid">
              {product.images.map((img, index) => (
                <div key={index} className="col-6 md:col-4 lg:col-3 p-2">
                  <div
                    className={`image-preview ${img.is_primary ? "border-primary border-2" : "border-1"} border-round p-1`}
                    onClick={() => handleSetPrimary(index)}
                    style={{ position: "relative", height: "150px", overflow: "hidden" }}
                  >
                    <img
                      src={img.image_url || "/placeholder.svg"}
                      alt={`Product ${index}`}
                      className="w-full h-full"
                      style={{ objectFit: "cover" }}
                    />
                    {img.is_primary && (
                      <div className="absolute top-0 right-0 bg-primary p-1 text-white border-round-bottom-left">
                        <i className="pi pi-check"></i> Chính
                      </div>
                    )}
                  </div>
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm mt-2"
                    onClick={() => {
                      const newImages = [...product.images]
                      newImages.splice(index, 1)
                      setProduct((prev) => ({ ...prev, images: newImages }))
                    }}
                  />
                </div>
              ))}
              <div className="col-6 md:col-4 lg:col-3 p-2">
                <div
                  className="image-upload-placeholder border-dashed border-round border-1 flex align-items-center justify-content-center flex-column"
                  onClick={() => setDisplayUrlDialog(true)}
                  style={{ height: "150px", cursor: "pointer" }}
                >
                  <i className="pi pi-link text-4xl mb-2"></i>
                  <span>Thêm từ URL</span>
                </div>
              </div>
              <div className="col-6 md:col-4 lg:col-3 p-2">
                <div
                  className="image-upload-placeholder border-dashed border-round border-1 flex align-items-center justify-content-center flex-column"
                  onClick={() => setDisplayDeviceDialog(true)}
                  style={{ height: "150px", cursor: "pointer" }}
                >
                  <i className="pi pi-upload text-4xl mb-2"></i>
                  <span>Thêm ảnh</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mb-3">
            <div className="flex justify-content-between align-items-center">
              <h3>Thông số kỹ thuật</h3>
              <Button
                label="Thêm thông số"
                icon="pi pi-plus"
                className="p-button-outlined p-button-success"
                onClick={() => setDisplaySpecDialog(true)}
              />
            </div>

            {product.category_id && categoryAttributes.filter((attr) => attr.is_required).length > 0 && (
              <div className="mt-2 mb-4">
                <Tag severity="info" icon="pi pi-info-circle">
                  Danh mục này yêu cầu các thông số kỹ thuật bắt buộc:{" "}
                  {categoryAttributes
                    .filter((attr) => attr.is_required)
                    .map((attr) => attr.type_name)
                    .join(", ")}
                </Tag>
              </div>
            )}

            {product.specifications.length > 0 ? (
              <DataTable value={product.specifications} className="p-datatable-sm mt-3" stripedRows>
                <Column field="spec_name" header="Tên thông số" />
                <Column field="spec_value" header="Giá trị" />
                <Column field="display_order" header="Thứ tự hiển thị" />
                <Column
                  body={(rowData, options) => (
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-danger p-button-sm"
                      onClick={() => {
                        const newSpecs = [...product.specifications]
                        newSpecs.splice(options.rowIndex, 1)
                        setProduct((prev) => ({ ...prev, specifications: newSpecs }))
                      }}
                    />
                  )}
                  style={{ width: "5rem", textAlign: "center" }}
                />
              </DataTable>
            ) : (
              <div className="text-center p-4 text-500">Chưa có thông số kỹ thuật nào</div>
            )}
          </Card>

          <Card className="mb-3">
            <h3>Biến thể sản phẩm</h3>
            <div className="field-checkbox mb-3">
              <Checkbox
                inputId="hasVariants"
                checked={product.hasVariants}
                onChange={(e) => onCheckboxChange(e, "hasVariants")}
              />
              <label htmlFor="hasVariants" className="ml-2 cursor-pointer">
                Sản phẩm này có nhiều biến thể (khác nhau về kích thước, màu sắc, v.v.)
              </label>
            </div>

            {product.hasVariants && (
              <>
                {product.category_id ? (
                  <>
                    <h4>Chọn thuộc tính biến thể</h4>
                    <div className="field mb-4">
                      <MultiSelect
                        value={selectedVariantAttributes.map((attr) => attr.attribute_type_id)}
                        options={attributeTypeOptions}
                        onChange={handleVariantAttributeSelect}
                        optionLabel="label"
                        placeholder="Chọn thuộc tính cho biến thể"
                        className="w-full"
                        filter
                        display="chip"
                      />
                      <small className="block mt-1 text-500">
                        Bạn có thể chọn một hoặc nhiều thuộc tính để tạo biến thể sản phẩm
                      </small>
                    </div>

                    {selectedVariantAttributes.length > 0 && (
                      <>
                        <h4>Chọn giá trị cho thuộc tính biến thể</h4>
                        {selectedVariantAttributes.map((attr) => (
                          <div key={attr.attribute_type_id} className="p-card p-3 mb-3">
                            <h5>{attr.type_name}</h5>
                            <div className="field">
                              <div className="mb-2">
                                {attr.values && attr.values.length > 0 ? (
                                  <>
                                    <Dropdown
                                      value={null}
                                      options={attr.values.map((val) => ({
                                        label: val.value_name,
                                        value: val.attribute_value_id,
                                      }))}
                                      onChange={(e) => {
                                        if (e.value) {
                                          const currentValues = selectedVariantValues[attr.attribute_type_id] || []
                                          if (!currentValues.includes(e.value)) {
                                            handleVariantValueSelect(attr.attribute_type_id, [
                                              ...currentValues,
                                              e.value,
                                            ])
                                          }
                                        }
                                      }}
                                      placeholder="Chọn giá trị thuộc tính"
                                      className="w-full"
                                      filter
                                    />

                                    {renderSelectedValues(attr.attribute_type_id)}
                                  </>
                                ) : (
                                  <div className="text-500 mb-2">Không có giá trị nào</div>
                                )}
                              </div>

                              <div className="p-inputgroup mt-3">
                                <InputText
                                  value={newVariantValue}
                                  onChange={(e) => setNewVariantValue(e.target.value)}
                                  placeholder="Thêm giá trị mới"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newVariantValue.trim()) {
                                      handleAddNewVariantValue(attr)
                                      e.preventDefault()
                                    }
                                  }}
                                />
                                <Button
                                  icon="pi pi-plus"
                                  onClick={() => {
                                    if (newVariantValue.trim()) {
                                      handleAddNewVariantValue(attr)
                                    }
                                  }}
                                  disabled={!newVariantValue.trim()}
                                  loading={loading}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          label="Tạo biến thể"
                          icon="pi pi-cog"
                          className="p-button-success"
                          onClick={handleShowVariantPreview}
                          disabled={!canGenerateVariants()}
                        />
                      </>
                    )}

                    {/* Dialog xem trước biến thể */}
                    <Dialog
                      header="Xác nhận biến thể"
                      visible={showVariantPreview}
                      style={{ width: "80%" }}
                      onHide={() => setShowVariantPreview(false)}
                      footer={
                        <div>
                          <Button
                            label="Hủy"
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setShowVariantPreview(false)}
                          />
                          <Button label="Tạo biến thể" icon="pi pi-check" onClick={generateVariants} />
                        </div>
                      }
                    >
                      <DataTable
                        value={previewVariants}
                        selection={selectedPreviewVariants}
                        onSelectionChange={(e) => setSelectedPreviewVariants(e.value)}
                        dataKey="id"
                        paginator
                        rows={10}
                        className="p-datatable-sm"
                      >
                        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }}></Column>
                        <Column field="name" header="Tên biến thể" />
                        {selectedVariantAttributes.map((attr) => (
                          <Column
                            key={attr.attribute_type_id}
                            field={`attr_${attr.attribute_type_id}`}
                            header={attr.type_name}
                          />
                        ))}
                      </DataTable>
                    </Dialog>

                    {/* Danh sách biến thể đã tạo */}
                    {productVariants.length > 0 && (
                      <div className="variants-container mt-4">
                        <h4>Danh sách biến thể</h4>
                        <DataTable
                          value={productVariants}
                          className="p-datatable-sm"
                          editMode="row"
                          dataKey="variant_id"
                          onRowEditComplete={(e) => {
                            const updatedVariants = [...productVariants]
                            updatedVariants[e.index] = e.newData
                            setProductVariants(updatedVariants)
                          }}
                          stripedRows
                        >
                          <Column field="name" header="Biến thể" />
                          <Column
                            field="variant_sku"
                            header="SKU"
                            editor={(options) => (
                              <InputText
                                value={options.value}
                                onChange={(e) => options.editorCallback(e.target.value)}
                              />
                            )}
                          />
                          <Column
                            field="price_adjustment"
                            header="Điều chỉnh giá"
                            editor={(options) => (
                              <InputNumber
                                value={options.value || 0}
                                onValueChange={(e) => options.editorCallback(e.value)}
                                mode="currency"
                                currency="VND"
                                locale="vi-VN"
                                minFractionDigits={0}
                              />
                            )}
                            body={(rowData) => {
                              const adjustment = rowData.price_adjustment || 0
                              return (
                                <span
                                  className={adjustment < 0 ? "text-red-500" : adjustment > 0 ? "text-green-500" : ""}
                                >
                                  {adjustment.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                </span>
                              )
                            }}
                          />
                          <Column
                            field="stock_quantity"
                            header="Tồn kho"
                            editor={(options) => (
                              <InputNumber
                                value={options.value || 0}
                                onValueChange={(e) => options.editorCallback(e.value)}
                                min={0}
                              />
                            )}
                          />
                          <Column
                            field="is_default"
                            header="Mặc định"
                            body={(rowData) => (
                              <InputSwitch
                                checked={rowData.is_default}
                                onChange={(e) => {
                                  const newVariants = productVariants.map((v) => ({
                                    ...v,
                                    is_default: v.variant_id === rowData.variant_id ? e.value : false,
                                  }))
                                  setProductVariants(newVariants)
                                }}
                              />
                            )}
                          />
                          <Column
                            rowEditor
                            headerStyle={{ width: "10%", minWidth: "8rem" }}
                            bodyStyle={{ textAlign: "center" }}
                          />
                          <Column
                            body={(rowData) => (
                              <Button
                                icon="pi pi-trash"
                                className="p-button-rounded p-button-danger p-button-sm"
                                onClick={() => handleRemoveVariant(rowData.variant_id)}
                              />
                            )}
                            style={{ width: "5rem", textAlign: "center" }}
                          />
                        </DataTable>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 text-500 border-dashed border-round border-1">
                    Vui lòng chọn danh mục sản phẩm trước
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-3 flex justify-content-end">
        <Button
          label="Hủy"
          icon="pi pi-times"
          className="p-button-outlined p-button-secondary mr-2"
          onClick={onCancel}
        />
        <Button
          label={isEditMode ? "Cập nhật" : "Lưu"}
          icon="pi pi-save"
          className="p-button-primary"
          onClick={handleSave}
          loading={loading}
        />
      </div>

      {/* Dialog cho thêm ảnh từ URL */}
      <Dialog
        header="Thêm hình ảnh từ URL"
        visible={displayUrlDialog}
        style={{ width: "450px" }}
        onHide={() => setDisplayUrlDialog(false)}
      >
        <div className="field">
          <label htmlFor="imageUrl" className="font-bold block mb-2">
            URL hình ảnh
          </label>
          <InputText
            id="imageUrl"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Nhập URL hình ảnh"
            className="w-full"
          />
        </div>
        <div className="flex justify-content-end mt-4">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text mr-2"
            onClick={() => setDisplayUrlDialog(false)}
          />
          <Button label="Thêm" icon="pi pi-check" className="p-button-text" onClick={handleAddUrlImage} />
        </div>
      </Dialog>

      {/* Dialog cho thêm ảnh từ thiết bị */}
      <Dialog
        header="Thêm hình ảnh từ thiết bị"
        visible={displayDeviceDialog}
        style={{ width: "500px" }}
        onHide={() => setDisplayDeviceDialog(false)}
      >
        <FileUpload
          name="files"
          customUpload
          uploadHandler={handleDeviceUpload}
          multiple
          accept="image/*"
          chooseLabel="Chọn ảnh"
          maxFileSize={5000000}
          emptyTemplate={<p className="m-0">Kéo và thả file ảnh vào đây để tải lên.</p>}
        />
        <div className="flex justify-content-end mt-4">
          <Button
            label="Đóng"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setDisplayDeviceDialog(false)}
          />
        </div>
      </Dialog>

      {/* Dialog cho thêm thông số kỹ thuật */}
      <Dialog
        header="Thêm thông số kỹ thuật"
        visible={displaySpecDialog}
        style={{ width: "450px" }}
        onHide={() => setDisplaySpecDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="spec_name" className="font-bold block mb-2">
            Tên thông số
          </label>
          {product.category_id && categoryAttributes.length > 0 ? (
            // Hiển thị dropdown với các thông số từ danh mục
            // Loại bỏ các thông số đã được thêm vào sản phẩm
            <Dropdown
              id="spec_name"
              value={specInput.spec_name}
              options={categoryAttributes
                .filter((attr) => !product.specifications.some((spec) => spec.spec_name === attr.type_name))
                .map((attr) => ({
                  label: attr.type_name + (attr.is_required ? " (Bắt buộc)" : ""),
                  value: attr.type_name,
                }))}
              onChange={onSpecNameChange}
              placeholder="Chọn thông số kỹ thuật"
              className="w-full"
              filter
              showClear
            />
          ) : (
            <InputText
              id="spec_name"
              value={specInput.spec_name}
              onChange={(e) => setSpecInput((prev) => ({ ...prev, spec_name: e.target.value }))}
              placeholder="Ví dụ: CPU, RAM, Độ phân giải..."
              className="w-full"
              autoFocus
            />
          )}
        </div>
        <div className="field mb-3">
          <label htmlFor="spec_value" className="font-bold block mb-2">
            Giá trị
          </label>
          {specValueOptions.length > 0 ? (
            <Dropdown
              id="spec_value"
              value={specInput.spec_value}
              options={specValueOptions}
              onChange={(e) => setSpecInput((prev) => ({ ...prev, spec_value: e.value }))}
              placeholder="Chọn giá trị"
              className="w-full"
              filter
              showClear
              editable={true} // Cho phép người dùng tự nhập giá trị
            />
          ) : (
            <InputText
              id="spec_value"
              value={specInput.spec_value}
              onChange={(e) => setSpecInput((prev) => ({ ...prev, spec_value: e.target.value }))}
              placeholder="Ví dụ: Intel Core i5, 8GB, Full HD..."
              className="w-full"
            />
          )}
        </div>
        <div className="field">
          <label htmlFor="display_order" className="font-bold block mb-2">
            Thứ tự hiển thị
          </label>
          <InputNumber
            id="display_order"
            value={specInput.display_order}
            onValueChange={(e) => setSpecInput((prev) => ({ ...prev, display_order: e.value || 0 }))}
            className="w-full"
            min={0}
          />
        </div>
        <div className="flex justify-content-end mt-4">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text mr-2"
            onClick={() => setDisplaySpecDialog(false)}
          />
          <Button label="Thêm" icon="pi pi-check" className="p-button-text" onClick={handleAddSpecification} />
        </div>
      </Dialog>

      {/* Dialog cho thêm thuộc tính biến thể */}
      <Dialog
        header="Thêm thuộc tính biến thể"
        visible={displayAttributeDialog}
        style={{ width: "500px" }}
        onHide={() => setDisplayAttributeDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="type_name" className="font-bold block mb-2">
            Tên thuộc tính
          </label>
          <InputText
            id="type_name"
            value={attributeInput.type_name}
            onChange={(e) => setAttributeInput((prev) => ({ ...prev, type_name: e.target.value }))}
            placeholder="Ví dụ: Màu sắc, Kích thước..."
            className="w-full"
            autoFocus
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="display_order" className="font-bold block mb-2">
            Thứ tự hiển thị
          </label>
          <InputNumber
            id="display_order"
            value={attributeInput.display_order}
            onValueChange={(e) => setAttributeInput((prev) => ({ ...prev, display_order: e.value || 0 }))}
            className="w-full"
            min={0}
          />
        </div>
        <div className="field mb-3">
          <label className="font-bold block mb-2">Giá trị thuộc tính</label>
          <div className="p-inputgroup">
            <InputText
              value={newAttributeValue}
              onChange={(e) => setNewAttributeValue(e.target.value)}
              placeholder="Ví dụ: Đen, XL, 256GB..."
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAttributeValue.trim()) {
                  setAttributeInput((prev) => ({
                    ...prev,
                    values: [...prev.values, newAttributeValue.trim()],
                  }))
                  setNewAttributeValue("")
                  e.preventDefault()
                }
              }}
            />
            <Button
              icon="pi pi-plus"
              onClick={() => {
                if (newAttributeValue.trim()) {
                  setAttributeInput((prev) => ({
                    ...prev,
                    values: [...prev.values, newAttributeValue.trim()],
                  }))
                  setNewAttributeValue("")
                }
              }}
            />
          </div>
          <small className="text-500">Nhấn Enter hoặc nhấn nút + để thêm giá trị</small>
        </div>
        <div className="attribute-values-list">
          <h5>Danh sách giá trị</h5>
          {attributeInput.values.length > 0 ? (
            <div className="border-1 border-round p-3">
              <div className="flex flex-wrap gap-2">
                {attributeInput.values.map((value, index) => (
                  <div key={index} className="flex align-items-center p-2 border-1 border-round mr-2 mb-2">
                    <span>{value}</span>
                    <Button
                      icon="pi pi-times"
                      className="p-button-text p-button-rounded p-button-danger p-button-sm ml-2"
                      onClick={() => {
                        const newValues = [...attributeInput.values]
                        newValues.splice(index, 1)
                        setAttributeInput((prev) => ({ ...prev, values: newValues }))
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-3 text-500 border-dashed border-round border-1">
              Chưa có giá trị nào được thêm
            </div>
          )}
        </div>
        <div className="flex justify-content-end mt-4">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text mr-2"
            onClick={() => setDisplayAttributeDialog(false)}
          />
          <Button
            label="Lưu"
            icon="pi pi-check"
            className="p-button-text"
            onClick={handleSaveAttribute}
            loading={loading}
          />
        </div>
      </Dialog>

      {/* Dialog cho thêm giá trị thuộc tính vào một thuộc tính đã có */}
      <Dialog
        header={`Thêm giá trị cho ${currentAttributeType?.type_name || "thuộc tính"}`}
        visible={displayAttributeValueDialog}
        style={{ width: "450px" }}
        onHide={() => setDisplayAttributeValueDialog(false)}
      >
        <div className="field mb-3">
          <label className="font-bold block mb-2">Giá trị mới</label>
          <div className="p-inputgroup">
            <InputText
              value={newAttributeValue}
              onChange={(e) => setNewAttributeValue(e.target.value)}
              placeholder="Nhập giá trị thuộc tính"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAttributeValue.trim()) {
                  handleAddAttributeValue()
                  e.preventDefault()
                }
              }}
            />
            <Button icon="pi pi-plus" onClick={handleAddAttributeValue} loading={loading} />
          </div>
        </div>
        <div className="attribute-values-list">
          <h5>Giá trị hiện có</h5>
          {currentAttributeType && currentAttributeType.values && currentAttributeType.values.length > 0 ? (
            <div className="border-1 border-round p-3">
              <div className="flex flex-wrap gap-2">
                {currentAttributeType.values.map((value) => (
                  <Tag key={value.attribute_value_id} value={value.value_name} rounded className="mr-2 mb-2" />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-3 text-500 border-dashed border-round border-1">
              Chưa có giá trị nào cho thuộc tính này
            </div>
          )}
        </div>
        <div className="flex justify-content-end mt-4">
          <Button
            label="Đóng"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setDisplayAttributeValueDialog(false)}
          />
        </div>
      </Dialog>

      {/* Dialog cho chọn ảnh cho biến thể */}
      <Dialog
        header="Chọn ảnh cho biến thể"
        visible={displayVariantImageDialog}
        style={{ width: "600px" }}
        onHide={() => setDisplayVariantImageDialog(false)}
      >
        <div className="variant-image-selector">
          <h5>Chọn từ ảnh sản phẩm</h5>
          <div className="flex flex-wrap gap-2">
            {product.images.map((img, index) => (
              <div
                key={index}
                className="border-1 border-round p-1 cursor-pointer"
                style={{ width: "120px", height: "120px" }}
                onClick={() => handleSelectVariantImage(img.image_url)}
              >
                <img
                  src={img.image_url || "/placeholder.svg"}
                  alt={`Product ${index}`}
                  className="w-full h-full"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>

          <h5 className="mt-4">Hoặc thêm ảnh mới</h5>
          <div className="p-inputgroup">
            <InputText
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Nhập URL hình ảnh"
              className="w-full"
            />
            <Button
              icon="pi pi-check"
              onClick={() => {
                if (urlInput.trim()) {
                  handleSelectVariantImage(urlInput.trim())
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-content-end mt-4">
          <Button
            label="Đóng"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setDisplayVariantImageDialog(false)}
          />
        </div>
      </Dialog>
    </div>
  )
}

export default ProductForm

