import axios from 'axios';
import {API_CONFIG} from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-App-Code': API_CONFIG.appCode,
  },
});

export default api;