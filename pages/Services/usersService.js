import axios from 'axios';

const API_URL = 'http://localhost:5000/users';

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
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },

  insert: async (userData) => {
    try {
      console.log('Adding user data:', JSON.stringify(userData));
      const response = await axios.post(API_URL, userData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (userData) => {
    try {
      const userID = userData.user_id;
      const response = await axios.put(`${API_URL}/${userID}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (userID) => {
    try {
      console.log('Deleting user with ID:', userID);
      const response = await axios.delete(`${API_URL}/${userID}`);
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
  },
  getOrdersByUserID: async (userID) => {
    try {
      const response = await axios.get(`${API_URL}/list/orders/${userID}`);
      return response.data;
    } catch (error) {
      // Kiểm tra nếu lỗi có mã 404 (Không tìm thấy dữ liệu)
      if (error.response && error.response.status === 404) {
        console.warn('No orders found for the user, returning empty array.');
        return [];  // Trả về mảng rỗng nếu lỗi 404
      }
  
      // Nếu lỗi không phải 404, ném lỗi để có thể xử lý ở nơi khác
      console.error('Error fetching orders by user ID:', error);
      return [];  // Trả về mảng rỗng để tránh ứng dụng bị dừng
    }
  },
  
};

export default usersService;