// 密钥管理网站  - 基于CloudFlare Workers

// 加密库
const Crypto = {
  getRandomValues: (array) => crypto.getRandomValues(array),
  subtle: crypto.subtle
};


// HTML模板 - 登录页
const loginPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>密钥管理系统 - 登录</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .login-container {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      min-height: 100vh;
    }
    .login-box {
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      transition: all 0.3s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .input-field {
      transition: all 0.3s;
      border: 1px solid #e2e8f0;
    }
    .input-field:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
    }
  </style>
</head>
<body class="login-container flex items-center justify-center">
  <div class="login-box p-8 rounded-xl w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-key mr-2"></i>密钥管理系统</h1>
      <p class="text-gray-600 mt-2">登录管理您的密钥</p>
    </div>
    
    <form id="loginForm" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-user mr-2"></i>用户名
        </label>
        <input type="text" id="username" name="username" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-lock mr-2"></i>密码
        </label>
        <input type="password" id="password" name="password" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <button type="submit" 
        class="btn-primary w-full py-3 rounded-lg text-white font-medium focus:outline-none">
        <i class="fas fa-sign-in-alt mr-2"></i>登录
      </button>
      
      <div id="errorMsg" class="text-red-500 text-center"></div>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const button = e.target.querySelector('button');
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登录中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          document.getElementById('errorMsg').textContent = result.message || '用户名或密码错误';
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        document.getElementById('errorMsg').textContent = '发生错误，请稍后再试';
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    });
  </script>
