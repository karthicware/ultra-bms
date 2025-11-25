/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class TestApiClient {
  private token: string | null = null;

  async login(email = 'admin@ultrabms.com', password = 'Admin@123') {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      this.token = response.data.accessToken;
      return this.token;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Force a new login, discarding cached token
   * Useful for refreshing expired tokens
   */
  async refreshToken() {
    this.token = null;
    return this.login();
  }

  /**
   * Make request with automatic retry on 401 errors
   */
  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      const axiosError = error as AxiosError;
      // Retry once on 401 (token expired/blacklisted)
      if (axiosError.response?.status === 401 && retryCount === 0) {
        console.log('Token expired, refreshing and retrying...');
        await this.refreshToken();
        return this.makeRequestWithRetry(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    if (!this.token) await this.login();
    return this.makeRequestWithRetry(() =>
      axios.post(`${API_URL}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
    );
  }

  async delete(endpoint: string) {
    if (!this.token) await this.login();
    return this.makeRequestWithRetry(() =>
      axios.delete(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
    );
  }

  async get(endpoint: string) {
    if (!this.token) await this.login();
    return this.makeRequestWithRetry(() =>
      axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
    );
  }

  async put(endpoint: string, data: any) {
    if (!this.token) await this.login();
    return this.makeRequestWithRetry(() =>
      axios.put(`${API_URL}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
    );
  }
}
