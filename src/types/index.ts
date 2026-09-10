// User and Auth Types
export type UserRole = 'GUEST' | 'EMPLOYEE' | 'MANAGER' | 'HR_MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type OnboardingStatus = 'GUEST_AWAITING_PROFILE' | 'PENDING_APPROVAL' | 'ACTIVE_EMPLOYEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: string;
  employeeId?: string;
  department?: string;
  emailVerified: boolean;
}

export interface UserStatusData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  hasEmployeeProfile: boolean;
  needsEmployeeProfile: boolean;
  status: OnboardingStatus;
}

// Auth Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Auth Response Types
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    emailVerified: boolean;
    message: string;
  };
  error?: string;
}

export interface UserInfoResponse {
  success: boolean;
  message: string;
  data?: User;
  error?: string;
}

export interface UserStatusResponse {
  success: boolean;
  data?: UserStatusData;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination Types
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// User Management Types
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  employeeId: string | null;
  department: string;
  position: string;
  hasEmployeeRecord: boolean;
}

export interface UpdateUserRoleRequest {
  roleIds: string[];
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

// Employee Management Types
export interface Employee {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isActive: boolean;
  };
  position: string;
  hireDate: string;
  status: string;
  department: {
    id: string;
    name: string;
    description?: string;
  };
  manager?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      profilePicture?: string;
      email: string;
    };
    position: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateEmployeeRequest {
  userId: string;
  position: string;
  departmentId: string;
  hireDate?: string;
  managerId?: string;
}

export interface UpdateEmployeeRequest {
  position?: string;
  departmentId?: string;
  managerId?: string;
  status?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string;
  manager?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  employees?: Employee[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  managerId?: string;
}

// Leave Management Types
export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  defaultDays: number;
  color?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  carryOver: number;
  adjustment: number;
  adjustmentReason?: string;
  expiryDate?: string;
  available: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveTypeRequest {
  name: string;
  description?: string;
  defaultDays: number;
  color?: string;
  active?: boolean;
}

export interface UpdateLeaveTypeRequest {
  name?: string;
  description?: string;
  defaultDays?: number;
  color?: string;
  active?: boolean;
}

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      profilePicture?: string;
    };
    department?: {
      id: string;
      name: string;
    };
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
  numberOfDays: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  approvalReason?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  leaveRequestId: string;
  leaveRequest?: LeaveRequest;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  uploadedById: string;
  createdAt: string;
}

