// display: grid：用网格布局。
// grid-template-columns: repeat(20, auto)：一行最多20列，每列自动宽度。
// gap: 5px：按钮之间留5px的间距。
// 超过20个按钮，会自动换行到下一行。
let allData = [];
let filteredData = [];
let currentIndex = 0;
let userAnswers = [];

let selectedUnit = null;
let isMatchQuestion = false;  // 标记是否是匹配题

// For order question
let tempOrder = [];
let selectedSet = new Set();

const translations = {
    zh: {
      selectBook: "📚 请选择一本书",
      selectUnit: "请选择单元或随机抽取题目",
      startQuiz: "开始答题",
      loading: "加载中...",
      chooseBookFirst: "请先选择一本书",
      warningNoQuestion: "该单元没有题目，请检查 JSON 数据！",
      questionNext: "下一题 →",
      questionPrev: "← 上一题",
      matchGuide: "请将左边的单词与右边的释义配对"
    },
    en: {
      selectBook: "📚 Please select a book",
      selectUnit: "Please select a unit or choose random questions",
      startQuiz: "Start Quiz",
      loading: "Loading...",
      chooseBookFirst: "Please select a book first",
      warningNoQuestion: "There is no question for this unit, please check the JSON data!",
      questionPrev: "← Previous",
      questionNext: "Next →",
      matchGuide: "Please match the word on the left with its meaning on the right"
    },
    jp: {
      selectBook: "📚 本を選択してください",
      selectUnit: "ユニットを選択するか、トピックをランダムに選択してください",
      startQuiz: "質問に答え始める",
      loading: "読み込み中...",
      chooseBookFirst: "まず本を選択してください",
      warningNoQuestion: "ユニットに問題はないので、JSON データを確認してください。",
      questionPrev: "← Previous",
      questionNext: "Next →",
      matchGuide: "左側の単語と右側の意味を一致させてください"
    }
};

function changeLanguage() {
    const lang = document.getElementById("languageSelect").value;
    localStorage.setItem("lang", lang); // 保存用户选择
    applyLanguage(lang);
}

function applyLanguage(lang) {
    const t = translations[lang];

    document.getElementById("selectedBookTitle").textContent = t.selectBook;
    document.querySelector(".theme-base-button").textContent = t.startQuiz;
    document.getElementById("prevBtn").textContent = t.questionPrev;
    document.getElementById("nextBtn").textContent = t.questionNext;
    document.getElementById("matchQuestionText").textContent = t.matchGuide;
}

// 初始化书籍列表
const bookListContainer = document.getElementById("bookList");
bookList.forEach((book, idx) => {
  const li = document.createElement("li");
  li.textContent = book.Title;
  li.dataset.index = idx;
  li.addEventListener("click", () => selectBook(idx, li));
  bookListContainer.appendChild(li);
});

function selectBook(idx, li) {
  // 选中效果
  document.querySelectorAll("#bookList li").forEach(el => el.classList.remove("active"));
  li.classList.add("active");

  const bookInfo = bookList[idx];
  const dataVarName = bookInfo.DataVar;
  allData = window[dataVarName];
  isMatchQuestion = bookInfo.QuestionType === "match";

  document.getElementById("selectedUnitTitle").textContent = "📖 " + bookInfo.Title;

  // 渲染单元列表
  const unitListContainer = document.getElementById("unitList");
  unitListContainer.innerHTML = "";
  const unitSet = new Set(allData.map(q => q.Unit));

  unitSet.forEach(unit => {
    const unitLi = document.createElement("li");
    unitLi.textContent = `Unit ${unit}`;
    unitLi.dataset.unit = unit;
    unitLi.addEventListener("click", () => selectUnit(unit, unitLi));
    unitListContainer.appendChild(unitLi);
  });

  // 随机抽题选项（仅非匹配题）
  if (!isMatchQuestion) {
    const random10 = document.createElement("li");
    random10.textContent = "🎲 随机抽取 10 题";
    random10.dataset.unit = "__RANDOM_10__";
    random10.addEventListener("click", () => selectUnit("__RANDOM_10__", random10));
    unitListContainer.appendChild(random10);

    const random15 = document.createElement("li");
    random15.textContent = "🎲 随机抽取 15 题";
    random15.dataset.unit = "__RANDOM_15__";
    random15.addEventListener("click", () => selectUnit("__RANDOM_15__", random15));
    unitListContainer.appendChild(random15);
  }
}

