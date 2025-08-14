/**
 * ==============================================
 * main.js - 主应用入口文件
 * ==============================================
 * 
 * 【文件职责】
 * - 应用初始化和全局配置
 * - 页面路由和导航控制
 * - 全局事件监听和处理
 * - 应用生命周期管理
 * - 全局变量和常量定义
 * 
 * 【主要功能模块】
 * 1. 应用初始化
 *    - DOMContentLoaded 事件处理
 *    - 用户状态检查
 *    - 页面权限控制
 * 
 * 2. 页面导航系统
 *    - showPage() 函数
 *    - 菜单项切换逻辑
 *    - 页面显示/隐藏控制
 *    - 移动端侧边栏控制
 * 
 * 3. 全局状态管理
 *    - currentUser 全局变量
 *    - 用户权限状态
 *    - 页面状态维护
 * 
 * 4. 响应式布局控制
 *    - 移动端菜单切换
 *    - 侧边栏折叠/展开
 *    - 屏幕尺寸适配
 * 
 * 【依赖关系】
 * - 依赖: auth.js (用户认证)
 * - 依赖: utils.js (工具函数)
 * - 被依赖: 所有其他模块
 * 
 * 【全局变量】
 * - currentUser: 当前登录用户信息
 * - pageState: 当前页面状态
 * 
 * 【待迁移的主要函数】
 * - showPage()
 * - toggleSidebar()
 * - updateUserInfo()
 * - 页面初始化相关函数
 */
// ========================================
// 全局变量和状态管理
// ========================================

// 页面状态管理
let pageState = {
    currentPage: 'data-entry',
    isSidebarOpen: true,
    isMobile: false
};

// ========================================
// 应用主管理器
// ========================================

/**
 * 主应用管理器
 */
const AppManager = {
    
    /**
     * 初始化应用
     */
    async initialize() {
        try {
            console.log('开始初始化主应用...');
            
            // 检测设备类型
            this.detectDeviceType();
            
            // 设置全局事件监听器
            this.setupEventListeners();
            
            // 初始化页面状态
            this.initializePageState();
            
            console.log('主应用初始化完成');
            
        } catch (error) {
            console.error('主应用初始化失败:', error);
        }
    },
    
    /**
     * 检测设备类型
     */
    detectDeviceType() {
        pageState.isMobile = window.innerWidth <= 768;
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            const wasMobile = pageState.isMobile;
            pageState.isMobile = window.innerWidth <= 768;
            
            // 如果从移动端切换到桌面端，自动打开侧边栏
            if (wasMobile && !pageState.isMobile) {
                this.openSidebar();
            }
        });
    },
    
    /**
     * 设置全局事件监听器
     */
    setupEventListeners() {
        // 移动端点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (pageState.isMobile) {
                const sidebar = document.getElementById('sidebar');
                const menuBtn = document.querySelector('.mobile-menu-btn');
                
                if (sidebar && menuBtn && 
                    !sidebar.contains(e.target) && 
                    !menuBtn.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });
        
        // 键盘导航支持
        document.addEventListener('keydown', (e) => {
            // ESC键关闭侧边栏（移动端）
            if (e.key === 'Escape' && pageState.isMobile) {
                this.closeSidebar();
            }
        });
    },
    
    /**
     * 初始化页面状态
     */
    initializePageState() {
        // 根据当前URL或默认显示数据填报页面
        const defaultPage = 'data-entry';
        this.showPage(defaultPage);
    },
    
    /**
     * 页面切换主函数
     * @param {string} pageId 页面ID
     */
    showPage(pageId) {
        try {
            console.log(`切换到页面: ${pageId}`);
            
            // 更新页面状态
            pageState.currentPage = pageId;
            
            // 隐藏所有页面
            this.hideAllPages();
            
            // 移除所有菜单项的活动状态
            this.clearMenuActiveStates();
            
            // 显示目标页面和菜单
            this.showTargetPage(pageId);
            
            // 加载页面特定内容
            this.loadPageContent(pageId);
            
            // 移动端自动关闭菜单
            if (pageState.isMobile) {
                this.closeSidebar();
            }
            
        } catch (error) {
            console.error(`页面切换失败 (${pageId}):`, error);
        }
    },
    
    /**
     * 隐藏所有页面
     */
    hideAllPages() {
        const allPages = document.querySelectorAll('.page-content');
        allPages.forEach(page => page.classList.remove('active'));
    },
    
    /**
     * 清除所有菜单项的活动状态
     */
    clearMenuActiveStates() {
        const allMenuItems = document.querySelectorAll('.menu-item');
        allMenuItems.forEach(item => item.classList.remove('active'));
    },
    
    /**
     * 显示目标页面和对应菜单
     * @param {string} pageId 页面ID
     */
    showTargetPage(pageId) {
        const targetPage = document.getElementById(`page-${pageId}`);
        const targetMenu = document.getElementById(`menu-${pageId}`);
        
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            console.warn(`页面元素未找到: page-${pageId}`);
        }
        
        if (targetMenu) {
            targetMenu.classList.add('active');
        } else {
            console.warn(`菜单元素未找到: menu-${pageId}`);
        }
    },
    
    /**
     * 加载页面特定内容
     * @param {string} pageId 页面ID
     */
    loadPageContent(pageId) {
        // 移除延迟，立即加载内容
        switch (pageId) {
            case 'data-entry':
                // 初始化数据填报模块
                if (typeof DataEntryManager !== 'undefined' && typeof DataEntryManager.initialize === 'function') {
                    DataEntryManager.initialize();
                }
                break;
                
            case 'data-management':
                if (typeof loadDataManagementContent === 'function') {
                    loadDataManagementContent();
                }
                break;
                
            case 'statistics':
                // 初始化统计管理器
                if (typeof statisticsManager !== 'undefined' && statisticsManager.initialize) {
                    statisticsManager.initialize();
                } else {
                    // 备用方法，兼容旧代码
                    if (typeof loadOverviewAvailableYears === 'function') {
                        loadOverviewAvailableYears();
                    }
                    if (typeof searchOverviewRecords === 'function') {
                        searchOverviewRecords();
                    }
                }
                // 更新用户信息
                const currentUser = AuthManager.getCurrentUser();
                if (currentUser && typeof updateStatisticsUserInfo === 'function') {
                    updateStatisticsUserInfo(currentUser);
                }
                break;
                
            case 'user-management':
                if (typeof loadUserManagementContent === 'function') {
                    loadUserManagementContent();
                }
                // 更新用户信息
                const user = AuthManager.getCurrentUser();
                if (user && typeof updateUserManagementUserInfo === 'function') {
                    updateUserManagementUserInfo(user);
                }
                break;
                
            default:
                // 默认情况下也初始化数据填报模块
                if (typeof DataEntryManager !== 'undefined' && typeof DataEntryManager.initialize === 'function') {
                    DataEntryManager.initialize();
                }
                break;
        }
    },
    
    /**
     * 切换侧边栏显示状态
     */
    toggleSidebar() {
        if (pageState.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    },
    
    /**
     * 打开侧边栏
     */
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('open');
            pageState.isSidebarOpen = true;
        }
    },
    
    /**
     * 关闭侧边栏
     */
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
            pageState.isSidebarOpen = false;
        }
    },
    
    /**
     * 获取当前页面状态
     * @returns {object} 当前页面状态
     */
    getPageState() {
        return { ...pageState };
    }
};

