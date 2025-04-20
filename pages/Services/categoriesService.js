import axios from 'axios';

const API_URL = 'http://localhost:5000/categories';

var token = '';

const categoriesService = {
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
      const url = `${API_URL}/${id}`;
      console.log('Request URL:', url);  // Kiểm tra URL
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },
  

  insert: async (categoriesData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding category data:', JSON.stringify(categoriesData));
      const response = await axios.post(API_URL, categoriesData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (categoriesData) => {
    try {
      const categoryID = categoriesData.category_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating category data:', JSON.stringify(categoriesData));
      
      const response = await axios.put(`${API_URL}/${categoryID}`, categoriesData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (categoryID) => {
    try {
      console.log('Deleting product with ID:', categoryID);
      const response = await axios.delete(`${API_URL}/${categoryID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default categoriesService;