function selectUnit(unit, li) {
  document.querySelectorAll("#unitList li").forEach(el => el.classList.remove("active"));
  li.classList.add("active");

  selectedUnit = unit; // 保存全局选中单元
}

function shuffleOptionsAndFixAnswer(q) {
    // 如果是排序题（有 CorrectOrder 字段），不打乱，直接返回
    if (q.CorrectOrder) {
      return q;
    }

    const originalOptions = q.Option;
    const correctIndex = q["Correct Answer"] - 1;

    // 创建索引数组并打乱
    const indices = originalOptions.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // 生成新的选项顺序
    const shuffledOptions = indices.map(i => originalOptions[i]);

    // 找到正确答案的新位置
    const newCorrectIndex = indices.indexOf(correctIndex);

    // 返回新结构
    return {
      ...q,
      Option: shuffledOptions,
      "Correct Answer": newCorrectIndex + 1 // 仍然用 1 开始
    };
}

function startQuiz() {
    const savedLang = localStorage.getItem("lang") || "zh";
    const t = translations[savedLang];

    if (!selectedUnit) return alert("请选择一个单元！");

    if (selectedUnit === "__RANDOM_10__") {
      filteredData = allData.sort(() => Math.random() - 0.5).slice(0, 10);
    }
    else if (selectedUnit === "__RANDOM_15__") {
      filteredData = allData.sort(() => Math.random() - 0.5).slice(0, 15);
    }
    else {
      filteredData = allData.filter(q => Number(q.Unit) === Number(selectedUnit));
    }

    // 对每题打乱选项并修正正确答案
    // 匹配题不需要处理选项
    if (!isMatchQuestion) {
      filteredData = filteredData.map(shuffleOptionsAndFixAnswer);
    }

    if (filteredData.length === 0) {
      alert(t.warningNoQuestion);
      return;
    }

    userAnswers = new Array(filteredData.length).fill(null);
    currentIndex = 0;
    document.getElementById("startScreen").style.display = "none";

    if (isMatchQuestion) {
      document.getElementById("matchScreen").style.display = "flex";
      document.getElementById("quizScreen").style.display = "none";
      renderMatchQuestion();
    } else {
      document.getElementById("quizScreen").style.display = "flex";
      document.getElementById("matchScreen").style.display = "none";
      renderQuestion(currentIndex);
    }

    // 下方跳转题目按钮
    const navContainer = document.getElementById("questionNav");
    navContainer.innerHTML = ""; // 清空旧的
    
    if (!isMatchQuestion) {
      filteredData.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.textContent = idx + 1;
        btn.id = `navBtn${idx}`;  // 加 ID
        btn.className = "nav-btn"; // 加 class，用于 CSS 统一样式
        btn.style.padding = "2px 4px";
        btn.style.textAlign = "center";  // 防止多行时居左
        btn.style.borderRadius = "4px";
        btn.style.border = "1px solid #aaa";
        btn.style.cursor = "pointer";

        btn.onclick = () => {
          currentIndex = idx;
          renderQuestion(currentIndex);
        };
        navContainer.appendChild(btn);
      });
    }
}

