document.documentElement.classList.add("js");

const RSVP_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwhX_lzT9TV4dQTiTpfBFK2uPCy5W1wxSxjiA_yeGhzWPn9j33Sf9kOgdWK8e5YaJza/exec";

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".nav a");
const revealElements = document.querySelectorAll(".reveal");
const heroPhotos = document.querySelectorAll(".hero-photo");
const heroSection = document.querySelector(".hero");
const heroSequenceGroups = {
  photos: document.querySelectorAll('[data-seq="photos"]'),
  names: document.querySelectorAll('[data-seq="names"]'),
  details: document.querySelectorAll('[data-seq="details"]'),
};
const pageLoader = document.getElementById("pageLoader");
const copyAliasBtn = document.getElementById("copyAliasBtn");
const aliasText = document.getElementById("aliasText");
const toast = document.getElementById("toast");
const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const countdownDays = document.getElementById("days");
const countdownHours = document.getElementById("hours");
const countdownMinutes = document.getElementById("minutes");
const countdownSeconds = document.getElementById("seconds");

const rsvpForm = document.getElementById("rsvp-form");
const rsvpSubmitBtn = document.getElementById("rsvpSubmitBtn");
const rsvpStatus = document.getElementById("rsvpStatus");

const pageStartTime = performance.now();

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    document.body.classList.toggle("menu-open");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      document.body.classList.remove("menu-open");
    });
  });
}

revealElements.forEach((el, index) => {
  if (!reduceMotion.matches) {
    el.style.setProperty("--reveal-delay", `${Math.min(index * 55, 220)}ms`);
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -5% 0px",
  }
);

revealElements.forEach((el) => observer.observe(el));

setupHeroParallax();
setupMusicControls();
setupOpeningExperience();
setupRsvpForm();
warmupRsvpScript();
setupCountdown();

if (copyAliasBtn && aliasText) {
  copyAliasBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(aliasText.textContent.trim());
      showToast("Alias copiado");
    } catch (error) {
      showToast("No se pudo copiar");
    }
  });
}

function setupOpeningExperience() {
  const launch = () => {
    const elapsed = performance.now() - pageStartTime;
    const minLoaderTime = reduceMotion.matches ? 0 : 1680;
    const waitTime = Math.max(0, minLoaderTime - elapsed);

    window.setTimeout(() => {
      if (pageLoader) {
        pageLoader.classList.add("is-hidden");
        window.setTimeout(() => {
          pageLoader.setAttribute("aria-hidden", "true");
        }, reduceMotion.matches ? 0 : 560);
      }

      runHeroSequence();
    }, waitTime);
  };

  if (document.readyState === "complete") {
    launch();
  } else {
    window.addEventListener("load", launch, { once: true });
  }
}

function runHeroSequence() {
  const immediate = reduceMotion.matches;

  if (immediate) {
    Object.values(heroSequenceGroups).forEach((group) => {
      group.forEach((el) => el.classList.add("is-visible"));
    });
    return;
  }

  const steps = [
    { key: "photos", delay: 90 },
    { key: "names", delay: 240 },
    { key: "details", delay: 370 },
  ];

  steps.forEach(({ key, delay }) => {
    window.setTimeout(() => {
      heroSequenceGroups[key].forEach((el) => el.classList.add("is-visible"));
    }, delay);
  });
}

function setupMusicControls() {
  if (!musicToggle || !bgMusic) return;

  const setMusicState = (playing) => {
    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute("aria-label", playing ? "Pausar música" : "Reproducir música");
    musicToggle.querySelector(".music-text").textContent = playing ? "Pausar" : "Música";
    musicToggle.querySelector(".music-icon").textContent = playing ? "❚❚" : "♪";
  };

  musicToggle.addEventListener("click", async () => {
    if (bgMusic.paused) {
      try {
        await bgMusic.play();
        setMusicState(true);
      } catch (error) {
        showToast("Tocá nuevamente para activar el audio");
        setMusicState(false);
      }
      return;
    }

    bgMusic.pause();
    setMusicState(false);
  });

  bgMusic.addEventListener("pause", () => setMusicState(false));
  bgMusic.addEventListener("play", () => setMusicState(true));
}

