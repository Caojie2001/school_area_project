/**
 * ==============================================
 * api.js - API调用封装模块
 * ==============================================
 * 
 * 【文件职责】
 * - 统一管理所有API端点的调用
 * - 提供标准化的请求/响应处理
 * - 处理API错误和异常情况
 * - 管理请求拦截器和响应拦截器
 * - 提供API调用的缓存机制
 * 
 * 【主要功能模块】
 * 1. API基础/**
 * DELETE请求封装
 * @param {string} endpoint API端点
 * @param {object} data 请求数据（可选）
 * @param {object} options 请求选项
 * @returns {Promise} 请求结果
 */
async function apiDelete(endpoint, data = null, options = {}) {
    const config = {
        ...options,
        method: 'DELETE'
    };
    
    if (data) {
        config.body = JSON.stringify(data);
        config.headers = {
            'Content-Type': 'application/json',
            ...(config.headers || {})
        };
    }
    
    return apiRequest(endpoint, config);
}

// ========================================
// API模块说明文档
// ========================================

/**
 * API模块功能说明：
 * 
 * 1. 基础配置
 *    - A
 *    - AuthAPI.checkStatus() 检查登录状态
 *    - AuthAPI.login() 用户登录
 *    - AuthAPI.logout() 用户登出
 *    - AuthAPI.refreshToken() 刷新令牌
 * 
 * 3. 数据填报相关API
 *    - DataEntryAPI.getSchools() 获取学校列表
 *    - DataEntryAPI.submitData() 提交测算数据
 *    - DataEntryAPI.getStandards() 获取计算标准
 *    - DataEntryAPI.validateData() 验证数据
 * 
 * 4. 数据管理相关API
 *    - DataManagementAPI.getHistory() 获取历史数据
 *    - DataManagementAPI.getDetails() 获取数据详情
 *    - DataManagementAPI.updateData() 更新数据
 *    - DataManagementAPI.deleteData() 删除数据
 *    - DataManagementAPI.exportData() 导出数据
 * 
 * 5. 统计分析相关API
 *    - StatisticsAPI.getOverview() 获取概览统计
 *    - StatisticsAPI.getSchoolStats() 获取学校统计
 *    - StatisticsAPI.getTrends() 获取趋势数据
 *    - StatisticsAPI.exportStats() 导出统计数据
 * 
 * 6. 用户管理相关API
 *    - UserManagementAPI.getUsers() 获取用户列表
 *    - UserManagementAPI.createUser() 创建用户
 *    - UserManagementAPI.updateUser() 更新用户
 *    - UserManagementAPI.deleteUser() 删除用户
 *    - UserManagementAPI.resetPassword() 重置密码
 * 
 * 7. 文件上传相关API
 *    - FileAPI.uploadExcel() 上传Excel文件
 *    - FileAPI.downloadTemplate() 下载模板
 *    - FileAPI.exportReport() 导出报告
 * 
 * 【请求拦截器功能】
 * - 自动添加认证头
 * - 请求参数标准化
 * - 请求日志记录
 * - 请求超时处理
 * 
 * 【响应拦截器功能】
 * - 响应数据标准化
 * - 错误状态处理
 * - 响应日志记录
 * - 自动重试机制
 * 
 * 【错误处理机制】
 * - 网络错误处理
 * - HTTP状态码错误处理
 * - 业务逻辑错误处理
 * - 超时错误处理
 * 
 * 【缓存机制】
 * - GET请求结果缓存
 * - 缓存失效策略
 * - 缓存清理机制
 * 
 * 【API端点定义】
 * - /api/auth/* - 认证相关
 * - /api/data/* - 数据相关
 * - /api/statistics/* - 统计相关
 * - /api/users/* - 用户管理相关
 * - /api/files/* - 文件相关
 * 
 * 【待迁移的主要函数】
 * - 所有fetch调用
 * - API错误处理逻辑
 * - 请求/响应处理函数
 */

// API配置常量
const API_CONFIG = {
    BASE_URL: '/api',
    TIMEOUT: 30000, // 30秒超时
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1秒重试延迟
    CACHE_DURATION: 300000 // 5分钟缓存
};