// ========================================
// 用户信息更新功能
// ========================================

/**
 * 更新统计页面的用户信息
 * @param {object} user 用户对象
 */
function updateStatisticsUserInfo(user) {
    const avatarEl = document.getElementById('userAvatar3');
    const nameEl = document.getElementById('userName3');
    const roleEl = document.getElementById('userRole3');
    
    if (avatarEl && nameEl && roleEl) {
        avatarEl.textContent = user.real_name ? user.real_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
        nameEl.textContent = user.real_name || user.username;
        
        let roleText = '用户';
        if (user.role === 'admin') roleText = '管理员';
        else if (user.role === 'construction_center') roleText = '基建中心';
        else if (user.role === 'school') roleText = '学校用户';
        
        roleEl.textContent = roleText;
    }
}

/**
 * 更新用户管理页面的用户信息
 * @param {object} user 用户对象
 */
function updateUserManagementUserInfo(user) {
    // 这个函数在用户管理模块中可能需要
    const avatarEl = document.getElementById('userAvatar4');
    const nameEl = document.getElementById('userName4');
    const roleEl = document.getElementById('userRole4');
    
    if (avatarEl && nameEl && roleEl) {
        avatarEl.textContent = user.real_name ? user.real_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
        nameEl.textContent = user.real_name || user.username;
        
        let roleText = '用户';
        if (user.role === 'admin') roleText = '管理员';
        else if (user.role === 'construction_center') roleText = '基建中心';
        else if (user.role === 'school') roleText = '学校用户';
        
        roleEl.textContent = roleText;
    }
}

// ========================================
// 兼容性函数（保持向后兼容）
// ========================================

/**
 * 页面切换函数（兼容性）
 * @param {string} pageId 页面ID
 */
function showPage(pageId) {
    return AppManager.showPage(pageId);
}

/**
 * 切换侧边栏（兼容性）
 */
function toggleSidebar() {
    return AppManager.toggleSidebar();
}

/**
 * 关闭侧边栏（兼容性）
 */
function closeSidebar() {
    return AppManager.closeSidebar();
}

/**
 * 应用初始化函数（兼容性）
 */
function initializeApp() {
    return AppManager.initialize();
}

// ========================================
// 导出到全局作用域
// ========================================

if (typeof window !== 'undefined') {
    // 主管理器
    window.AppManager = AppManager;
    
    // 兼容性函数
    window.showPage = showPage;
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;
    window.initializeApp = initializeApp;
    
    // 用户信息更新函数
    window.updateStatisticsUserInfo = updateStatisticsUserInfo;
    window.updateUserManagementUserInfo = updateUserManagementUserInfo;
    
    // 全局变量
    window.pageState = pageState;
}

// ========================================
// 模块信息
// ========================================

console.log('✅ 主应用模块 (main.js) 已加载');
console.log('📦 提供功能: 页面导航、侧边栏控制、应用状态管理');
console.log('🔗 依赖模块: auth.js');
