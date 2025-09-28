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

let wordHint = true;

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
    const analysisBtn = document.getElementById("analysisBtn");
    analysisBtn.style.visibility = "hidden";

    // 👉 如果是排序题，走单独逻辑
    if (question.CorrectOrder) {
      sortSubmitBtn.style.visibility = "visible";
      renderOrderQuestion(question, index);
      return;
    }
    sortSubmitBtn.style.visibility = "hidden";

    const qText = document.getElementById("questionText");
    const container = document.getElementById("optionsContainer");
    const analysisText = document.getElementById("analysisText");

    // 渲染带注释的问题文本
    const rawText = question.Question;
    const renderedHTML = rawText.replace(/\[([^\]]+)\]\{([^\}]+)\}/g, (match, visible, note) => {
      if (wordHint) {
        return `<span class="annotated-word" data-note="${note}" style="cursor:pointer;">${visible}</span>`;
      } else {
        return `<span>${visible}</span>`; // 只显示文字，不带提示
      };
    });

    qText.innerHTML = `${index + 1}. ${renderedHTML}`;
    container.innerHTML = "";
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

    if (wordHint){
      document.querySelectorAll(".annotated-word").forEach(span => {
        span.addEventListener("click", () => {
          const note = span.getAttribute("data-note");
          const analysisText = document.getElementById("analysisText");
          analysisText.textContent = note;
        });
      });
    }
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
    const analysisText = document.getElementById("analysisText");
    const question = filteredData[currentIndex];
    const navBtn = document.querySelector(`#navBtn${currentIndex}`);

    // 用户选项索引转为1-based序号
    const userOrder = (question._selected || []).map(idx => idx + 1);
    if (userOrder.length < question.Option.length) {
      analysisText.textContent = "请先点完所有选项再确认。";
      return;
    }

    const correctOrder = question.CorrectOrder;
    const keyPos = question.KeyPosition;
    const keyCorrect = correctOrder[keyPos - 1];
    const userAtKey = userOrder[keyPos - 1];

    const cards = document.querySelectorAll(".sort-card-selected");
    // 检查每个位置的正确性
    for (let i = 0; i < 4; i++) {
        const indexCorrect = correctOrder[i];
        const userAtIndex = userOrder[i];

        if (indexCorrect !== userAtIndex) {
          cards[i].classList.add("wrong-sort");
        }
        else {
          cards[i].classList.add("correct-sort");
        }
    }

    if (arraysEqual(userOrder, correctOrder)) {
      analysisText.textContent = "✅ 全部顺序正确！";
      navBtn.classList.remove("wrong");
      navBtn.classList.add("correct");
    } else if (userAtKey === keyCorrect) {
      analysisText.textContent = "⚠️ 关键位置正确，但顺序不完全正确。"
      navBtn.classList.remove("wrong");
      navBtn.classList.add("correct");
    } else {
     // analysisText.textContent = "❌ 关键位置错误。" + userAtKey + " " + keyCorrect;
      analysisText.textContent = "❌ 关键位置错误。"
      navBtn.classList.remove("correct");
      navBtn.classList.add("wrong");
    }

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
    const optionsContainer = document.getElementById("optionsContainer");

    // 初始化
    if (!question._unselected) {
        question._unselected = question.Option.map((_, i) => i);
        question._selected = [];
    }
    const unselected = question._unselected;
    const selected = question._selected;

    // 渲染题干，把空格替换为已选卡片或占位符
    let blanks = selected.map((idx, i) => {
        if (typeof idx === "number") {
            return `<button class="sort-card-selected"" onclick="removeOrderCard(${i})">${question.Option[idx]}</button>`;
        } else {
            return `<span class="sort-card-selected"">____</span>`;
        }
    });
    // 补齐未选的空格
    while (blanks.length < question.Option.length) {
        blanks.push(`<span class="sort-card-selected"">____</span>`);
    }
    // 关键位置加星标
    if (question.KeyPosition && blanks[question.KeyPosition - 1]) {
        blanks[question.KeyPosition - 1] = blanks[question.KeyPosition - 1].replace("____", "__⭐__");
    }
    const renderedBlanks = blanks.join(" ");

    // 题干替换
    const rawText = question.Question;
    const renderedHTML = rawText
      .replace(/#space#/g, renderedBlanks)
      .replace(/\[([^\]]+)\]\{([^\}]+)\}/g, (match, visible, note) => {
        if (wordHint) {
          return `<span class="annotated-word" data-note="${note}" style="cursor:pointer;">${visible}</span>`;
        } else {
          return `<span>${visible}</span>`; // 只显示文字，不带提示
        }
      });
    qText.innerHTML = `${index + 1}. ${renderedHTML}`;

    // 渲染未选卡片
    optionsContainer.innerHTML = "";
    unselected.forEach(idx => {
        const btn = document.createElement("button");
        btn.className = "sort-card";
        btn.textContent = question.Option[idx];
        btn.onclick = () => {
            // 移到已选
            unselected.splice(unselected.indexOf(idx), 1);
            selected.push(idx);
            renderOrderQuestion(question, index);
        };
        optionsContainer.appendChild(btn);
    });

    // 解析点击
    if (wordHint){
      document.querySelectorAll(".annotated-word").forEach(span => {
          span.addEventListener("click", () => {
              const note = span.getAttribute("data-note");
              document.getElementById("analysisText").textContent = note;
          });
      });
    }
}

// 移除已选卡片函数
function removeOrderCard(i) {
    const question = filteredData[currentIndex];
    question._unselected.push(question._selected[i]);
    question._selected.splice(i, 1);
    renderOrderQuestion(question, currentIndex);
}

function showHint(){
  wordHint = !wordHint;
  // 切换后，重新渲染当前题
  renderQuestion(currentIndex);
}

applyDefaultThemeByTime();
