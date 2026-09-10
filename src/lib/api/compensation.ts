import { apiClient } from './client';
import type {
  Salary,
  CreateSalaryRequest,
  UpdateSalaryRequest,
  Benefit,
  CreateBenefitRequest,
  UpdateBenefitRequest,
  Bonus,
  CreateBonusRequest,
  UpdateBonusRequest,
  EmployeeBenefit,
  AssignBenefitToEmployeeRequest,
  UpdateEmployeeBenefitRequest,
} from '@/types';

// Salary API
export const salaryApi = {
  /**
   * Get all salaries (for frontend filtering)
   */
  async getAllSalaries() {
    return apiClient.get<{ data: Salary[]; total: number }>('/compensation/salaries');
  },

  /**
   * Get salary by ID
   */
  async getSalaryById(id: string) {
    return apiClient.get<Salary>(`/compensation/salaries/${id}`);
  },

  /**
   * Create salary
   */
  async createSalary(data: CreateSalaryRequest) {
    return apiClient.post<Salary>('/compensation/salaries', data);
  },

  /**
   * Update salary
   */
  async updateSalary(id: string, data: UpdateSalaryRequest) {
    return apiClient.put<Salary>(`/compensation/salaries/${id}`, data);
  },

  /**
   * Delete salary (if needed)
   */
  async deleteSalary(id: string) {
    return apiClient.delete(`/compensation/salaries/${id}`);
  },

  /**
   * Get employee salary history
   */
  async getEmployeeSalaryHistory(employeeId: string) {
    return apiClient.get<{ data: Salary[]; total: number }>(
      `/compensation/employees/${employeeId}/salaries`
    );
  },
};

// Benefit API
export const benefitApi = {
  /**
   * Get all benefits (for frontend filtering)
   */
  async getAllBenefits() {
    return apiClient.get<{ data: Benefit[]; total: number }>('/compensation/benefits');
  },

  /**
   * Get benefit by ID
   */
  async getBenefitById(id: string) {
    return apiClient.get<Benefit>(`/compensation/benefits/${id}`);
  },

  /**
   * Create benefit
   */
  async createBenefit(data: CreateBenefitRequest) {
    return apiClient.post<Benefit>('/compensation/benefits', data);
  },

  /**
   * Update benefit
   */
  async updateBenefit(id: string, data: UpdateBenefitRequest) {
    return apiClient.put<Benefit>(`/compensation/benefits/${id}`, data);
  },

  /**
   * Delete benefit (if needed)
   */
  async deleteBenefit(id: string) {
    return apiClient.delete(`/compensation/benefits/${id}`);
  },
};

// Bonus API
export const bonusApi = {
  /**
   * Get all bonuses (for frontend filtering)
   */
  async getAllBonuses() {
    return apiClient.get<{ data: Bonus[]; total: number }>('/compensation/bonuses');
  },

  /**
   * Get bonus by ID
   */
  async getBonusById(id: string) {
    return apiClient.get<Bonus>(`/compensation/bonuses/${id}`);
  },

  /**
   * Create bonus
   */
  async createBonus(data: CreateBonusRequest) {
    return apiClient.post<Bonus>('/compensation/bonuses', data);
  },

  /**
   * Update bonus
   */
  async updateBonus(id: string, data: UpdateBonusRequest) {
    return apiClient.put<Bonus>(`/compensation/bonuses/${id}`, data);
  },

  /**
   * Delete bonus (if needed)
   */
  async deleteBonus(id: string) {
    return apiClient.delete(`/compensation/bonuses/${id}`);
  },
};

// Employee Benefit API
export const employeeBenefitApi = {
  /**
   * Get all employee benefits (for frontend filtering)
   */
  async getAllEmployeeBenefits() {
    return apiClient.get<{ data: EmployeeBenefit[]; total: number }>(
      '/compensation/employee-benefits'
    );
  },

  /**
   * Get employee benefit by ID
   */
  async getEmployeeBenefitById(id: string) {
    return apiClient.get<EmployeeBenefit>(`/compensation/employee-benefits/${id}`);
  },

  /**
   * Assign benefit to employee
   */
  async assignBenefitToEmployee(data: AssignBenefitToEmployeeRequest) {
    return apiClient.post<EmployeeBenefit>('/compensation/employee-benefits', data);
  },

  /**
   * Update employee benefit
   */
  async updateEmployeeBenefit(id: string, data: UpdateEmployeeBenefitRequest) {
    return apiClient.put<EmployeeBenefit>(`/compensation/employee-benefits/${id}`, data);
  },

  /**
   * Delete employee benefit
   */
  async deleteEmployeeBenefit(id: string) {
    return apiClient.delete(`/compensation/employee-benefits/${id}`);
  },

  /**
   * Get employee's assigned benefits
   */
  async getEmployeeBenefits(employeeId: string) {
    return apiClient.get<{ data: EmployeeBenefit[]; total: number }>(
      `/compensation/employees/${employeeId}/benefits`
    );
  },
};
