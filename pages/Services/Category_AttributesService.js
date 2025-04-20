import axios from 'axios';

const API_URL = 'http://localhost:5000/category_attributes';

var token = '';

const category_attributesService = {
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
  

  insert: async (category_attributesData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding category_attributes data:', JSON.stringify(category_attributesData));
      const response = await axios.post(API_URL, category_attributesData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (category_attributesData) => {
    try {
      const categoryID = category_attributesData.category_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating category_attributes data:', JSON.stringify(category_attributesData));
      
      const response = await axios.put(`${API_URL}/${categoryID}`, category_attributesData);
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

export default category_attributesService;