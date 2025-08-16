export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  province?: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

export interface Department {
  id: string;
  name: string;
  jurisdiction: string;
  province?: string;
  email?: string;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  userId?: string;
  channel: string;
  text: string;
  mediaUrls?: string[];
  languageDetected?: string;
  province?: string;
  sentiment?: number;
  toxicity: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  submissionId: string;
  departmentId: string;
  assigneeId?: string;
  priority: string;
  state: string;
  dueAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  startAt: string;
  endAt: string;
  targetProvince?: string;
  createdAt: string;
}

export interface TopicTag {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  submissions: {
    total: number;
    recent: number;
    growth: number;
  };
  cases: {
    total: number;
    active: number;
    overdue: number;
  };
  sentiment: {
    avgSentiment: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
  provinces: Array<{
    province: string;
    count: number;
  }>;
}
