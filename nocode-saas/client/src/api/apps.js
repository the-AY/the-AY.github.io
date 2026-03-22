import api from './client';

export const appsApi = {
  list:    ()           => api.get('/api/apps'),
  get:     (id)         => api.get(`/api/apps/${id}`),
  create:  (data)       => api.post('/api/apps', data),
  update:  (id, data)   => api.patch(`/api/apps/${id}`, data),
  remove:  (id)         => api.delete(`/api/apps/${id}`),
  publish: (id)         => api.post(`/api/apps/${id}/publish`),
};

export const schemaApi = {
  listTables:  (appId)           => api.get(`/api/apps/${appId}/tables`),
  getTable:    (appId, tableId)  => api.get(`/api/apps/${appId}/tables/${tableId}`),
  createTable: (appId, data)     => api.post(`/api/apps/${appId}/tables`, data),
  updateTable: (appId, tableId, data) => api.patch(`/api/apps/${appId}/tables/${tableId}`, data),
  deleteTable: (appId, tableId)  => api.delete(`/api/apps/${appId}/tables/${tableId}`),
};

export const dataApi = {
  listRows:   (appId, table, params) => api.get(`/api/apps/${appId}/data/${table}`, { params }),
  getRow:     (appId, table, rowId)  => api.get(`/api/apps/${appId}/data/${table}/${rowId}`),
  createRow:  (appId, table, data)   => api.post(`/api/apps/${appId}/data/${table}`, data),
  updateRow:  (appId, table, rowId, data) => api.patch(`/api/apps/${appId}/data/${table}/${rowId}`, data),
  deleteRow:  (appId, table, rowId)  => api.delete(`/api/apps/${appId}/data/${table}/${rowId}`),
};

export const uiApi = {
  listPages:  (appId)              => api.get(`/api/apps/${appId}/ui`),
  getPage:    (appId, pageId)      => api.get(`/api/apps/${appId}/ui/${pageId}`),
  savePage:   (appId, data)        => api.post(`/api/apps/${appId}/ui`, data),
  updatePage: (appId, pageId, data) => api.put(`/api/apps/${appId}/ui/${pageId}`, data),
  deletePage: (appId, pageId)      => api.delete(`/api/apps/${appId}/ui/${pageId}`),
};

export const modulesApi = {
  list:    (appId)            => api.get(`/api/apps/${appId}/modules`),
  enable:  (appId, moduleKey) => api.post(`/api/apps/${appId}/modules/${moduleKey}/enable`),
  disable: (appId, moduleKey) => api.post(`/api/apps/${appId}/modules/${moduleKey}/disable`),
};

export const posApi = {
  listProducts:   (appId)           => api.get(`/api/apps/${appId}/pos/products`),
  createProduct:  (appId, data)     => api.post(`/api/apps/${appId}/pos/products`, data),
  updateProduct:  (appId, id, data) => api.patch(`/api/apps/${appId}/pos/products/${id}`, data),
  deleteProduct:  (appId, id)       => api.delete(`/api/apps/${appId}/pos/products/${id}`),
  listOrders:     (appId, params)   => api.get(`/api/apps/${appId}/pos/orders`, { params }),
  createOrder:    (appId, data)     => api.post(`/api/apps/${appId}/pos/orders`, data),
  getOrder:       (appId, id)       => api.get(`/api/apps/${appId}/pos/orders/${id}`),
  updateStatus:   (appId, id, data) => api.patch(`/api/apps/${appId}/pos/orders/${id}/status`, data),
  getStats:       (appId)           => api.get(`/api/apps/${appId}/pos/stats`),
};
