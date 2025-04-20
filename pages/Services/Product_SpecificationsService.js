import axios from 'axios';

const API_URL = 'http://localhost:5000/Product_Specifications';

var token = '';

const Product_SpecificationsService = {
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
      return [];
    }
  },
  

  insert: async (Product_SpecificationsData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding Product_Specification data:', JSON.stringify(Product_SpecificationsData));
      const response = await axios.post(API_URL, Product_SpecificationsData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (Product_SpecificationsData) => {
    try {
      const Product_SpecificationID = Product_SpecificationsData.spec_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating Product_Specification data:', JSON.stringify(Product_SpecificationsData));
      
      const response = await axios.put(`${API_URL}/${Product_SpecificationID}`, Product_SpecificationsData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (Product_SpecificationID) => {
    try {
      console.log('Deleting product with ID:', Product_SpecificationID);
      const response = await axios.delete(`${API_URL}/${Product_SpecificationID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default Product_SpecificationsService;