export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

type ApiOptions = {
  method?: string;
  body?: unknown;
  token: string;
};

export const apiClient = async <T>(endpoint: string, { method = 'GET', body, token }: ApiOptions): Promise<T> => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (response.status === 404) {
      throw new NotFoundError();
    }
    
    // Try to parse JSON error message from backend if available
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ') 
          : errorData.message;
      }
    } catch (e) {
      // Ignore JSON parse errors for error responses
    }
    
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
