import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class TestApiClient {
  private token: string | null = null;

  async login(email = 'admin@ultrabms.com', password = 'password') {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      this.token = response.data.token;
      return this.token;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    if (!this.token) await this.login();
    return axios.post(`${API_URL}${endpoint}`, data, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }

  async delete(endpoint: string) {
    if (!this.token) await this.login();
    return axios.delete(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
  
  async get(endpoint: string) {
    if (!this.token) await this.login();
    return axios.get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}
