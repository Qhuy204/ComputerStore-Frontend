import axios from 'axios';

const API_URL = 'http://localhost:5000/cart';

const cartService = {
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
      const status = error.response?.status;
      console.error(`Error fetching record by ID (${id}):`, status);
      // Trả về luôn status (hoặc bạn có thể return object tuỳ bạn)
      return { error: true, status };
    }
  },
  

  insert: async (cartData) => {
    try {
      console.log('Adding cart data:', JSON.stringify(cartData));
      const response = await axios.post(API_URL, cartData, {
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

  update: async (cartData) => {
    try {
      const cartID = cartData.cart_id;
      const response = await axios.put(`${API_URL}/${cartID}`, cartData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (cartID) => {
    try {
      console.log('Deleting cart with ID:', cartID);
      const response = await axios.delete(`${API_URL}/${cartID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default cartService;