# 📚 选择题答题系统（HTML/JS 静态页面）

[Demo Page](https://cangzihan.github.io/web_choice/)

一个简单易用的浏览器答题系统，支持以 JSON 格式加载题库，支持按单元答题与随机抽题模式，并可显示选项反馈和解析。

## 🔧 功能介绍

- ✅ 从本地 JSON 格式数据中读取题库
- ✅ 支持按 `Unit` 单元选择题目
- ✅ 支持随机抽取题
- ✅ 单题展示 + 选项按钮选择
- ✅ 自动判断正确/错误并高亮
- ✅ 支持点击“查看解析”显示讲解
- ✅ 自动记忆用户选择并高亮状态

---

## 📁 题库JS文件格式说明

题库应为一个`.js`文件，每个元素如下所示：

### 四选一题情况
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

### 排序题情况
```json
{
  "Question": "毕业论文按照时间顺序分为#space#4个阶段。",
  "Option": ["中期", "外审", "开题", "答辩"],
  "CorrectOrder": [3, 1, 2, 4], 
  "KeyPosition": 3, 
  "Analysis": "",
  "Unit": 1
}
```

- Unit: 单元编号（可以是整数）
- Question: 问题文本，其中 #space# 表示填空位置，会渲染成四个空格位（含一个关键位置）
- Option: 选项数组，需要按顺序排列
- CorrectOrder: 正确的顺序，用选项索引（从 1 开始）表示。
- KeyPosition: 关键位置（从 1 开始计数），在判分时如果用户该位置选择正确，会给予部分肯定，即使整体顺序不对
- Analysis: 该题解析说明

### 单词对对碰情况
参考`Word.js`，配置`WordList`字典。

## Q & A
1. 为什么只通过前端静态页面实现？
  - 本工程的目标是打造一个**任何人都能轻易部署的&任何情况下都能使用&任何设备都能兼容的**答题系统。最终是希望这个工程能够在即使没有网络，没有中心服务器，没有开发环境的情况下直接使用其核心功能。
