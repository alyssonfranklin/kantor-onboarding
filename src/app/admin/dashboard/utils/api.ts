// API utilities for admin dashboard operations

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Update an entity (user, company, department, employee)
 */
export const updateEntity = async (
  entityType: string, 
  id: string, 
  data: any, 
  token: string
): Promise<any> => {
  // Define the endpoints and ID field names for each entity type
  const endpoints: Record<string, { url: string; method: string }> = {
    users: { 
      url: `/api/v1/users/${id}`, 
      method: 'PUT'
    },
    companies: { 
      url: `/api/v1/companies/${id}`, 
      method: 'PUT'
    },
    departments: { 
      url: `/api/v1/departments/${id}`, 
      method: 'PUT'
    },
    employees: { 
      url: `/api/v1/employees/${id}`, 
      method: 'PUT'
    },
  };
  
  const endpoint = endpoints[entityType];
  if (!endpoint) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    const result: ApiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Failed to update ${entityType}`);
    }
    
    return result.data || { ...data, updated: true };
  } catch (error) {
    console.error(`Error updating ${entityType}:`, error);
    throw error;
  }
};

/**
 * Delete an entity (user, company, department, employee)
 */
export const deleteEntity = async (
  entityType: string, 
  id: string, 
  token: string
): Promise<void> => {
  // Define the endpoints for each entity type
  const endpoints: Record<string, { url: string }> = {
    users: { url: `/api/v1/users/${id}` },
    companies: { url: `/api/v1/companies/${id}` },
    departments: { url: `/api/v1/departments/${id}` },
    employees: { url: `/api/v1/employees/${id}` },
    tokens: { url: `/api/logout` }, // For logging out/invalidating tokens
  };
  
  const endpoint = endpoints[entityType];
  if (!endpoint) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  try {
    // Special case for tokens (logout)
    const method = entityType === 'tokens' ? 'POST' : 'DELETE';
    const body = entityType === 'tokens' ? JSON.stringify({ token }) : undefined;
    
    const response = await fetch(endpoint.url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    });
    
    const result: ApiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Failed to delete ${entityType}`);
    }
  } catch (error) {
    console.error(`Error deleting ${entityType}:`, error);
    throw error;
  }
};