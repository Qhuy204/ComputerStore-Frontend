import axios from 'axios';


const API_URL = 'http://localhost:5000/products';
// const  = 'http://localhost:5000/products//list/inventorystatus'
const ATTRIBUTE_API_URL = 'http://localhost:5000/products/list/attribute'
const VARIANT_API_URL = 'http://localhost:5000/products/list/variant'
var token = '';

const productsService = {
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

  getAllAttribute: async () => {
    try {
      const url = ATTRIBUTE_API_URL;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  getAllVariant: async () => {
    try {
      const url = VARIANT_API_URL;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const url = `${API_URL}/${id}`;
      console.log('Request URL:', url);  // Kiểm tra URL
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },
  

  insert: async (productsData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding admin data:', JSON.stringify(productsData));
      const response = await axios.post(API_URL, productsData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (productsData) => {
    try {
      // Sử dụng promotion_id để xác định record cần cập nhật
      const productID = productsData.product_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating promotion data:', JSON.stringify(productsData));
      
      const response = await axios.put(`${API_URL}/${productID}`, productsData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (productID) => {
    try {
      console.log('Deleting product with ID:', productID);
      const response = await axios.delete(`${API_URL}/${productID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default productsService;