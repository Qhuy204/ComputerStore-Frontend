import axios from 'axios';

const API_URL = 'http://localhost:5000/variant_attribute_values';

const Variant_Attribute_ValuesService = {
  // Get all variant attribute values
  getAll: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching variant attribute values:', error);
      throw error;
    }
  },

  // Get variant attribute values by variant ID and attribute value ID
  getById: async (variantId) => {
    try {
      const url = `${API_URL}/${variantId}`;
      console.log('Request URL:', url);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching variant attribute values by ID:', error);
      throw error;
    }
  },

  // Insert new variant attribute values
  insert: async (variantAttributeValuesData) => {
    try {
      console.log('Adding variant attribute values:', JSON.stringify(variantAttributeValuesData));
      const response = await axios.post(API_URL, variantAttributeValuesData);
      return response.data;
    } catch (error) {
      console.error('Error adding variant attribute values:', error);
      throw error;
    }
  },

  // Update existing variant attribute values
  update: async (variantId, variantAttributeValuesData) => {
    try {
      console.log('Updating variant attribute values:', JSON.stringify(variantAttributeValuesData));
      
      const url = `${API_URL}/${variantId}`;
      const response = await axios.put(url, variantAttributeValuesData);
      return response.data;
    } catch (error) {
      console.error('Error updating variant attribute values:', error);
      throw error;
    }
  },

  // Delete variant attribute values
  delete: async (variantId, attributeValueId) => {
    try {
      console.log(`Deleting variant attribute values with variantId: ${variantId}, attributeValueId: ${attributeValueId}`);
      const url = `${API_URL}/${variantId}/${attributeValueId}`;
      const response = await axios.delete(url);
      return response.data;
    } catch (error) {
      console.error('Error deleting variant attribute values:', error);
      throw error;
    }
  }
};

export default Variant_Attribute_ValuesService;