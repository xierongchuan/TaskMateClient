import apiClient from './client';

export interface ReportData {
  period: string;
  date_from: string;
  date_to: string;
  summary: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    total_shifts: number;
    late_shifts: number;
    total_replacements: number;
  };
  tasks_by_status: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  employees_performance: Array<{
    employee_id: number;
    employee_name: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    overdue_tasks: number;
    total_shifts: number;
    late_shifts: number;
    avg_late_minutes: number;
    performance_score: number;
  }>;
  daily_stats: Array<{
    date: string;
    completed: number;
    overdue: number;
    late_shifts: number;
  }>;
  top_issues: Array<{
    issue_type: string;
    count: number;
    description: string;
  }>;
}

export interface IssueDetail {
  id: number;
  title: string;
  subtitle?: string;
  date?: string;
  type: 'task' | 'shift' | 'user';
  user_id?: number;
  score?: number;
  dealership_id?: number;
}

export interface IssueDetailsResponse {
  issue_type: string;
  items: IssueDetail[];
}

export const reportsApi = {
  getReport: async (dateFrom: string, dateTo: string, dealershipId?: number | null): Promise<ReportData> => {
    const params: { date_from: string; date_to: string; dealership_id?: number } = {
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (dealershipId) {
      params.dealership_id = dealershipId;
    }
    const response = await apiClient.get<ReportData>('/reports', { params });
    return response.data;
  },

  getIssueDetails: async (
    issueType: string,
    dateFrom: string,
    dateTo: string,
    dealershipId?: number | null
  ): Promise<IssueDetailsResponse> => {
    const params: { date_from: string; date_to: string; dealership_id?: number } = {
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (dealershipId) {
      params.dealership_id = dealershipId;
    }
    const response = await apiClient.get<IssueDetailsResponse>(`/reports/issues/${issueType}`, { params });
    return response.data;
  },
};