</body>
</html>
`;

// HTML模板 - 管理页
const adminPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>密钥管理系统</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); transition: all 0.3s; }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    
    .table-container { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .key-value { 
      max-width: 200px; 
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      position: relative;
    }
    .key-value:hover { color: #4f46e5; }
    .key-tooltip {
      position: fixed;
      z-index: 1000;
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      max-width: 400px;
      word-wrap: break-word;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      transform: translateY(-10px);
      white-space: normal;
      pointer-events: none;
    }
    .key-tooltip.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .key-tooltip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 20px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #1f2937;
    }
    
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-key text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">密钥管理系统</span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>密钥列表
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登录
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">密钥管理</h2>
      <div class="flex items-center space-x-4">
        <button id="generateSingleKey" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <i class="fas fa-plus mr-2"></i>生成单个密钥
        </button>
        <button id="generateBulkKeys" class="btn-success text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <i class="fas fa-copy mr-2"></i>批量生成密钥
        </button>
        <!-- 新增导出按钮 -->
        <button id="exportKeys" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <i class="fas fa-download mr-2"></i>导出密钥
        </button>
      </div>
    </div>
    
    <div class="table-container bg-white rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style="min-width: 160px;">
                密钥ID
              </th>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                设备ID
              </th>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                过期时间
              </th>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP地址
              </th>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody id="keysBody" class="bg-white divide-y divide-gray-200">
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 密钥生成模态框 -->
  <div id="keyModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center hidden z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h3 id="modalTitle" class="text-lg font-medium text-gray-900">生成密钥</h3>
          <button id="closeModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>
      
      <form id="keyForm" class="p-6 space-y-6">
        <div id="deviceIdField">
          <label for="deviceId" class="block text-sm font-medium text-gray-700 mb-1">设备ID *</label>
          <input type="text" id="deviceId" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        
        <div id="countField" class="hidden">
          <label for="keyCount" class="block text-sm font-medium text-gray-700 mb-1">生成数量 *</label>
          <input type="number" id="keyCount" min="1" max="100" value="10" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        
        <div>
          <label for="expiryDays" class="block text-sm font-medium text-gray-700 mb-1">有效期(天) *</label>
          <input type="number" id="expiryDays" min="1" value="30" required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancelBtn" 
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit" 
            class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-key mr-2"></i>生成
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // 显示提示
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }
    
    // 显示密钥完整内容
    function showKeyTooltip(key, event) {
      const tooltip = document.createElement('div');
      tooltip.className = 'key-tooltip';
      tooltip.textContent = key;
      
      // 计算位置
      const x = event.clientX;
      const y = event.clientY;
      tooltip.style.left = (x + 10) + 'px';
      tooltip.style.top = (y + 10) + 'px';
      
      document.body.appendChild(tooltip);
      tooltip.classList.add('show');
      
      // 添加事件监听器，点击页面其他地方关闭提示
      const closeListener = () => {
        tooltip.classList.remove('show');
        setTimeout(() => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        }, 300);
        document.removeEventListener('click', closeListener);
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeListener);
      }, 100);
    }
    
    // 加载所有密钥
    async function loadKeys() {
      try {
        const response = await fetch('/api/keys');
        const keys = await response.json();
        
        const tbody = document.getElementById('keysBody');
        tbody.innerHTML = '';
        
        if (keys.length === 0) {
          tbody.innerHTML = 
            '<tr>' +
              '<td colspan="6" class="px-4 py-4 text-center text-gray-500">' +
                '<i class="fas fa-key text-2xl mb-2"></i>' +
                '<p>没有密钥数据</p>' +
              '</td>' +
            '</tr>';
          return;
        }
        
        keys.forEach(key => {
          const createdAt = new Date(key.createdAt);
          const expires = new Date(key.expires);
          const now = new Date();
          const status = expires > now ? 
            '<span class="px-2 py-1 text-xs text-center font-medium rounded-full text-white bg-green-500">有效</span>' :
            '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-red-500">已过期</span>';

          const row = document.createElement('tr');
          row.className = 'hover:bg-gray-50';
          row.innerHTML = 
            // 增加宽度
            '<td class="px-4 py-3 text-sm text-center text-gray-900" style="min-width: 160px;">' + key.id + '</td>' +
            '<td class="px-4 py-3 text-sm text-center text-gray-900">' + key.deviceId  + '</td>' +
            '<td class="px-4 py-3 text-sm text-center text-gray-500">' + formatDate(createdAt) + '</td>' +
            '<td class="px-4 py-3 text-sm text-center text-gray-500">' + formatDate(expires) + '</td>' +
            '<td class="px-4 py-3 text-sm text-center text-gray-500">' + key.ip + '</td>' +
            '<td class="px-4 py-3 text-sm text-center ">' + status + '</td>' +
            '<td class="px-4 py-3 text-sm text-center ">' +
              '<div class="flex space-x-2">' +
                '<button class="view-key btn-primary text-white px-3 py-1 rounded text-xs" data-key="' + key.key + '" data-id="' + key.id + '">' +
                  '<i class="fas fa-eye mr-1"></i>查看' +
                '</button>' +
                // 新增复制按钮
                '<button class="copy-key btn-success text-white px-3 py-1 rounded text-xs" data-key="' + key.key + '">' +
                  '<i class="fas fa-copy mr-1"></i>复制' +
                '</button>' +
                '<button class="delete-key btn-danger text-white px-3 py-1 rounded text-xs" data-id="' + key.id + '">' +
                  '<i class="fas fa-trash-alt mr-1"></i>删除' +
                '</button>' +
              '</div>' +
            '</td>';
          tbody.appendChild(row);
        });
        
        // 添加查看密钥事件
        document.querySelectorAll('.view-key').forEach(button => {
          button.addEventListener('click', (e) => {
            const key = button.dataset.key;
            showKeyTooltip(key, e);
          });
        });
        
        // 添加复制密钥事件
        document.querySelectorAll('.copy-key').forEach(button => {
          button.addEventListener('click', async () => {
            const key = button.dataset.key;
            try {
              await navigator.clipboard.writeText(key);
              showToast('密钥已复制到剪贴板', 'success');
            } catch (err) {
              showToast('复制失败，请手动复制', 'error');
            }
          });
        });
        
        // 添加删除密钥事件
        document.querySelectorAll('.delete-key').forEach(button => {
          button.addEventListener('click', () => {
            const id = button.dataset.id;
            deleteKey(id);
          });
        });
        
      } catch (error) {
        console.error('加载密钥失败:', error);
        showToast('加载密钥失败，请刷新页面重试', 'error');
      }
    }
    
    // 格式化日期
    function formatDate(date) {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // 删除密钥
    async function deleteKey(id) {
      if (!confirm('确定要删除这个密钥吗？此操作不可恢复。')) {
        return;
      }
      
      try {
        const response = await fetch('/api/keys/' + id, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showToast('密钥删除成功', 'success');
          loadKeys();
        } else {
          const error = await response.json();
          showToast('删除失败: ' + (error.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('删除密钥失败:', error);
        showToast('删除失败，请稍后再试', 'error');
      }
    }
    
    // 生成密钥
    async function generateKeys(deviceId, count, expiryDays) {
      try {
        const response = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, count, expiryDays })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showToast('成功生成' + count + '个密钥', 'success');
          document.getElementById('keyModal').classList.add('hidden');
          loadKeys();
        } else {
          showToast('生成失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('生成密钥失败:', error);
        showToast('生成失败，请稍后再试', 'error');
      }
    }
    
    // 页面加载完成后初始化
    window.addEventListener('load', () => {
      // 加载密钥列表
      loadKeys();
      
      // 单个密钥生成按钮
      document.getElementById('generateSingleKey').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = '生成单个密钥';
        document.getElementById('deviceIdField').classList.remove('hidden');
        document.getElementById('countField').classList.add('hidden');
        document.getElementById('keyModal').classList.remove('hidden');
      });
      
      // 批量密钥生成按钮
      document.getElementById('generateBulkKeys').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = '批量生成密钥';
        document.getElementById('deviceIdField').classList.add('hidden');
        document.getElementById('countField').classList.remove('hidden');
        document.getElementById('keyModal').classList.remove('hidden');
      });
      
      // 关闭模态框
      document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('keyModal').classList.add('hidden');
      });
      
      document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('keyModal').classList.add('hidden');
      });
      
      // 密钥生成表单提交
      document.getElementById('keyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const deviceId = document.getElementById('deviceIdField').classList.contains('hidden') ? 
          "" : document.getElementById('deviceId').value;
        const count = document.getElementById('countField').classList.contains('hidden') ? 
          1 : parseInt(document.getElementById('keyCount').value);
        const expiryDays = parseInt(document.getElementById('expiryDays').value);
        
        const button = e.target.querySelector('button[type="submit"]');
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成中...';
        button.disabled = true;
        
        generateKeys(deviceId, count, expiryDays);
        
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.disabled = false;
        }, 2000);
      });
      
      document.getElementById('exportKeys').addEventListener('click', async () => {
        try {
          const response = await fetch('/api/keys');
          const keys = await response.json();
          if (!keys.length) {
            showToast('没有可导出的密钥', 'info');
            return;
          }
          // 生成CSV内容
          const header = ['key_ID', 'device_ID', 'created_TIME', 'expires_TIME', 'IP', 'key'];
          const rows = keys.map(k => [
            k.id,
            k.deviceId,
            k.createdAt,
            k.expires,
            k.ip,
            k.key
          ]);
          const csv = [header, ...rows].map(function(row) {
            return row.map(function(v) {
              return '"' + ((v ?? '').toString().replace(/"/g, '""')) + '"';
            }).join(',');
          }).join('\\r\\n');
          // 下载
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'keys_export.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('密钥已导出', 'success');
        } catch (e) {
          showToast('导出失败', 'error');
        }
      });
    });
  </script>
</body>
</html>
`;

