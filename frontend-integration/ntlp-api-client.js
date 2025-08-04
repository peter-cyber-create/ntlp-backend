// Frontend API Client for NTLP Backend Integration
// Copy this file to your Next.js frontend project

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class NTLPApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.adminToken = null;
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add admin token if available
    if (this.adminToken) {
      config.headers.Authorization = `Bearer ${this.adminToken}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // API documentation
  async getApiDocs() {
    return this.request('/api');
  }

  // Contact methods
  async getContacts(page = 1, limit = 50) {
    return this.request(`/api/contacts?page=${page}&limit=${limit}`);
  }

  async createContact(contactData) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async getContact(id) {
    return this.request(`/api/contacts/${id}`);
  }

  async updateContact(id, data) {
    return this.request(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id) {
    return this.request(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Registration methods
  async getRegistrations(page = 1, limit = 50) {
    return this.request(`/api/registrations?page=${page}&limit=${limit}`);
  }

  async createRegistration(registrationData) {
    return this.request('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  // Abstract methods
  async getAbstracts(page = 1, limit = 50) {
    return this.request(`/api/abstracts?page=${page}&limit=${limit}`);
  }

  async createAbstract(abstractData) {
    return this.request('/api/abstracts', {
      method: 'POST',
      body: JSON.stringify(abstractData),
    });
  }

  // Speaker methods
  async getSpeakers() {
    return this.request('/api/speakers');
  }

  async createSpeaker(speakerData) {
    return this.request('/api/speakers', {
      method: 'POST',
      body: JSON.stringify(speakerData),
    });
  }

  // Session methods
  async getSessions() {
    return this.request('/api/sessions');
  }

  async createSession(sessionData) {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Admin methods
  async adminLogin(email, password) {
    const response = await this.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.adminToken = response.token;
      localStorage.setItem('ntlp_admin_token', response.token);
    }
    
    return response;
  }

  async getAdminDashboard() {
    return this.request('/api/admin/dashboard');
  }

  async getAdminActivity(limit = 20) {
    return this.request(`/api/admin/activity?limit=${limit}`);
  }

  async getPendingItems() {
    return this.request('/api/admin/pending');
  }

  // Initialize admin token from localStorage
  initializeAdminToken() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ntlp_admin_token');
      if (token) {
        this.adminToken = token;
      }
    }
  }

  // Clear admin session
  adminLogout() {
    this.adminToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ntlp_admin_token');
    }
  }
}

// Create singleton instance
const apiClient = new NTLPApiClient();

// Initialize admin token on client side
if (typeof window !== 'undefined') {
  apiClient.initializeAdminToken();
}

export default apiClient;

// Export helper hooks for React components
export const useNTLPApi = () => apiClient;

// Example usage in React components:
/*
import apiClient, { useNTLPApi } from './ntlp-api-client';

// In a React component:
const ContactForm = () => {
  const api = useNTLPApi();
  
  const handleSubmit = async (formData) => {
    try {
      const result = await api.createContact(formData);
      console.log('Contact created:', result);
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  // ... rest of component
};
*/
