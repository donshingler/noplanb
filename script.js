(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const notesBtn = document.getElementById("notesBtn");
  const overviewBtn = document.getElementById("overviewBtn");
  const fullBtn = document.getElementById("fullBtn");
  const audioBtn = document.getElementById("audioBtn");
  const counter = document.getElementById("counter");
  const notesPanel = document.getElementById("notesPanel");
  const notesText = document.getElementById("notesText");
  const overview = document.getElementById("overview");
  const deckDots = document.getElementById("deckDots");
  const deckHint = document.getElementById("deckHint");
  let current = 0;
  let photoCollageTimers = [];
  let hintFaded = false;
  let soundEnabled = true;
  let soundNeedsGesture = false;
  const photoGridSources = [
    "assets/photo-grid/photo-01.jpg",
    "assets/photo-grid/photo-02.jpg",
    "assets/photo-grid/photo-03.jpg",
    "assets/photo-grid/photo-04.jpg",
    "assets/photo-grid/photo-05.jpg",
    "assets/photo-grid/photo-06.jpg",
    "assets/photo-grid/photo-07.jpg",
    "assets/photo-grid/photo-08.jpg",
    "assets/photo-grid/photo-09.jpg",
  ];

  function clampIndex(index) {
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  function updateAudioButton() {
    const label = soundNeedsGesture && soundEnabled ? "Enable sound" : soundEnabled ? "Sound on" : "Sound off";
    audioBtn.textContent = soundEnabled ? "\u266A" : "\u00D7";
    audioBtn.title = label;
    audioBtn.setAttribute("aria-label", label);
    audioBtn.setAttribute("aria-pressed", String(soundEnabled));
    audioBtn.classList.toggle("is-muted", !soundEnabled);
  }

  function applyAudioState(video) {
    video.muted = !soundEnabled;
    video.volume = soundEnabled ? 1 : 0;
  }

  function playVideo(video) {
    applyAudioState(video);
    video.play().catch(() => {
      if (!soundEnabled) return;
      soundNeedsGesture = true;
      updateAudioButton();
      video.muted = true;
      video.volume = 0;
      video.play().catch(() => {});
    });
  }

  function playActiveMedia() {
    slides.forEach((slide, index) => {
      slide.querySelectorAll("video").forEach((video) => {
        if (index === current) {
          video.currentTime = Math.min(video.currentTime || 0, 1);
          playVideo(video);
        } else {
          video.pause();
          video.muted = true;
        }
      });
    });
    updateAudioButton();
  }

  function unlockAudio() {
    soundEnabled = true;
    soundNeedsGesture = false;
    playActiveMedia();
  }

  function toggleAudio() {
    soundEnabled = !soundEnabled;
    soundNeedsGesture = false;
    playActiveMedia();
  }

  function handleAudioButton() {
    if (soundNeedsGesture || !soundEnabled) {
      unlockAudio();
    } else {
      toggleAudio();
    }
  }

  function stopPhotoCollage() {
    photoCollageTimers.forEach((timer) => {
      window.clearInterval(timer);
      window.clearTimeout(timer);
    });
    photoCollageTimers = [];
  }

  function startPhotoCollage() {
    const panel = slides[current].querySelector("[data-photo-panel]");
    if (!panel) return;
    stopPhotoCollage();

    const frames = Array.from(panel.querySelectorAll(".photo-frame"));
    frames.forEach((frame, frameIndex) => {
      const images = Array.from(frame.querySelectorAll("img"));
      if (images.length < 2) return;

      let sourceIndex = frameIndex % photoGridSources.length;
      let front = 0;
      images[0].src = photoGridSources[sourceIndex];
      images[0].classList.add("on");
      images[1].classList.remove("on");

      const step = () => {
        sourceIndex = (sourceIndex + frames.length) % photoGridSources.length;
        const nextSource = photoGridSources[sourceIndex];
        const back = front ^ 1;
        const backImage = images[back];
        let swapped = false;
        const showBackImage = () => {
          if (swapped) return;
          swapped = true;
          backImage.onload = null;
          backImage.onerror = null;
          backImage.classList.add("on");
          images[front].classList.remove("on");
          front = back;
        };
        backImage.onload = showBackImage;
        backImage.onerror = () => {
          sourceIndex = (sourceIndex + 1) % photoGridSources.length;
          backImage.src = photoGridSources[sourceIndex];
        };
        if (backImage.getAttribute("src") === nextSource && backImage.complete && backImage.naturalWidth > 0) {
          showBackImage();
          return;
        }
        backImage.src = nextSource;
        if (backImage.complete && backImage.naturalWidth > 0) showBackImage();
      };

      photoCollageTimers.push(window.setTimeout(() => {
        step();
        photoCollageTimers.push(window.setInterval(step, 8000));
      }, (frameIndex + 1) * 2000));
    });
  }

  function managePhotoCollage() {
    const hasPanel = Boolean(slides[current].querySelector("[data-photo-panel]"));
    if (!hasPanel) {
      stopPhotoCollage();
      return;
    }
    startPhotoCollage();
  }

  function render() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === current);
    });
    counter.innerHTML = `<b>${current + 1}</b><i>/</i><span>${slides.length}</span>`;
    notesText.textContent = slides[current].dataset.notes || "No speaker notes for this slide.";
    location.hash = `slide-${current + 1}`;
    Array.from(deckDots.children).forEach((dot, index) => dot.classList.toggle("on", index === current));
    playActiveMedia();
    managePhotoCollage();
  }

  function goTo(index) {
    const next = clampIndex(index);
    if (next === current) return;
    current = next;
    render();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function toggleNotes() {
    const open = notesPanel.classList.toggle("is-open");
    notesPanel.setAttribute("aria-hidden", String(!open));
  }

  function toggleOverview(forceOpen) {
    const open = typeof forceOpen === "boolean" ? forceOpen : !overview.classList.contains("is-open");
    overview.classList.toggle("is-open", open);
    overview.setAttribute("aria-hidden", String(!open));
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function buildOverview() {
    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.className = "thumb";
      button.type = "button";
      button.innerHTML = `<strong>${String(index + 1).padStart(2, "0")}</strong><span>${slide.dataset.title || "Slide"}</span>`;
      button.addEventListener("click", () => {
        unlockAudio();
        current = index;
        toggleOverview(false);
        render();
      });
      overview.appendChild(button);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.title = slide.dataset.title || `Slide ${index + 1}`;
      dot.setAttribute("aria-label", `Go to slide ${index + 1}: ${slide.dataset.title || "Slide"}`);
      dot.addEventListener("click", () => {
        fadeHintOnce();
        unlockAudio();
        current = index;
        render();
      });
      deckDots.appendChild(dot);
    });
  }

  function fadeHintOnce() {
    if (hintFaded) return;
    hintFaded = true;
    window.setTimeout(() => deckHint.classList.add("fade"), 400);
  }

  function loadHash() {
    const match = location.hash.match(/slide-(\d+)/);
    if (match) current = clampIndex(Number(match[1]) - 1);
  }

  slides.forEach((slide) => {
    slide.querySelectorAll("video").forEach((video) => {
      applyAudioState(video);
      video.addEventListener("click", unlockAudio);
    });
  });

  prevBtn.addEventListener("click", () => {
    fadeHintOnce();
    unlockAudio();
    prev();
  });
  nextBtn.addEventListener("click", () => {
    fadeHintOnce();
    unlockAudio();
    next();
  });
  notesBtn.addEventListener("click", toggleNotes);
  overviewBtn.addEventListener("click", () => toggleOverview());
  fullBtn.addEventListener("click", toggleFullscreen);
  audioBtn.addEventListener("click", handleAudioButton);

  document.getElementById("deck").addEventListener("click", (event) => {
    if (event.target.closest("button, a, video")) return;
    fadeHintOnce();
    unlockAudio();
    next();
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const key = event.key;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(key)) {
      event.preventDefault();
      fadeHintOnce();
      unlockAudio();
      next();
    } else if (["ArrowLeft", "PageUp", "Backspace"].includes(key)) {
      event.preventDefault();
      fadeHintOnce();
      unlockAudio();
      prev();
    } else if (key === "Home") {
      event.preventDefault();
      unlockAudio();
      goTo(0);
    } else if (key === "End") {
      event.preventDefault();
      unlockAudio();
      goTo(slides.length - 1);
    } else if (key.toLowerCase() === "n") {
      event.preventDefault();
      toggleNotes();
    } else if (key.toLowerCase() === "o") {
      event.preventDefault();
      toggleOverview();
    } else if (key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    } else if (key === "Escape") {
      toggleOverview(false);
      notesPanel.classList.remove("is-open");
      notesPanel.setAttribute("aria-hidden", "true");
    }
  });

  window.addEventListener("hashchange", () => {
    const before = current;
    loadHash();
    if (current !== before) render();
  });

  buildOverview();
  loadHash();
  render();
})();
