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
  const notesSaveState = document.getElementById("notesSaveState");
  const overview = document.getElementById("overview");
  const deckDots = document.getElementById("deckDots");
  const deckHint = document.getElementById("deckHint");
  let current = 0;
  let photoCollageTimers = [];
  let hintFaded = false;
  let soundEnabled = true;
  let soundNeedsGesture = false;
  const speakerStorageKey = "cuba-speaker-assignments-talk-pass-v3";
  const notesStorageKey = "cuba-presenter-notes-talk-pass-v2";
  const defaultSpeakerAssignments = [
    "Don",
    "Both",
    "",
    "Justin",
    "Don",
    "Don",
    "Justin",
    "Justin",
    "Don",
    "Justin",
    "Justin",
    "Don",
    "Justin",
    "",
  ];
  const speakers = ["Don", "Both", "Justin"];
  let speakerAssignments = loadSpeakerAssignments();
  let editedNotes = loadEditedNotes();
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
    "assets/photo-grid/photo-10.jpg",
    "assets/photo-grid/photo-11.jpg",
    "assets/photo-grid/photo-12.jpg",
    "assets/photo-grid/photo-13.jpg",
    "assets/photo-grid/photo-14.jpg",
    "assets/photo-grid/photo-15.jpg",
  ];

  function clampIndex(index) {
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  function loadSpeakerAssignments() {
    try {
      const stored = window.localStorage?.getItem(speakerStorageKey) || "[]";
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      // Ignore corrupt local state and fall back to the default speaker.
    }
    return [];
  }

  function saveSpeakerAssignments() {
    try {
      window.localStorage?.setItem(speakerStorageKey, JSON.stringify(speakerAssignments));
    } catch (error) {
      // Speaker labels still work for the current session if storage is unavailable.
    }
  }

  function loadEditedNotes() {
    try {
      const stored = window.localStorage?.getItem(notesStorageKey) || "{}";
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch (error) {
      // Ignore corrupt local state and fall back to the embedded presenter notes.
    }
    return {};
  }

  function saveEditedNotes() {
    try {
      window.localStorage?.setItem(notesStorageKey, JSON.stringify(editedNotes));
      if (notesSaveState) notesSaveState.textContent = "Saved locally in this browser";
    } catch (error) {
      if (notesSaveState) notesSaveState.textContent = "Could not save notes locally";
    }
  }

  function getSlideNotes(index) {
    if (typeof editedNotes[index] === "string") return editedNotes[index];
    return slides[index].dataset.notes || "No speaker notes for this slide.";
  }

  function getSpeaker(index) {
    if (speakers.includes(speakerAssignments[index])) return speakerAssignments[index];
    return defaultSpeakerAssignments[index] || "";
  }

  function setSpeakerButtonState(button, index) {
    const speaker = getSpeaker(index);
    const hasSpeaker = speaker.length > 0;
    button.hidden = !hasSpeaker;
    button.textContent = speaker;
    button.title = hasSpeaker ? `Speaker for slide ${index + 1}: ${speaker}` : `No speaker assigned for slide ${index + 1}`;
    button.setAttribute(
      "aria-label",
      hasSpeaker ? `Speaker for slide ${index + 1}: ${speaker}. Click to switch.` : `No speaker assigned for slide ${index + 1}.`
    );
    button.dataset.speaker = speaker;
  }

  function toggleSpeaker(index, button) {
    const currentSpeaker = getSpeaker(index);
    const currentSpeakerIndex = speakers.indexOf(currentSpeaker);
    const nextSpeakerIndex = currentSpeakerIndex >= 0 ? (currentSpeakerIndex + 1) % speakers.length : 0;
    speakerAssignments[index] = speakers[nextSpeakerIndex];
    setSpeakerButtonState(button, index);
    saveSpeakerAssignments();
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
    const forceMuted = video.dataset.forceMuted === "true";
    video.muted = forceMuted || !soundEnabled;
    video.volume = forceMuted || !soundEnabled ? 0 : 1;
  }

  function playVideo(video) {
    applyAudioState(video);
    video.play().catch(() => {
      if (!soundEnabled || video.dataset.forceMuted === "true") return;
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
    notesText.value = getSlideNotes(current);
    if (notesSaveState) notesSaveState.textContent = "Saved locally in this browser";
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

  function buildSpeakerToggles() {
    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.className = "speaker-toggle";
      button.type = "button";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleSpeaker(index, button);
      });
      setSpeakerButtonState(button, index);
      slide.appendChild(button);
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
  notesText.addEventListener("input", () => {
    editedNotes[current] = notesText.value;
    if (notesSaveState) notesSaveState.textContent = "Saving...";
    saveEditedNotes();
  });
  overviewBtn.addEventListener("click", () => toggleOverview());
  fullBtn.addEventListener("click", toggleFullscreen);
  audioBtn.addEventListener("click", handleAudioButton);

  document.getElementById("deck").addEventListener("click", (event) => {
    if (event.target.closest("button, a, video")) return;
    fadeHintOnce();
    unlockAudio();
    next();
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.getElementById("deck").addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.getElementById("deck").addEventListener("touchend", (event) => {
    if (event.changedTouches.length !== 1) return;
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const duration = Date.now() - touchStartTime;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50 && duration < 350) {
      fadeHintOnce();
      unlockAudio();
      if (diffX < 0) {
        next();
      } else {
        prev();
      }
    }
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const key = event.key;
    const isEditableTarget = event.target instanceof Element && event.target.closest("textarea, input, [contenteditable='true']");
    if (isEditableTarget) {
      if (key === "Escape") {
        notesPanel.classList.remove("is-open");
        notesPanel.setAttribute("aria-hidden", "true");
        event.target.blur?.();
      }
      return;
    }
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

  buildSpeakerToggles();
  buildOverview();
  loadHash();
  render();
})();