// 生成单个密钥
async function generateKey(deviceId, expiryDays, env, clientIp) {
  const key = _generateRandomKey();
  console.log(`[生成密钥] 设备ID: ${deviceId}, 密钥: ${key}, 有效期: ${expiryDays}天, IP: ${clientIp}`);
  const encryptedKey = await _encryptKey(key, env);

  const keyData = {
    key: encryptedKey,
    deviceId,
    createdAt: new Date().toISOString(),
    expires: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
    ip: clientIp || '',
    status: 'active',
  };

  const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  await env.KMS_KV.put(id, JSON.stringify(keyData));
  return { id, ...keyData, key }; // 返回包含原始密钥的对象
}

// 批量生成密钥
async function generateBulkKeys(count, expiryDays, env, ip) {
  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = await generateKey(`sys_device_${Date.now()}_${i}`, expiryDays, env, ip);
    keys.push(key);
  }
  return keys;
}

// 获取所有密钥
async function getAllKeys(env) {
  const keys = [];
  const list = await env.KMS_KV.list();
  
  for (const key of list.keys) {
    const value = await env.KMS_KV.get(key.name);
    if (value) {
      const keyData = JSON.parse(value);
      // 解密密钥（仅管理员可见）
      try {
        keyData.key = await _decryptKey(keyData.key, env);
      } catch (e) {
        keyData.key = "解密失败";
      }
      keys.push({ id: key.name, ...keyData });
    }
  }
  
  return keys;
}

