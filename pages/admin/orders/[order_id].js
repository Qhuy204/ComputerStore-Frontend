import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import ordersService from "../../Services/ordersService"
import orderItemsService from "../../Services/orderItemsService"
import addressService from "../../Services/addressService"
import { Card } from "primereact/card"
import { Button } from "primereact/button"
import { Panel } from "primereact/panel"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Toast } from "primereact/toast"
import { Dialog } from "primereact/dialog"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import { InputTextarea } from "primereact/inputtextarea"
import jsPDF from "jspdf"
import html2canvas from 'html2canvas'

const OrderDetailPage = () => {
  const router = useRouter()
  const toast = useRef(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false)
  const [addressDialogVisible, setAddressDialogVisible] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone_number: "",
    address: "",
    city: "",
    province: "",
    district: "",
    country: "Vietnam",
  })

  const processOrderStatus = (status) => {
    if (!status) return "unknown"
    const statusMap = {
      Delivered: "delivered",
      Pending: "pending",
      Processing: "processing",
      "Chờ xác nhận": "pending",
      Shipped: "shipped",
      Cancelled: "cancelled",
    }
    const normalizedStatus = statusMap[status] || (typeof status === "string" ? status.toLowerCase() : "unknown")
    return normalizedStatus
  }

  const renderStatusBadge = (status) => {
    const normalizedStatus = processOrderStatus(status)
    const statusMap = {
      pending: { text: "Chờ xác nhận", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      processing: { text: "Đang xử lý", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      shipped: { text: "Đang vận chuyển", bgColor: "bg-blue-100", textColor: "text-blue-800" },
      delivered: { text: "Đã giao hàng", bgColor: "bg-green-100", textColor: "text-green-800" },
      cancelled: { text: "Đã hủy", bgColor: "bg-red-100", textColor: "text-red-800" },
      unknown: { text: "Trạng thái không xác định", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    }
    const statusInfo = statusMap[normalizedStatus] || {
      text: normalizedStatus,
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        {statusInfo.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (error) {
      console.error("Lỗi format date:", error);
      return "Không xác định";
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const storedOrderId = localStorage.getItem("currentOrderId")
        console.log('Stored Order ID:', storedOrderId)
        
        if (!storedOrderId) return
  
        const fetchedDataArray = await ordersService.getById(storedOrderId)
        
        // Điều chỉnh lấy phần tử đầu tiên của mảng
        const fetchedData = fetchedDataArray[0] 
  
        console.log('Fetched Order Data:', fetchedData)
  
        const processedOrderData = {
          ...fetchedData,
          status: processOrderStatus(fetchedData.status),
        }
        
        setOrderDetail(processedOrderData)
        await fetchOrderItems(storedOrderId)
      } catch (error) {
        console.error("Lỗi:", error)
      }
    }
  
    fetchOrderDetails()
  }, [])

  const fetchOrderItems = async (orderId) => {
    try {
      const response = await orderItemsService.getById(orderId)
      
      // Nâng cấp logic xử lý response
      let items = []
      if (Array.isArray(response)) {
        items = response
      } else if (response) {
        // Thêm nhiều điều kiện để bắt các cấu trúc dữ liệu khác nhau
        items = response.data || 
                response.items || 
                (response.product_id ? [response] : 
                Object.values(response).filter(item => typeof item === 'object' && item !== null))
      }

      // Log để kiểm tra
      console.log('Fetched Order Items:', items)

      setOrderItems(items)
    } catch (error) {
      console.error("Lỗi fetch items:", error)
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách sản phẩm",
        life: 3000
      })
      setOrderItems([])
    }
  }


  // Hàm tạo hóa đơn PDF với html2canvas
  const generateInvoiceFromHTML = () => {
    // Hiển thị thông báo tải
    toast.current.show({
      severity: "info",
      summary: "Đang xử lý",
      detail: "Đang tạo hóa đơn PDF, vui lòng đợi trong giây lát...",
      life: 3000
    });
    
    // Tạo một div chứa nội dung hóa đơn với font Roboto
    const invoiceElement = document.createElement('div');
    invoiceElement.style.fontFamily = 'Roboto, sans-serif';
    invoiceElement.style.padding = '20px';
    invoiceElement.style.width = '210mm'; // Kích thước A4
    invoiceElement.style.backgroundColor = 'white';
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    
    // Helper function to get status text
    const getStatusText = () => {
      const normalizedStatus = processOrderStatus(orderDetail.status);
      const statusMap = {
        pending: "Chờ xác nhận",
        processing: "Đang xử lý",
        shipped: "Đang vận chuyển",
        delivered: "Đã giao hàng",
        cancelled: "Đã hủy",
        unknown: "Trạng thái không xác định",
      };
      return statusMap[normalizedStatus] || normalizedStatus;
    };
    
    // Thêm nội dung HTML cho hóa đơn với các class CSS từ Google Fonts
    invoiceElement.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap');
      
      body {
        font-family: 'Roboto', sans-serif;
        color: #333;
        line-height: 1.5;
      }
      
      h1 {
        font-size: 24px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 20px;
        color: #2c3e50;
      }
      
      h2 {
        font-size: 18px;
        font-weight: 700;
        margin-top: 20px;
        margin-bottom: 10px;
        color: #2c3e50;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      p {
        margin: 5px 0;
      }
      
      .info-section {
        margin-bottom: 15px;
      }
      
      .info-box {
        border: 1px solid #eee;
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 15px;
        background-color: #f9f9f9;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        font-size: 14px;
      }
      
      th {
        background-color: #2980b9;
        color: white;
      }
      
      .text-right {
        text-align: right;
      }
      
      .text-center {
        text-align: center;
      }
      
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 12px;
        color: #7f8c8d;
        border-top: 1px dashed #ddd;
        padding-top: 15px;
      }
      
      .total-section {
        margin-top: 20px;
        border-top: 1px solid #eee;
        padding-top: 10px;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }
      
      .total-amount {
        font-weight: bold;
        font-size: 16px;
      }
      
      .payment-info {
        margin-top: 15px;
        padding: 10px;
        border: 1px dashed #ccc;
        background-color: #f5f5f5;
        border-radius: 5px;
      }
      
      .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .status-pending {
        background-color: #FFF9C4;
        color: #F57F17;
      }
      
      .status-processing {
        background-color: #FFF9C4;
        color: #F57F17;
      }
      
      .status-shipped {
        background-color: #BBDEFB;
        color: #1565C0;
      }
      
      .status-delivered {
        background-color: #C8E6C9;
        color: #2E7D32;
      }
      
      .status-cancelled {
        background-color: #FFCDD2;
        color: #B71C1C;
      }
      
      .payment-status {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .payment-completed {
        background-color: #C8E6C9;
        color: #2E7D32;
      }
      
      .payment-pending {
        background-color: #FFF9C4;
        color: #F57F17;
      }
      
      .payment-failed {
        background-color: #FFCDD2;
        color: #B71C1C;
      }
      
      .logo-section {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .company-name {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .invoice-id {
        font-size: 18px;
        font-weight: bold;
      }
    </style>
    
    <div class="logo-section">
      <div class="company-name">GEARVN COMPUTER</div>
      <div>Địa chỉ: 78-80 Hoàng Hoa Thám, P.12, Q.Tân Bình, TP.HCM</div>
      <div>Hotline: 1800.6975</div>
    </div>
    
    <h1>HÓA ĐƠN BÁN HÀNG</h1>
    
    <div class="invoice-header">
      <div>
        <div class="invoice-id">Mã đơn hàng: #${orderDetail.order_id}</div>
        <div>Ngày đặt hàng: ${formatDate(orderDetail.order_date)}</div>
      </div>
      <div>
        <div>
          Trạng thái đơn hàng: 
          <span class="status-badge status-${orderDetail.status}">
            ${getStatusText()}
          </span>
        </div>
        <div>
          Trạng thái thanh toán: 
          <span class="payment-status payment-${(orderDetail.payment_status || "").toLowerCase()}">
            ${orderDetail.payment_status || "Chưa thanh toán"}
          </span>
        </div>
      </div>
    </div>
    
    <div class="info-box">
      <h2>THÔNG TIN KHÁCH HÀNG</h2>
      <div class="info-section">
        <p><strong>Họ tên:</strong> ${orderDetail.guest_name || "Chưa cập nhật"}</p>
        <p><strong>Email:</strong> ${orderDetail.guest_email || "Chưa cập nhật"}</p>
        <p><strong>Số điện thoại:</strong> ${orderDetail.guest_phone || "Chưa cập nhật"}</p>
        <p><strong>Địa chỉ giao hàng:</strong> ${orderDetail.shipping_address || "Chưa cập nhật"}</p>
        <p><strong>Phương thức thanh toán:</strong> ${orderDetail.payment_method_id === 1 ? "Tiền mặt khi nhận hàng (COD)" : 
                                                   orderDetail.payment_method_id === 2 ? "Chuyển khoản ngân hàng" : 
                                                   "Khác"}</p>
        ${orderDetail.note ? `<p><strong>Ghi chú:</strong> ${orderDetail.note}</p>` : ''}
      </div>
    </div>
    
    <h2>DANH SÁCH SẢN PHẨM</h2>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên SP</th>
          <th>Hãng</th>
          <th>SL</th>
          <th class="text-center">Đơn giá</th>
          <th class="text-right">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.product_name || "Chưa rõ"}</td>
            <td>${item.brand_name || "Chưa rõ"}</td>
            <td class="text-center">${item.quantity || 0}</td>
            <td class="text-right">${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price_at_time || 0)}</td>
            <td class="text-right">${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format((item.price_at_time || 0) * (item.quantity || 0))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      <div class="total-row">
        <div><strong>Tổng tiền sản phẩm:</strong></div>
        <div>${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
          orderItems.reduce((sum, item) => sum + ((item.price_at_time || 0) * (item.quantity || 0)), 0)
        )}</div>
      </div>
      ${orderDetail.shipping_fee ? `
      <div class="total-row">
        <div><strong>Phí vận chuyển:</strong></div>
        <div>${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(orderDetail.shipping_fee)}</div>
      </div>
      ` : ''}
      ${orderDetail.discount_amount ? `
      <div class="total-row">
        <div><strong>Giảm giá:</strong></div>
        <div>-${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(orderDetail.discount_amount)}</div>
      </div>
      ` : ''}
      <div class="total-row total-amount">
        <div>Tổng cộng:</div>
        <div>${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(orderDetail.total_amount)}</div>
      </div>
    </div>
    
    ${orderDetail.payment_method_id === 2 ? `
    <div class="payment-info">
      <h2>THÔNG TIN THANH TOÁN</h2>
      <p><strong>Ngân hàng:</strong> VIETCOMBANK - Chi nhánh Tân Bình</p>
      <p><strong>Số tài khoản:</strong> 0123456789</p>
      <p><strong>Chủ tài khoản:</strong> CÔNG TY TNHH THƯƠNG MẠI GEARVN</p>
      <p><strong>Nội dung chuyển khoản:</strong> Thanh toan don hang #${orderDetail.order_id}</p>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Cảm ơn quý khách đã mua hàng tại GEARVN!</p>
      <p>Mọi thắc mắc xin vui lòng liên hệ Hotline: 1800.6975 hoặc Email: cskh@gearvn.com</p>
      <p>Website: gearvn.com | Ngày in: ${new Date().toLocaleDateString("vi-VN")}</p>
    </div>
  `;
    // Thêm element vào document để chụp
    document.body.appendChild(invoiceElement);

    // Sử dụng html2canvas để chụp nội dung thành ảnh
    html2canvas(invoiceElement, {
      scale: 2, // Tăng chất lượng
      useCORS: true, // Cho phép tải font từ URL khác
      logging: false,
      letterRendering: true,
      allowTaint: true
    }).then(canvas => {
      // Xóa element đã tạo
      document.body.removeChild(invoiceElement);
      
      // Tạo PDF từ canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Lấy kích thước canvas và PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Thêm ảnh vào PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Thêm trang nếu cần
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Lưu PDF
      pdf.save(`Hoa_Don_${orderDetail.order_id}.pdf`);
      
      // Hiển thị thông báo thành công
      toast.current.show({
        severity: "success",
        summary: "Thành công",
        detail: "Đã tạo hóa đơn PDF thành công",
        life: 3000
      });
    }).catch(error => {
      console.error("Lỗi khi tạo PDF:", error);
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tạo hóa đơn PDF. Vui lòng thử lại sau.",
        life: 3000
      });
    });
  };

  const handlePrintInvoice = () => generateInvoiceFromHTML();

  // Kiểm tra trạng thái để hiển thị nút chỉnh sửa thông tin giao hàng
  const isEditableStatus =
    ["pending", "processing"].includes(orderDetail?.status) || orderDetail?.status === "Chờ xác nhận"

  if (!orderDetail) return <div>Đang tải...</div>
  

  return (
    <div className="p-5">
      <Toast ref={toast} />
      <Card title={`Chi tiết Đơn hàng #${orderDetail.order_id}`}>
        <div className="grid">
          <div className="col-6">
            <Panel header="Thông Tin Khách Hàng">
              <p>
                <strong>Tên:</strong> {orderDetail.guest_name || "Khách vãng lai"}
              </p>
              <p>
                <strong>Email:</strong> {orderDetail.guest_email || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {orderDetail.guest_phone || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Phương thức thanh toán:</strong> {orderDetail.payment_method_id === 1 ? "Tiền mặt" : orderDetail.payment_method_id === 2 ? "Chuyển khoản" : "Khác"}
              </p>
              <p>
                <strong>Trạng thái thanh toán:</strong> {orderDetail.payment_status || "Chưa thanh toán"}
              </p>
              {orderDetail.note && (
                <p>
                  <strong>Ghi chú:</strong> {orderDetail.note}
                </p>
              )}
            </Panel>
          </div>
          <div className="col-6">
            <Panel header="Thông Tin Đơn Hàng">
              <p>
                <strong>Ngày đặt:</strong> {formatDate(orderDetail.order_date)}
              </p>
              <p>
                <strong>Trạng thái:</strong> {renderStatusBadge(orderDetail.status)}
              </p>
              <p>
                <strong>Tổng tiền:</strong>{" "}
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                  orderDetail.total_amount,
                )}
              </p>
              <p>
                <strong>Địa chỉ giao hàng:</strong> {orderDetail.shipping_address}
              </p>
              <div className="flex mt-2">
                {orderDetail.status === "pending" && (
                  <>
                    <Button
                      label="Xác nhận đơn hàng"
                      icon="pi pi-check"
                      className="p-button-success"
                      onClick={() => setConfirmDialogVisible(true)}
                    />
                    {/* <Button
                      label="Chỉnh sửa đơn hàng"
                      icon="pi pi-pencil"
                      className="p-button-warning ml-2"
                      onClick={() => {
                        // Navigate to order edit page or open edit dialog
                        router.push(`/admin/edit_order/${orderDetail.order_id}`);
                      }}
                    /> */}
                  </>
                )}
                {isEditableStatus && (
                  <Button
                    label="Chỉnh sửa thông tin giao hàng"
                    icon="pi pi-pencil"
                    className="p-button-warning ml-2"
                    onClick={async () => {
                      setAddressDialogVisible(true)
                      if (orderDetail.user_id) {
                        const allAddresses = await addressService.getAll()
                        const filtered = allAddresses.filter((addr) => addr.user_id === orderDetail.user_id)
                        setSavedAddresses(filtered)
                      }
                    }}
                  />
                )}
              </div>
            </Panel>
          </div>
        </div>
        <Panel header="Danh Sách Sản Phẩm" className="mt-3">
        <DataTable value={orderItems} emptyMessage="Không có sản phẩm trong đơn hàng">
            <Column
              header="STT"
              body={(_, { rowIndex }) => rowIndex + 1}
              style={{ width: '70px' }}
            />
            <Column field="product_name" header="Tên Sản Phẩm" />
            <Column field="brand_name" header="Thương hiệu" />
            <Column field="model" header="Model" />
            <Column field="quantity" header="Số Lượng" />
            <Column
              header="Đơn Giá"
              body={(rowData) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(rowData.price_at_time || 0)
              }
            />
            <Column
              header="Thành Tiền"
              body={(rowData) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format((rowData.price_at_time || 0) * (rowData.quantity || 0))
              }
            />
          </DataTable>

        </Panel>
        <div className="mt-3 text-right">
          <Button
            label="Quay Lại"
            icon="pi pi-arrow-left"
            className="p-button-secondary mr-2"
            onClick={() => router.push("/admin/orders")}
          />
          <Button label="In Hóa Đơn" icon="pi pi-print" className="p-button-info" onClick={handlePrintInvoice} />
        </div>
      </Card>

      {/* Dialog Xác nhận đơn hàng */}
      <Dialog
        header="Xác nhận đơn hàng"
        visible={confirmDialogVisible}
        onHide={() => setConfirmDialogVisible(false)}
        footer={
          <>
            <Button
              label="Hủy"
              icon="pi pi-times"
              onClick={() => setConfirmDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label="Xác nhận"
              icon="pi pi-check"
              onClick={async () => {
                try {
                  // Create an updatePayload object with only the necessary fields
                  const updatePayload = {
                    status: "shipped",
                    order_id: orderDetail.order_id,
                  };
                  // Use the update method with clean payload
                  await ordersService.update(updatePayload);
                  
                  setOrderDetail((prev) => ({ ...prev, status: "shipped" }));
                  setConfirmDialogVisible(false);
                  toast.current.show({
                    severity: "success",
                    summary: "Thành công",
                    detail: "Đơn hàng đã được xác nhận",
                  });
                } catch (err) {
                  console.error("Update order error:", err);
                  toast.current.show({ 
                    severity: "error", 
                    summary: "Lỗi", 
                    detail: "Không thể cập nhật đơn hàng. Vui lòng thử lại." 
                  });
                }
              }}
            />
          </>
        }
      >
        <p>Bạn có chắc chắn muốn xác nhận đơn hàng này không?</p>
      </Dialog>

      {/* Dialog Cập nhật địa chỉ */}
      <Dialog
        header="Cập nhật thông tin giao hàng"
        visible={addressDialogVisible}
        onHide={() => setAddressDialogVisible(false)}
        style={{ width: "40vw" }}
        footer={
          <>
            <Button
              label="Hủy"
              icon="pi pi-times"
              onClick={() => setAddressDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label="Cập nhật"
              icon="pi pi-save"
              onClick={async () => {
                try {
                  const finalAddress = selectedAddressId
                    ? savedAddresses.find((addr) => addr.address_id === selectedAddressId)
                    : newAddress
                  const shippingText = `${finalAddress.address}, ${finalAddress.district}, ${finalAddress.province}, ${finalAddress.country}`
                  
                  // Prepare clean update payload WITH THE NEW ADDRESS
                  const updatePayload = {
                    order_id: orderDetail.order_id,
                    shipping_address: shippingText,  // Sử dụng địa chỉ mới thay vì địa chỉ cũ
                  };

                  if (!selectedAddressId && orderDetail.user_id) {
                    await addressService.insert({ ...newAddress, user_id: orderDetail.user_id })
                  }
                  
                  // Cập nhật đơn hàng với địa chỉ mới
                  await ordersService.update(updatePayload);
                  
                  // Cập nhật state UI
                  setOrderDetail((prev) => ({ ...prev, shipping_address: shippingText }))
                  toast.current.show({
                    severity: "success",
                    summary: "Thành công",
                    detail: "Cập nhật địa chỉ thành công",
                  })
                  setAddressDialogVisible(false)
                } catch (err) {
                  console.error("Update address error:", err);
                  toast.current.show({ 
                    severity: "error", 
                    summary: "Lỗi", 
                    detail: "Không thể cập nhật địa chỉ" 
                  });
                }
              }}
            />
          </>
        }
      >
        <div className="p-fluid">
          <label className="mb-2">Chọn địa chỉ đã lưu</label>
          <Dropdown
            value={selectedAddressId}
            options={savedAddresses.map((addr) => ({
              label: `${addr.recipient_name} - ${addr.address}, ${addr.district}, ${addr.province}`,
              value: addr.address_id,
            }))}
            onChange={(e) => setSelectedAddressId(e.value)}
            placeholder="Chọn địa chỉ đã lưu"
            className="mb-3"
          />
          <div className="text-center mb-2 font-bold">Hoặc nhập địa chỉ mới:</div>
          <div className="grid">
            <div className="col-6">
              <label>Tên người nhận</label>
              <InputText
                value={newAddress.recipient_name}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient_name: e.target.value }))}
              />
            </div>
            <div className="col-6">
              <label>SĐT</label>
              <InputText
                value={newAddress.phone_number}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
            <div className="col-12">
              <label>Địa chỉ</label>
              <InputTextarea
                rows={2}
                value={newAddress.address}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="col-6">
              <label>Quận/Huyện</label>
              <InputText
                value={newAddress.district}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, district: e.target.value }))}
              />
            </div>
            <div className="col-6">
              <label>Tỉnh/TP</label>
              <InputText
                value={newAddress.province}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, province: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default OrderDetailPage