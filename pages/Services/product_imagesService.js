import axios from 'axios';

const API_URL = 'http://localhost:5000/Product_Images';

var token = '';

const Product_ImagesService = {
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
  

  insert: async (Product_ImagesData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding variant data:', JSON.stringify(Product_ImagesData));
      const response = await axios.post(API_URL, Product_ImagesData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  update: async (Product_ImagesData) => {
    try {
      const imageID = Product_ImagesData.image_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating image data:', JSON.stringify(Product_ImagesData));
      
      const response = await axios.put(`${API_URL}/${imageID}`, Product_ImagesData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (imageID) => {
    try {
      console.log('Deleting image with ID:', imageID);
      const response = await axios.delete(`${API_URL}/${imageID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default Product_ImagesService;