export interface CreateLeaveRequestRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveRequestRequest {
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface ApproveLeaveRequest {
  comments?: string;
}

export interface RejectLeaveRequest {
  reason: string;
}

export interface CancelLeaveRequest {
  reason?: string;
}

// Recruitment Management Types
export type JobPostingStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type ExperienceLevel = 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  department: {
    id: string;
    name: string;
  };
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  status: JobPostingStatus;
  applicationDeadline: string;
  publishedAt?: string;
  closedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPostingRequest {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  departmentId: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  applicationDeadline: string;
}

export interface UpdateJobPostingRequest {
  title?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  departmentId?: string;
  location?: string;
  type?: JobType;
  experienceLevel?: ExperienceLevel;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  applicationDeadline?: string;
  status?: JobPostingStatus;
}

export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';

export interface JobApplication {
  id: string;
  jobPosting: {
    id: string;
    title: string;
    department: {
      id: string;
      name: string;
    };
  };
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resume: string;
  coverLetter?: string;
  experience: number;
  expectedSalary?: number;
  availability?: string;
  status: ApplicationStatus;
  notes?: string;
  rating?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationRequest {
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resume: string;
  coverLetter?: string;
  experience: number;
  expectedSalary?: number;
  availability?: string;
}

export interface UpdateJobApplicationRequest {
  status: ApplicationStatus;
  notes?: string;
  rating?: number;
}

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type InterviewType = 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL' | 'BEHAVIORAL';

export interface Interview {
  id: string;
  jobApplication: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobPosting: {
      id: string;
      title: string;
    };
  };
  interviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  scheduledDate: string;
  duration: number;
  type: InterviewType;
  location?: string;
  notes?: string;
  status: InterviewStatus;
  feedback?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewRequest {
  jobApplicationId: string;
  interviewerId: string;
  scheduledDate: string;
  duration: number;
  type: InterviewType;
  location?: string;
  notes?: string;
}

export interface UpdateInterviewRequest {
  scheduledDate?: string;
  duration?: number;
  type?: InterviewType;
  location?: string;
  notes?: string;
  status?: InterviewStatus;
  feedback?: string;
  rating?: number;
}

// Onboarding Management Types
export type OnboardingProcessStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type OnboardingPhase =
  | 'PRE_BOARDING'
  | 'FIRST_DAY'
  | 'FIRST_WEEK'
  | 'FIRST_MONTH'
  | 'FIRST_QUARTER';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ON_HOLD';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskCategory =
  | 'DOCUMENTATION'
  | 'TRAINING'
  | 'EQUIPMENT'
  | 'ACCESS'
  | 'ORIENTATION'
  | 'COMPLIANCE'
  | 'SOCIAL'
  | 'OTHER';

export interface OnboardingProcess {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
  status: OnboardingProcessStatus;
  currentPhase: OnboardingPhase;
  startDate: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  notes?: string;
  goals?: string[];
  challenges?: string[];
  feedback?: string;
  satisfactionRating?: number;
  improvementSuggestions?: string;
  isTemplate: boolean;
  templateName?: string;
  customFields?: string[];
  tasks?: OnboardingTask[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTask {
  id: string;
  onboardingId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  orderIndex: number;
  dueDate?: string;
  completedDate?: string;
  assignedTo?: string;
  completedBy?: string;
  instructions?: string;
  requiredDocuments?: string[];
  attachments?: string[];
  notes?: string;
  completionNotes?: string;
  isRequired: boolean;
  isRecurring: boolean;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOnboardingRequest {
  employeeId: string;
  startDate: string;
  targetCompletionDate?: string;
  assignedToId?: string;
  notes?: string;
  goals?: string[];
  isTemplate?: boolean;
  templateName?: string;
}

export interface UpdateOnboardingRequest {
  status?: OnboardingProcessStatus;
  currentPhase?: OnboardingPhase;
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  assignedToId?: string;
  notes?: string;
  goals?: string[];
  challenges?: string[];
  feedback?: string;
  satisfactionRating?: number;
  improvementSuggestions?: string;
}

export interface CreateOnboardingTaskRequest {
  onboardingId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  orderIndex?: number;
  dueDate?: string;
  assignedTo?: string;
  instructions?: string;
  requiredDocuments?: string[];
  isRequired?: boolean;
  isRecurring?: boolean;
  estimatedDuration?: number;
  dependencies?: string[];
}

export interface UpdateOnboardingTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  orderIndex?: number;
  dueDate?: string;
  completedDate?: string;
  assignedTo?: string;
  completedBy?: string;
  instructions?: string;
  requiredDocuments?: string[];
  attachments?: string[];
  notes?: string;
  completionNotes?: string;
  isRequired?: boolean;
  estimatedDuration?: number;
  actualDuration?: number;
  failureReason?: string;
}

// Compensation Management Types
export type SalaryType = 'BASE_SALARY' | 'HOURLY_RATE' | 'COMMISSION' | 'BONUS' | 'ALLOWANCE';
export type PayFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'ANNUALLY';

export interface Salary {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
  type: SalaryType;
  amount: number;
  payFrequency: PayFrequency;
  effectiveDate: string;
  endDate?: string;
  reason?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  percentageIncrease?: number;
  previousAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryRequest {
  employeeId: string;
  type: SalaryType;
  amount: number;
  payFrequency: PayFrequency;
  effectiveDate: string;
  endDate?: string;
  reason?: string;
  notes?: string;
  percentageIncrease?: number;
  previousAmount?: number;
}

export interface UpdateSalaryRequest {
  type?: SalaryType;
  amount?: number;
  payFrequency?: PayFrequency;
  effectiveDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
  percentageIncrease?: number;
  previousAmount?: number;
  isActive?: boolean;
}

export type BenefitType =
  | 'HEALTH_INSURANCE'
  | 'DENTAL_INSURANCE'
  | 'VISION_INSURANCE'
  | 'LIFE_INSURANCE'
  | 'DISABILITY_INSURANCE'
  | 'RETIREMENT_PLAN'
  | 'PAID_TIME_OFF'
  | 'SICK_LEAVE'
  | 'MATERNITY_LEAVE'
  | 'PATERNITY_LEAVE'
  | 'EDUCATION_REIMBURSEMENT'
  | 'TRANSPORTATION'
  | 'MEAL_ALLOWANCE'
  | 'GYM_MEMBERSHIP'
  | 'OTHER';

export type BenefitCategory =
  | 'INSURANCE'
  | 'RETIREMENT'
  | 'TIME_OFF'
  | 'WELLNESS'
  | 'PROFESSIONAL_DEVELOPMENT'
  | 'LIFESTYLE';

export interface Benefit {
  id: string;
  name: string;
  description: string;
  type: BenefitType;
  category: BenefitCategory;
  cost?: number;
  employeeContribution?: number;
  employeeContributionPercentage?: number;
  isActive: boolean;
  requiresEnrollment: boolean;
  effectiveDate?: string;
  endDate?: string;
  eligibilityCriteria?: string[];
  documentsRequired?: string[];
  provider?: string;
  contactInfo?: string;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBenefitRequest {
  name: string;
  description: string;
  type: BenefitType;
  category: BenefitCategory;
  cost?: number;
  employeeContribution?: number;
  employeeContributionPercentage?: number;
  requiresEnrollment?: boolean;
  effectiveDate?: string;
  endDate?: string;
  eligibilityCriteria?: string[];
  documentsRequired?: string[];
  provider?: string;
  contactInfo?: string;
  notes?: string;
}

export interface UpdateBenefitRequest {
  name?: string;
  description?: string;
  type?: BenefitType;
  category?: BenefitCategory;
  cost?: number;
  employeeContribution?: number;
  employeeContributionPercentage?: number;
  isActive?: boolean;
  requiresEnrollment?: boolean;
  effectiveDate?: string;
  endDate?: string;
  eligibilityCriteria?: string[];
  documentsRequired?: string[];
  provider?: string;
  contactInfo?: string;
  notes?: string;
}

export type BonusType =
  | 'PERFORMANCE'
  | 'ANNUAL'
  | 'QUARTERLY'
  | 'PROJECT'
  | 'REFERRAL'
  | 'RETENTION'
  | 'SIGN_ON'
  | 'MILESTONE'
  | 'OTHER';

export type BonusStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'REJECTED';

export interface Bonus {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
  title: string;
  description: string;
  type: BonusType;
  amount: number;
  percentage?: number;
  effectiveDate: string;
  paymentDate?: string;
  status: BonusStatus;
  criteria?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  isTaxable: boolean;
  taxAmount?: number;
  netAmount?: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBonusRequest {
  employeeId: string;
  title: string;
  description: string;
  type: BonusType;
  amount: number;
  percentage?: number;
  effectiveDate: string;
  paymentDate?: string;
  criteria?: string;
  notes?: string;
  paymentMethod?: string;
  isTaxable?: boolean;
  taxAmount?: number;
  netAmount?: number;
}

export interface UpdateBonusRequest {
  title?: string;
  description?: string;
  type?: BonusType;
  amount?: number;
  percentage?: number;
  effectiveDate?: string;
  paymentDate?: string;
  status?: BonusStatus;
  criteria?: string;
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  isTaxable?: boolean;
  taxAmount?: number;
  netAmount?: number;
  rejectionReason?: string;
}

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'WAITING_PERIOD';

export interface EmployeeBenefit {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
  benefitId: string;
  benefit: Benefit;
  status: EnrollmentStatus;
  enrollmentDate: string;
  effectiveDate?: string;
  endDate?: string;
  employeeContribution?: number;
  companyContribution?: number;
  dependents?: string[];
  policyNumber?: string;
  groupNumber?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  terminationReason?: string;
  terminatedBy?: string;
  terminatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignBenefitToEmployeeRequest {
  employeeId: string;
  benefitId: string;
  enrollmentDate: string;
  effectiveDate?: string;
  endDate?: string;
  employeeContribution?: number;
  companyContribution?: number;
  dependents?: string[];
  policyNumber?: string;
  groupNumber?: string;
  notes?: string;
}

export interface UpdateEmployeeBenefitRequest {
  status?: EnrollmentStatus;
  effectiveDate?: string;
  endDate?: string;
  employeeContribution?: number;
  companyContribution?: number;
  dependents?: string[];
  policyNumber?: string;
  groupNumber?: string;
  notes?: string;
  terminationReason?: string;
}

// ===== Report Types =====
export interface LeaveByDepartmentReport {
  departmentName: string;
  leaveCount: number;
  totalDays: number;
}

export interface LeaveByEmployeeReport {
  employee: {
    firstName: string;
    lastName: string;
  };
  leaveData: Array<{
    leaveType: string;
    totalDays: number;
  }>;
}

export interface LeaveByTypeReport {
  leaveType: string;
  leaveCount: number;
  totalDays: number;
}

export interface LeaveCalendarEvent {
  firstName: string;
  lastName: string;
  profilePicture?: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  color: string;
  department: string;
}

export interface ReportFilters {
  year?: number;
  month?: number;
  departmentId?: string;
  employeeId?: string;
  reportType?: string;
}

// ===== Audit Types =====
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'ROLE_CHANGE'
  | 'USER_STATUS_CHANGE'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'CRITICAL_UPDATE';

export type EntityType = 'User' | 'LeaveRequest' | 'System';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  timestamp: string;
}

export interface AuditFilters {
  action?: AuditAction;
  entityType?: EntityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// ===== Notification Types =====
export type NotificationType =
  | 'LEAVE_SUBMITTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_REMINDER'
  | 'APPROVAL_PENDING'
  | 'LEAVE_CANCELLED';

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  relatedEntityId?: string;
  entityType?: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  leaveApprovals: boolean;
  leaveRejections: boolean;
  leaveReminders: boolean;
  systemUpdates: boolean;
}

// ===== Attendance Types =====
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type VerificationMethod = 'MANUAL' | 'FINGERPRINT' | 'PIN';

export interface Attendance {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      profilePicture?: string;
    };
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  verifiedBy?: string;
  verificationMethod?: VerificationMethod;
  fingerprintTemplate?: string;
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceRequest {
  employeeId: string;
  date: string; // YYYY-MM-DD format
  status?: AttendanceStatus;
  checkInTime?: string; // HH:MM format
  checkOutTime?: string; // HH:MM format
  notes?: string;
  fingerprintTemplate?: string;
}

export interface UpdateAttendanceRequest {
  status?: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysHalfDay: number;
  daysLeave: number;
  attendancePercentage: number;
  periodStart: string;
  periodEnd: string;
}

export interface FingerprintEnrollmentResponse {
  employeeId: string;
  employeeName: string;
  enrolled: boolean;
  enrollmentDate?: string;
  message: string;
}

export interface FingerprintStatus {
  employeeId: string;
  employeeName: string;
  enrolled: boolean;
  enrollmentDate?: string;
}

export interface FingerprintDeviceInfo {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  status: string;
}

export interface FingerprintKioskResponse {
  attendance: Attendance;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  confidence: number;
  message: string;
}
