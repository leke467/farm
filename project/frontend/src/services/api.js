// API service for Terra Track frontend
const API_BASE_URL = "http://localhost:8000/api";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem("authToken", token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  // Get headers with authentication
  getHeaders(skipAuth = false) {
    const headers = {
      "Content-Type": "application/json",
    };
    if (!skipAuth) {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Token ${token}`;
      }
    }
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}, skipAuth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(skipAuth),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Instead of throwing, return the error data with a flag
        return { _error: true, ...data, status: response.status };
      }
      return data;
    } catch (error) {
      // Return a generic error object
      return { _error: true, error: error.message };
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request(
      "/auth/login/",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      true
    ); // skipAuth true for login

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async register(userData) {
    const response = await this.request(
      "/auth/register/",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
      true
    ); // skipAuth true for register

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request("/auth/logout/", {
        method: "POST",
      });
    } finally {
      this.removeToken();
    }
  }

  async getProfile() {
    return this.request("/auth/profile/");
  }

  async updateProfile(data) {
    return this.request("/auth/profile/update/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(passwordData) {
    return this.request("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  }

  // Farm methods
  async getFarms() {
    return this.request("/farms/");
  }

  async createFarm(farmData) {
    return this.request("/farms/", {
      method: "POST",
      body: JSON.stringify(farmData),
    });
  }

  async updateFarm(id, farmData) {
    return this.request(`/farms/${id}/`, {
      method: "PUT",
      body: JSON.stringify(farmData),
    });
  }

  async deleteFarm(id) {
    return this.request(`/farms/${id}/`, {
      method: "DELETE",
    });
  }

  async getFarmMembers(farmId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/farms/${farmId}/members/${queryString ? `?${queryString}` : ""}`);
  }

  async createFarmMember(farmId, memberData) {
    return this.request(`/farms/${farmId}/members/`, {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  }

  async getFarmPermissionsCatalog(farmId) {
    return this.request(`/farms/${farmId}/permissions/catalog/`);
  }

  async getRoleMenuPermissions(farmId, role) {
    return this.request(`/farms/${farmId}/permissions/roles/${role}/`);
  }

  async updateRoleMenuPermissions(farmId, role, payload) {
    return this.request(`/farms/${farmId}/permissions/roles/${role}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getUserMenuPermissions(farmId, userId) {
    return this.request(`/farms/${farmId}/permissions/users/${userId}/`);
  }

  async updateUserMenuPermissions(farmId, userId, payload) {
    return this.request(`/farms/${farmId}/permissions/users/${userId}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getMyFarmPermissions(farmId) {
    return this.request(`/farms/${farmId}/permissions/me/`);
  }

  // Animal methods
  async getAnimals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/animals/${queryString ? `?${queryString}` : ""}`);
  }

  async createAnimal(animalData) {
    return this.request("/animals/", {
      method: "POST",
      body: JSON.stringify(animalData),
    });
  }

  async updateAnimal(id, animalData) {
    return this.request(`/animals/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(animalData),
    });
  }

  async deleteAnimal(id) {
    return this.request(`/animals/${id}/`, {
      method: "DELETE",
    });
  }

  async getAnimalWeights(animalId) {
    return this.request(`/animals/${animalId}/weights/`);
  }

  async addAnimalWeight(animalId, weightData) {
    return this.request(`/animals/${animalId}/weights/`, {
      method: "POST",
      body: JSON.stringify(weightData),
    });
  }

  // Crop methods
  async getCrops(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/crops/${queryString ? `?${queryString}` : ""}`);
  }

  async createCrop(cropData) {
    return this.request("/crops/", {
      method: "POST",
      body: JSON.stringify(cropData),
    });
  }

  async updateCrop(id, cropData) {
    return this.request(`/crops/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(cropData),
    });
  }

  async deleteCrop(id) {
    return this.request(`/crops/${id}/`, {
      method: "DELETE",
    });
  }

  // Task methods
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tasks/${queryString ? `?${queryString}` : ""}`);
  }

  async createTask(taskData) {
    return this.request("/tasks/", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}/`, {
      method: "DELETE",
    });
  }

  // Inventory methods
  async getInventory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/${queryString ? `?${queryString}` : ""}`);
  }

  async createInventoryItem(itemData) {
    return this.request("/inventory/", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(id, itemData) {
    return this.request(`/inventory/${id}/`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory/${id}/`, {
      method: "DELETE",
    });
  }

  async getLowStockItems() {
    return this.request("/inventory/low-stock/");
  }

  // Expense methods
  async getExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses/${queryString ? `?${queryString}` : ""}`);
  }

  async createExpense(expenseData) {
    return this.request("/expenses/", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/expenses/${id}/`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}/`, {
      method: "DELETE",
    });
  }

  async getExpenseSummary() {
    return this.request("/expenses/summary/");
  }

  // Reports methods
  async getDashboardAnalytics() {
    return this.request("/reports/analytics/");
  }

  async getProductionReport(year) {
    return this.request(`/reports/production/${year ? `?year=${year}` : ""}`);
  }

  async getReports() {
    return this.request("/reports/");
  }

  async createReport(reportData) {
    return this.request("/reports/", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  // Phase 2 Inventory - Forecasting & Supplier Management
  async getDemandForecasts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/forecasts/${queryString ? `?${queryString}` : ""}`);
  }

  async createDemandForecast(forecastData) {
    return this.request("/inventory/forecasts/", {
      method: "POST",
      body: JSON.stringify(forecastData),
    });
  }

  async updateDemandForecast(id, forecastData) {
    return this.request(`/inventory/forecasts/${id}/`, {
      method: "PUT",
      body: JSON.stringify(forecastData),
    });
  }

  async deleteDemandForecast(id) {
    return this.request(`/inventory/forecasts/${id}/`, {
      method: "DELETE",
    });
  }

  async getForecastOptimization(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/forecasts/optimization/${queryString ? `?${queryString}` : ""}`);
  }

  async getSuppliers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/suppliers/${queryString ? `?${queryString}` : ""}`);
  }

  async createSupplier(supplierData) {
    return this.request("/inventory/suppliers/", {
      method: "POST",
      body: JSON.stringify(supplierData),
    });
  }

  async updateSupplier(id, supplierData) {
    return this.request(`/inventory/suppliers/${id}/`, {
      method: "PUT",
      body: JSON.stringify(supplierData),
    });
  }

  async deleteSupplier(id) {
    return this.request(`/inventory/suppliers/${id}/`, {
      method: "DELETE",
    });
  }

  async getSupplierComparison(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/suppliers/comparison/${queryString ? `?${queryString}` : ""}`);
  }

  // Phase 2 Animals - Breeding & Production Records
  async getBreedingRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/animals/breeding-records/${queryString ? `?${queryString}` : ""}`);
  }

  async createBreedingRecord(breedingData) {
    return this.request("/animals/breeding-records/", {
      method: "POST",
      body: JSON.stringify(breedingData),
    });
  }

  async updateBreedingRecord(id, breedingData) {
    return this.request(`/animals/breeding-records/${id}/`, {
      method: "PUT",
      body: JSON.stringify(breedingData),
    });
  }

  async deleteBreedingRecord(id) {
    return this.request(`/animals/breeding-records/${id}/`, {
      method: "DELETE",
    });
  }

  async getProductionRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/animals/production-records/${queryString ? `?${queryString}` : ""}`);
  }

  async createProductionRecord(productionData) {
    return this.request("/animals/production-records/", {
      method: "POST",
      body: JSON.stringify(productionData),
    });
  }

  async updateProductionRecord(id, productionData) {
    return this.request(`/animals/production-records/${id}/`, {
      method: "PUT",
      body: JSON.stringify(productionData),
    });
  }

  async deleteProductionRecord(id) {
    return this.request(`/animals/production-records/${id}/`, {
      method: "DELETE",
    });
  }

  async getAnimalProductionMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/animals/production-metrics/${queryString ? `?${queryString}` : ""}`);
  }

  async getAnimalProductionMetricDetail(id) {
    return this.request(`/animals/production-metrics/${id}/`);
  }

  // Phase 2 Expenses - Financial Analytics
  async getRevenues(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses/revenues/${queryString ? `?${queryString}` : ""}`);
  }

  async createRevenue(revenueData) {
    return this.request("/expenses/revenues/", {
      method: "POST",
      body: JSON.stringify(revenueData),
    });
  }

  async updateRevenue(id, revenueData) {
    return this.request(`/expenses/revenues/${id}/`, {
      method: "PUT",
      body: JSON.stringify(revenueData),
    });
  }

  async deleteRevenue(id) {
    return this.request(`/expenses/revenues/${id}/`, {
      method: "DELETE",
    });
  }

  async getFinancialAnalysis(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses/financial-analysis/${queryString ? `?${queryString}` : ""}`);
  }

  async createFinancialAnalysis(analysisData) {
    return this.request("/expenses/financial-analysis/", {
      method: "POST",
      body: JSON.stringify(analysisData),
    });
  }

  async updateFinancialAnalysis(id, analysisData) {
    return this.request(`/expenses/financial-analysis/${id}/`, {
      method: "PUT",
      body: JSON.stringify(analysisData),
    });
  }

  async deleteFinancialAnalysis(id) {
    return this.request(`/expenses/financial-analysis/${id}/`, {
      method: "DELETE",
    });
  }

  async getDebtManagement(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses/debts/${queryString ? `?${queryString}` : ""}`);
  }

  async createDebt(debtData) {
    return this.request("/expenses/debts/", {
      method: "POST",
      body: JSON.stringify(debtData),
    });
  }

  async updateDebt(id, debtData) {
    return this.request(`/expenses/debts/${id}/`, {
      method: "PUT",
      body: JSON.stringify(debtData),
    });
  }

  async deleteDebt(id) {
    return this.request(`/expenses/debts/${id}/`, {
      method: "DELETE",
    });
  }

  // Phase 2 Crops - Yield & Environmental Intelligence
  async getCropYieldAnalysis(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/crops/yield-analysis/${queryString ? `?${queryString}` : ""}`);
  }

  async createCropYieldAnalysis(yieldData) {
    return this.request("/crops/yield-analysis/", {
      method: "POST",
      body: JSON.stringify(yieldData),
    });
  }

  async updateCropYieldAnalysis(id, yieldData) {
    return this.request(`/crops/yield-analysis/${id}/`, {
      method: "PUT",
      body: JSON.stringify(yieldData),
    });
  }

  async deleteCropYieldAnalysis(id) {
    return this.request(`/crops/yield-analysis/${id}/`, {
      method: "DELETE",
    });
  }

  async getFertilizerRecommendations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/crops/fertilizer-recommendations/${queryString ? `?${queryString}` : ""}`);
  }

  async createFertilizerRecommendation(recommendationData) {
    return this.request("/crops/fertilizer-recommendations/", {
      method: "POST",
      body: JSON.stringify(recommendationData),
    });
  }

  async updateFertilizerRecommendation(id, recommendationData) {
    return this.request(`/crops/fertilizer-recommendations/${id}/`, {
      method: "PUT",
      body: JSON.stringify(recommendationData),
    });
  }

  async deleteFertilizerRecommendation(id) {
    return this.request(`/crops/fertilizer-recommendations/${id}/`, {
      method: "DELETE",
    });
  }

  async getWeatherImpactRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/crops/weather-impacts/${queryString ? `?${queryString}` : ""}`);
  }

  async createWeatherImpactRecord(weatherData) {
    return this.request("/crops/weather-impacts/", {
      method: "POST",
      body: JSON.stringify(weatherData),
    });
  }

  async updateWeatherImpactRecord(id, weatherData) {
    return this.request(`/crops/weather-impacts/${id}/`, {
      method: "PUT",
      body: JSON.stringify(weatherData),
    });
  }

  async deleteWeatherImpactRecord(id) {
    return this.request(`/crops/weather-impacts/${id}/`, {
      method: "DELETE",
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
