# 红豆 🫘 · 你的小红书旅行决策搭子

## 本地运行

1. 安装依赖
```bash
npm install
```

2. 配置 API Key
```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 Anthropic API key
```

3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

1. 把项目推到 GitHub
2. 在 Vercel 导入这个仓库
3. 在 Vercel 的 Environment Variables 里添加：
   - `ANTHROPIC_API_KEY` = 你的 key
4. 部署完成，获得公开 URL

## Demo 演示路径

按顺序点击"发送"按钮，走完5个步骤：

1. **第1步** 画像建立：输入目的地 → 收藏夹钩子 → 偏好选择
2. **第2步** 实时洞察：五一去合适吗？→ 实时情报 + 画像差异化回答
3. **第3步** 聚合决策：大理还是丽江？→ 数据支撑的有立场建议
4. **第4步** 主动追问 + 避坑：规划行程 → 红豆主动问缺口 → 发现矛盾
5. **第5步** 行程输出：确认后输出完整行程 + 一键导出笔记

右上角可以切换"显示/隐藏解说"面板（评委模式）
