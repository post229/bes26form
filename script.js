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
  const promoTip = document.getElementById("promoTip");
  const promoTipTitle = document.getElementById("promoTipTitle");
  const promoTipText = document.getElementById("promoTipText");
  const payCta = document.getElementById("payCta");
  const payCtaTicket = document.getElementById("payCtaTicket");
  const payCtaLink = document.getElementById("payCtaLink");

  // Contextual objection-handling copy shown in the desktop promo panel,
  // matched to whichever step the visitor is currently answering.
  const STEP_TIPS = {
    intro: ["New to the summit?", "This is a clinical medical summit for licensed professionals — not a general beauty event. Expect practical, case-based content across three disciplines."],
    role: ["Not sure which fits?", "Choose by specialty: ophthalmologists → Day 2 (Wet Lab, keratopigmentation, artificial vision). Surgeons → Day 1 (periorbital, CO₂ laser, rhinoplasty). Aesthetic medicine → regenerative protocols, exosomes, biostimulators."],
    personal: ["Why we ask this", "Used only for your badge, certificate, and official communication about the summit — never shared with third parties."],
    professional: ["Building your program fit", "Your specialization helps our committee match you to the most relevant sessions and, for speakers, the right review panel."],
    company: ["Exhibiting at the summit", "17 booths across 488 m² of exhibition space, reaching 400+ specialists per track across ophthalmology, plastic surgery, and aesthetic medicine."],
    education: ["Why credentials matter", "This is a summit for licensed medical professionals, and CME/CPD accreditation has been submitted — this helps us verify eligibility and tailor your certificate."],
    presentation: ["Speaking at the summit", "Faculty attend free of charge, including the gala dinner. Invited keynote speakers may also receive travel support."],
    visa: ["Need an invitation letter?", "We issue official UGAMC invitation letters within 3–5 business days after registration. These letters support your visa application only and don't guarantee approval."],
    travel: ["Getting here is easy", "Alicante–Elche Airport is about 15 minutes from the venue by car, with easy transfers available on request."],
    accommodation: ["Where to stay", "Our partner hotel, Hotel Huerto del Cura, is just 3–5 minutes on foot from Centro de Congresos de Elche."],
    dietary: ["We've got you covered", "Let us know any dietary or accessibility needs and our team will handle the rest at check-in."],
    materials: ["Why we ask for files", "Your photo, bio, and materials go straight into the official program and speaker profile."],
    "exhibitor-materials": ["Choosing a package", "Not sure yet is fine — our partnerships team will follow up either way. Pro and above include a speaking slot; Premium and Title include gala seats and delegate tickets."],
    social: ["Get featured", "Speakers and delegates who opt in are featured across our social channels and the official post-event recap."],
    additional: ["Almost there", "Anything else our organizing committee should know before the summit? Group of 5+? Mention it here for the 15% discount."],
    confirmation: ["About pricing", "Not a payment — just tell us what to prepare. Early Bird pricing (through 30 Sept) is significantly lower than the final rate, and a full 2-day pass costs less than two single days."],
    final: ["What happens next", "Our organizing committee reviews every submission and will reach out by e-mail if anything else is needed."],
  };

  function updatePromoTip(stepId) {
    if (!promoTip) return;
    const copy = STEP_TIPS[stepId];
    if (!copy) return;
    promoTip.classList.add("swap");
    window.setTimeout(() => {
      promoTipTitle.textContent = copy[0];
      promoTipText.textContent = copy[1];
      promoTip.classList.remove("swap");
    }, 160);
  }

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
    updatePromoTip(currentStepEl.dataset.step);

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
    payCta.classList.add("hidden");
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

  // Payment happens after registration, not instead of it — the Google
  // Sheet already has the submission by the time this runs. Only offer
  // the button when the visitor picked a paid ticket and a real Stripe
  // Payment Link has been configured for it.
  function updatePayCta(ticketValue) {
    const links = typeof TICKET_PAYMENT_LINKS === "object" && TICKET_PAYMENT_LINKS ? TICKET_PAYMENT_LINKS : {};
    const link = links[ticketValue];
    if (!ticketValue || ticketValue === "Not interested yet" || !link) {
      payCta.classList.add("hidden");
      return;
    }
    payCtaTicket.textContent = ticketValue.replace(/\s*—\s*€/, " — €");
    payCtaLink.href = link;
    payCta.classList.remove("hidden");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateStep(currentStepEl)) return;

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      setFooterStatus(
        "This form isn't connected to a Google Sheet yet. Set GOOGLE_SCRIPT_URL in config.js.",
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
      updatePayCta(payload.ticket_interest);
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
