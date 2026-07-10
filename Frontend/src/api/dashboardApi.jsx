import api from "./axios";

export const getDashboard = async () => {
  const { data } = await api.get("/dashboard");
  return data.data;
};

export const getDashboardStats = async () => {
  const { data } = await api.get("/dashboard/stats");
  return data.data;
};

export const getResourceDemand = async () => {
  const { data } = await api.get("/dashboard/resource-demand");
  return data.data;
};


export const getTaskEfficiency = async () => {
  const { data } = await api.get("/dashboard/task-efficiency");
  return data.data;
};

export const getHarvests = async () => {
  const { data } = await api.get("/dashboard/harvests?limit=3");
  return data.data;
};


export const getAIReport = async () => {
  const { data } = await api.get("/dashboard/ai-report");
  return data.data;
};

export const getActivity = async () => {
  const { data } = await api.get("/dashboard/activity");
  return data.data;
};


export const getWeatherRequest = async () => {
  const response = await api.get("/dashboard/weather");  
  return response.data.data || response.data;
};