// API端点定义
const API_ENDPOINTS = {
    // 认证相关
    AUTH: {
        STATUS: '/auth/status',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        CREATE_USER: '/auth/create-user'
    },
    
    // 数据填报相关
    DATA_ENTRY: {
        SCHOOLS: '/data/schools',
        SUBMIT: '/data/submit',
        STANDARDS: '/data/standards',
        VALIDATE: '/data/validate',
        SCHOOL_TYPE: '/school-type'
    },
    
    // 数据管理相关
    DATA_MANAGEMENT: {
        HISTORY: '/data/history',
        DETAILS: '/data/details',
        UPDATE: '/data/update',
        DELETE: '/data/delete',
        EXPORT: '/data/export',
        BATCH_EXPORT: '/batch-export',
        OVERVIEW_RECORDS: '/overview/records',
        SCHOOLS_LATEST: '/schools/latest'
    },
    
    // 统计分析相关
    STATISTICS: {
        OVERVIEW: '/statistics/overview',
        SCHOOLS: '/statistics/schools',
        TRENDS: '/statistics/trends',
        EXPORT: '/statistics/export'
    },
    
    // 用户管理相关
    USER_MANAGEMENT: {
        USERS: '/auth/users',
        CREATE: '/auth/create-user',
        UPDATE: '/auth/user',  // 需要加上/:id/status
        DELETE: '/auth/user',  // 需要加上/:id
        RESET_PASSWORD: '/auth/users/reset-password'
    },
    
    // 其他API
    OTHER: {
        YEARS: '/years',
        USERS: '/users'
    }
};

// 请求缓存
const requestCache = new Map();

// ========================================
// 基础请求方法
// ========================================

/**
 * 基础API请求方法
 * @param {string} endpoint API端点
 * @param {object} options 请求选项
 * @returns {Promise} 请求结果
 */
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.TIMEOUT
    };
    
    const config = mergeObjects(defaultOptions, options);
    
    // 请求拦截
    requestInterceptor(config);
    
    try {
        const response = await fetch(url, config);
        return await responseInterceptor(response);
    } catch (error) {
        throw handleApiError(error, `${config.method} ${url}`);
    }
}

/**
 * GET请求
 * @param {string} endpoint API端点
 * @param {object} params 查询参数
 * @param {object} options 请求选项
 * @returns {Promise} 请求结果
 */
async function apiGet(endpoint, params = {}, options = {}) {
    let url = endpoint;
    
    // 构建查询参数
    if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
    }
    
    // 检查缓存
    const cacheKey = `GET:${url}`;
    if (requestCache.has(cacheKey) && options.useCache !== false) {
        const cached = requestCache.get(cacheKey);
        if (Date.now() - cached.timestamp < API_CONFIG.CACHE_DURATION) {
            return cached.data;
        }
    }
    
    const result = await apiRequest(url, { ...options, method: 'GET' });
    
    // 缓存结果
    if (options.useCache !== false) {
        requestCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
    }
    
    return result;
}

/**
 * POST请求
 * @param {string} endpoint API端点
 * @param {object} data 请求数据
 * @param {object} options 请求选项
 * @returns {Promise} 请求结果
 */
async function apiPost(endpoint, data = {}, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * PUT请求
 * @param {string} endpoint API端点
 * @param {object} data 请求数据
 * @param {object} options 请求选项
 * @returns {Promise} 请求结果
 */
async function apiPut(endpoint, data = {}, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * DELETE请求
 * @param {string} endpoint API端点
 * @param {object} data 要发送的数据
 * @param {object} options 请求选项
 * @returns {Promise} 请求结果
 */
async function apiDelete(endpoint, data = {}, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: 'DELETE',
        body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined
    });
}

// ========================================
// 认证相关API
// ========================================