function renderQuestion(index) {
    const question = filteredData[index];
    const sortSubmitBtn = document.querySelector("#sortSubmitBtn");

    // 👉 如果是排序题，走单独逻辑
    if (question.CorrectOrder) {
      sortSubmitBtn.style.visibility = "visible";
      renderOrderQuestion(question, index);
      return;
    }
    sortSubmitBtn.style.visibility = "hidden";

    const qText = document.getElementById("questionText");
    const container = document.getElementById("optionsContainer");
    const analysisBtn = document.getElementById("analysisBtn");
    const analysisText = document.getElementById("analysisText");

    // 渲染带注释的问题文本
    const rawText = question.Question;
    const renderedHTML = rawText.replace(/\[([^\]]+)\]\{([^\}]+)\}/g, (match, visible, note) => {
      return `<span class="annotated-word" data-note="${note}">${visible}</span>`;
    });

    qText.innerHTML = `${index + 1}. ${renderedHTML}`;
    container.innerHTML = "";
    analysisBtn.style.visibility = "hidden";
    analysisText.textContent = "请选择选项后点击“查看解析”以显示内容。";

    question.Option.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => {
        if (userAnswers[index] == null) {
          userAnswers[index] = i + 1;
          checkAnswer(i + 1, btn, question["Correct Answer"]);
          analysisBtn.style.visibility = "visible";
        }
      };
      container.appendChild(btn);
    });

    // 渲染选项按钮
    if (userAnswers[index] != null) {
      const selected = userAnswers[index];
      const buttons = document.querySelectorAll(".options button");
      buttons.forEach(btn => btn.disabled = true);
      if (selected === question["Correct Answer"]) {
        buttons[selected - 1].classList.add("correct");
      } else {
        buttons[selected - 1].classList.add("wrong");
        buttons[question["Correct Answer"] - 1].classList.add("correct");
      }
      analysisBtn.style.visibility = "visible";
      showAnalysis();
    }

    // 控制上一题/下一题按钮状态。如果这道题是最后一题则禁用下一题按钮，如果这道题是第一题则禁用上一题按钮
    const prevBtn = document.querySelector(".navigation button:nth-child(1)");
    const nextBtn = document.getElementById("nextBtn")

    if (index === 0){
        prevBtn.style.visibility = "hidden";
    }
    else {
        prevBtn.style.visibility = "visible";
    }
    if  (index === filteredData.length - 1){
        nextBtn.style.visibility = "hidden";
    }
    else {
        nextBtn.style.visibility = "visible";
    }

    document.querySelectorAll(".annotated-word").forEach(span => {
      span.addEventListener("click", () => {
        const note = span.getAttribute("data-note");
        const analysisText = document.getElementById("analysisText");
        analysisText.textContent = note;
      });
    });
}

function checkAnswer(selected, button, correct) {
    const buttons = document.querySelectorAll(".options button");
    buttons.forEach(btn => btn.disabled = true);
    if (selected === correct) {
      button.classList.add("correct");
    } else {
      button.classList.add("wrong");
      buttons[correct - 1].classList.add("correct");
    }

    // 高亮题号按钮
    const navBtn = document.querySelector(`#navBtn${currentIndex}`);
    if (selected === correct) {
      navBtn.classList.add("correct");
    } else {
      navBtn.classList.add("wrong");
    }
}

function showAnalysis() {
    const analysis = filteredData[currentIndex]["Analysis"];
    document.getElementById("analysisText").textContent = analysis || "暂无解析";
}

function nextQuestion() {
    if (currentIndex < filteredData.length - 1) {
      currentIndex++;
      renderQuestion(currentIndex);
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion(currentIndex);
    }
}

function goBackToStart() {
    document.getElementById("quizScreen").style.display = "none";   // 隐藏答题界面
    document.getElementById("matchScreen").style.display = "none";  // 隐藏答题界面
    document.getElementById("startScreen").style.display = "flex"; // 显示选书界面

    // 👉 清空题号按钮
    document.getElementById("questionNav").innerHTML = "";
}

