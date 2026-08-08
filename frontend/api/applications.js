import axios from 'axios';
const baseURL = '/api/applications';

export default {
  getPending: () => axios.get(`${baseURL}/pending`),
  approve: (id, data) => axios.post(`${baseURL}/${id}/approve`, data),
  reject: (id, data) => axios.post(`${baseURL}/${id}/reject`, data),
  getTimeline: (params) => axios.get(`${baseURL}/timeline`, { params }),
};