const AuthAPI = {
    /**
     * 检查用户登录状态
     * @returns {Promise} 用户状态信息
     */
    async checkStatus() {
        return apiGet(API_ENDPOINTS.AUTH.STATUS);
    },
    
    /**
     * 用户登录
     * @param {object} credentials 登录凭据
     * @returns {Promise} 登录结果
     */
    async login(credentials) {
        return apiPost(API_ENDPOINTS.AUTH.LOGIN, credentials);
    },
    
    /**
     * 用户登出
     * @returns {Promise} 登出结果
     */
    async logout() {
        return apiPost(API_ENDPOINTS.AUTH.LOGOUT);
    },
    
    /**
     * 创建用户
     * @param {object} userData 用户数据
     * @returns {Promise} 创建结果
     */
    async createUser(userData) {
        return apiPost(API_ENDPOINTS.AUTH.CREATE_USER, userData);
    }
};

// ========================================
// 数据填报相关API
// ========================================

const DataEntryAPI = {
    /**
     * 获取学校列表
     * @returns {Promise} 学校列表数据
     */
    async getSchools() {
        return apiGet('/school-options');
    },
    
    /**
     * 获取学校类型
     * @param {string} schoolName 学校名称
     * @returns {Promise} 学校类型信息
     */
    async getSchoolType(schoolName) {
        const endpoint = `${API_ENDPOINTS.DATA_ENTRY.SCHOOL_TYPE}/${encodeURIComponent(schoolName)}`;
        return apiGet(endpoint);
    },
    
    /**
     * 提交测算数据
     * @param {object} data 测算数据
     * @returns {Promise} 提交结果
     */
    async submitData(data) {
        return apiPost(API_ENDPOINTS.DATA_ENTRY.SUBMIT, data);
    },
    
    /**
     * 获取计算标准
     * @returns {Promise} 计算标准数据
     */
    async getStandards() {
        return apiGet(API_ENDPOINTS.DATA_ENTRY.STANDARDS);
    }
};

// ========================================
// 数据管理相关API
// ========================================

const DataManagementAPI = {
    /**
     * 获取概览记录
     * @param {object} params 查询参数
     * @returns {Promise} 概览记录数据
     */
    async getOverviewRecords(params = {}) {
        return apiGet(API_ENDPOINTS.DATA_MANAGEMENT.OVERVIEW_RECORDS, params);
    },
    
    /**
     * 获取学校最新数据
     * @param {object} params 查询参数
     * @returns {Promise} 学校数据
     */
    async getSchoolsLatest(params = {}) {
        return apiGet(API_ENDPOINTS.DATA_MANAGEMENT.SCHOOLS_LATEST, params);
    },
    
    /**
     * 批量导出数据
     * @param {object} exportParams 导出参数
     * @returns {Promise} 导出结果
     */
    async batchExport(exportParams) {
        return apiPost(API_ENDPOINTS.DATA_MANAGEMENT.BATCH_EXPORT, exportParams);
    },
    
    /**
     * 获取历史数据
     * @param {object} filters 筛选条件
     * @returns {Promise} 历史数据
     */
    async getHistory(filters = {}) {
        return apiGet(API_ENDPOINTS.DATA_MANAGEMENT.HISTORY, filters);
    },
    
    /**
     * 获取数据详情
     * @param {string|number} id 数据ID
     * @returns {Promise} 数据详情
     */
    async getDetails(id) {
        const endpoint = `${API_ENDPOINTS.DATA_MANAGEMENT.DETAILS}/${id}`;
        return apiGet(endpoint);
    },
    
    /**
     * 更新数据
     * @param {string|number} id 数据ID
     * @param {object} data 更新数据
     * @returns {Promise} 更新结果
     */
    async updateData(id, data) {
        const endpoint = `${API_ENDPOINTS.DATA_MANAGEMENT.UPDATE}/${id}`;
        return apiPut(endpoint, data);
    },
    
    /**
     * 删除数据
     * @param {string|number} id 数据ID
     * @returns {Promise} 删除结果
     */
    async deleteData(id) {
        const endpoint = `${API_ENDPOINTS.DATA_MANAGEMENT.DELETE}/${id}`;
        return apiDelete(endpoint);
    },
    
    /**
     * 导出数据
     * @param {object} exportParams 导出参数
     * @returns {Promise} 导出结果
     */
    async exportData(exportParams) {
        return apiPost(API_ENDPOINTS.DATA_MANAGEMENT.EXPORT, exportParams);
    },

    /**
     * 删除学校组合记录
     * @param {object} params 删除参数 {schoolName, year, submitterUsername}
     * @returns {Promise} 删除结果
     */
    async deleteSchoolCombination(params) {
        return apiDelete('/school-combination', params);
    },

    /**
     * 搜索学校最新数据
     * @param {object} filters 筛选条件
     * @returns {Promise} 搜索结果
     */
    async searchSchoolsLatest(filters = {}) {
        const params = [];
        
        if (filters.year && filters.year !== 'all') {
            params.push(`year=${filters.year}`);
        }
        
        if (filters.school && filters.school !== 'all') {
            params.push(`school=${encodeURIComponent(filters.school)}`);
        }
        
        if (filters.user && filters.user !== 'all') {
            params.push(`user=${encodeURIComponent(filters.user)}`);
        }
        
        let url = '/schools/latest';
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        return apiGet(url, {}, { preventCache: true });
    },

    /**
     * 删除单个记录
     * @param {string|number} recordId 记录ID
     * @returns {Promise} 删除结果
     */
    async deleteRecord(recordId) {
        return apiDelete(`/school-record/${recordId}`, null, { preventCache: true });
    },

    /**
     * 下载记录
     * @param {string|number} recordId 记录ID
     * @returns {Promise} 下载结果
     */
    async downloadRecord(recordId) {
        return apiGet(`/download-record/${recordId}`);
    }
};

