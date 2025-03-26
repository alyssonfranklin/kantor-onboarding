/**
   * REST API-based Database Manager for the Voxerion application.
   * Handles interactions with MongoDB via REST API.
   * 
   * @class DatabaseManager
   */
  class DatabaseManager {
    constructor() {
      // Version info for debugging
      this.VERSION = "v1.1.0 - 2025-03-25 20:30";
      console.log("==== VOXERION DATABASE MANAGER ====");
      console.log(`Version: ${this.VERSION}`);
      console.log("==================================");
      
      // API configuration - Updated to use the new MongoDB API layer
      this.baseUrl = "https://kantor-onboarding-alysson-franklins-projects.vercel.app";
      console.log(`API Base URL: ${this.baseUrl}`);
      this.apiToken = "";
      
      // API endpoint structure - Updated for our new API
      this.endpoints = {
        login: "/api/v1/users/login",
        users: "/api/v1/users",
        user_by_email: "/api/v1/users?email={email}",
        companies: "/api/v1/companies",
        company_by_domain: "/api/v1/companies?domain={domain}"
      };
      
      // Try to load a saved token from cache
      try {
        const cache = CacheService.getUserCache();
        const savedToken = cache.get('VOXERION_API_TOKEN');
        if (savedToken) {
          this.apiToken = savedToken;
          console.log('Loaded saved token from cache');
        }
      } catch (e) {
        console.log('No saved token found in cache');
      }
    }

    /**
     * Sets the API token for authentication
     * @param {string} token - JWT token for API authentication
     */
    setToken(token) {
      this.apiToken = token;
    }

    /**
     * Gets the current API token
     * @return {string} The current API token
     */
    getToken() {
      return this.apiToken;
    }

    /**
     * Makes an authenticated API request to the MongoDB backend
     * @param {string} endpoint - API endpoint path (e.g., '/api/users')
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {Object} payload - Data to send (for POST/PUT)
     * @param {boolean} noAuth - If true, don't add authorization header even if token exists
     * @return {Object} Response data
     */
    makeApiRequest(endpoint, method, payload = null, noAuth = false) {
      try {
        const url = this.baseUrl + endpoint;

        const options = {
          method: method.toLowerCase(),
          headers: {
            'Content-Type': 'application/json'
          },
          muteHttpExceptions: true
        };

        // Add authentication if token is available and auth is required
        if (!noAuth && this.apiToken) {
          options.headers['Authorization'] = `Bearer ${this.apiToken}`;
        }

        // Add payload for POST/PUT
        if (payload && (method === 'post' || method === 'put')) {
          options.payload = JSON.stringify(payload);
        }

        console.log(`Making ${method.toUpperCase()} request to ${endpoint}`);
        const response = UrlFetchApp.fetch(url, options);

        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        console.log(`Response code: ${responseCode}`);

        if (responseCode >= 400) {
          if (responseCode === 401 && !noAuth) {
            // Token might be expired, clear it
            this.apiToken = "";
            const cache = CacheService.getUserCache();
            cache.remove('VOXERION_API_TOKEN');
          }
          
          console.error(`API Error: ${responseText}`);
          throw new Error(`API Error (${responseCode}): ${responseText}`);
        }

        // Parse the response - our new API formats responses consistently
        const parsedResponse = JSON.parse(responseText);
        
        // Check if we have a standard success/data format from our new API
        if (parsedResponse.status === 'success' && parsedResponse.data) {
          return parsedResponse.data;
        }
        
        return parsedResponse;
      } catch (error) {
        console.error(`Error making API request to ${endpoint}:`, error);
        throw error;
      }
    }

    /**
     * Gets all entities from a collection
     * @param {string} entityType - Type of entity (users, companies, departments, employees)
     * @param {Object} filters - Query parameters for filtering
     * @return {Array} Array of entities
     */
    getEntities(entityType, filters = {}) {
      try {
        console.log(`Getting ${entityType} with filters:`, JSON.stringify(filters));
        
        // Build query string from filters
        const queryParams = [];
        for (const key in filters) {
          if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
            queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`);
          }
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        
        // Use our defined endpoints
        let endpoint;
        switch(entityType) {
          case 'users':
            endpoint = this.endpoints.users + queryString;
            break;
          case 'companies':
            endpoint = this.endpoints.companies + queryString;
            break;
          case 'departments':
            endpoint = `/api/v1/departments${queryString}`;
            break;
          case 'employees':
            endpoint = `/api/v1/employees${queryString}`;
            break;
          default:
            endpoint = `/api/v1/${entityType}${queryString}`;
        }
        
        console.log(`Using endpoint: ${endpoint}`);
        
        // Make the request
        const response = this.makeApiRequest(endpoint, 'get');
        
        // Check if we have a paginated response
        if (response && response.pagination) {
          return response.users || 
                 response.companies || 
                 response.departments || 
                 response.employees || 
                 response[entityType] || 
                 [];
        }
        
        // If it's an array, return it directly
        if (Array.isArray(response)) {
          return response;
        }
        
        // If it's a single entity, wrap it in an array
        if (response && (response.id || response._id)) {
          return [response];
        }
        
        return [];
      } catch (error) {
        console.error(`Error in getEntities for ${entityType}:`, error);
        throw error;
      }
    }

    /**
     * Gets a single entity by ID
     * @param {string} entityType - Type of entity (users, companies, departments, employees)
     * @param {string} id - Entity ID
     * @return {Object} Entity data
     */
    getEntityById(entityType, id) {
      try {
        console.log(`Getting ${entityType} by ID: ${id}`);
        
        // Determine the endpoint based on entity type
        let endpoint;
        switch(entityType) {
          case 'users':
            endpoint = `${this.endpoints.users}/${id}`;
            break;
          case 'companies':
            endpoint = `${this.endpoints.companies}/${id}`;
            break;
          case 'departments':
            endpoint = `/api/v1/departments/${id}`;
            break;
          case 'employees':
            endpoint = `/api/v1/employees/${id}`;
            break;
          default:
            endpoint = `/api/v1/${entityType}/${id}`;
        }
        
        console.log(`Using endpoint: ${endpoint}`);
        
        // Make the request
        const response = this.makeApiRequest(endpoint, 'get');
        
        // Check various possible response formats
        if (response && response.user) {
          return response.user;
        }
        
        if (response && response.company) {
          return response.company;
        }
        
        if (response && response.department) {
          return response.department;
        }
        
        if (response && response.employee) {
          return response.employee;
        }
        
        // If it's not in a property, return the response itself
        return response;
      } catch (error) {
        console.error(`Error in getEntityById for ${entityType}:`, error);
        
        // Try a query approach as last resort
        try {
          console.log(`Trying query approach for ${entityType} with ID: ${id}`);
          const entities = this.getEntities(entityType, { id: id });
          
          if (entities && entities.length > 0) {
            console.log(`Found ${entityType} by ID using query approach`);
            return entities[0];
          }
        } catch (queryError) {
          console.log(`Query approach failed: ${queryError.message}`);
        }
        
        return null;
      }
    }

    /**
     * Creates a new entity
     * @param {string} entityType - Type of entity (users, companies, departments, employees)
     * @param {Object} data - Entity data
     * @return {Object} Created entity data
     */
    createEntity(entityType, data) {
      try {
        // Determine the endpoint based on entity type
        let endpoint;
        switch(entityType) {
          case 'users':
            endpoint = this.endpoints.users;
            break;
          case 'companies':
            endpoint = this.endpoints.companies;
            break;
          case 'departments':
            endpoint = "/api/v1/departments";
            break;
          case 'employees':
            endpoint = "/api/v1/employees";
            break;
          default:
            endpoint = `/api/v1/${entityType}`;
        }
        
        console.log(`Creating ${entityType} with endpoint: ${endpoint}`);
        
        // Make the request
        const response = this.makeApiRequest(endpoint, 'post', data);
        
        // Check various possible response formats
        if (response && response.user) {
          return response.user;
        }
        
        if (response && response.company) {
          return response.company;
        }
        
        if (response && response.department) {
          return response.department;
        }
        
        if (response && response.employee) {
          return response.employee;
        }
        
        return response;
      } catch (error) {
        console.error(`Error in createEntity for ${entityType}:`, error);
        throw error;
      }
    }

    /**
     * Updates an existing entity
     * @param {string} entityType - Type of entity (users, companies, departments, employees)
     * @param {string} id - Entity ID
     * @param {Object} data - Updated entity data
     * @return {Object} Updated entity data
     */
    updateEntity(entityType, id, data) {
      try {
        // Determine the endpoint based on entity type
        let endpoint;
        switch(entityType) {
          case 'users':
            endpoint = `${this.endpoints.users}/${id}`;
            break;
          case 'companies':
            endpoint = `${this.endpoints.companies}/${id}`;
            break;
          case 'departments':
            endpoint = `/api/v1/departments/${id}`;
            break;
          case 'employees':
            endpoint = `/api/v1/employees/${id}`;
            break;
          default:
            endpoint = `/api/v1/${entityType}/${id}`;
        }
        
        console.log(`Updating ${entityType} with endpoint: ${endpoint}`);
        
        // Make the request
        const response = this.makeApiRequest(endpoint, 'put', data);
        
        // Check various possible response formats
        if (response && response.user) {
          return response.user;
        }
        
        if (response && response.company) {
          return response.company;
        }
        
        if (response && response.department) {
          return response.department;
        }
        
        if (response && response.employee) {
          return response.employee;
        }
        
        return response;
      } catch (error) {
        console.error(`Error in updateEntity for ${entityType}:`, error);
        throw error;
      }
    }

    /**
     * Deletes an entity
     * @param {string} entityType - Type of entity (users, companies, departments, employees)
     * @param {string} id - Entity ID
     * @return {boolean} Success status
     */
    deleteEntity(entityType, id) {
      try {
        // Determine the endpoint based on entity type
        let endpoint;
        switch(entityType) {
          case 'users':
            endpoint = `${this.endpoints.users}/${id}`;
            break;
          case 'companies':
            endpoint = `${this.endpoints.companies}/${id}`;
            break;
          case 'departments':
            endpoint = `/api/v1/departments/${id}`;
            break;
          case 'employees':
            endpoint = `/api/v1/employees/${id}`;
            break;
          default:
            endpoint = `/api/v1/${entityType}/${id}`;
        }
        
        console.log(`Deleting ${entityType} with endpoint: ${endpoint}`);
        
        // Make the request
        const response = this.makeApiRequest(endpoint, 'delete');
        
        return true; // If we got here, the delete was successful
      } catch (error) {
        console.error(`Error in deleteEntity for ${entityType}:`, error);
        return false;
      }
    }
    
    /**
     * Gets company by domain more efficiently using a dedicated endpoint
     * @param {string} domain - Domain to search for
     * @return {Object|null} Company data or null if not found
     */
    getCompanyByDomain(domain) {
      try {
        console.log(`Looking up company by domain: ${domain}`);
        
        // Use company endpoint with domain filter
        const endpoint = this.endpoints.company_by_domain.replace('{domain}', domain);
        console.log(`Using endpoint: ${endpoint}`);
        
        // Make the request
        const response = this.makeApiRequest(endpoint, 'get');
        
        if (Array.isArray(response) && response.length > 0) {
          console.log(`Found company for domain ${domain}`);
          return response[0];
        }
        
        if (response && response.companies && response.companies.length > 0) {
          console.log(`Found company for domain ${domain} in companies property`);
          return response.companies[0];
        }
        
        if (response && !Array.isArray(response) && (response.name || response.company_id)) {
          console.log(`Found single company for domain ${domain}`);
          return response;
        }
        
        console.log(`No company found for domain: ${domain}`);
        return null;
      } catch (error) {
        console.error(`Error in getCompanyByDomain for ${domain}:`, error);
        
        // Fallback to using query parameters on the standard companies endpoint
        try {
          console.log('Trying fallback to companies endpoint with query parameter');
          const companies = this.getEntities('companies', { domain: domain });
          
          if (companies && companies.length > 0) {
            console.log('Found company using fallback approach');
            return companies[0];
          }
        } catch (fallbackError) {
          console.log(`Fallback failed: ${fallbackError.message}`);
        }
        
        return null;
      }
    }
    
    /**
     * Checks if a user exists by email
     * @param {string} email - Email address to check
     * @return {Object|null} User data if found, or null
     */
    checkUserExists(email) {
      try {
        if (!email) return null;
        console.log(`Checking if user exists: ${email}`);
        
        // Use user_by_email endpoint
        const endpoint = this.endpoints.user_by_email.replace('{email}', encodeURIComponent(email));
        console.log(`Using endpoint: ${endpoint}`);
        
        // Try without authentication first (public endpoint)
        try {
          const response = this.makeApiRequest(endpoint, 'get', null, true);
          
          if (Array.isArray(response) && response.length > 0) {
            console.log(`Found user for email ${email}`);
            return response[0];
          }
          
          if (response && response.users && response.users.length > 0) {
            console.log(`Found user for email ${email} in users property`);
            return response.users[0];
          }
          
          if (response && !Array.isArray(response) && (response.email || response.id)) {
            console.log(`Found single user for email ${email}`);
            return response;
          }
        } catch (publicError) {
          console.log(`Public endpoint failed: ${publicError.message}`);
          
          // If we have a token, try with authentication
          if (this.apiToken) {
            try {
              const authResponse = this.makeApiRequest(endpoint, 'get');
              
              if (Array.isArray(authResponse) && authResponse.length > 0) {
                console.log(`Found user for email ${email} with auth`);
                return authResponse[0];
              }
              
              if (authResponse && authResponse.users && authResponse.users.length > 0) {
                console.log(`Found user for email ${email} in users property with auth`);
                return authResponse.users[0];
              }
              
              if (authResponse && !Array.isArray(authResponse) && (authResponse.email || authResponse.id)) {
                console.log(`Found single user for email ${email} with auth`);
                return authResponse;
              }
            } catch (authError) {
              console.log(`Authenticated endpoint failed: ${authError.message}`);
            }
          }
        }
        
        console.log(`No user found for email: ${email}`);
        return null;
      } catch (error) {
        console.error(`Error checking if user exists: ${email}`, error);
        return null;
      }
    }

    /**
     * Authenticates with the API
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @return {Object} Auth response with token
     */
    authenticate(email, password) {
      console.log("Authenticating user...");
      
      const credentials = {
        email: email || 'admin@voxerion.com',
        password: password || 'defaultpassword'
      };
      
      try {
        const response = this.makeApiRequest(this.endpoints.login, 'post', credentials, true);
        
        // Check for token in response
        let token = null;
        if (response.accessToken) {
          token = response.accessToken;
        } else if (response.token) {
          token = response.token;
        }
        
        if (token) {
          console.log('Authentication successful');
          
          // Set the token for subsequent requests
          this.setToken(token);
          
          // Save the token in cache for future use
          const cache = CacheService.getUserCache();
          cache.put('VOXERION_API_TOKEN', token, 60 * 60); // 1 hour expiry
          
          return {
            token: token,
            user: response.user || null
          };
        } else {
          throw new Error('No token found in authentication response');
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
      }
    }
    
    /**
     * Try to authenticate with various credentials
     * @return {boolean} True if authentication successful
     */
    tryAuth() {
      try {
        console.log("Trying authentication...");
        
        // Check if we already have a token
        if (this.apiToken) {
          console.log("Token exists, validating it...");
          try {
            // Try a simple request to see if token is valid
            this.makeApiRequest(this.endpoints.users, 'get', null, false);
            console.log("Existing token is valid");
            return true;
          } catch (tokenError) {
            console.log("Existing token is invalid, clearing it");
            this.apiToken = "";
          }
        }
        
        // List of credential sets to try
        const credentialSets = [
          { email: 'admin@voxerion.com', password: 'defaultpassword' },
          { email: 'guest@voxerion.com', password: 'guest123' },
          { email: 'alysson.franklin@voxerion.com', password: 'password123' }
        ];
        
        // Try each credential set
        for (const creds of credentialSets) {
          try {
            this.authenticate(creds.email, creds.password);
            console.log("Authentication successful");
            return true;
          } catch (e) {
            // Continue to next credential set
            console.log(`Authentication failed with ${creds.email}`);
          }
        }
        
        console.warn('All authentication attempts failed');
        return false;
      } catch (error) {
        console.warn('Authentication error:', error);
        return false;
      }
    }

    /**
     * Invalidates the current token (logout)
     * @return {boolean} Success status
     */
    invalidateToken() {
      try {
        if (!this.apiToken) {
          return true; // Already logged out
        }

        const endpoint = '/api/v1/users/logout';
        this.makeApiRequest(endpoint, 'post');

        // Clear the token
        this.apiToken = '';
        
        // Clear the token from cache
        const cache = CacheService.getUserCache();
        cache.remove('VOXERION_API_TOKEN');

        return true;
      } catch (error) {
        console.error('Error invalidating token:', error);
        // Clear token even if there's an error
        this.apiToken = '';
        return false;
      }
    }
  }

  /**
   * Get or create the database manager.
   * Returns an instance of the API-based DatabaseManager.
   * 
   * @return {DatabaseManager} The database manager instance.
   */
  function getDatabaseManager() {
    return new DatabaseManager();
  }