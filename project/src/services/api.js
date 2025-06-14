// API service for Terra Track frontend
const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
      });
    } finally {
      this.removeToken();
    }
  }

  async getProfile() {
    return this.request('/auth/profile/');
  }

  async updateProfile(data) {
    return this.request('/auth/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Farm methods
  async getFarms() {
    return this.request('/farms/');
  }

  async createFarm(farmData) {
    return this.request('/farms/', {
      method: 'POST',
      body: JSON.stringify(farmData),
    });
  }

  async updateFarm(id, farmData) {
    return this.request(`/farms/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(farmData),
    });
  }

  async deleteFarm(id) {
    return this.request(`/farms/${id}/`, {
      method: 'DELETE',
    });
  }

  // Animal methods
  async getAnimals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/animals/${queryString ? `?${queryString}` : ''}`);
  }

  async createAnimal(animalData) {
    return this.request('/animals/', {
      method: 'POST',
      body: JSON.stringify(animalData),
    });
  }

  async updateAnimal(id, animalData) {
    return this.request(`/animals/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(animalData),
    });
  }

  async deleteAnimal(id) {
    return this.request(`/animals/${id}/`, {
      method: 'DELETE',
    });
  }

  async getAnimalWeights(animalId) {
    return this.request(`/animals/${animalId}/weights/`);
  }

  async addAnimalWeight(animalId, weightData) {
    return this.request(`/animals/${animalId}/weights/`, {
      method: 'POST',
      body: JSON.stringify(weightData),
    });
  }

  // Crop methods
  async getCrops(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/crops/${queryString ? `?${queryString}` : ''}`);
  }

  async createCrop(cropData) {
    return this.request('/crops/', {
      method: 'POST',
      body: JSON.stringify(cropData),
    });
  }

  async updateCrop(id, cropData) {
    return this.request(`/crops/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    });
  }

  async deleteCrop(id) {
    return this.request(`/crops/${id}/`, {
      method: 'DELETE',
    });
  }

  // Task methods
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tasks/${queryString ? `?${queryString}` : ''}`);
  }

  async createTask(taskData) {
    return this.request('/tasks/', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}/`, {
      method: 'DELETE',
    });
  }

  // Inventory methods
  async getInventory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/${queryString ? `?${queryString}` : ''}`);
  }

  async createInventoryItem(itemData) {
    return this.request('/inventory/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(id, itemData) {
    return this.request(`/inventory/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory/${id}/`, {
      method: 'DELETE',
    });
  }

  async getLowStockItems() {
    return this.request('/inventory/low-stock/');
  }

  // Expense methods
  async getExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses/${queryString ? `?${queryString}` : ''}`);
  }

  async createExpense(expenseData) {
    return this.request('/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/expenses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}/`, {
      method: 'DELETE',
    });
  }

  async getExpenseSummary() {
    return this.request('/expenses/summary/');
  }

  // Reports methods
  async getDashboardAnalytics() {
    return this.request('/reports/analytics/');
  }

  async getProductionReport(year) {
    return this.request(`/reports/production/${year ? `?year=${year}` : ''}`);
  }

  async getReports() {
    return this.request('/reports/');
  }

  async createReport(reportData) {
    return this.request('/reports/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;