// ========================================
// 统计分析相关API
// ========================================

const StatisticsAPI = {
    /**
     * 获取概览统计
     * @param {object} params 查询参数
     * @returns {Promise} 概览统计数据
     */
    async getOverview(params = {}) {
        return apiGet(API_ENDPOINTS.STATISTICS.OVERVIEW, params);
    },
    
    /**
     * 获取学校统计
     * @param {object} params 查询参数
     * @returns {Promise} 学校统计数据
     */
    async getSchoolStats(params = {}) {
        return apiGet(API_ENDPOINTS.STATISTICS.SCHOOLS, params);
    },
    
    /**
     * 获取趋势数据
     * @param {object} params 查询参数
     * @returns {Promise} 趋势数据
     */
    async getTrends(params = {}) {
        return apiGet(API_ENDPOINTS.STATISTICS.TRENDS, params);
    },
    
    /**
     * 导出统计数据
     * @param {object} exportParams 导出参数
     * @returns {Promise} 导出结果
     */
    async exportStats(exportParams) {
        return apiPost(API_ENDPOINTS.STATISTICS.EXPORT, exportParams);
    }
};

// ========================================
// 用户管理相关API
// ========================================

const UserManagementAPI = {
    /**
     * 获取用户列表
     * @param {object} params 查询参数
     * @returns {Promise} 用户列表
     */
    async getUsers(params = {}) {
        return apiGet(API_ENDPOINTS.USER_MANAGEMENT.USERS, params);
    },
    
    /**
     * 创建用户
     * @param {object} userData 用户数据
     * @returns {Promise} 创建结果
     */
    async createUser(userData) {
        return apiPost(API_ENDPOINTS.USER_MANAGEMENT.CREATE, userData);
    },
    
    /**
     * 更新用户
     * @param {string|number} id 用户ID
     * @param {object} userData 用户数据
     * @returns {Promise} 更新结果
     */
    async updateUser(id, userData) {
        const endpoint = `${API_ENDPOINTS.USER_MANAGEMENT.UPDATE}/${id}`;
        return apiPut(endpoint, userData);
    },
    
    /**
     * 删除用户
     * @param {string|number} id 用户ID
     * @returns {Promise} 删除结果
     */
    async deleteUser(id) {
        return apiDelete(`/auth/user/${id}`);
    },
    
    /**
     * 重置用户密码
     * @param {string|number} id 用户ID
     * @param {object} passwordData 密码数据
     * @returns {Promise} 重置结果
     */
    async resetPassword(id, passwordData) {
        const endpoint = `${API_ENDPOINTS.USER_MANAGEMENT.RESET_PASSWORD}/${id}`;
        return apiPost(endpoint, passwordData);
    },

    /**
     * 切换用户状态
     * @param {string|number} id 用户ID
     * @param {string} status 新状态
     * @returns {Promise} 切换结果
     */
    async toggleUserStatus(id, status) {
        return apiPut(`/auth/user/${id}/status`, { status });
    }
};

