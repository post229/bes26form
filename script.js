(function () {
  "use strict";

  const form = document.getElementById("regForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");

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

  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = "form-status" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      setStatus(
        "Форма ещё не подключена к Google Таблице. Укажите GOOGLE_SCRIPT_URL в config.js.",
        "err"
      );
      return;
    }

    submitBtn.disabled = true;
    setStatus("Sending your registration…", "");

    try {
      const payload = collectFormData();
      payload.files = await collectFiles();
      payload.submitted_at = new Date().toISOString();
      payload.page_url = window.location.href;

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // "no-cors" gives an opaque response — we can't read it, so we assume
      // success once fetch resolves without throwing a network error.
      setStatus("Thank you! Your registration has been submitted.", "ok");
      form.reset();
      document.querySelectorAll(".other-input").forEach((el) => el.classList.add("hidden"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setStatus(
        "Something went wrong while sending the form. Please check your connection and try again.",
        "err"
      );
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
