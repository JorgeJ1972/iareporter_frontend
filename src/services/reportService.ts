import apiClient from "./apiClient";
import { EnvironmentTablesGroup } from "../types/environment";
import { Report, ReportParam, ReportParamDB, RunReport, ReportUpdate, ReportCreate, ReportParamCreate, ReportParamUpdate} from "../types/report";
import MessageResponse from "../types/MessageResponse";

export const reportService = {
  getEnvironmentUser: async (): Promise<MessageResponse<EnvironmentTablesGroup>> => {

    const response = await apiClient.get(`/get_environment_user`);
    return response.data;
  },

  getReportUser: async (
    tables_group_id: number
  ): Promise<MessageResponse<Report>> => {
    const response = await apiClient.get(`/get_report_user?tables_group_id=${tables_group_id}`);
    return response.data;
  },

 getReportParam: async (
    report_id: number
  ): Promise<MessageResponse<ReportParam>> => {
    const response = await apiClient.get(`/report/get_params_by_report?report_id=${report_id}`);
    return response.data;
  },

  getReportParamResponse: async (
    report_id: number
  ): Promise<MessageResponse<ReportParam>> => {
    const response = await apiClient.get(`/report/reports/${report_id}/params`);
    return response.data;
  },

  runReport: async (report: RunReport): Promise<MessageResponse<any>> => {
    const response = await apiClient.post(`report/run_report`, report);
    return response.data;
  },

  getReports: async (id_tables_group: number): Promise<MessageResponse<any>> => {
    const response = await apiClient.get(`report/groups/${id_tables_group}/reports`);
    return response.data;
  },

  updateReport: async (
    report_id: number,
    report: ReportUpdate
  ): Promise<MessageResponse<Report>> => {
    console.log("Updating Report:",report);
    console.log(`report/reports/${report_id}`);
    const response = await apiClient.put(`/report/reports/${report_id}`, report);
    return response.data;
  },

   createReport: async (
    report: ReportCreate
  ): Promise<MessageResponse<Report>> => {
    const response = await apiClient.post(`/report/reports`, report);
    return response.data;
  },

  deleteReport: async (
    report_id: number,
  ): Promise<MessageResponse<Report>> => {
    const response = await apiClient.delete(`/report/reports/${report_id}`);
    return response.data;
  },

  getReportParamsByReport: async (
    report_id:number
  ): Promise<MessageResponse<ReportParam>> => {
    const response = await apiClient.get(`report/${report_id}/params`);
    return response.data;
  },

  updateParam: async (
    param_id:number,
    param:ReportParamUpdate
  ): Promise<MessageResponse<ReportParamDB>> => {
    console.log("Updating report:", param);
    console.log(`report/params/${param_id}`);
    const response = await apiClient.put(`report/params/${param_id}`, param);
    return response.data;
  },

  createParam: async (
      report_id: number,
      param:ReportParamCreate
    ): Promise<MessageResponse<ReportParamDB>> => {
    console.log("Creating param:",param);
    console.log(`report/params/${report_id}`);
    const response = await apiClient.post(`report/params/${report_id}`, param);
    return response.data;
  },

  deleteParam: async (
      param_id: number
    ): Promise<MessageResponse<any>> => {
    const response = await apiClient.delete(`report/params/${param_id}`);
    return response.data;
  },

  getReportParamTypes: async (): Promise<MessageResponse<any>> => {
    const response = await apiClient.get(`report/param-types`);
    return response.data;
  },

};