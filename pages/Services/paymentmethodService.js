import axios from 'axios';

const API_URL = 'http://localhost:5000/payment_methods';

const paymentmethodService = {
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

  insert: async (paymentmethodData) => {
    try {
      console.log('Adding paymentmethod data:', JSON.stringify(paymentmethodData));
      const response = await axios.post(API_URL, paymentmethodData, {
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

  update: async (paymentmethodData) => {
    try {
      const paymentmethodID = paymentmethodData.paymentmethod_id;
      const response = await axios.put(`${API_URL}/${paymentmethodID}`, paymentmethodData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (paymentmethodID) => {
    try {
      console.log('Deleting paymentmethod with ID:', paymentmethodID);
      const response = await axios.delete(`${API_URL}/${paymentmethodID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default paymentmethodService;