function warmupRsvpScript() {
  const warmupImage = new Image();
  const separator = RSVP_SCRIPT_URL.includes("?") ? "&" : "?";

  warmupImage.onload = () => {};
  warmupImage.onerror = () => {};
  warmupImage.src = `${RSVP_SCRIPT_URL}${separator}warmup=1&t=${Date.now()}`;
}

function setupRsvpForm() {
  if (!rsvpForm || !rsvpSubmitBtn || !rsvpStatus) return;

  let successButtonTimer = null;
  let duplicateCheckInProgress = false;
  let isSubmittingLocked = false;

  rsvpForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (isSubmittingLocked) return;
    isSubmittingLocked = true;

    if (duplicateCheckInProgress) {
      isSubmittingLocked = false;
      return;
    }

    const formData = new FormData(rsvpForm);
    const rawNombre = String(formData.get("nombre") || "").trim();
    const rawDni = String(formData.get("dni") || "").trim();
    const rawNinos = String(formData.get("ninos") || "").trim();

    if (!rawNombre) {
      setRsvpStatus("error", "Completá tu nombre y apellido.");
      isSubmittingLocked = false;
      return;
    }

    if (!/^\d+$/.test(rawDni)) {
      setRsvpStatus("error", "El DNI es obligatorio y debe ser numérico.");
      isSubmittingLocked = false;
      return;
    }

    if (rawNinos) {
      if (!/^\d+$/.test(rawNinos)) {
        setRsvpStatus("error", "Si completás niños, debe ser un número entero.");
        isSubmittingLocked = false;
        return;
      }

      const parsedNinos = Number.parseInt(rawNinos, 10);

      if (!Number.isInteger(parsedNinos) || parsedNinos < 0) {
        setRsvpStatus("error", "Si completás niños, debe ser un entero mayor o igual a 0.");
        isSubmittingLocked = false;
        return;
      }
    }

    clearTimeout(successButtonTimer);
    setRsvpSubmittingState(true, "Enviando...");
    setRsvpStatus("loading", "Verificando DNI...");

    duplicateCheckInProgress = true;

    checkDniExists(rawDni, (result) => {
      duplicateCheckInProgress = false;

      if (!result || result.ok !== true) {
        setRsvpStatus("error", "Ocurrió un error. Intentá nuevamente.");
        setRsvpSubmittingState(false);
        isSubmittingLocked = false;
        return;
      }

      if (result.exists) {
        setRsvpStatus("error", "Este DNI ya fue registrado.");
        setRsvpSubmittingState(false);
        isSubmittingLocked = false;
        return;
      }

      setRsvpStatus("loading", "Enviando confirmación...");

      // Envío real al Apps Script con iframe oculto, sin cambiar el layout
      const iframeName = "rsvp_submit_iframe";
      let submitFrame = document.querySelector(`iframe[name="${iframeName}"]`);

      if (!submitFrame) {
        submitFrame = document.createElement("iframe");
        submitFrame.name = iframeName;
        submitFrame.style.display = "none";
        document.body.appendChild(submitFrame);
      }

      const originalTarget = rsvpForm.getAttribute("target");
      rsvpForm.setAttribute("target", iframeName);
      rsvpForm.submit();

      // Restaurar target original
      if (originalTarget !== null) {
        rsvpForm.setAttribute("target", originalTarget);
      } else {
        rsvpForm.removeAttribute("target");
      }

      // Como ya validamos que no está duplicado y el submit está funcionando en Sheets,
      // damos éxito visual estable.
      window.setTimeout(() => {
        rsvpForm.reset();
        setRsvpStatus("success", "¡Gracias por confirmar! Nos hace muy felices que nos acompañes ❤️");
        rsvpStatus.classList.remove("is-success");
        void rsvpStatus.offsetWidth;
        rsvpStatus.classList.add("is-success");
        setRsvpSubmittingState(true, "Confirmación enviada");
        isSubmittingLocked = false;

        clearTimeout(successButtonTimer);
        successButtonTimer = window.setTimeout(() => {
          setRsvpSubmittingState(false);
        }, 2500);
      }, 900);
    });
  });
}

