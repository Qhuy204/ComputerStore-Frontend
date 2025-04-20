import axios from 'axios';

const API_URL = 'http://localhost:5000/User_Addresses';

const usersService = {
  getAll: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  getById: async (id) => {
    if (!id) {
      console.warn('No user ID provided to getById');
      return []; // Return empty array if no ID is provided
    }
    
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      // Handle 404 errors specifically (no addresses found)
      if (error.response && error.response.status === 404) {
        console.warn(`No addresses found for user ID: ${id}`);
        return []; // Return empty array instead of throwing error
      }
      
      console.error('Error fetching addresses by user ID:', error);
      return []; // Return empty array for all errors
    }
  },
  

  insert: async (addressData) => {
    try {
      console.log('Adding user data:', JSON.stringify(addressData));
      const response = await axios.post(API_URL, addressData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (addressData) => {
    try {
      const addressID = addressData.address_id;
      const response = await axios.put(`${API_URL}/${addressID}`, addressData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (addressID) => {
    try {
      console.log('Deleting address with ID:', addressID);
      const response = await axios.delete(`${API_URL}/${addressID}`);
      return response.data;
    } catch (error) {
      console.error('Detailed delete error:', error.response ? error.response.data : error);
      throw error;
    }
  },

  checkUsername: function(username) {
    return axios.get(`${API_URL}/check-username/${encodeURIComponent(username)}`)
      .then(response => {
        if (response.data.success) {
          return response.data.exists;
        }
        throw new Error('Failed to check username');
      });
  }
};

export default usersService;