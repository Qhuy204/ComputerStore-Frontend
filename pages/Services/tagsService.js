import axios from 'axios';

const API_URL = 'http://localhost:5000/tags';

const tagsService = {
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

  getById: async (tag_name) => {
    try {
      const url = `${API_URL}/${tag_name}`;
      console.log('Request URL:', url);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },

  insert: async (tagsData) => {
    try {
      console.log('Adding tags data:', JSON.stringify(tagsData));
      const response = await axios.post(API_URL, tagsData, {
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

  update: async (tagsData) => {
    try {
      const tagsID = tagsData.tags_id;
      const response = await axios.put(`${API_URL}/${tagsID}`, tagsData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  delete: async (tag_name) => {
    try {
      console.log('Deleting tags with ID:', tag_name);
      const response = await axios.delete(`${API_URL}/${tag_name}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};

export default tagsService;