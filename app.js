(() => {
  const { lessons, prompts } = window.GRAMMAR_UNIT_DATA;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const sharedAudio = new Audio();
  const timings = window.GRAMMAR_AUDIO_TIMINGS ?? {};
  let lessonIndex = 0;
  let practiceIndex = 0;

  $$("[data-practice-total]").forEach((node) => {
    node.textContent = String(prompts.length);
  });
  $("#lessonTotal").textContent = String(lessons.length);

  function stopAudio() {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
    sharedAudio.ontimeupdate = null;
    sharedAudio.onended = null;
    sharedAudio.onerror = null;
    $$("#lessonExample span").forEach((word) => word.classList.remove("is-speaking"));
    $("#playLesson").innerHTML =
      '<span aria-hidden="true">▶</span> Nghe câu mẫu tiếng Anh';
  }

  function renderKaraoke(sentence) {
    $("#lessonExample").replaceChildren(
      ...sentence.split(/\s+/).map((text) => {
        const word = document.createElement("span");
        word.textContent = text;
        return word;
      }),
    );
  }

  function updateKaraoke(audioId) {
    const boundaries = timings[audioId] ?? [];
    const words = $$("#lessonExample span");
    let active = -1;
    boundaries.forEach((boundary, index) => {
      if (sharedAudio.currentTime >= boundary.start) active = index;
    });
    words.forEach((word, index) => {
      word.classList.toggle("is-speaking", index === active);
    });
  }

  function playLesson() {
    stopAudio();
    const lesson = lessons[lessonIndex];
    sharedAudio.src = `assets/audio/${lesson.audio}.mp3`;
    $("#playLesson").textContent = "Đang phát câu mẫu...";
    const finish = () => stopAudio();
    sharedAudio.ontimeupdate = () => updateKaraoke(lesson.audio);
    sharedAudio.onended = finish;
    sharedAudio.onerror = finish;
    sharedAudio.play().catch(finish);
  }

  function renderDots() {
    $("#lessonDots").replaceChildren(
      ...lessons.map((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(index + 1);
        button.classList.toggle("is-active", index === lessonIndex);
        button.setAttribute("aria-label", `Mở phần ${index + 1}`);
        button.addEventListener("click", () => {
          lessonIndex = index;
          renderLesson();
        });
        return button;
      }),
    );
  }

  function formulaRow(parts) {
    const row = document.createElement("div");
    row.className = "formula-row";
    parts.forEach((part, index) => {
      const span = document.createElement("span");
      span.textContent = part;
      if (index === 0) span.className = "subject";
      if (/am|is|are|’m|’s|’re|isn’t|aren’t|this|that|these|those/i.test(part)) span.className = "verb";
      if (/danh từ|tính từ|tuổi|thông tin/.test(part)) span.className = "detail";
      row.append(span);
    });
    return row;
  }

  function renderLesson() {
    stopAudio();
    const lesson = lessons[lessonIndex];
    $("#lessonNumber").textContent = String(lessonIndex + 1);
    $("#lessonProgress").style.width = `${((lessonIndex + 1) / lessons.length) * 100}%`;
    $("#lessonVisual").src = `assets/images/${lesson.image}.webp?v=20260806-discover2-hires-dtw-u11`;
    $("#lessonVisual").alt = lesson.label;
    $("#visualLabel").textContent = lesson.label;
    $("#lessonTag").textContent = lesson.tag;
    $("#lessonTitle").textContent = lesson.title;
    $("#lessonNote").textContent = lesson.note;
    $("#lessonFormula").replaceChildren(...lesson.formula.map(formulaRow));
    renderKaraoke(lesson.example);
    renderDots();
  }

  function cueNode(cue) {
    if (typeof cue === "object" && cue.image) {
      const wrapper = document.createElement("span");
      wrapper.className = "cue-image";
      wrapper.setAttribute("role", "img");
      wrapper.setAttribute("aria-label", "Hình từ vựng");
      const image = document.createElement("img");
      image.src = `assets/images/${cue.image}.webp?v=20260806-discover2-hires-dtw-u11`;
      image.alt = "";
      wrapper.append(image);
      return wrapper;
    }
    const chip = document.createElement("span");
    chip.className = "cue-chip";
    chip.textContent = cue;
    return chip;
  }

  function renderCues(cues) {
    const nodes = [];
    cues.forEach((cue, index) => {
      if (index > 0) {
        const plus = document.createElement("span");
        plus.className = "cue-plus";
        plus.textContent = "+";
        nodes.push(plus);
      }
      nodes.push(cueNode(cue));
    });
    $("#promptCues").replaceChildren(...nodes);
  }

  function renderPrompt() {
    const prompt = prompts[practiceIndex];
    $("#practiceNumber").textContent = String(practiceIndex + 1);
    $("#practiceProgress").style.width = `${((practiceIndex + 1) / prompts.length) * 100}%`;
    $("#practiceVisual").src = `assets/images/${prompt.image}.webp?v=20260806-discover2-hires-dtw-u11`;
    $("#practiceVisual").alt = "Hình gợi ý cho câu nói";
    $("#promptType").textContent = prompt.type;
    $("#promptInstruction").textContent = prompt.instruction;
    renderCues(prompt.cues);
    $("#previousPrompt").disabled = practiceIndex === 0;
    $("#nextPrompt").textContent =
      practiceIndex === prompts.length - 1 ? "Xem đáp án ›" : "Câu tiếp theo ›";
  }

  function renderAnswers() {
    $("#answerList").replaceChildren(
      ...prompts.map((prompt) => {
        const item = document.createElement("li");
        item.textContent = prompt.answer;
        return item;
      }),
    );
  }

  function startPractice() {
    practiceIndex = 0;
    $("#practiceIntro").hidden = true;
    $("#practiceComplete").hidden = true;
    $("#practiceStage").hidden = false;
    renderPrompt();
  }

  function completePractice() {
    $("#practiceStage").hidden = true;
    $("#practiceComplete").hidden = false;
    $("#practiceNumber").textContent = String(prompts.length);
    $("#practiceProgress").style.width = "100%";
    renderAnswers();
  }

  function selectView(view) {
    stopAudio();
    $$(".mode-tabs button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    $("#understandView").classList.toggle("is-active", view === "understand");
    $("#practiceView").classList.toggle("is-active", view === "practice");
  }

  $$(".mode-tabs button").forEach((button) => {
    button.addEventListener("click", () => selectView(button.dataset.view));
  });
  $("#playLesson").addEventListener("click", playLesson);
  $("#previousLesson").addEventListener("click", () => {
    lessonIndex = (lessonIndex - 1 + lessons.length) % lessons.length;
    renderLesson();
  });
  $("#nextLesson").addEventListener("click", () => {
    lessonIndex = (lessonIndex + 1) % lessons.length;
    renderLesson();
  });
  $("#startPractice").addEventListener("click", startPractice);
  $("#previousPrompt").addEventListener("click", () => {
    if (practiceIndex === 0) return;
    practiceIndex -= 1;
    renderPrompt();
  });
  $("#nextPrompt").addEventListener("click", () => {
    if (practiceIndex === prompts.length - 1) {
      completePractice();
      return;
    }
    practiceIndex += 1;
    renderPrompt();
  });
  $("#restartPractice").addEventListener("click", startPractice);

  renderLesson();
})();