// 切换主题并保存到本地存储
function toggleTheme() {
    const body = document.querySelector('body');
    const isDark = document.getElementById("themeToggleSwitch").checked;

    if (isDark) {
      body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
}

function applyDefaultThemeByTime() {
    const hour = new Date().getHours(); // 当前小时数
    const body = document.querySelector('body');

    // 优先读取用户本地存储的选择
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
        return;
    }

    // 如果没有用户设置，按时间设置
    if (hour >= 0 && hour < 5) {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
  }

  // 当浏览器把 HTML 页面的结构全部加载完毕后，就执行括号里的代码块。
  // window 是浏览器中代表 全局对象 的变量
  // () => { ... } 是ES6 中的 箭头函数（Arrow Function），是一个简洁的函数写法。
  window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem("lang") || "zh";

    const theme = localStorage.getItem('theme') || (isNightTime() ? 'dark' : 'light');
    const isDark = theme === 'dark';

    document.getElementById("languageSelect").value = savedLang;
    applyLanguage(savedLang);
    
    document.body.classList.toggle('dark-theme', isDark);
    document.getElementById("themeToggleSwitch").checked = isDark;
});

function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 0 && hour < 5;
}

function renderMatchQuestion() {
    const questionData = filteredData[currentIndex];
    const wordPairs = Object.entries(questionData.WordList);

    const sampledPairs = shuffle([...wordPairs]).slice(0, 6); // 抽6对
    const leftWords = shuffle(sampledPairs); // 左边打乱
    const rightMeanings = shuffle(sampledPairs.map(([_, m]) => m)); // 右边打乱

    const leftContainer = document.getElementById("matchLeft");
    const rightContainer = document.getElementById("matchRight");

    leftContainer.innerHTML = "";
    rightContainer.innerHTML = "";

    let selectedLeft = null;
    let selectedRight = null;
    const matched = new Map();

    // 渲染左边词卡
    leftWords.forEach(([word]) => {
        const card = document.createElement("div");
        card.textContent = word;
        card.className = "word-card";
        card.style.padding = "8px 12px";
        card.style.borderRadius = "8px";
        card.style.cursor = "pointer";

        // 这里添加动画结束监听
        card.addEventListener("animationend", () => {
            card.classList.remove("wrong_match");
        });

        card.addEventListener("click", () => {
            if (matched.has(word)) return;
            if (selectedLeft) selectedLeft.classList.remove("selected");
            selectedLeft = card;
            card.classList.add("selected");

            // 如果右边已选，则判断配对
            if (selectedRight) {
            const meaning = selectedRight.textContent;
            if (questionData.WordList[word] === meaning) {
                card.classList.add("correct_match");
                selectedRight.classList.add("correct_match");
                matched.set(word, meaning);
            } else {
                card.classList.add("wrong_match");
                selectedRight.classList.add("wrong_match");
            }
            card.classList.remove("selected");
            selectedRight.classList.remove("selected");
            selectedLeft = null;
            selectedRight = null;
            }
      });

      leftContainer.appendChild(card);
    });

    // 渲染右边释义卡
    rightMeanings.forEach(meaning => {
        const card = document.createElement("div");
        card.textContent = meaning;
        card.className = "word-card";
        card.style.padding = "8px 12px";
        card.style.borderRadius = "8px";
        card.style.cursor = "pointer";

        // 这里添加动画结束监听
        card.addEventListener("animationend", () => {
            card.classList.remove("wrong_match");
        });

        card.addEventListener("click", () => {
            // 已匹配则不可再点
            if ([...matched.values()].includes(meaning)) return;
            if (selectedRight) selectedRight.classList.remove("selected");
            selectedRight = card;
            card.classList.add("selected");

            // 如果左边已选，则判断配对
            if (selectedLeft) {
            const word = selectedLeft.textContent;
            if (questionData.WordList[word] === meaning) {
                selectedLeft.classList.add("correct_match");
                card.classList.add("correct_match");
                matched.set(word, meaning);
            } else {
                selectedLeft.classList.add("wrong_match");
                card.classList.add("wrong_match");
            }
            selectedLeft.classList.remove("selected");
            card.classList.remove("selected");
            selectedLeft = null;
            selectedRight = null;
            }
        });

      rightContainer.appendChild(card);
    });
}

function resetMatchQuiz() {
    // 每次点击重新抽取新的 6 对
    renderMatchQuestion();
}