// 删除密钥
async function deleteKey(id, env) {
  await env.KMS_KV.delete(id);
  return { success: true };
}

// 清理过期密钥
async function cleanupExpiredKeys(env) {
const list = await env.KMS_KV.list();
const now = new Date();
let deletedCount = 0;
if(!list.keys || list.keys.length === 0) {
  return { deletedCount: 0 };
}
for (const kvKey of list.keys) {
  const keyData = await env.KMS_KV.get(kvKey.name);
  if (!keyData) continue;
  
  const keyObj = JSON.parse(keyData);
  if (new Date(keyObj.expires) < now) {
    await env.KMS_KV.delete(kvKey.name); // 使用 KV 键名删除
    deletedCount++;
  }
}

return { deletedCount };
}

// 生成随机密钥
function _generateRandomKey() {
  const array = new Uint8Array(32);
  Crypto.getRandomValues(array);
  let key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return key;
}

// 加密密钥
async function _encryptKey(key, env) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  
  // 使用环境变量中的主密钥
  const masterKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.MASTER_KEY),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    keyData
  );
  
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  });
}

// 解密密钥
async function _decryptKey(encrypted, env) {
  const { iv, data } = JSON.parse(encrypted);
  const ivArray = new Uint8Array(iv);
  const dataArray = new Uint8Array(data);
  
  // 使用环境变量中的主密钥
  const encoder = new TextEncoder();
  const masterKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.MASTER_KEY),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    masterKey,
    dataArray
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// 请求处理
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 登录页面
  if (path === '/') {
    return new Response(loginPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // 管理页面
  if (path === '/admin') {
    // 检查认证
    const cookies = request.headers.get('Cookie') || '';
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    // 简单验证逻辑（实际应用中应使用JWT等）
    if (!token || token !== 'valid_token') {
      return new Response('', {
        status: 302,
        headers: { 'Location': '/' }
      });
    }
    
    return new Response(adminPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // API路由
  if (path.startsWith('/api')) {
    return handleAPIRequest(request, env, ctx);
  }
  
  return new Response('Not Found', { status: 404 });
}

// API请求处理
async function handleAPIRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 登录API
  if (path === '/api/login' && request.method === 'POST') {
    const body = await request.json();
    if (body.username === env.USER && body.password === env.PASSWORD) {
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'token=valid_token; HttpOnly; Path=/; Max-Age=86400'
          }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: '用户名或密码错误' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // 登出API
  if (path === '/api/logout' && (request.method === 'GET' || request.method === 'POST')) {
    return new Response('', {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': 'token=; Path=/; Max-Age=0'
      }
    });
  }
  
  // 密钥管理API
  if (path.startsWith('/api/keys')) {
    // 检查认证
    const cookies = request.headers.get('Cookie') || '';
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token || token !== 'valid_token') {
      return new Response(
        JSON.stringify({ success: false, message: '未授权访问' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    
    // 获取所有密钥
    if (path === '/api/keys' && request.method === 'GET') {
      const keys = await getAllKeys(env);
      return new Response(JSON.stringify(keys), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成密钥
    if (path === '/api/keys' && request.method === 'POST') {
      const body = await request.json();
      const { deviceId, count, expiryDays } = body;
      
      // 获取客户端IP
      const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';

      try {
        let result;
        if (count > 1) {
          // 批量生成时每个密钥都带上IP
          result = await generateBulkKeys(count, expiryDays, env, clientIp);
        } else {
          result = await generateKey(deviceId, expiryDays, env, clientIp);
        }

        return new Response(JSON.stringify(result), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, message: '生成密钥失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // 删除密钥
    if (path.startsWith('/api/keys/') && request.method === 'DELETE') {
      const id = path.split('/')[3];
      const result = await deleteKey(id, env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}

// 定时任务 - 清理过期密钥
async function scheduled(event, env, ctx) {
  const result = await cleanupExpiredKeys(env);
  console.log(`[定时任务] 清理了 ${result.deletedCount} 个过期密钥`);
}

export default {
  fetch: handleRequest,
  scheduled
};