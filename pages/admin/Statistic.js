import { useState, useEffect } from "react"
import { Card } from "primereact/card"
import { TabView, TabPanel } from "primereact/tabview"
import { Chart } from "primereact/chart"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Calendar } from "primereact/calendar"
import { Button } from "primereact/button"
import { Divider } from "primereact/divider"
import { Panel } from "primereact/panel"
import { Tag } from "primereact/tag"
import { SelectButton } from "primereact/selectbutton"

import usersService from "../Services/usersService"
import ordersService from "../Services/ordersService"
import orderItemsService from "../Services/orderItemsService"
import productsService from "../Services/productsService"
import paymentmethodService from "../Services/paymentMethodService"

const AnalyticsPage = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [timeFrame, setTimeFrame] = useState("monthly")
  const [dateRange, setDateRange] = useState({
    currentPeriod: null,
    previousPeriod: null,
  })
  const [statsData, setStatsData] = useState({
    currentPeriod: {
      salesByCategory: [],
      topProducts: [],
      customerStats: {
        totalCustomers: 0,
        newCustomers: 0,
        repeatCustomers: 0,
      },
      salesByTimeFrame: {
        daily: { labels: [], datasets: [{ data: [] }] },
        weekly: { labels: [], datasets: [{ data: [] }] },
        monthly: { labels: [], datasets: [{ data: [] }] },
        yearly: { labels: [], datasets: [{ data: [] }] },
      },
      paymentMethodStats: [],
      orderStatusStats: [],
    },
    previousPeriod: null,
    comparisonResults: null,
  })
  const [ordersData, setOrdersData] = useState([])
  const [orderItemsData, setOrderItemsData] = useState([])
  const [productsData, setProductsData] = useState([])
  const [usersData, setUsersData] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [filteredOrdersData, setFilteredOrdersData] = useState([])
  // Add state for order status counts
  const [orderStatusCounts, setOrderStatusCounts] = useState({
    successful: 0,
    cancelled: 0,
    pending: 0,
    shipped: 0,
    cancelToSuccessRatio: 0
  })

  const timeFrameOptions = [
    { label: "Ngày", value: "daily" },
    { label: "Tuần", value: "weekly" },
    { label: "Tháng", value: "monthly" },
    { label: "Năm", value: "yearly" },
  ]

  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(0)
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  // Prepare sales trend chart based on selected time frame
  const prepareSalesTrendChart = (orders, timeFrame) => {
    if (!orders || orders.length === 0)
      return {
        labels: [],
        datasets: [
          {
            label: `Doanh Thu Theo ${
              timeFrame === "daily"
                ? "Ngày"
                : timeFrame === "weekly"
                  ? "Tuần"
                  : timeFrame === "yearly"
                    ? "Năm"
                    : "Tháng"
            }`,
            data: [],
            fill: false,
            borderColor: "#42A5F5",
            backgroundColor: "rgba(66, 165, 245, 0.2)",
            tension: 0.4,
          },
        ],
      }

    // Only count delivered orders for revenue analytics
    const deliveredOrders = orders.filter(order => order.status === "Delivered")
    
    const salesByTime = {}
    const getTimeKey = (date) => {
      if (!date) return null

      const d = new Date(date)
      if (isNaN(d.getTime())) return null

      switch (timeFrame) {
        case "daily":
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        case "weekly":
          // Get the week number
          const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
          const pastDaysOfYear = (d - firstDayOfYear) / 86400000
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
          return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`
        case "yearly":
          return `${d.getFullYear()}`
        case "monthly":
        default:
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      }
    }

    const formatLabel = (key) => {
      if (!key) return ""

      switch (timeFrame) {
        case "daily":
          return new Date(key).toLocaleDateString("vi-VN")
        case "weekly":
          const [year, week] = key.split("-W")
          return `Tuần ${week}, ${year}`
        case "yearly":
          return key
        case "monthly":
        default:
          const [y, m] = key.split("-")
          return `${m}/${y}`
      }
    }

    deliveredOrders.forEach((order) => {
      if (!order.order_date || !order.total_amount) return

      const key = getTimeKey(order.order_date)
      if (!key) return

      const amount = Number.parseFloat(order.total_amount)
      if (isNaN(amount)) return

      salesByTime[key] = (salesByTime[key] || 0) + amount
    })

    // Sort by time
    const sortedSales = Object.entries(salesByTime).sort((a, b) => a[0].localeCompare(b[0]))

    // If no data, return empty chart
    if (sortedSales.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: `Doanh Thu Theo ${
              timeFrame === "daily"
                ? "Ngày"
                : timeFrame === "weekly"
                  ? "Tuần"
                  : timeFrame === "yearly"
                    ? "Năm"
                    : "Tháng"
            }`,
            data: [],
            fill: false,
            borderColor: "#42A5F5",
            backgroundColor: "rgba(66, 165, 245, 0.2)",
            tension: 0.4,
          },
        ],
      }
    }

    return {
      labels: sortedSales.map(([key]) => formatLabel(key)),
      datasets: [
        {
          label: `Doanh Thu Theo ${
            timeFrame === "daily" ? "Ngày" : timeFrame === "weekly" ? "Tuần" : timeFrame === "yearly" ? "Năm" : "Tháng"
          }`,
          data: sortedSales.map(([, amount]) => amount),
          fill: false,
          borderColor: "#42A5F5",
          backgroundColor: "rgba(66, 165, 245, 0.2)",
          tension: 0.4,
        },
      ],
    }
  }

  // Calculate statistics for a given period
  const calculatePeriodStats = (products, orders, orderItems, users, paymentMethods) => {
    if (!products || !orders || !orderItems || !users) {
      return {
        salesByCategory: [],
        topProducts: [],
        customerStats: {
          totalCustomers: 0,
          newCustomers: 0,
          repeatCustomers: 0,
        },
        salesByTimeFrame: {
          daily: { labels: [], datasets: [{ data: [] }] },
          weekly: { labels: [], datasets: [{ data: [] }] },
          monthly: { labels: [], datasets: [{ data: [] }] },
          yearly: { labels: [], datasets: [{ data: [] }] },
        },
        paymentMethodStats: [],
        orderStatusStats: [],
      }
    }

    // Only use delivered orders for revenue calculations
    const deliveredOrders = orders.filter(order => order.status === "Delivered")
    
    // Ensure orders have valid total_amount
    const validDeliveredOrders = deliveredOrders.map((order) => ({
      ...order,
      total_amount: Number.parseFloat(order.total_amount) || 0,
    }))

    // Sales by category - only count delivered orders
    const salesByCategoryMap = {}
    const deliveredOrderIds = deliveredOrders.map(order => order.order_id)
    
    orderItems.forEach((item) => {
      if (!item.product_id || !item.quantity || !item.price_at_time) return
      if (!deliveredOrderIds.includes(item.order_id)) return // Skip items from non-delivered orders

      const product = products.find((p) => p.product_id === item.product_id)
      if (product) {
        const categoryName = product.category_name || "Không phân loại"
        const quantity = Number.parseInt(item.quantity) || 0
        const price = Number.parseFloat(item.price_at_time) || 0

        salesByCategoryMap[categoryName] = (salesByCategoryMap[categoryName] || 0) + quantity * price
      }
    })

    const salesByCategory = Object.entries(salesByCategoryMap)
      .map(([categoryName, totalSales]) => ({
        categoryName,
        totalSales,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)

    // Product sales - only count delivered orders
    const productSalesMap = {}
    orderItems.forEach((item) => {
      if (!item.product_id || !item.quantity || !item.price_at_time) return
      if (!deliveredOrderIds.includes(item.order_id)) return // Skip items from non-delivered orders

      const product = products.find((p) => p.product_id === item.product_id)
      if (product) {
        if (!productSalesMap[product.product_id]) {
          productSalesMap[product.product_id] = {
            productName: product.product_name || "Sản phẩm không tên",
            totalQuantity: 0,
            totalRevenue: 0,
          }
        }
        const quantity = Number.parseInt(item.quantity) || 0
        const price = Number.parseFloat(item.price_at_time) || 0

        productSalesMap[product.product_id].totalQuantity += quantity
        productSalesMap[product.product_id].totalRevenue += quantity * price
      }
    })

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    // Customer statistics - only count delivered orders for customer stats
    const customerStats = {
      totalCustomers: new Set(validDeliveredOrders.filter((o) => o.user_id).map((o) => o.user_id)).size,
      newCustomers: users.filter(
        (u) =>
          validDeliveredOrders.length > 0 &&
          u.registration_date &&
          new Date(u.registration_date) >= new Date(validDeliveredOrders[0]?.order_date || 0),
      ).length,
      repeatCustomers: validDeliveredOrders.filter(
        (o) => o.user_id && validDeliveredOrders.filter((order) => order.user_id === o.user_id).length > 1,
      ).length,
    }

    // Payment method statistics - only count delivered orders
    const paymentMethodMap = {}
    validDeliveredOrders.forEach((order) => {
      let methodName = "Không xác định"

      if (order.payment_method_id) {
        const method = paymentMethods.find((m) => m.payment_method_id === order.payment_method_id)
        if (method) {
          methodName = method.payment_method_name
        }
      }

      paymentMethodMap[methodName] = (paymentMethodMap[methodName] || 0) + 1
    })

    const paymentMethodStats = Object.entries(paymentMethodMap).map(([method, count]) => ({
      method,
      count,
      percentage: validDeliveredOrders.length > 0 ? ((count / validDeliveredOrders.length) * 100).toFixed(2) : "0.00",
    }))

    // Order status statistics - count all orders
    const orderStatusMap = {}
    orders.forEach((order) => {
      const status = order.status || "Không xác định"
      orderStatusMap[status] = (orderStatusMap[status] || 0) + 1
    })

    const orderStatusStats = Object.entries(orderStatusMap).map(([status, count]) => ({
      status,
      count,
      percentage: orders.length > 0 ? ((count / orders.length) * 100).toFixed(2) : "0.00",
    }))

    // Sales by time frame (daily, weekly, monthly, yearly) - only count delivered orders
    const salesByTimeFrame = {
      daily: prepareSalesTrendChart(deliveredOrders, "daily"),
      weekly: prepareSalesTrendChart(deliveredOrders, "weekly"),
      monthly: prepareSalesTrendChart(deliveredOrders, "monthly"),
      yearly: prepareSalesTrendChart(deliveredOrders, "yearly"),
    }

    return {
      salesByCategory,
      topProducts,
      customerStats,
      salesByTimeFrame,
      paymentMethodStats,
      orderStatusStats,
    }
  }

  // Compare statistics between two periods
  const comparePeriodsStats = (currentPeriod, previousPeriod) => {
    if (!currentPeriod || !previousPeriod) return null

    const compareResults = {}

    // Compare sales by category
    compareResults.salesByCategory = currentPeriod.salesByCategory.map((current) => {
      const previous = previousPeriod.salesByCategory.find((p) => p.categoryName === current.categoryName)

      return {
        ...current,
        growthRate:
          previous && previous.totalSales !== 0
            ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100
            : 100,
      }
    })

    // Compare top products
    compareResults.topProducts = currentPeriod.topProducts.map((current) => {
      const previous = previousPeriod.topProducts.find((p) => p.productName === current.productName)

      return {
        ...current,
        growthRate:
          previous && previous.totalRevenue !== 0
            ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
            : 100,
      }
    })

    // Compare customer statistics
    compareResults.customerStats = {
      totalCustomers: {
        current: currentPeriod.customerStats.totalCustomers,
        previous: previousPeriod.customerStats.totalCustomers,
        growthRate: calculateGrowthRate(
          currentPeriod.customerStats.totalCustomers,
          previousPeriod.customerStats.totalCustomers,
        ),
      },
      newCustomers: {
        current: currentPeriod.customerStats.newCustomers,
        previous: previousPeriod.customerStats.newCustomers,
        growthRate: calculateGrowthRate(
          currentPeriod.customerStats.newCustomers,
          previousPeriod.customerStats.newCustomers,
        ),
      },
      repeatCustomers: {
        current: currentPeriod.customerStats.repeatCustomers,
        previous: previousPeriod.customerStats.repeatCustomers,
        growthRate: calculateGrowthRate(
          currentPeriod.customerStats.repeatCustomers,
          previousPeriod.customerStats.repeatCustomers,
        ),
      },
    }

    return compareResults
  }

  // Calculate growth rate between two values
  const calculateGrowthRate = (current, previous) => {
    return previous && previous !== 0 ? ((current - previous) / previous) * 100 : 100
  }

  // Calculate order status counts
  const calculateOrderStatusCounts = (orders) => {
    if (!orders || orders.length === 0) {
      return {
        successful: 0,
        cancelled: 0,
        processing: 0,
        cancelToSuccessRatio: 0
      }
    }

    const successful = orders.filter(order => order.status === "Delivered").length
    const cancelled = orders.filter(order => order.status === "Cancelled").length
    
    // Gộp "Pending" và "Processing" vào nhóm "đang xử lý"
    const processing = orders.filter(order => 
      order.status === "Pending" || order.status === "Processing" || order.status === "Shipped"
    ).length

    // Calculate ratio of cancelled to successful orders
    const cancelToSuccessRatio = successful > 0 ? (cancelled / successful) * 100 : 0

    return {
      successful,
      cancelled,
      processing,
      cancelToSuccessRatio
    }
  }

  // Fetch data and calculate statistics
  const fetchStatistics = async () => {
    try {
      // Fetch all required data
      const products = await productsService.getAllVariant()
      const orders = await ordersService.getAll()
      const orderItems = await orderItemsService.getAll()
      const users = await usersService.getAll()
      const methods = await paymentmethodService.getAll()

      // Ensure data is valid
      const validProducts = Array.isArray(products) ? products : []
      const validOrders = Array.isArray(orders) ? orders : []
      const validOrderItems = Array.isArray(orderItems) ? orderItems : []
      const validUsers = Array.isArray(users) ? users : []
      const validMethods = Array.isArray(methods) ? methods : []

      setProductsData(validProducts)
      setOrdersData(validOrders)
      setOrderItemsData(validOrderItems)
      setUsersData(validUsers)
      setPaymentMethods(validMethods)

      // Calculate order status counts
      const statusCounts = calculateOrderStatusCounts(validOrders)
      setOrderStatusCounts(statusCounts)

      // Filter data based on selected date range if available
      let filteredOrders = validOrders
      let filteredOrderItems = validOrderItems

      if (dateRange.currentPeriod && dateRange.currentPeriod.length === 2) {
        const startDate = new Date(dateRange.currentPeriod[0])
        const endDate = new Date(dateRange.currentPeriod[1])
        endDate.setHours(23, 59, 59, 999)

        filteredOrders = validOrders.filter((order) => {
          if (!order.order_date) return false
          const orderDate = new Date(order.order_date)
          return orderDate >= startDate && orderDate <= endDate
        })

        setFilteredOrdersData(filteredOrders)

        const filteredOrderIds = filteredOrders.map((order) => order.order_id)
        filteredOrderItems = validOrderItems.filter((item) => filteredOrderIds.includes(item.order_id))
      } else {
        setFilteredOrdersData(validOrders)
      }

      // Calculate statistics for current period
      const currentPeriodStats = calculatePeriodStats(
        validProducts,
        filteredOrders,
        filteredOrderItems,
        validUsers,
        validMethods,
      )

      let previousPeriodStats = null
      let comparisonResults = null

      // Calculate statistics for previous period if compare mode is enabled
      if (compareMode && dateRange.currentPeriod && dateRange.currentPeriod.length === 2) {
        const currentStartDate = new Date(dateRange.currentPeriod[0])
        const currentEndDate = new Date(dateRange.currentPeriod[1])
        const daysDiff = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)

        const previousEndDate = new Date(currentStartDate)
        previousEndDate.setDate(previousEndDate.getDate() - 1)

        const previousStartDate = new Date(previousEndDate)
        previousStartDate.setDate(previousStartDate.getDate() - daysDiff)

        const previousPeriodOrders = validOrders.filter((order) => {
          if (!order.order_date) return false
          const orderDate = new Date(order.order_date)
          return orderDate >= previousStartDate && orderDate <= previousEndDate
        })

        const previousPeriodOrderIds = previousPeriodOrders.map((order) => order.order_id)
        const previousPeriodOrderItems = validOrderItems.filter((item) =>
          previousPeriodOrderIds.includes(item.order_id),
        )

        previousPeriodStats = calculatePeriodStats(
          validProducts,
          previousPeriodOrders,
          previousPeriodOrderItems,
          validUsers,
          validMethods,
        )

        comparisonResults = comparePeriodsStats(currentPeriodStats, previousPeriodStats)
      }

      setStatsData({
        currentPeriod: currentPeriodStats,
        previousPeriod: previousPeriodStats,
        comparisonResults,
      })
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error)
    }
  }

  // Fetch data when component mounts or when date range or compare mode changes
  useEffect(() => {
    fetchStatistics()
  }, [dateRange, compareMode])

  // Calculate total revenue safely - only count delivered orders
  const calculateTotalRevenue = () => {
    if (!filteredOrdersData || filteredOrdersData.length === 0) return 0

    return filteredOrdersData
      .filter(order => order.status === "Delivered")
      .reduce((sum, order) => {
        const amount = Number.parseFloat(order.total_amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
  }

  // Calculate average order value safely - only count delivered orders
  const calculateAverageOrderValue = () => {
    if (!filteredOrdersData || filteredOrdersData.length === 0) return 0

    const deliveredOrders = filteredOrdersData.filter(order => order.status === "Delivered")
    if (deliveredOrders.length === 0) return 0
    
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      const amount = Number.parseFloat(order.total_amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    
    return totalRevenue / deliveredOrders.length
  }

  // Render sales by category tab
  const renderSalesByCategoryTab = () => (
    <Card title="Doanh Thu Theo Danh Mục">
      <div className="grid">
        <div className="col-12 md:col-8">
          {statsData.currentPeriod.salesByCategory.length > 0 ? (
            <Chart
              type="bar"
              data={{
                labels: statsData.currentPeriod.salesByCategory.map((item) => item.categoryName),
                datasets: [
                  {
                    label: "Doanh Thu",
                    data: statsData.currentPeriod.salesByCategory.map((item) => item.totalSales),
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                plugins: {
                  legend: {
                    position: "top",
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `Doanh thu: ${formatCurrency(context.raw)}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "300px" }}>
              <p className="text-500">Không có dữ liệu danh mục</p>
            </div>
          )}
        </div>
        <div className="col-12 md:col-4">
          <h3>Phân Bổ Doanh Thu</h3>
          {statsData.currentPeriod.salesByCategory.length > 0 ? (
            <Chart
              type="pie"
              data={{
                labels: statsData.currentPeriod.salesByCategory.map((item) => item.categoryName),
                datasets: [
                  {
                    data: statsData.currentPeriod.salesByCategory.map((item) => item.totalSales),
                    backgroundColor: [
                      "#FF6384",
                      "#36A2EB",
                      "#FFCE56",
                      "#4BC0C0",
                      "#9966FF",
                      "#FF9F40",
                      "#8AC249",
                      "#EA5545",
                      "#F46A9B",
                      "#EF9B20",
                    ],
                  },
                ],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                        const value = context.raw
                        const percentage = ((value / total) * 100).toFixed(2)
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                      },
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "200px" }}>
              <p className="text-500">Không có dữ liệu</p>
            </div>
          )}
        </div>
        <div className="col-12">
          <Divider />
          <h3>Chi Tiết Doanh Thu Theo Danh Mục</h3>
          <DataTable
            value={statsData.currentPeriod.salesByCategory}
            rowClassName={(rowData) => ({
              "bg-green-100": compareMode && (rowData.growthRate || 0) > 0,
              "bg-red-100": compareMode && (rowData.growthRate || 0) < 0,
            })}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="Không có dữ liệu danh mục"
          >
            <Column field="categoryName" header="Danh Mục" sortable />
            <Column
              field="totalSales"
              header="Doanh Thu"
              sortable
              body={(rowData) => formatCurrency(rowData.totalSales)}
            />
            {compareMode && (
              <Column
                header="Tăng Trưởng"
                sortable
                field="growthRate"
                body={(rowData) => {
                  const growthRate = rowData.growthRate ?? 0
                  return <Tag severity={growthRate > 0 ? "success" : "danger"}>{Number(growthRate).toFixed(2)}%</Tag>
                }}
              />
            )}
          </DataTable>
        </div>
      </div>
    </Card>
  )

  // Render top products tab
  const renderTopProductsTab = () => (
    <Card title="Top Sản Phẩm Bán Chạy">
      <div className="grid">
        <div className="col-12">
          <DataTable
            value={statsData.currentPeriod.topProducts}
            rowClassName={(rowData) => ({
              "bg-green-100": compareMode && (rowData.growthRate || 0) > 0,
              "bg-red-100": compareMode && (rowData.growthRate || 0) < 0,
            })}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="Không có dữ liệu sản phẩm"
          >
            <Column field="productName" header="Sản Phẩm" sortable />
            <Column field="totalQuantity" header="Số Lượng Bán" sortable />
            <Column
              field="totalRevenue"
              header="Doanh Thu"
              sortable
              body={(rowData) => formatCurrency(rowData.totalRevenue)}
            />
            {compareMode && (
              <Column
                header="Tăng Trưởng"
                sortable
                field="growthRate"
                body={(rowData) => {
                  const growthRate = rowData.growthRate ?? 0
                  return <Tag severity={growthRate > 0 ? "success" : "danger"}>{Number(growthRate).toFixed(2)}%</Tag>
                }}
              />
            )}
          </DataTable>
        </div>
        <div className="col-12">
          <Divider />
          <h3>Biểu Đồ Top 5 Sản Phẩm</h3>
          {statsData.currentPeriod.topProducts.length > 0 ? (
            <Chart
              type="bar"
              data={{
                labels: statsData.currentPeriod.topProducts.slice(0, 5).map((item) => item.productName),
                datasets: [
                  {
                    label: "Doanh Thu",
                    data: statsData.currentPeriod.topProducts.slice(0, 5).map((item) => item.totalRevenue),
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                  },
                ],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => `Doanh thu: ${formatCurrency(context.raw)}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "300px" }}>
              <p className="text-500">Không có dữ liệu sản phẩm</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  // Render customer statistics tab
  const renderCustomerStatsTab = () => (
    <Card title="Thống Kê Khách Hàng">
      <div className="grid">
        <div className="col-12 md:col-4">
          <Panel header="Tổng Số Khách Hàng">
            <div className="text-center">
              <div className="text-4xl font-bold">{statsData.currentPeriod.customerStats.totalCustomers}</div>
              {compareMode && statsData.comparisonResults?.customerStats && (
                <div
                  className={`mt-2 ${
                    (statsData.comparisonResults.customerStats.totalCustomers?.growthRate || 0) > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {(statsData.comparisonResults.customerStats.totalCustomers?.growthRate || 0) > 0 ? "↑" : "↓"}
                  {Math.abs(statsData.comparisonResults.customerStats.totalCustomers?.growthRate || 0).toFixed(2)}%
                </div>
              )}
            </div>
          </Panel>
        </div>
        <div className="col-12 md:col-4">
          <Panel header="Khách Hàng Mới">
            <div className="text-center">
              <div className="text-4xl font-bold">{statsData.currentPeriod.customerStats.newCustomers}</div>
              {compareMode && statsData.comparisonResults?.customerStats && (
                <div
                  className={`mt-2 ${
                    (statsData.comparisonResults.customerStats.newCustomers?.growthRate || 0) > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {(statsData.comparisonResults.customerStats.newCustomers?.growthRate || 0) > 0 ? "↑" : "↓"}
                  {Math.abs(statsData.comparisonResults.customerStats.newCustomers?.growthRate || 0).toFixed(2)}%
                </div>
              )}
            </div>
          </Panel>
        </div>
        <div className="col-12 md:col-4">
          <Panel header="Khách Hàng Quay Lại">
            <div className="text-center">
              <div className="text-4xl font-bold">{statsData.currentPeriod.customerStats.repeatCustomers}</div>
              {compareMode && statsData.comparisonResults?.customerStats && (
                <div
                  className={`mt-2 ${
                    (statsData.comparisonResults.customerStats.repeatCustomers?.growthRate || 0) > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {(statsData.comparisonResults.customerStats.repeatCustomers?.growthRate || 0) > 0 ? "↑" : "↓"}
                  {Math.abs(statsData.comparisonResults.customerStats.repeatCustomers?.growthRate || 0).toFixed(2)}%
                </div>
              )}
            </div>
          </Panel>
        </div>
        <div className="col-12">
          <Divider />
          <h3>Phân Tích Khách Hàng</h3>
          {statsData.currentPeriod.customerStats.newCustomers > 0 ||
          statsData.currentPeriod.customerStats.repeatCustomers > 0 ? (
            <Chart
              type="pie"
              data={{
                labels: ["Khách Hàng Mới", "Khách Hàng Quay Lại"],
                datasets: [
                  {
                    data: [
                      statsData.currentPeriod.customerStats.newCustomers,
                      statsData.currentPeriod.customerStats.repeatCustomers,
                    ],
                    backgroundColor: ["#FF6384", "#36A2EB"],
                  },
                ],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                        const value = context.raw
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00"
                        return `${context.label}: ${value} (${percentage}%)`
                      },
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "300px" }}>
              <p className="text-500">Không có dữ liệu khách hàng</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  // Render sales trend tab
  const renderSalesTrendTab = () => (
    <Card title="Xu Hướng Doanh Số">
      <div className="grid">
        <div className="col-12 mb-3">
          <div className="flex justify-content-center">
            <SelectButton value={timeFrame} options={timeFrameOptions} onChange={(e) => setTimeFrame(e.value)} />
          </div>
        </div>
        <div className="col-12">
          {statsData.currentPeriod.salesByTimeFrame[timeFrame]?.datasets[0]?.data.length > 0 ? (
            <Chart
              type="line"
              data={statsData.currentPeriod.salesByTimeFrame[timeFrame]}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `Doanh thu: ${formatCurrency(context.raw)}`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Doanh Thu (VND)",
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text:
                        timeFrame === "daily"
                          ? "Ngày"
                          : timeFrame === "weekly"
                            ? "Tuần"
                            : timeFrame === "yearly"
                              ? "Năm"
                              : "Tháng",
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "300px" }}>
              <p className="text-500">Không có dữ liệu xu hướng doanh số</p>
            </div>
          )}
        </div>
        <div className="col-12 mt-4">
          <Divider />
          <h3>
            Bảng Thống Kê Doanh Thu Theo{" "}
            {timeFrame === "daily"
              ? "Ngày"
              : timeFrame === "weekly"
                ? "Tuần"
                : timeFrame === "yearly"
                  ? "Năm"
                  : "Tháng"}
          </h3>
          <DataTable
            value={statsData.currentPeriod.salesByTimeFrame[timeFrame]?.labels.map((label, index) => ({
              period: label,
              revenue: statsData.currentPeriod.salesByTimeFrame[timeFrame].datasets[0].data[index],
            }))}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="Không có dữ liệu"
          >
            <Column
              field="period"
              header={
                timeFrame === "daily"
                  ? "Ngày"
                  : timeFrame === "weekly"
                    ? "Tuần"
                    : timeFrame === "yearly"
                      ? "Năm"
                      : "Tháng"
              }
              sortable
            />
            <Column field="revenue" header="Doanh Thu" sortable body={(rowData) => formatCurrency(rowData.revenue)} />
          </DataTable>
        </div>
      </div>
    </Card>
  )

  // Render payment methods tab
  const renderPaymentMethodsTab = () => (
    <Card title="Phương Thức Thanh Toán">
      <div className="grid">
        <div className="col-12 md:col-6">
          {statsData.currentPeriod.paymentMethodStats.length > 0 ? (
            <Chart
              type="pie"
              data={{
                labels: statsData.currentPeriod.paymentMethodStats.map((item) => item.method),
                datasets: [
                  {
                    data: statsData.currentPeriod.paymentMethodStats.map((item) => item.count),
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                  },
                ],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                        return `${context.label}: ${context.raw} đơn hàng (${total > 0 ? ((context.raw / total) * 100).toFixed(2) : "0.00"}%)`
                      },
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "300px" }}>
              <p className="text-500">Không có dữ liệu phương thức thanh toán</p>
            </div>
          )}
        </div>
        <div className="col-12 md:col-6">
          <DataTable
            value={statsData.currentPeriod.paymentMethodStats}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="Không có dữ liệu phương thức thanh toán"
          >
            <Column field="method" header="Phương Thức" sortable />
            <Column field="count" header="Số Đơn Hàng" sortable />
            <Column field="percentage" header="Tỷ Lệ" sortable body={(rowData) => `${rowData.percentage}%`} />
          </DataTable>
        </div>
      </div>
    </Card>
  )

  // Render order status tab
  const renderOrderStatusTab = () => (
    <Card title="Trạng Thái Đơn Hàng">
      <div className="grid">
        <div className="col-12 md:col-6">
          {statsData.currentPeriod.orderStatusStats.length > 0 ? (
            <Chart
              type="doughnut"
              data={{
                labels: statsData.currentPeriod.orderStatusStats.map((item) => item.status),
                datasets: [
                  {
                    data: statsData.currentPeriod.orderStatusStats.map((item) => item.count),
                    backgroundColor: ["#4BC0C0", "#FF9F40", "#36A2EB", "#FF6384", "#9966FF"],
                  },
                ],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                        return `${context.label}: ${context.raw} đơn hàng (${total > 0 ? ((context.raw / total) * 100).toFixed(2) : "0.00"}%)`
                      },
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-content-center align-items-center" style={{ height: "300px" }}>
              <p className="text-500">Không có dữ liệu trạng thái đơn hàng</p>
            </div>
          )}
        </div>
        <div className="col-12 md:col-6">
          <DataTable
            value={statsData.currentPeriod.orderStatusStats}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="Không có dữ liệu trạng thái đơn hàng"
          >
            <Column field="status" header="Trạng Thái" sortable />
            <Column field="count" header="Số Đơn Hàng" sortable />
            <Column field="percentage" header="Tỷ Lệ" sortable body={(rowData) => `${rowData.percentage}%`} />
          </DataTable>
        </div>
      </div>
    </Card>
  )

  // Render cancelled orders statistics tab
  const renderCancelledOrdersTab = () => (
    <Card title="Thống Kê Đơn Hàng Hủy">
      <div className="grid">
        <div className="col-12 md:col-6">
          <Panel header="Số Lượng Đơn Hàng Hủy">
            <div className="text-center">
              <div className="text-4xl font-bold">{orderStatusCounts.cancelled}</div>
            </div>
          </Panel>
        </div>
        <div className="col-12 md:col-6">
          <Panel header="Tỷ Lệ Đơn Hàng Hủy / Đơn Hàng Thành Công">
            <div className="text-center">
              <div className="text-4xl font-bold">{orderStatusCounts.cancelToSuccessRatio.toFixed(2)}%</div>
            </div>
          </Panel>
        </div>
        <div className="col-12">
          <Divider />
          <h3>Phân Tích Đơn Hàng Theo Trạng Thái</h3>
          <Chart
            type="pie"
            data={{
              labels: ["Đơn Hàng Thành Công", "Đơn Hàng Hủy", "Đơn Hàng Đang Xử Lý"],
              datasets: [
                {
                  data: [
                    orderStatusCounts.successful,
                    orderStatusCounts.cancelled,
                    orderStatusCounts.processing
                  ],
                  backgroundColor: ["#4BC0C0", "#FF6384", "#FFCE56"],
                },
              ],
            }}
            options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0)
                      const value = context.raw
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00"
                      return `${context.label}: ${value} (${percentage}%)`
                    },
                  },
                },
              }}}
            />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="surface-ground p-4">
      <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-4">
        <h1 className="text-3xl mb-3 md:mb-0">Phân Tích Kinh Doanh</h1>
        <div className="flex flex-column md:flex-row align-items-center gap-3">
          <Calendar
            selectionMode="range"
            value={dateRange.currentPeriod}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                currentPeriod: e.value,
              }))
            }
            placeholder="Chọn khoảng thời gian"
            showIcon
            className="w-full md:w-auto"
          />
          <Button
            label={compareMode ? "Tắt So Sánh" : "Bật So Sánh"}
            onClick={() => setCompareMode(!compareMode)}
            className={compareMode ? "p-button-danger w-full md:w-auto" : "p-button-success w-full md:w-auto"}
            icon={compareMode ? "pi pi-times" : "pi pi-chart-line"}
          />
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-4">
          <Card>
            <div className="flex justify-content-between">
              <div>
                <span className="block text-500 font-medium mb-6">Tổng Doanh Thu</span>
                <div className="text-900 font-medium text-xl">{formatCurrency(calculateTotalRevenue())}</div>
              </div>
              <div
                className="flex align-items-center justify-content-center bg-blue-100 border-round"
                style={{ width: "2.5rem", height: "2.5rem" }}
              >
                <i className="pi pi-dollar text-blue-500 text-xl" />
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card>
            <div className="flex justify-content-between">
              <div>
                <span className="block text-500 font-medium mb-0" style={{height:'35px'}}>Tổng Đơn Hàng</span>
                <div className="text-900 font-medium text-xl">{filteredOrdersData.length}</div>
                <div className="text-500 mt-2">
                  <span className="text-green-500 mr-2">Thành công: {orderStatusCounts.successful}</span>
                  <span className="text-red-500 mr-2">Hủy: {orderStatusCounts.cancelled}</span>
                  <span className="text-orange-500">Đang xử lý: {orderStatusCounts.processing}</span>
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center bg-orange-100 border-round"
                style={{ width: "2.5rem", height: "2.5rem" }}
              >
                <i className="pi pi-shopping-cart text-orange-500 text-xl" />
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card>
            <div className="flex justify-content-between">
              <div>
                <span className="block text-500 font-medium mb-0" style={{height:'60px'}}>Giá Trị Trung Bình</span>
                <div className="text-900 font-medium text-xl">{formatCurrency(calculateAverageOrderValue())}</div>
              </div>
              <div
                className="flex align-items-center justify-content-center bg-cyan-100 border-round"
                style={{ width: "2.5rem", height: "2.5rem" }}
              >
                <i className="pi pi-chart-bar text-cyan-500 text-xl" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="mt-4">
        <TabPanel header="Doanh Thu Theo Danh Mục">{renderSalesByCategoryTab()}</TabPanel>
        <TabPanel header="Top Sản Phẩm">{renderTopProductsTab()}</TabPanel>
        <TabPanel header="Khách Hàng">{renderCustomerStatsTab()}</TabPanel>
        <TabPanel header="Xu Hướng Doanh Số">{renderSalesTrendTab()}</TabPanel>
        <TabPanel header="Phương Thức Thanh Toán">{renderPaymentMethodsTab()}</TabPanel>
        <TabPanel header="Trạng Thái Đơn Hàng">{renderOrderStatusTab()}</TabPanel>
        <TabPanel header="Đơn Hàng Hủy">{renderCancelledOrdersTab()}</TabPanel>
      </TabView>
    </div>
  )
}

export default AnalyticsPage
