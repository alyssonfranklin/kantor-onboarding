export interface User {
  id: string;
  email: string;
  name: string;
  company_id: string;
  role: string; // 'orgadmin', 'user', etc.
  created_at: string;
  department: string;
  company_role: string;
  password: string;
}

export interface Company {
  company_id: string;
  name: string;
  assistant_id: string;
  status: string; // 'active', 'inactive', etc.
  created_at: string;
  updated_at: string;
}

export interface AccessToken {
  token: string;
  user_id: string;
  expires_at: string;
}

export interface Department {
  company_id: string;
  department_name: string;
  department_desc: string;
  user_head: string; // User ID of department head
}

export interface Employee {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_leader: string; // User ID of employee's manager
  company_id: string;
}

export interface Database {
  users: User[];
  companies: Company[];
  accessTokens: AccessToken[];
  departments: Department[];
  employees: Employee[];
}