# 📚 选择题答题系统（HTML/JS 静态页面）

[Demo Page](https://cangzihan.github.io/web_choice/)

一个简单易用的浏览器答题系统，支持从 JSON 文件加载题库，支持按单元答题与随机抽题模式，并可显示选项反馈和解析。

## 🔧 功能介绍

- ✅ 从本地 JSON 文件中读取题库数据
- ✅ 支持按 `Unit` 单元选择题目
- ✅ 支持随机抽取 10 道题练习
- ✅ 单题展示 + 选项按钮选择
- ✅ 自动判断正确/错误并高亮
- ✅ 支持点击“查看解析”显示讲解
- ✅ 自动记忆用户选择并高亮状态

---

## 📁 题库JS文件格式说明

题库应为一个`.js`文件，每个元素如下所示：

```json
{
  "Unit": 1,
  "Question": "下列哪一个选项是 HTML 的缩写？",
  "Option": ["Hyper Text Mark Language", "High Text Markup Language", "Hyper Text Markup Language", "Hyperlink Text Management Language"],
  "Correct Answer": 3,
  "Analysis": "HTML 是 Hyper Text Markup Language 的缩写，意为超文本标记语言，用于构建网页结构。"
}
```

- `Unit`: 单元编号（可以是整数）
- `Question`: 问题文本
- `Option`: 四个选项数组
- `Correct Answer`: 正确选项索引（从 1 开始）
- `Analysis`: 该题解析说明
