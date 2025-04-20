import axios from 'axios';

const API_URL = 'http://localhost:5000/Attribute_Types';

var token = '';

const Attribute_TypesService = {
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
  

  insert: async (Attribute_TypesData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding attribute_type data:', JSON.stringify(Attribute_TypesData));
      const response = await axios.post(API_URL, Attribute_TypesData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (Attribute_TypesData) => {
    try {
      const attribute_typeID = Attribute_TypesData.attribute_type_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating attribute_type data:', JSON.stringify(Attribute_TypesData));
      
      const response = await axios.put(`${API_URL}/${attribute_typeID}`, Attribute_TypesData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (attribute_typeID) => {
    try {
      console.log('Deleting product with ID:', attribute_typeID);
      const response = await axios.delete(`${API_URL}/${attribute_typeID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default Attribute_TypesService;