function checkDniExists(dni, callback) {
  const callbackName = `rsvpCheck_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const script = document.createElement("script");

  let finished = false;

  const cleanup = () => {
    if (script.parentNode) script.parentNode.removeChild(script);
    try {
      delete window[callbackName];
    } catch (e) {
      window[callbackName] = undefined;
    }
  };

  const finish = (payload) => {
    if (finished) return;
    finished = true;
    cleanup();
    callback(payload);
  };

  window[callbackName] = function (data) {
    finish(data);
  };

  script.onerror = function () {
    finish({ ok: false, exists: false });
  };

  const url =
    `${RSVP_SCRIPT_URL}?mode=checkDni` +
    `&dni=${encodeURIComponent(dni)}` +
    `&callback=${encodeURIComponent(callbackName)}`;

  script.src = url;
  document.body.appendChild(script);

  window.setTimeout(() => {
    finish({ ok: false, exists: false });
  }, 15000);
}

function setRsvpSubmittingState(isSubmitting, buttonText) {
  if (!rsvpSubmitBtn) return;

  rsvpSubmitBtn.disabled = isSubmitting;
  rsvpSubmitBtn.classList.toggle("is-loading", isSubmitting);
  rsvpSubmitBtn.textContent =
    buttonText || (isSubmitting ? "Enviando..." : "Enviar confirmación");
}

function setRsvpStatus(type, message) {
  if (!rsvpStatus) return;

  rsvpStatus.textContent = message;
  rsvpStatus.classList.remove("is-success", "is-error", "is-loading");

  if (type === "success") rsvpStatus.classList.add("is-success");
  if (type === "error") rsvpStatus.classList.add("is-error");
  if (type === "loading") rsvpStatus.classList.add("is-loading");
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function setupHeroParallax() {
  if (!heroSection || !heroPhotos.length) return;
  if (reduceMotion.matches) return;
  if (window.matchMedia("(max-width: 520px)").matches) return;

  let ticking = false;

  const updateParallax = () => {
    const rect = heroSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;

    if (rect.bottom <= 0 || rect.top >= viewportHeight) {
      heroPhotos.forEach((photo) => photo.style.setProperty("--parallax-y", "0px"));
      ticking = false;
      return;
    }

    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;
    const offset = sectionCenter - viewportCenter;
    const progress = Math.max(-1, Math.min(1, offset / viewportHeight));

    heroPhotos.forEach((photo, index) => {
      const direction = index === 0 ? -1 : 1;
      const moveY = progress * 12 * direction;
      photo.style.setProperty("--parallax-y", `${moveY.toFixed(2)}px`);
    });

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
}

function setupCountdown() {
  if (!countdownDays || !countdownHours || !countdownMinutes || !countdownSeconds) return;

  const eventDate = new Date("2027-03-27T19:00:00");
  const countdownValues = [
    countdownDays,
    countdownHours,
    countdownMinutes,
    countdownSeconds,
  ];
  const shouldAnimate = !reduceMotion.matches;

  const setCountdownValue = (element, value) => {
    if (!element) return;
    if (element.textContent === value) return;

    element.textContent = value;

    if (!shouldAnimate) return;

    element.classList.remove("is-changing");
    void element.offsetWidth;
    element.classList.add("is-changing");
  };

  if (shouldAnimate) {
    countdownValues.forEach((element) => {
      element.addEventListener("animationend", () => {
        element.classList.remove("is-changing");
      });
    });
  }

  const updateCountdown = () => {
    const now = new Date();
    const distance = eventDate.getTime() - now.getTime();

    if (distance <= 0) {
      setCountdownValue(countdownDays, "00");
      setCountdownValue(countdownHours, "00");
      setCountdownValue(countdownMinutes, "00");
      setCountdownValue(countdownSeconds, "00");
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    setCountdownValue(countdownDays, String(days).padStart(2, "0"));
    setCountdownValue(countdownHours, String(hours).padStart(2, "0"));
    setCountdownValue(countdownMinutes, String(minutes).padStart(2, "0"));
    setCountdownValue(countdownSeconds, String(seconds).padStart(2, "0"));
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
}
