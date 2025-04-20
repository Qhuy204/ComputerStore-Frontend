import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { AutoComplete } from 'primereact/autocomplete';
import productsService from '../Services/productsService';
import usersService from '../Services/usersService';
import paymentmethodService from '../Services/paymentMethodService';
import addressService from '../Services/addressService';
import ordersService from '../Services/ordersService';
import orderItemsService from '../Services/orderItemsService';

// AddressDialog Component
const AddressDialog = ({
  visible,
  onHide,
  editingAddress,
  setEditingAddress,
  onSave,
  isEditing,
}) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: "600px" }}
      modal
      onHide={onHide}
      header={isEditing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button
            label="Hủy"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onHide}
          />
          <Button label="Lưu" icon="pi pi-check" onClick={onSave} />
        </div>
      }
    >
      <div className="p-fluid grid formgrid">
        <div className="field col-12 md:col-6">
          <label htmlFor="recipientName" className="font-medium mb-2 block">
            Tên người nhận *
          </label>
          <InputText
            id="recipientName"
            value={editingAddress?.recipient_name || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, recipient_name: e.target.value })}
            className="w-full"
            required
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="phoneNumber" className="font-medium mb-2 block">
            Số điện thoại *
          </label>
          <InputText
            id="phoneNumber"
            value={editingAddress?.phone_number || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, phone_number: e.target.value })}
            className="w-full"
            required
          />
        </div>
        <div className="field col-12">
          <label htmlFor="address" className="font-medium mb-2 block">
            Địa chỉ chi tiết *
          </label>
          <InputTextarea
            id="address"
            autoResize
            rows={2}
            value={editingAddress?.address || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
            className="w-full"
            required
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="city" className="font-medium mb-2 block">
            Thành phố *
          </label>
          <InputText
            id="city"
            value={editingAddress?.city || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
            className="w-full"
            required
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="province" className="font-medium mb-2 block">
            Tỉnh *
          </label>
          <InputText
            id="province"
            value={editingAddress?.province || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, province: e.target.value })}
            className="w-full"
            required
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="district" className="font-medium mb-2 block">
            Quận/Huyện
          </label>
          <InputText
            id="district"
            value={editingAddress?.district || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, district: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="country" className="font-medium mb-2 block">
            Quốc gia *
          </label>
          <InputText
            id="country"
            value={editingAddress?.country || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })}
            className="w-full"
            required
          />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="addressType" className="font-medium mb-2 block">
            Loại địa chỉ
          </label>
          <InputText
            id="addressType"
            value={editingAddress?.address_type || ""}
            onChange={(e) => setEditingAddress({ ...editingAddress, address_type: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="field col-12 md:col-6 flex align-items-center">
          <div className="p-field-checkbox">
            <input
              type="checkbox"
              id="isDefault"
              checked={editingAddress?.is_default}
              onChange={(e) => setEditingAddress({ ...editingAddress, is_default: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isDefault">Đặt làm địa chỉ mặc định</label>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

function App() {
  const [orderDetails, setOrderDetails] = useState({
    user_id: null,
    guest_email: '',
    guest_phone: '',
    guest_name: '',
    total_amount: 0,
    shipping_address: '',
    payment_method_id: null,
    payment_status: 'Pending',
    note: ''
  });

  // Address components
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressDetails, setAddressDetails] = useState({
    province: null,
    district: null,
    ward: null,
    streetAddress: ''
  });
  
  // User addresses
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedUserAddress, setSelectedUserAddress] = useState(null);
  const [addressDialogVisible, setAddressDialogVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [products, setProducts] = useState([]);
  const [expandedRows, setExpandedRows] = useState(null);
  const [tempSelectedProducts, setTempSelectedProducts] = useState([]);
  const [tempSelectedVariants, setTempSelectedVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDisplayText, setCustomerDisplayText] = useState('');
  
  const dt = useRef(null);
  const toast = useRef(null);

  // Payment status options
  const paymentStatusOptions = [
    { label: 'Chờ thanh toán', value: 'Pending' },
    { label: 'Đã thanh toán', value: 'Completed' },
    { label: 'Thanh toán thất bại', value: 'Failed' }
  ];

  // Fetch customers data
  const fetchCustomers = async () => {
    try {
      const data = await usersService.getAll();
      const formattedCustomers = data.map(user => ({
        user_id: user.user_id,
        name: user.full_name || `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone_number || user.phone
      }));
      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.current.show({ 
        severity: 'error', 
        summary: 'Lỗi', 
        detail: 'Không thể tải danh sách khách hàng', 
        life: 3000 
      });
    }
  };
  
  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const data = await paymentmethodService.getAll();
      setPaymentMethods(data.map(method => ({
        payment_method_id: method.payment_method_id,
        name: method.payment_method_name,
        description: method.description
      })));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.current.show({ 
        severity: 'error', 
        summary: 'Lỗi', 
        detail: 'Không thể tải phương thức thanh toán', 
        life: 3000 
      });
    }
  };

  // Fetch user addresses
  const fetchUserAddresses = async (userId) => {
    try {
      const addresses = await addressService.getById(userId);
      setUserAddresses(addresses);
      
      // Find default address if exists
      const defaultAddress = addresses.find(addr => addr.is_default === 1);
      if (defaultAddress) {
        setSelectedUserAddress(defaultAddress);
        
        // Update address details with default address
        updateAddressFromUserAddress(defaultAddress);
        
        // Update name and phone from the selected address
        setOrderDetails(prev => ({
          ...prev,
          guest_name: defaultAddress.recipient_name,
          guest_phone: defaultAddress.phone_number
          // Do not update email - it comes from customer data
        }));
      }
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      toast.current.show({ 
        severity: 'error', 
        summary: 'Lỗi', 
        detail: 'Không thể tải địa chỉ của khách hàng', 
        life: 3000 
      });
    }
  };
  
  // Update address details from user address
  const updateAddressFromUserAddress = (address) => {
    if (!address) return;
    
    // Set the combined address directly
    const fullAddress = `${address.address}, ${address.district}, ${address.province}, ${address.country}`;
    setOrderDetails(prev => ({
      ...prev,
      shipping_address: fullAddress
    }));
  };

  // Fetch products data
  const fetchProducts = async () => {
    try {
      const data = await productsService.getAllVariant();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.current.show({ 
        severity: 'error', 
        summary: 'Lỗi', 
        detail: 'Không thể tải danh sách sản phẩm', 
        life: 3000 
      });
    }
  };

  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      const response = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');
      const data = await response.json();
      
      if (data.error === 0 && data.data) {
        const formattedProvinces = data.data.map(province => ({
          value: province.id,
          label: province.full_name
        }));
        setProvinces(formattedProvinces);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  // Fetch districts based on selected province
  const fetchDistricts = async (provinceId) => {
    try {
      const response = await fetch(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
      const data = await response.json();
      
      if (data.error === 0 && data.data) {
        const formattedDistricts = data.data.map(district => ({
          value: district.id,
          label: district.full_name
        }));
        setDistricts(formattedDistricts);
        setWards([]); // Reset wards when province changes
        setAddressDetails(prev => ({ ...prev, district: null, ward: null }));
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Fetch wards based on selected district
  const fetchWards = async (districtId) => {
    try {
      const response = await fetch(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
      const data = await response.json();
      
      if (data.error === 0 && data.data) {
        const formattedWards = data.data.map(ward => ({
          value: ward.id,
          label: ward.full_name
        }));
        setWards(formattedWards);
        setAddressDetails(prev => ({ ...prev, ward: null }));
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  // Update the combined shipping address whenever address components change
  useEffect(() => {
    const province = provinces.find(p => p.value === addressDetails.province)?.label || '';
    const district = districts.find(d => d.value === addressDetails.district)?.label || '';
    const ward = wards.find(w => w.value === addressDetails.ward)?.label || '';
    const street = addressDetails.streetAddress || '';
    
    if (province && district && ward && street) {
      const fullAddress = `${street}, ${ward}, ${district}, ${province}`;
      setOrderDetails(prev => ({
        ...prev,
        shipping_address: fullAddress
      }));
    }
  }, [addressDetails, provinces, districts, wards]);

  useEffect(() => {
    setIsClient(true);
    fetchProducts();
    fetchCustomers();
    fetchPaymentMethods();
    fetchProvinces();
  }, []);

  // Calculate total amount from selected variants
  useEffect(() => {
    const variantTotal = selectedVariants.reduce((sum, variant) => {
      const quantity = variant.quantity || 1;
      const price = parseFloat(variant.final_price) || 0;
      return sum + (price * quantity);
    }, 0);
    
    setOrderDetails(prev => ({
      ...prev,
      total_amount: variantTotal
    }));
  }, [selectedVariants]);

  // Open product dialog
  const openProductDialog = () => {
    // Reset temporary selections but keep them in sync with the current state
    setTempSelectedProducts([]);
    setTempSelectedVariants([...selectedVariants]);
    setShowDialog(true);
  };

  // Handle dialog hide
  const handleDialogHide = () => {
    // Reset temporary selections
    setTempSelectedProducts([]);
    setTempSelectedVariants([]);
    setShowDialog(false);
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerDisplayText('');
    setOrderDetails({
      ...orderDetails,
      user_id: null,
      guest_name: '',
      guest_email: '',
      guest_phone: ''
    });
    setUserAddresses([]);
    setSelectedUserAddress(null);
  };

  // Open address dialog for adding new address
  const handleAddNewAddress = () => {
    setEditingAddress({
      recipient_name: '',
      phone_number: '',
      address: '',
      city: '',
      province: '',
      district: '',
      country: 'Việt Nam',
      address_type: 'Nhà riêng',
      is_default: false,
      user_id: orderDetails.user_id
    });
    setAddressDialogVisible(true);
  };

  // Open address dialog for editing existing address
  const handleEditAddress = (address) => {
    setEditingAddress({
      ...address,
      is_default: address.is_default === 1
    });
    setAddressDialogVisible(true);
  };

  // Save address (add new or update existing)
  const handleSaveAddress = async () => {
    try {
      // Validate required fields
      if (
        !editingAddress.recipient_name ||
        !editingAddress.phone_number ||
        !editingAddress.address ||
        !editingAddress.city ||
        !editingAddress.province ||
        !editingAddress.country
      ) {
        toast.current.show({
          severity: 'warn',
          summary: 'Thiếu thông tin',
          detail: 'Vui lòng điền đầy đủ thông tin địa chỉ',
          life: 3000
        });
        return;
      }

      // Prepare address data - convert boolean to 0/1
      const addressData = {
        user_id: orderDetails.user_id,
        recipient_name: editingAddress.recipient_name,
        phone_number: editingAddress.phone_number,
        address: editingAddress.address,
        city: editingAddress.city,
        province: editingAddress.province,
        district: editingAddress.district || '',
        country: editingAddress.country,
        address_type: editingAddress.address_type || 'Nhà riêng',
        is_default: editingAddress.is_default ? 1 : 0 // Convert boolean to 0/1
      };

      // If setting this address as default, update other addresses first
      if (addressData.is_default === 1) {
        const updatePromises = userAddresses.map(addr => {
          // Skip the current address being edited
          if (editingAddress.address_id && addr.address_id === editingAddress.address_id) {
            return Promise.resolve();
          }
          return addressService.update({
            address_id: addr.address_id,
            is_default: 0
          });
        });
        
        await Promise.all(updatePromises);
      }

      // Update or insert address
      if (editingAddress.address_id) {
        addressData.address_id = editingAddress.address_id;
        await addressService.update(addressData);
      } else {
        await addressService.insert(addressData);
      }

      // Refresh addresses list
      await fetchUserAddresses(orderDetails.user_id);

      toast.current.show({
        severity: 'success',
        summary: 'Thành công',
        detail: editingAddress.address_id ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ mới thành công',
        life: 3000
      });

      // Close dialog
      setAddressDialogVisible(false);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu địa chỉ',
        life: 3000
      });
    }
  };

  const addSelectedProducts = () => {
    try {
      const selectedProductRows = tempSelectedProducts || [];
      
      // Bắt đầu với các biến thể đã được chọn trong các hàng đã mở rộng
      let newVariantsToAdd = [...tempSelectedVariants]; 
      
      // Xử lý các sản phẩm được chọn để thêm tất cả các biến thể của chúng
      selectedProductRows.forEach(product => {
        // Nếu sản phẩm có biến thể, thêm tất cả các biến thể khả dụng
        if (product.variants && product.variants.length > 0) {
          // Lọc ra các biến thể của sản phẩm này có thể đã có trong lựa chọn tạm thời
          const existingVariantsOfThisProduct = newVariantsToAdd.filter(v => v.product_id === product.product_id);
          const existingVariantIds = new Set(existingVariantsOfThisProduct.map(v => v.variant_id));
          
          // Chỉ thêm các biến thể chưa có trong danh sách tạm thời
          const productVariants = product.variants
            .filter(variant => 
              variant.stock_quantity > 0 && // Chỉ thêm biến thể có tồn kho
              !existingVariantIds.has(variant.variant_id) // Và chưa tồn tại trong danh sách tạm thời
            )
            .map(variant => ({
              ...variant,
              product_id: product.product_id,
              product_name: product.product_name,
              product_image: variant.variant_image || product.primary_image_url,
              quantity: 1,
              brand_name: product.brand_name,
              category_name: product.category_name
            }));
          
          if (productVariants.length === 0 && existingVariantsOfThisProduct.length === 0) {
            toast.current.show({
              severity: 'warn',
              summary: 'Cảnh báo',
              detail: `Sản phẩm "${product.product_name}" hiện đang hết hàng`,
              life: 3000
            });
          } else {
            newVariantsToAdd = [...newVariantsToAdd, ...productVariants];
          }
        } else {
          // Sản phẩm không có biến thể, thêm chính sản phẩm đó nếu có tồn kho
          if ((product.stock_quantity || 0) > 0) {
            // Kiểm tra xem sản phẩm này đã có trong danh sách chưa
            const existingIndex = newVariantsToAdd.findIndex(v => 
              v.is_single_product && v.product_id === product.product_id
            );
            
            // Nếu chưa có trong danh sách, thêm nó vào
            if (existingIndex === -1) {
              newVariantsToAdd.push({
                variant_id: product.product_id, // Sử dụng product_id làm variant_id nếu không có biến thể
                product_id: product.product_id,
                product_name: product.product_name,
                product_image: product.primary_image_url,
                final_price: product.base_price,
                stock_quantity: product.stock_quantity || 0,
                quantity: 1,
                brand_name: product.brand_name,
                category_name: product.category_name,
                is_single_product: true // Cờ để chỉ ra đây là sản phẩm không có biến thể
              });
            }
          } else {
            toast.current.show({
              severity: 'warn',
              summary: 'Cảnh báo',
              detail: `Sản phẩm "${product.product_name}" hiện đang hết hàng`,
              life: 3000
            });
          }
        }
      });
      
      // Đảm bảo không thêm trùng lặp khi hợp nhất với lựa chọn hiện có
      const existingVariantIds = new Set(selectedVariants.map(v => v.variant_id));
      const filteredNewVariants = newVariantsToAdd.filter(v => !existingVariantIds.has(v.variant_id));
      
      // Hợp nhất với lựa chọn hiện có
      const updatedVariants = [...selectedVariants, ...filteredNewVariants];
      
      // Cập nhật biến thể đã chọn chính
      setSelectedVariants(updatedVariants);
      
      if (filteredNewVariants.length > 0) {
        toast.current.show({ 
          severity: 'success', 
          summary: 'Thành công', 
          detail: `Đã thêm ${filteredNewVariants.length} sản phẩm vào đơn hàng`, 
          life: 3000 
        });
      } else if (selectedProductRows.length > 0 && filteredNewVariants.length === 0) {
        toast.current.show({ 
          severity: 'info', 
          summary: 'Thông báo', 
          detail: 'Các sản phẩm đã được thêm vào đơn hàng từ trước', 
          life: 3000 
        });
      }
      
      // Đặt lại lựa chọn tạm thời và đóng hộp thoại
      setTempSelectedProducts([]);
      setTempSelectedVariants([]);
      setShowDialog(false);
      
    } catch (error) {
      console.error('Error adding products:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Đã xảy ra lỗi khi thêm sản phẩm',
        life: 3000
      });
    }
  };

  // Delete a variant from selected variants
  const deleteVariant = (variantId) => {
    setSelectedVariants(selectedVariants.filter(variant => variant.variant_id !== variantId));
    
    toast.current.show({ 
      severity: 'info', 
      summary: 'Đã xóa', 
      detail: 'Sản phẩm đã được xóa khỏi đơn hàng', 
      life: 3000 
    });
  };

  // Update variant quantity
  const updateVariantQuantity = (variantId, newQuantity) => {
    if (!newQuantity || newQuantity <= 0) newQuantity = 1;
    
    setSelectedVariants(selectedVariants.map(variant => 
      variant.variant_id === variantId 
        ? { ...variant, quantity: newQuantity } 
        : variant
    ));
  };

  // Image template for products
  const imageBodyTemplate = (data) => {
    if (!data) return <span>Không có ảnh</span>;
    
    // Find the default variant's image
    let imageUrl = '';
    if (data.variants && data.variants.length > 0) {
      const defaultVariant = data.variants.find(v => v.is_default === 1);
      if (defaultVariant) {
        imageUrl = defaultVariant.variant_image;
      } else {
        imageUrl = data.variants[0].variant_image;
      }
    }
    
    // Fallback to primary_image_url if no variant image is found
    if (!imageUrl) {
      imageUrl = data.primary_image_url;
    }
    
    if (!imageUrl) return <span>Không có ảnh</span>;
    
    return (
      <img 
        src={imageUrl} 
        alt={data.product_name || 'Product image'}
        className="product-image" 
        style={{ width: '50px', height: '50px', objectFit: 'contain' }} 
      />
    );
  };

  // Image template for variants
  const variantImageTemplate = (data) => {
    if (!data) return <span>Không có ảnh</span>;
    
    const imageUrl = data.product_image || data.variant_image;
    if (!imageUrl) return <span>Không có ảnh</span>;
    
    return (
      <img 
        src={imageUrl} 
        alt={data.product_name || 'Variant image'} 
        className="product-image" 
        style={{ width: '50px', height: '50px', objectFit: 'contain' }} 
      />
    );
  };

  // Stock template for products
  const stockTemplate = (rowData) => {
    if (!rowData) return null;
    
    // If it's a product with variants, sum up the stock of all variants
    if (rowData.variants && rowData.variants.length > 0) {
      const totalStock = rowData.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      return (
        <Tag 
          value={totalStock} 
          severity={totalStock > 10 ? 'success' : totalStock > 0 ? 'warning' : 'danger'}
        />
      );
    }
    
    // Otherwise, show the product's stock
    const stock = rowData.stock_quantity || 0;
    return (
      <Tag 
        value={stock} 
        severity={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'danger'}
      />
    );
  };

  // Stock template for variants
  const variantStockTemplate = (rowData) => {
    if (!rowData) return null;
    
    const stock = rowData.stock_quantity || 0;
    return (
      <Tag 
        value={stock} 
        severity={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'danger'}
      />
    );
  };

  // Quantity input template
  const quantityBodyTemplate = (rowData) => {
    if (!rowData) return null;
    
    return (
      <InputNumber 
        value={rowData.quantity || 1} 
        onValueChange={(e) => updateVariantQuantity(rowData.variant_id, e.value)} 
        showButtons 
        buttonLayout="horizontal"
        min={1}
        max={rowData.stock_quantity || 999}
        style={{ width: '7rem' }}
        inputStyle={{ width: '3rem', textAlign: 'center' }}
      />
    );
  };

  // Price calculation template
  const priceBodyTemplate = (rowData) => {
    if (!rowData) return null;
    
    const quantity = rowData.quantity || 1;
    const price = parseFloat(rowData.final_price) || 0;
    const totalPrice = price * quantity;
    
    return (
      <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
    );
  };

  // Variant price template
  const variantPriceTemplate = (rowData) => {
    if (!rowData || !rowData.final_price) {
      return <span>0 đ</span>;
    }
    
    return <span>{parseFloat(rowData.final_price).toLocaleString('vi-VN')} đ</span>;
  };

  // Product price template
  const productPriceTemplate = (rowData) => {
    if (!rowData || !rowData.base_price) {
      return <span>0 đ</span>;
    }
    
    return <span>{parseFloat(rowData.base_price).toLocaleString('vi-VN')} đ</span>;
  };

// Action template for deleting variants
const actionBodyTemplate = (rowData) => {
  return (
    <Button 
      icon="pi pi-trash" 
      className="p-button-rounded p-button-danger p-button-text" 
      onClick={() => deleteVariant(rowData.variant_id)} 
      tooltip="Xóa sản phẩm" 
    />
  );
};

// Variant name template
const variantNameTemplate = (rowData) => {
  if (!rowData || !rowData.variant_attributes) return rowData.product_name || '';
  
  const attributeString = Object.entries(rowData.variant_attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  return (
    <div>
      <div className="font-bold">{rowData.product_name}</div>
      <div className="text-sm">{attributeString}</div>
    </div>
  );
};

// Customer search method
const searchCustomer = (event) => {
  try {
    const query = typeof event?.query === 'string' ? event.query.toLowerCase() : '';
    
    if (!Array.isArray(customers)) {
      setFilteredCustomers([]);
      return;
    }

    const filtered = customers.filter(customer =>
      (customer.name && customer.name.toLowerCase().includes(query)) ||
      (customer.email && customer.email.toLowerCase().includes(query)) ||
      (customer.phone && customer.phone.includes(query))
    );

    setFilteredCustomers(filtered);
  } catch (error) {
    console.error('Error in searchCustomer:', error);
    setFilteredCustomers([]);
  }
};

// Customer selection method
const onCustomerSelect = (e) => {
  if (!e.value) return;
  
  const customer = e.value;
  setSelectedCustomer(customer);
  setCustomerDisplayText(`${customer.name} - ${customer.phone || ''}`);
  
  setOrderDetails({
    ...orderDetails,
    user_id: customer.user_id,
    guest_email: customer.email 
  });
  
  // Fetch user addresses
  fetchUserAddresses(customer.user_id);
};

// Check if customer is selected from the system
const isRegisteredCustomer = orderDetails.user_id !== null;

// Customer template for items in dropdown
const customerItemTemplate = (option) => {
  if (!option) return null;
  
  return (
    <div className="flex align-items-center">
      <i className="pi pi-user mr-2" />
      <div>{option.name} {option.phone ? `- ${option.phone}` : ''}</div>
    </div>
  );
};

// User address selection handler
const handleAddressSelect = (address) => {
  setSelectedUserAddress(address);
  updateAddressFromUserAddress(address);
  
  // Update name and phone from the selected address, but keep email from customer
  setOrderDetails(prev => ({
    ...prev,
    guest_name: address.recipient_name,
    guest_phone: address.phone_number
    // Keep email unchanged
  }));
};

// Row expansion template for products with variants
const rowExpansionTemplate = (data) => {
  if (!data.variants || data.variants.length === 0) {
    return <div className="p-3">Sản phẩm này không có biến thể.</div>;
  }
  
  // Find which variants of this product are already selected in the temporary selection
  const selectedVariantIds = new Set(
    tempSelectedVariants
      .filter(sv => sv.product_id === data.product_id)
      .map(sv => sv.variant_id)
  );
  
  // Check if all variants of this product are selected
  const allVariantsSelected = data.variants.length > 0 && 
    data.variants.every(v => selectedVariantIds.has(v.variant_id));
  
  // If all variants are selected, make sure the product is selected too
  if (allVariantsSelected && !tempSelectedProducts.some(p => p.product_id === data.product_id)) {
    setTempSelectedProducts([...tempSelectedProducts, data]);
  }
  
  // Pre-select variants that are already in the temporary selected list
  const preSelectedVariants = data.variants.filter(v => 
    selectedVariantIds.has(v.variant_id)
  );
  
  return (
    <div className="p-3">
      <h5>Biến thể của sản phẩm</h5>
      <DataTable 
        value={data.variants} 
        selectionMode="multiple"
        selection={preSelectedVariants}
        onSelectionChange={e => {
          // Update temporary selected variants
          // Remove all variants of this product
          const updatedTempVariants = tempSelectedVariants.filter(v => v.product_id !== data.product_id);
          
          // Add the newly selected variants
          const newVariants = e.value.map(variant => ({
            ...variant,
            product_id: data.product_id,
            product_name: data.product_name,
            product_image: variant.variant_image || data.primary_image_url,
            quantity: 1,
            brand_name: data.brand_name,
            category_name: data.category_name
          }));
          
          // Update temporary selections
          setTempSelectedVariants([...updatedTempVariants, ...newVariants]);
          
          // If all variants are selected, select the product too
          if (e.value.length === data.variants.length && data.variants.length > 0) {
            if (!tempSelectedProducts.some(p => p.product_id === data.product_id)) {
              setTempSelectedProducts([...tempSelectedProducts, data]);
            }
          } else {
            // If not all variants are selected, unselect the product
            setTempSelectedProducts(tempSelectedProducts.filter(p => p.product_id !== data.product_id));
          }
        }}
        dataKey="variant_id"
        responsiveLayout="scroll"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column field="variant_sku" header="Mã SKU" style={{ width: '10rem' }}></Column>
        <Column header="Thuộc tính" body={(rowData) => {
          if (!rowData.variant_attributes) return '';
          return Object.entries(rowData.variant_attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        }}></Column>
        <Column field="stock_quantity" header="Tồn kho" body={variantStockTemplate} style={{ width: '7rem' }}></Column>
        <Column field="final_price" header="Giá" body={variantPriceTemplate} style={{ width: '8rem' }}></Column>
      </DataTable>
    </div>
  );
};

// Header for product selection dialog
const header = (
  <div className="flex justify-content-between align-items-center">
    <h5 className="m-0">Danh sách sản phẩm</h5>
    <span className="p-input-icon-left">
      <i className="pi pi-search" />
      <InputText 
        value={globalFilter} 
        onChange={(e) => setGlobalFilter(e.target.value)} 
        placeholder="Tìm kiếm..." 
      />
    </span>
  </div>
);

// Dialog footer for product selection
const dialogFooter = (
  <div>
    <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={() => setShowDialog(false)} />
    <Button 
      label="Thêm sản phẩm" 
      icon="pi pi-check" 
      onClick={addSelectedProducts}
    />
  </div>
);

// Create order method 
const createOrder = async () => {
  // Validate required fields
  if (!orderDetails.shipping_address) {
    toast.current.show({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng nhập địa chỉ giao hàng',
      life: 3000
    });
    return;
  }

  if (!orderDetails.payment_method_id) {
    toast.current.show({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng chọn phương thức thanh toán',
      life: 3000
    });
    return;
  }

  if (selectedVariants.length === 0) {
    toast.current.show({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng chọn ít nhất một sản phẩm',
      life: 3000
    });
    return;
  }

  try {
    // Prepare order data (exclude order_items since they're stored separately)
    const orderData = {
      user_id: orderDetails.user_id,
      guest_email: orderDetails.guest_email,
      guest_phone: orderDetails.guest_phone,
      guest_name: orderDetails.guest_name,
      total_amount: orderDetails.total_amount,
      shipping_address: orderDetails.shipping_address,
      payment_method_id: orderDetails.payment_method_id,
      payment_status: orderDetails.payment_status,
      note: orderDetails.note
    };

    // Insert order
    await ordersService.insert(orderData);
    
    // Get all orders to find the latest one
    const allOrders = await ordersService.getAll();
    
    // Sort orders by ID in descending order to get the most recent one
    const sortedOrders = allOrders.sort((a, b) => {
      const idA = parseInt(a.order_id);
      const idB = parseInt(b.order_id);
      return idB - idA; // Sort in descending order
    });
    
    // Get the latest order ID
    const latestOrder = sortedOrders[0];
    
    if (!latestOrder || !latestOrder.order_id) {
      throw new Error('Cannot determine the latest order ID');
    }
    
    const orderId = latestOrder.order_id;
    console.log('Using latest order ID:', orderId);

    // Insert order items one by one using a for loop instead of Promise.all
    // This ensures each insert completes before starting the next one
    for (let i = 0; i < selectedVariants.length; i++) {
      const variant = selectedVariants[i];
      const orderItemData = {
        order_id: orderId,
        product_id: variant.product_id,
        variant_id: variant.variant_id,
        variant_sku: variant.variant_sku || '',
        quantity: variant.quantity || 1,
        price_at_time: variant.final_price || 0
      };
      
      // Wait for each insert to complete before continuing
      await orderItemsService.insert(orderItemData);
      console.log(`Added item ${i+1}/${selectedVariants.length}: Product ID ${variant.product_id}, Variant ID ${variant.variant_id}`);
    }

    // Show success message
    toast.current.show({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Đơn hàng đã được tạo thành công', 
      life: 3000 
    });

    // Reset the form after successful order creation
    setSelectedVariants([]);
    setOrderDetails({
      user_id: null,
      guest_email: '',
      guest_phone: '',
      guest_name: '',
      total_amount: 0,
      shipping_address: '',
      payment_method_id: null,
      payment_status: 'Pending',
      note: ''
    });
    setSelectedCustomer(null);
    setCustomerDisplayText('');
    setUserAddresses([]);
    setSelectedUserAddress(null);
    
    // Optional: Redirect to orders page
    // window.location.href = '/orders';
  } catch (error) {
    console.error('Error creating order:', error);
    toast.current.show({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: 'Không thể tạo đơn hàng. Vui lòng thử lại sau.', 
      life: 3000 
    });
  }
};

return (
  <div className="card">
    <Toast ref={toast} />
    
    <Card title="Tạo đơn hàng" className="mb-3">
      <div className="grid">
        {/* Customer Information Section */}
        <div className="col-12">
          <h5>Thông tin khách hàng</h5>
        </div>

        <div className="col-12 md:col-6 mb-3">
          <div className="p-inputgroup">
            <AutoComplete 
              value={customerDisplayText}
              suggestions={filteredCustomers} 
              completeMethod={searchCustomer}
              field="name"
              dropdown
              forceSelection
              onChange={(e) => {
                if (typeof e.value === 'string') {
                  setCustomerDisplayText(e.value);
                  searchCustomer({ query: e.value });
                }}}
              onSelect={onCustomerSelect}
              itemTemplate={customerItemTemplate}
              placeholder="Tìm kiếm khách hàng"
              className="w-full"
            />
            <Button
              icon="pi pi-times"
              className="p-button-danger"
              onClick={clearCustomerSelection}
              tooltip="Xóa khách hàng đã chọn"
            />
          </div>
        </div>

        <div className="col-12 md:col-6 mb-3">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <InputText
              value={orderDetails.guest_name}
              onChange={(e) => setOrderDetails({ ...orderDetails, guest_name: e.target.value })}
              placeholder="Tên khách hàng"
              className="w-full"
              disabled={isRegisteredCustomer}
            />
          </div>
        </div>

        <div className="col-12 md:col-6 mb-3">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-envelope"></i>
            </span>
            <InputText
              value={orderDetails.guest_email}
              onChange={(e) => setOrderDetails({ ...orderDetails, guest_email: e.target.value })}
              placeholder="Email"
              className="w-full"
              disabled={isRegisteredCustomer}
            />
          </div>
        </div>

        <div className="col-12 md:col-6 mb-3">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-phone"></i>
            </span>
            <InputText
              value={orderDetails.guest_phone}
              onChange={(e) => setOrderDetails({ ...orderDetails, guest_phone: e.target.value })}
              placeholder="Số điện thoại"
              className="w-full"
              disabled={isRegisteredCustomer}
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="col-12">
          <div className="flex justify-content-between align-items-center">
            <h5>Địa chỉ giao hàng</h5>
            {isRegisteredCustomer && (
              <Button
                label="Thêm địa chỉ mới"
                icon="pi pi-plus"
                className="p-button-text"
                onClick={handleAddNewAddress}
              />
            )}
          </div>
        </div>
        
        {/* User saved addresses if available */}
        {userAddresses.length > 0 && (
          <div className="col-12 mb-3">
            <div className="grid">
              {userAddresses.map(address => (
                <div className="col-12 md:col-6 lg:col-4" key={address.address_id}>
                  <Card
                    className={`cursor-pointer ${selectedUserAddress?.address_id === address.address_id ? 'border-primary' : ''}`}
                    onClick={() => handleAddressSelect(address)}
                    style={{ 
                      borderWidth: selectedUserAddress?.address_id === address.address_id ? '2px' : '1px',
                      borderStyle: 'solid',
                      borderColor: selectedUserAddress?.address_id === address.address_id ? 'var(--primary-color)' : 'var(--surface-border)'
                    }}
                  >
                    <div className="flex align-items-center justify-content-between mb-2">
                      <span className="font-bold">{address.recipient_name}</span>
                      <div className="flex">
                        {address.is_default === 1 && (
                          <Tag value="Mặc định" severity="info" className="mr-2" />
                        )}
                        <Button
                          icon="pi pi-pencil"
                          className="p-button-rounded p-button-text p-button-sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleEditAddress(address);
                          }}
                          tooltip="Chỉnh sửa địa chỉ"
                        />
                      </div>
                    </div>
                    <div>{address.phone_number}</div>
                    <div>{address.address}, {address.district}, {address.province}, {address.country}</div>
                    <div className="text-sm mt-2">{address.address_type}</div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show manual address input if no user address is selected or available */}
        {(userAddresses.length === 0 || !selectedUserAddress) && (
          <>
            <div className="col-12 md:col-4 mb-3">
              <Dropdown
                value={addressDetails.province}
                options={provinces}
                onChange={(e) => {
                  const provinceId = e.value;
                  setAddressDetails(prev => ({ ...prev, province: provinceId }));
                  if (provinceId) {
                    fetchDistricts(provinceId);
                  }
                }}
                placeholder="Chọn Tỉnh/Thành phố *"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-4 mb-3">
              <Dropdown
                value={addressDetails.district}
                options={districts}
                onChange={(e) => {
                  const districtId = e.value;
                  setAddressDetails(prev => ({ ...prev, district: districtId }));
                  if (districtId) {
                    fetchWards(districtId);
                  }
                }}
                placeholder="Chọn Quận/Huyện *"
                className="w-full"
                disabled={!addressDetails.province}
              />
            </div>

            <div className="col-12 md:col-4 mb-3">
              <Dropdown
                value={addressDetails.ward}
                options={wards}
                onChange={(e) => {
                  setAddressDetails(prev => ({ ...prev, ward: e.value }));
                }}
                placeholder="Chọn Phường/Xã *"
                className="w-full"
                disabled={!addressDetails.district}
              />
            </div>

            <div className="col-12 mb-3">
              <InputTextarea
                value={addressDetails.streetAddress}
                onChange={(e) => setAddressDetails(prev => ({ ...prev, streetAddress: e.target.value }))}
                placeholder="Địa chỉ cụ thể (số nhà, tên đường) *"
                rows={2}
                className="w-full"
                required
              />
            </div>
          </>
        )}

        <Divider />

        {/* Product Selection Section */}
        <div className="col-12">
          <h5>Thông tin sản phẩm</h5>
        </div>

        <div className="col-12 mb-3">
          <Button 
            label="Thêm sản phẩm" 
            icon="pi pi-plus" 
            onClick={openProductDialog} 
            className="mb-3"
          />

          {/* Selected Products Table */}
          <DataTable 
            value={selectedVariants} 
            responsiveLayout="scroll" 
            paginator={selectedVariants.length > 5}
            rows={5} 
            emptyMessage="Chưa có sản phẩm nào được chọn"
            rowsPerPageOptions={[5, 10, 25]}
            className="mb-3"
          >
            <Column body={variantImageTemplate} header="Hình ảnh" style={{ width: '7rem' }}></Column>
            <Column field="product_name" header="Tên sản phẩm" body={variantNameTemplate}></Column>
            <Column body={variantStockTemplate} header="Tồn kho" style={{ width: '7rem' }}></Column>
            <Column body={quantityBodyTemplate} header="Số lượng" style={{ width: '10rem' }}></Column>
            <Column field="final_price" header="Đơn giá" body={variantPriceTemplate} style={{ width: '10rem' }}></Column>
            <Column body={priceBodyTemplate} header="Thành tiền" style={{ width: '10rem' }}></Column>
            <Column body={actionBodyTemplate} exportable={false} style={{ width: '5rem' }}></Column>
          </DataTable>
        </div>

        <Divider />

        {/* Order Details Section */}
        <div className="col-12">
          <h5>Chi tiết đơn hàng</h5>
        </div>

        <div className="col-12 md:col-6 mb-3">
          <Dropdown
            options={paymentMethods}
            value={orderDetails.payment_method_id}
            onChange={(e) => setOrderDetails({ ...orderDetails, payment_method_id: e.value })}
            optionLabel="name"
            optionValue="payment_method_id"
            placeholder="Phương thức thanh toán *"
            className="w-full"
          />
        </div>

        <div className="col-12 md:col-6 mb-3">
          <Dropdown
            options={paymentStatusOptions}
            value={orderDetails.payment_status}
            onChange={(e) => setOrderDetails({ ...orderDetails, payment_status: e.value })}
            placeholder="Trạng thái thanh toán"
            className="w-full"
          />
        </div>

        <div className="col-12 mb-3">
          <InputTextarea
            value={orderDetails.note}
            onChange={(e) => setOrderDetails({ ...orderDetails, note: e.target.value })}
            placeholder="Ghi chú"
            rows={3}
            className="w-full"
          />
        </div>

        {/* Payment Summary Section */}
        <div className="col-12">
          <Card title="Thanh toán" className="mb-3">
            <div className="flex justify-content-between mb-3">
              <span>Tổng tiền sản phẩm:</span>
              <span className="font-bold">{orderDetails.total_amount.toLocaleString('vi-VN')} đ</span>
            </div>
            <Divider />
            <div className="flex justify-content-between">
              <span className="font-bold text-xl">Tổng thanh toán:</span>
              <span className="font-bold text-xl text-primary">{orderDetails.total_amount.toLocaleString('vi-VN')} đ</span>
            </div>
          </Card>
        </div>

        {/* Button Section */}
        <div className="col-12 flex justify-content-end gap-2">
          <Button 
            label="Hủy" 
            icon="pi pi-times" 
            className="p-button-secondary" 
          />
          <Button 
            label="Tạo đơn hàng" 
            icon="pi pi-check" 
            onClick={createOrder} 
          />
        </div>
      </div>
    </Card>

    {/* Product Selection Dialog */}
    <Dialog
      visible={showDialog}
      style={{ width: '80vw' }}
      header="Chọn sản phẩm"
      modal
      footer={dialogFooter}
      onHide={handleDialogHide}
      maximizable
      closeOnEscape={false}
      closable={false}
    >
      <DataTable
        ref={dt}
        value={products}
        selection={tempSelectedProducts}
        onSelectionChange={(e) => setTempSelectedProducts(e.value)}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        dataKey="product_id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        globalFilter={globalFilter}
        header={header}
        responsiveLayout="scroll"
        selectionMode="multiple"
        emptyMessage="Không tìm thấy sản phẩm"
      >
        <Column expander style={{ width: '3rem' }} />
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column body={imageBodyTemplate} header="Hình ảnh" style={{ width: '7rem' }}></Column>
        <Column field="product_id" header="Mã sản phẩm" sortable style={{ width: '10rem' }}></Column>
        <Column field="product_name" header="Tên sản phẩm" sortable style={{ minWidth: '14rem' }}></Column>
        <Column body={stockTemplate} header="Tồn kho" sortable style={{ width: '8rem' }}></Column>
        <Column field="category_name" header="Danh mục" sortable style={{ width: '10rem' }}></Column>
        <Column field="brand_name" header="Thương hiệu" sortable style={{ width: '10rem' }}></Column>
        <Column header="Giá" body={productPriceTemplate} sortable style={{ width: '8rem' }}></Column>
      </DataTable>
    </Dialog>

    {/* Address Dialog Component */}
    <AddressDialog
      visible={addressDialogVisible}
      onHide={() => setAddressDialogVisible(false)}
      editingAddress={editingAddress}
      setEditingAddress={setEditingAddress}
      onSave={handleSaveAddress}
      isEditing={editingAddress && editingAddress.address_id}
    />
  </div>
);
}

export default App;