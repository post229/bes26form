(function () {
  "use strict";

  const form = document.getElementById("regForm");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const footerStatus = document.getElementById("footerStatus");
  const stepCounter = document.getElementById("stepCounter");
  const progressFill = document.getElementById("progressFill");
  const finalIcon = document.getElementById("finalIcon");

  // All steps in DOM order: intro screen, every form step (some track-specific
  // via data-tracks), and the final thank-you screen.
  const steps = Array.from(document.querySelectorAll(".step"));
  const introEl = steps[0];
  const finalEl = steps[steps.length - 1];
  let currentStepEl = introEl;
  const SLIDE_DISTANCE = "28px";
  const EXIT_DURATION = 420;

  // ---- Registration track (drives which steps are shown) ----
  // "Speaker / Lecturer", "Moderator", "Workshop / Wet Lab Instructor" and
  // "Live Surgery Participant" all follow the same "speaker" track.
  function getTrack() {
    const checked = form.querySelector('input[name="participation_status"]:checked');
    if (!checked) return null;
    if (checked.value === "Exhibitor / Industry Representative") return "exhibitor";
    if (checked.value === "Participant / Delegate") return "participant";
    return "speaker";
  }

  function stepMatchesTrack(stepEl, track) {
    const tracks = stepEl.dataset.tracks;
    if (!tracks) return true; // universal step
    if (!track) return false; // track-specific step, but role not chosen yet
    return tracks.split(",").includes(track);
  }

  function getVisibleSteps() {
    const track = getTrack();
    return steps.filter((s) => stepMatchesTrack(s, track));
  }

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
  // direction: 1 = moving forward, -1 = moving backward
  function goTo(nextEl, direction = 1) {
    const prevEl = currentStepEl;

    if (prevEl && prevEl !== nextEl) {
      prevEl.style.setProperty("--slide-x", direction >= 0 ? `-${SLIDE_DISTANCE}` : SLIDE_DISTANCE);
      prevEl.classList.remove("active");
      prevEl.classList.add("exiting");
      window.setTimeout(() => {
        prevEl.classList.remove("exiting");
        prevEl.style.removeProperty("--slide-x");
      }, EXIT_DURATION);
    }

    nextEl.classList.remove("exiting", "active");
    nextEl.style.setProperty("--slide-x", direction >= 0 ? SLIDE_DISTANCE : `-${SLIDE_DISTANCE}`);
    void nextEl.offsetWidth; // commit the pre-animation position before transitioning in
    nextEl.classList.add("active");
    nextEl.style.setProperty("--slide-x", "0px");
    nextEl.scrollTop = 0;

    currentStepEl = nextEl;
    updateChrome();
  }

  function updateChrome() {
    const isFinal = currentStepEl === finalEl;
    const isIntro = currentStepEl === introEl;
    document.body.classList.toggle("at-final", isFinal);
    document.body.classList.toggle("at-intro", isIntro);

    if (isFinal) {
      progressFill.style.width = "100%";
      finalIcon.classList.remove("play");
      void finalIcon.offsetWidth; // restart the draw-in animation every time this screen shows
      finalIcon.classList.add("play");
      return;
    }
    if (isIntro) {
      progressFill.style.width = "0%";
      return;
    }

    const visible = getVisibleSteps();
    const idx = visible.indexOf(currentStepEl); // 0 = intro, so form steps start at 1
    const totalFormSteps = visible.length - 2; // minus intro and final
    const stepNum = idx; // intro occupies position 0, so form step N sits at index N

    stepCounter.textContent = `Step ${stepNum} of ${totalFormSteps}`;
    progressFill.style.width = ((stepNum - 1) / totalFormSteps) * 100 + "%";
    backBtn.disabled = false; // Back from the first form step returns to the intro

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

  startBtn.addEventListener("click", () => {
    const visible = getVisibleSteps();
    goTo(visible[1], 1); // first form step (the role question) right after intro
  });

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStepEl)) return;
    const visible = getVisibleSteps();
    const idx = visible.indexOf(currentStepEl);
    if (idx >= 0 && idx < visible.length - 2) {
      goTo(visible[idx + 1], 1);
    }
  });

  backBtn.addEventListener("click", () => {
    const visible = getVisibleSteps();
    const idx = visible.indexOf(currentStepEl);
    if (idx > 0) {
      goTo(visible[idx - 1], -1);
    }
  });

  restartBtn.addEventListener("click", () => {
    form.reset();
    form.classList.remove("was-validated");
    document.querySelectorAll(".other-input").forEach((el) => el.classList.add("hidden"));
    document.getElementById("visa-block").classList.add("hidden");
    setFooterStatus("", "");
    goTo(introEl, -1);
  });

  // Enter advances to the next step instead of doing nothing / submitting early —
  // except inside a textarea, where Enter should just insert a newline as usual.
  form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName === "TEXTAREA") return;
    const visible = getVisibleSteps();
    const idx = visible.indexOf(currentStepEl);
    const isLastFormStep = idx === visible.length - 2;
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
      // Skip fields that live inside a step not applicable to the chosen
      // track, so leftover/empty values from an abandoned track never
      // overwrite a same-named field that's actually in use.
      const stepEl = el.closest(".step");
      if (stepEl && !getVisibleSteps().includes(stepEl)) return;

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
    const visible = getVisibleSteps();
    const fileInputs = form.querySelectorAll('input[type="file"]');
    const files = {};
    for (const input of fileInputs) {
      const stepEl = input.closest(".step");
      if (stepEl && !visible.includes(stepEl)) continue;
      if (input.files && input.files[0]) {
        files[input.name] = await fileToBase64(input.files[0]);
      }
    }
    // The exhibitor track uses a differently-named logo input so it never
    // collides with the speaker track's file input of the same purpose;
    // normalize both into the same "logo_file" key expected by the sheet.
    if (files.exhibitor_logo_file && !files.logo_file) {
      files.logo_file = files.exhibitor_logo_file;
      delete files.exhibitor_logo_file;
    }
    return files;
  }

  function setFooterStatus(message, kind) {
    footerStatus.textContent = message;
    footerStatus.className = "footer-status" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateStep(currentStepEl)) return;

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
      goTo(finalEl, 1);
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

  updateChrome();
})();