function checkSortAnswer() {
    // 获取用户答案
    const analysisText = document.getElementById("analysisText");
    const question = filteredData[currentIndex];

    const navBtn = document.querySelector(`#navBtn${currentIndex}`);

    // 用户答案不足时提醒
    if (tempOrder.length < question.Option.length) {
      analysisText.textContent = "请先点完所有选项再确认。";
      return;
    }

    const correctOrder = question.CorrectOrder;   // e.g. [1,3,4,2]
    const keyPos = question.KeyPosition;          // e.g. 3
    const keyCorrect = correctOrder[keyPos - 1];  // 正确答案在关键位置上应该是哪个

    // 关键位置用户选择
    const userAtKey = tempOrder[keyPos - 1];

    if (arraysEqual(tempOrder, correctOrder)) {
      // ✅ 全对
      analysisText.textContent = "✅ 全部顺序正确！";
      // 高亮题号按钮
      navBtn.classList.remove("wrong");
      navBtn.classList.add("correct");
    } 
    else if (userAtKey === keyCorrect) {
      // ⚠️ 关键位置正确，其它顺序错误
      analysisText.textContent = "⚠️ 关键位置正确，但顺序不完全正确。";
      navBtn.classList.remove("wrong");
      navBtn.classList.add("correct");
    }
    else {
      // ❌ 错误
      analysisText.textContent = "❌ 关键位置错误。";
      // 高亮题号按钮
      navBtn.classList.remove("correct");
      navBtn.classList.add("wrong");
    }

    // 追加解析
    analysisText.textContent += "\n\n【解析】 " + question.Analysis;
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// 辅助函数：判断两个数组是否相等
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
}

function renderOrderQuestion(question, index) {
    const qText = document.getElementById("questionText");
    const container = document.getElementById("optionsContainer");
    const analysisBtn = document.getElementById("analysisBtn");
    const analysisText = document.getElementById("analysisText");

    // 1. 渲染题干，把 #space# 替换成 4 个空格位，并在关键位置插入 ⭐
    const rawText = question.Question;
    const keyPos = question.KeyPosition;

    // 先构造 ["____", "____", "____", "____"]
    const blanks = Array(4).fill("____");

    // 在 keyPos（1-based 索引）处加 ⭐
    blanks[keyPos - 1] = "__⭐__";

    // 拼成字符串
    const renderedBlanks = blanks.join("  ");

    // 替换 #space# 占位符并渲染带注释的问题文本
    const renderedHTML = rawText.replace(/#space#/g, renderedBlanks).replace(/\[([^\]]+)\]\{([^\}]+)\}/g, (match, visible, note) => {
          return `<span class="annotated-word" data-note="${note}">${visible}</span>`;
        });

    qText.innerHTML = `${index + 1}. ${renderedHTML}`;

    container.innerHTML = "";
    analysisBtn.style.visibility = "hidden";
    analysisText.textContent = "依次点击选项，组成完整语句，然后点击确定";

    tempOrder = [];
    selectedSet = new Set();

    // 渲染选项按钮
    question.Option.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "sort-card";
      btn.textContent = opt;
      btn.onclick = () => {
        if (selectedSet.has(i)) {
            // 如果已选择，则取消选择
            selectedSet.delete(i);
            // 从 tempOrder 中删除对应的元素
            const index = tempOrder.indexOf(i + 1);
            if (index > -1) {
                tempOrder.splice(index, 1);
            }
        }
        else{
          selectedSet.add(i);
          tempOrder.push(i + 1); // 保存顺序（1-based）
        }

        // 更新显示
        const currentSentence = tempOrder.map(idx => question.Option[idx - 1]).join(" ");
        qText.innerHTML = `${index + 1}. ${renderedHTML}<br><br><strong>你的选择:</strong> ${currentSentence}`;
      };
      container.appendChild(btn);
    });
    document.querySelectorAll(".annotated-word").forEach(span => {
      span.addEventListener("click", () => {
        const note = span.getAttribute("data-note");
        const analysisText = document.getElementById("analysisText");
        analysisText.textContent = note;
      });
    });
}

applyDefaultThemeByTime();
