# Key Management System - 密钥管理系统

基于Cloudflare Workers的轻量级密钥管理系统，专为开发者设计的密钥管理解决方案。

![img1](https://github.com/user-attachments/assets/5b7cdb82-002c-45da-89d9-58ea64f71d25)


## ✨ 功能特色

### 🔑 密钥管理
- **密钥生成**：生成高强度加密密钥（AES-GCM 256位）
- **批量生成**：一次性生成多个密钥（最多100个）
- **密钥加密存储**：使用主密钥加密存储所有密钥
- **密钥生命周期管理**：设置密钥有效期，自动清理过期密钥
- **IP绑定**：记录密钥生成时的客户端IP地址

### 🛡️ 安全特性
- **端到端加密**：密钥在存储前使用AES-GCM加密
- **安全会话管理**：基于Cookie的认证机制
- **主密钥保护**：通过环境变量安全存储主密钥

### 💻 管理功能
- **密钥查看**：点击按钮查看完整密钥内容
- **密钥复制**：一键复制密钥到剪贴板
- **密钥删除**：安全删除不再需要的密钥
- **CSV导出**：导出所有密钥到CSV文件
- **状态标记**：清晰标识密钥有效/过期状态

### 🎨 用户体验
- **响应式设计**：完美适配桌面和移动设备
- **优雅的UI**：使用Tailwind CSS构建的现代化界面
- **操作反馈**：Toast通知系统提供即时反馈
- **简洁管理**：表格展示所有密钥信息

## 🚀 一键部署

### 点击按钮，一键部署到CloudFlare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/rento666/KeyManagementSystem)

> 适用于新部署，已部署项目可直接更新JS代码

## 📋 快速开始

### 1️⃣ 部署准备
1. 创建Cloudflare Workers项目
2. 创建KV命名空间（名称：`KMS_KV`）
3. 绑定KV到Worker（变量名：`KMS_KV`）

![img2](https://github.com/user-attachments/assets/c6553d96-8a0f-412e-bbfb-0df4817feed5)

### 2️⃣ 环境变量配置
| 变量名 | 必需 | 示例值 | 说明 |
|--------|------|--------|------|
| `MASTER_KEY` | ✓ | `mySuperSecretKey123!` | 加密密钥的主密钥(32+字符) |
| `USER` | ✓ | `admin` | 管理员用户名 |
| `PASSWORD` | ✓ | `123456` | 管理员密码 |

### 3️⃣ 定时任务设置
在Cloudflare Workers控制台：
1. 点击"设置"，进入"触发事件"选项卡
2. 添加Cron触发器：`0 * * * *`（每小时执行一次）

### 4️⃣ 系统访问
1. 访问Worker部署地址
2. 使用设置的用户名密码登录
3. 立即开始管理您的密钥

## 🔧 功能使用指南

### 生成密钥
1. 点击"生成单个密钥"或"批量生成密钥"
2. 设置参数：
   - 设备ID（单密钥）
   - 生成数量（批量）
   - 有效期（天数）
3. 点击生成按钮

### 密钥操作
- **查看密钥**：点击"查看"按钮显示完整密钥
- **复制密钥**：点击"复制"按钮复制到剪贴板
- **删除密钥**：点击"删除"按钮移除密钥
- **导出密钥**：点击"导出密钥"下载CSV文件

### 支持外部调用的API列表
| api名 | 请求方式 | 需要登录 | 参数示例 | 说明 | 
|--------|------|--------|------|------|
| `/api/key/check` | `POST` | `否` | `{key: 密钥}` | 查询该密钥是否过期 |



## 🤝 贡献指南
欢迎贡献代码、报告问题或提出新功能建议！

## 📜 许可证
MIT License

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rento666/KeyManagementSystem&type=Date)](https://www.star-history.com/#rento666/KeyManagementSystem&Date)
