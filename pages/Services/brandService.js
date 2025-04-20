import axios from 'axios';

const API_URL = 'http://localhost:5000/brand';

const brandService = {
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

  insert: async (brandData) => {
    try {
      console.log('Adding brand data:', JSON.stringify(brandData));
      const response = await axios.post(API_URL, brandData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  update: async (brandData) => {
    try {
      const brandID = brandData.brand_id;
      const response = await axios.put(`${API_URL}/${brandID}`, brandData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (brandID) => {
    try {
      console.log('Deleting brand with ID:', brandID);
      const response = await axios.delete(`${API_URL}/${brandID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default brandService;