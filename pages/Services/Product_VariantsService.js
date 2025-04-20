import axios from 'axios';

const API_URL = 'http://localhost:5000/Product_Variants';

var token = '';

const Product_VariantsService = {
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
      console.log('Request URL:', url);  
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },
  

  insert: async (Product_VariantsData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding variant data:', JSON.stringify(Product_VariantsData));
      const response = await axios.post(API_URL, Product_VariantsData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (Product_VariantsData) => {
    try {
      const variantID = Product_VariantsData.variant_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating variant data:', JSON.stringify(Product_VariantsData));
      
      const response = await axios.put(`${API_URL}/${variantID}`, Product_VariantsData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (variantID) => {
    try {
      console.log('Deleting variant with ID:', variantID);
      const response = await axios.delete(`${API_URL}/${variantID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default Product_VariantsService;