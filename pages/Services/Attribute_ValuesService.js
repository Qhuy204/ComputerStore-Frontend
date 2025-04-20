import axios from 'axios';

const API_URL = 'http://localhost:5000/Attribute_Values';

var token = '';

const Attribute_ValuesService = {
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
  

  insert: async (Attribute_ValuesData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding attribute_value data:', JSON.stringify(Attribute_ValuesData));
      const response = await axios.post(API_URL, Attribute_ValuesData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (Attribute_ValuesData) => {
    try {
      const attribute_valueID = Attribute_ValuesData.attribute_value_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating attribute_value data:', JSON.stringify(Attribute_ValuesData));
      
      const response = await axios.put(`${API_URL}/${attribute_valueID}`, Attribute_ValuesData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (attribute_valueID) => {
    try {
      console.log('Deleting product with ID:', attribute_valueID);
      const response = await axios.delete(`${API_URL}/${attribute_valueID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default Attribute_ValuesService;