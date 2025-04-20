import axios from 'axios';

const API_URL = 'http://localhost:5000/order_items';
var token = '';

const orderItemsService = {
  getAll: async () => {
    try {
      const url = API_URL;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },

  insert: async (orderitemsData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding order item data:', JSON.stringify(orderitemsData));
      const response = await axios.post(API_URL, orderitemsData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (orderitemsData) => {
    try {
      // Sử dụng order_id để xác định record cần cập nhật
      const orderitemID = orderitemsData.orderitem_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating order data:', JSON.stringify(orderitemsData));
      
      const response = await axios.put(`${API_URL}/${orderitemID}`, orderitemsData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (orderitemID) => {
    try {
      console.log('Deleting order with ID:', orderitemID);
      const response = await axios.delete(`${API_URL}/${orderitemID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default orderItemsService;