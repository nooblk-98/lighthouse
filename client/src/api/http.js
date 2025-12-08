const API_BASE = '/api';

const parseErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data?.detail || data?.message || response.statusText;
  } catch {
    return response.statusText || 'Request failed';
  }
};

export async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}
