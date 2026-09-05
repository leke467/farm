const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    const trimmed = envUrl.trim().replace(/\/$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }
  // Fallback for deployed production environments (Netlify/Vercel/etc.)
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://farm-production-7a6b.up.railway.app/api";
  }
  return "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

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
    if (!skipAuth && !localStorage.getItem("authToken")) {
      return { _error: true, status: 401, detail: "Authentication required" };
    }
    let cleanEndpoint = endpoint || "";
    if (cleanEndpoint.startsWith("/api/")) {
      cleanEndpoint = cleanEndpoint.substring(4);
    } else if (cleanEndpoint.startsWith("api/")) {
      cleanEndpoint = cleanEndpoint.substring(3);
    }
    if (!cleanEndpoint.startsWith("/")) {
      cleanEndpoint = "/" + cleanEndpoint;
    }
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    const config = {
      headers: this.getHeaders(skipAuth),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
        }
        return { _error: true, ...data, status: response.status };
      }
      return data;
    } catch (error) {
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

  // Generic GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  // Generic POST request
  async post(endpoint, data = null, options = {}) {
    const config = {
      ...options,
      method: "POST",
    };
    if (data) {
      config.body = JSON.stringify(data);
    }
    return this.request(endpoint, config);
  }

  // Generic PUT request
  async put(endpoint, data = null, options = {}) {
    const config = {
      ...options,
      method: "PUT",
    };
    if (data) {
      config.body = JSON.stringify(data);
    }
    return this.request(endpoint, config);
  }

  // Generic DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  // Farm Categories
  async getFarmCategories(farmId, categoryType = '') {
    const params = categoryType ? `?category_type=${categoryType}` : '';
    return this.request(`/farms/${farmId}/categories/${params}`);
  }

  async createFarmCategory(farmId, categoryData) {
    return this.request(`/farms/${farmId}/categories/`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateFarmCategory(farmId, categoryId, categoryData) {
    return this.request(`/farms/${farmId}/categories/${categoryId}/`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteFarmCategory(farmId, categoryId) {
    return this.request(`/farms/${farmId}/categories/${categoryId}/`, {
      method: 'DELETE',
    });
  }

  // Subscription methods
  async getSubscriptionPlans() {
    return this.request('/subscriptions/plans/', {}, true);
  }

  async getMySubscription(farmId = null) {
    const query = farmId ? `?farm=${farmId}` : '';
    return this.request(`/subscriptions/me/${query}`);
  }

  async subscribe(planId, idempotencyKey, redirectUrl = '', couponCode = null) {
    return this.request('/subscriptions/subscribe/', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, idempotency_key: idempotencyKey, redirect_url: redirectUrl, coupon_code: couponCode }),
    });
  }

  async verifySubscriptionPayment(reference) {
    return this.request(`/subscriptions/verify/${reference}/`);
  }

  async verifyLatestSubscriptionPayment() {
    return this.request('/subscriptions/verify-latest/');
  }

  async cancelSubscription() {
    return this.request('/subscriptions/cancel/', {
      method: 'POST',
    });
  }

  async applyCoupon(code, planId = null) {
    return this.request('/subscriptions/apply-coupon/', {
      method: 'POST',
      body: JSON.stringify({ code, plan_id: planId }),
    });
  }

  async getSuperadminCoupons() {
    return this.request('/subscriptions/coupons/');
  }

  async createSuperadminCoupon(couponData) {
    return this.request('/subscriptions/coupons/', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  }

  async updateSuperadminCoupon(id, couponData) {
    return this.request(`/subscriptions/coupons/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(couponData),
    });
  }

  async deleteSuperadminCoupon(id) {
    return this.request(`/subscriptions/coupons/${id}/`, {
      method: 'DELETE',
    });
  }

  // AI Agent methods
  async getAIAnalysis(farmId = null) {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/ai-agent/analyze/${query}`);
  }

  async getAIRecommendations(farmId = null) {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/ai-agent/recommendations/${query}`);
  }

  async getAIAlerts(farmId = null) {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/ai-agent/alerts/${query}`);
  }

  async getAIForecast(farmId = null) {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/ai-agent/forecast/${query}`);
  }

  async chatWithAI(message, recommendationTitle = null, farmId = null) {
    return this.request('/ai-agent/chat/', {
      method: 'POST',
      body: JSON.stringify({
        message,
        recommendation_title: recommendationTitle,
        farm_id: farmId,
      }),
    });
  }

  async askAIAgent(message, farmId = null) {
    return this.request('/ai-agent/chat/', {
      method: 'POST',
      body: JSON.stringify({
        message,
        farm_id: farmId,
      }),
    });
  }

  // Contact & Superadmin Methods
  async submitContactMessage(contactData) {
    return this.request('/reports/contact/', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async getSuperadminStats() {
    return this.request('/reports/superadmin/stats/');
  }

  async getSuperadminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/superadmin/users/${query ? `?${query}` : ''}`);
  }

  async updateSuperadminUser(id, userData) {
    return this.request(`/reports/superadmin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async getSuperadminFarms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/superadmin/farms/${query ? `?${query}` : ''}`);
  }

  async getDisputes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/superadmin/disputes/${query ? `?${query}` : ''}`);
  }

  async createDispute(disputeData) {
    return this.request('/reports/superadmin/disputes/', {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
  }

  async updateDispute(id, disputeData) {
    return this.request(`/reports/superadmin/disputes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(disputeData),
    });
  }

  async getContactMessages(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/superadmin/contact-messages/${query ? `?${query}` : ''}`);
  }

  async updateContactMessage(id, messageData) {
    return this.request(`/reports/superadmin/contact-messages/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(messageData),
    });
  }

  async getSuperadminSubscriptions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/superadmin/subscriptions/${query ? `?${query}` : ''}`);
  }

  async getSuperadminPayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/superadmin/payments/${query ? `?${query}` : ''}`);
  }

  async manageSubscription(payload) {
    return this.request('/reports/superadmin/subscriptions/manage/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