// ========================================
// 其他通用API
// ========================================

const CommonAPI = {
    /**
     * 获取年份列表
     * @returns {Promise} 年份列表
     */
    async getYears() {
        return apiGet(API_ENDPOINTS.OTHER.YEARS);
    },

    /**
     * 获取用户列表
     * @returns {Promise} 用户列表
     */
    async getUsers() {
        return apiGet(API_ENDPOINTS.OTHER.USERS);
    },

    /**
     * 批量导出数据
     * @param {object} params 导出参数
     * @returns {Promise} 导出结果
     */
    async batchExport(params) {
        return apiPost('/batch-export', params);
    },

    /**
     * 检查数据库连接状态
     * @returns {Promise} 数据库状态信息
     */
    async checkDatabaseStatus() {
        try {
            return await apiGet('/database/status');
        } catch (error) {
            console.warn('数据库状态检查失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 下载记录
     * @param {string|number} recordId 记录ID
     * @returns {Promise} 下载结果
     */
    async downloadRecord(recordId) {
        return DataManagementAPI.downloadRecord(recordId);
    }
};

// ========================================
// 拦截器和错误处理
// ========================================

/**
 * 请求拦截器
 * @param {object} config 请求配置
 */
function requestInterceptor(config) {
    // 添加时间戳防止缓存
    if (config.method === 'GET' && config.preventCache !== false) {
        const url = new URL(config.url || window.location.href);
        url.searchParams.set('_t', Date.now());
        config.url = url.toString();
    }
    
    // 添加通用请求头
    if (!config.headers) {
        config.headers = {};
    }
    
    // 日志记录
    if (window.console && typeof console.log === 'function') {
        console.log(`API Request: ${config.method} ${config.url || 'unknown'}`, config);
    }
}

/**
 * 响应拦截器
 * @param {Response} response fetch响应对象
 * @returns {Promise} 处理后的响应数据
 */
async function responseInterceptor(response) {
    // 日志记录
    if (window.console && typeof console.log === 'function') {
        console.log(`API Response: ${response.status} ${response.url}`, response);
    }
    
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
            // 如果无法解析错误响应，使用默认错误消息
        }
        
        throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    } else {
        return await response.text();
    }
}

/**
 * API错误处理器
 * @param {Error} error 错误对象
 * @param {string} context 错误上下文
 * @returns {Error} 处理后的错误
 */
function handleApiError(error, context = '') {
    const errorMessage = error.message || Constants.ERROR_MESSAGES.NETWORK_ERROR;
    const contextMessage = context ? `[${context}] ` : '';
    
    console.error(`${contextMessage}${errorMessage}`, error);
    
    // 创建标准化错误对象
    const apiError = new Error(`${contextMessage}${errorMessage}`);
    apiError.originalError = error;
    apiError.context = context;
    
    return apiError;
}

/**
 * 清除API缓存
 * @param {string} pattern 缓存键模式（可选）
 */
function clearApiCache(pattern = '') {
    if (!pattern) {
        requestCache.clear();
        return;
    }
    
    for (const [key] of requestCache) {
        if (key.includes(pattern)) {
            requestCache.delete(key);
        }
    }
}

// ========================================
// 导出API对象（便于其他模块使用）
// ========================================

// 将API对象挂载到全局作用域（临时解决方案，后续可以用模块化替代）
if (typeof window !== 'undefined') {
    window.AuthAPI = AuthAPI;
    window.DataEntryAPI = DataEntryAPI;
    window.DataManagementAPI = DataManagementAPI;
    window.StatisticsAPI = StatisticsAPI;
    window.UserManagementAPI = UserManagementAPI;
    window.CommonAPI = CommonAPI;
    window.clearApiCache = clearApiCache;
}
