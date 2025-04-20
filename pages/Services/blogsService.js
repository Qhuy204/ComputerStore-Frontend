import axios from 'axios';

const API_URL = 'http://localhost:5000/blogs';

const blogsService = {
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

  insert: async (blogsData) => {
    try {
      console.log('Adding blogs data:', JSON.stringify(blogsData));
      const response = await axios.post(API_URL, blogsData, {
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

  update: async (blogsData) => {
    try {
      const blogId = blogsData.blog_id;
      if (!blogId) {
        throw new Error('blog_id is required for updating a blog');
      }
      console.log('Sending update request to:', `${API_URL}/${blogId}`);
      console.log('With data:', JSON.stringify(blogsData));
      const response = await axios.put(`${API_URL}/${blogId}`, blogsData);
      return response.data;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  },

  delete: async (blogsID) => {
    try {
      console.log('Deleting blogs with ID:', blogsID);
      const response = await axios.delete(`${API_URL}/${blogsID}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  },

  getBySlug: async (slug) => {
    try {
      const url = `${API_URL}/slug/${slug}`;
      console.log('Fetching blog by slug:', url);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching blog by slug:', error);
      throw error;
    }
  },
  
};

export default blogsService;