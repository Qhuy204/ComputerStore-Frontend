import axios from 'axios';

const API_URL = 'http://localhost:5000/orders';
var token = '';

const ordersService = {
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

  insert: async (ordersData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding admin data:', JSON.stringify(ordersData));
      const response = await axios.post(API_URL, ordersData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (ordersData) => {
    try {
      // Sử dụng order_id để xác định record cần cập nhật
      const orderID = ordersData.order_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating order data:', JSON.stringify(ordersData));
      
      const response = await axios.put(`${API_URL}/${orderID}`, ordersData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (orderID) => {
    try {
      console.log('Deleting order with ID:', orderID);
      const response = await axios.delete(`${API_URL}/${orderID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default ordersService;