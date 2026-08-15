(function () {
  "use strict";

  const form = document.getElementById("regForm");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");
  const footerStatus = document.getElementById("footerStatus");
  const stepCounter = document.getElementById("stepCounter");
  const progressFill = document.getElementById("progressFill");

  const steps = Array.from(document.querySelectorAll(".step"));
  const formSteps = steps.filter((s) => !s.classList.contains("step-final"));
  const totalFormSteps = formSteps.length;
  const finalIndex = steps.length - 1;
  let currentIndex = 0;

  // ---- "Other" / conditional field toggles ----
  document.querySelectorAll("[data-other-target]").forEach((trigger) => {
    trigger.addEventListener("change", () => {
      const targetId = trigger.getAttribute("data-other-target");
      const target = document.getElementById(targetId);
      if (!target) return;

      if (trigger.type === "radio") {
        // Show target only for the radio option that declared it; hide for siblings in the group
        const groupName = trigger.name;
        const checkedTrigger = document.querySelector(
          `input[name="${groupName}"]:checked`
        );
        const shouldShow =
          checkedTrigger && checkedTrigger.getAttribute("data-other-target") === targetId;
        target.classList.toggle("hidden", !shouldShow);
      } else {
        target.classList.toggle("hidden", !trigger.checked);
      }
    });
  });

  // ---- Wizard navigation ----
  function showStep(index) {
    steps.forEach((stepEl, i) => {
      const isActive = i === index;
      stepEl.classList.toggle("active", isActive);
      if (isActive) {
        stepEl.classList.remove("animate-in");
        void stepEl.offsetWidth; // force reflow so the animation restarts every time
        stepEl.classList.add("animate-in");
        stepEl.scrollTop = 0;
      }
    });

    const isFinal = index === finalIndex;
    document.body.classList.toggle("at-final", isFinal);

    if (isFinal) {
      progressFill.style.width = "100%";
      return;
    }

    const stepNum = index + 1;
    stepCounter.textContent = `Step ${stepNum} of ${totalFormSteps}`;
    progressFill.style.width = ((stepNum - 1) / totalFormSteps) * 100 + "%";
    backBtn.disabled = index === 0;

    const isLastFormStep = stepNum === totalFormSteps;
    nextBtn.classList.toggle("hidden", isLastFormStep);
    submitBtn.classList.toggle("hidden", !isLastFormStep);
  }

  function validateStep(stepEl) {
    const invalidField = stepEl.querySelector(":invalid");
    if (invalidField) {
      form.classList.add("was-validated");
      invalidField.reportValidity();
      return false;
    }
    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(steps[currentIndex])) return;
    if (currentIndex < totalFormSteps - 1) {
      currentIndex++;
      showStep(currentIndex);
    }
  });

  backBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      showStep(currentIndex);
    }
  });

  restartBtn.addEventListener("click", () => {
    form.reset();
    form.classList.remove("was-validated");
    document.querySelectorAll(".other-input").forEach((el) => el.classList.add("hidden"));
    setFooterStatus("", "");
    currentIndex = 0;
    showStep(currentIndex);
  });

  // Enter advances to the next step instead of doing nothing / submitting early —
  // except inside a textarea, where Enter should just insert a newline as usual.
  form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName === "TEXTAREA") return;
    const isLastFormStep = currentIndex === totalFormSteps - 1;
    if (!isLastFormStep) {
      e.preventDefault();
      nextBtn.click();
    }
  });

  // ---- Collect checkbox groups into arrays, everything else as scalar values ----
  function collectFormData() {
    const data = {};
    const checkboxGroups = {};

    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.disabled) return;

      if (el.type === "checkbox") {
        if (el.name === "confirm_info_correct" || el.name === "understand_photo_video" || el.name === "agree_receive_info") {
          data[el.name] = el.checked;
          return;
        }
        if (!checkboxGroups[el.name]) checkboxGroups[el.name] = [];
        if (el.checked) checkboxGroups[el.name].push(el.value);
        return;
      }

      if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
        return;
      }

      if (el.type === "file") {
        return; // handled separately as async base64 reads
      }

      data[el.name] = el.value;
    });

    Object.assign(data, checkboxGroups);
    return data;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result; // "data:<mime>;base64,<data>"
        const base64 = result.split(",")[1] || "";
        resolve({ name: file.name, mimeType: file.type || "application/octet-stream", data: base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function collectFiles() {
    const fileInputs = form.querySelectorAll('input[type="file"]');
    const files = {};
    for (const input of fileInputs) {
      if (input.files && input.files[0]) {
        files[input.name] = await fileToBase64(input.files[0]);
      }
    }
    return files;
  }

  function setFooterStatus(message, kind) {
    footerStatus.textContent = message;
    footerStatus.className = "footer-status" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateStep(steps[currentIndex])) return;

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      setFooterStatus(
        "Форма ещё не подключена к Google Таблице. Укажите GOOGLE_SCRIPT_URL в config.js.",
        "err"
      );
      return;
    }

    submitBtn.disabled = true;
    setFooterStatus("Sending your registration…", "sending");

    try {
      const payload = collectFormData();
      payload.files = await collectFiles();
      payload.submitted_at = new Date().toISOString();
      payload.page_url = window.location.href;

      await sendRegistration(JSON.stringify(payload));

      // "no-cors" gives an opaque response — we can't read it, so we assume
      // success once fetch resolves without throwing a network error.
      setFooterStatus("", "");
      currentIndex = finalIndex;
      showStep(currentIndex);
    } catch (err) {
      console.error(err);
      setFooterStatus(
        "We couldn't confirm the submission went through — please check your connection and try again. If the problem repeats, your data may still have been received.",
        "err"
      );
    } finally {
      submitBtn.disabled = false;
    }
  });

  // A single flaky attempt shouldn't be treated as a hard failure — retry once
  // before surfacing an error, since transient network/extension hiccups are
  // common with cross-origin "no-cors" requests like this one.
  async function sendRegistration(body, attempt = 1) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body,
      });
    } catch (err) {
      if (attempt >= 2) throw err;
      await new Promise((resolve) => setTimeout(resolve, 800));
      return sendRegistration(body, attempt + 1);
    }
  }

  showStep(0);
})();
