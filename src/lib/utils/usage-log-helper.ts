/**
 * Helper function to log company status changes
 * This can be called from frontend pages to record usage logs
 */

export const logCompanyStatus = async (companyId: string, statusId: string, token?: string) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/v1/usage-logs', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        company_id: companyId,
        last_status_id: statusId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to log company status:', errorData);
      return { success: false, error: errorData };
    }
    
    const result = await response.json();
    console.log('Company status logged successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error logging company status:', error);
    return { success: false, error };
  }
};

// Status constants for easy reference
export const COMPANY_STATUS = {
  ACCOUNT_CREATED: '6233-832932-1313',      // After agent-org-creation
  ONBOARDING_COMPLETED: '6123-98712312-8923', // After onboarding-company
  DEPARTMENT_CREATED: '8290-90232442-0233',   // After admin/departments/create
  USER_CREATED: '6723-09823413-0002'         // After admin/users/create
} as const;