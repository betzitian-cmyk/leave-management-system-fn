import { storage } from '../storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FormDataInput = Record<string, string | number | boolean | File | string[] | undefined | null>;

function createFormData(data: FormDataInput): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          formData.append(`${key}[]`, String(item));
        });
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return formData;
}

export const apiClient = {
  async post<T>(
    endpoint: string,
    data: FormData | object,
    options?: { skipAuth?: boolean }
  ): Promise<T> {
    const token = storage.getToken();
    const headers: Record<string, string> = {
      ...(!options?.skipAuth && token && { Authorization: `Bearer ${token}` }),
    };

    let body: FormData | string;
    if (data instanceof FormData) {
      body = data;
    } else {
      const hasFile = Object.values(data).some((value) => value instanceof File);
      if (hasFile) {
        body = createFormData(data as FormDataInput);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        response.status,
        errorData.error || errorData.message || 'Request failed',
        errorData
      );
    }

    return response.json();
  },

  async get<T>(endpoint: string, options?: { skipAuth?: boolean }): Promise<T> {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(!options?.skipAuth && token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        response.status,
        errorData.error || errorData.message || 'Request failed',
        errorData
      );
    }

    return response.json();
  },

  async put<T>(
    endpoint: string,
    data: FormData | object,
    options?: { skipAuth?: boolean }
  ): Promise<T> {
    const token = storage.getToken();
    const headers: Record<string, string> = {
      ...(!options?.skipAuth && token && { Authorization: `Bearer ${token}` }),
    };

    let body: FormData | string;
    if (data instanceof FormData) {
      body = data;
    } else {
      const hasFile = Object.values(data).some((value) => value instanceof File);
      if (hasFile) {
        body = createFormData(data as FormDataInput);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        response.status,
        errorData.error || errorData.message || 'Request failed',
        errorData
      );
    }

    return response.json();
  },

  async delete<T>(endpoint: string, options?: { skipAuth?: boolean }): Promise<T> {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(!options?.skipAuth && token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        response.status,
        errorData.error || errorData.message || 'Request failed',
        errorData
      );
    }

    return response.json();
  },
};
