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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
