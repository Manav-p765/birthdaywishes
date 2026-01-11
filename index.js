// =======================
// MAIN
// =======================
console.log("Main JS running");

/* EARLY UNIVERSAL CLICK LOGGER - runs in capture phase before anything else */
document.addEventListener('click', (e) => {
  const isExplore = e.target.closest('#birthday-page .btn');
  if (isExplore) {
    console.log('>>> CLICK ON EXPLORE BTN <<<', 'target:', e.target, 'btnElement:', e.target.closest('#birthday-page .btn'));
  }
}, true); // use capture phase

// =======================
// PAGE 1: BLOBS FOLLOW (WORKS ON MOBILE + DESKTOP)
// =======================

const shapes = document.querySelectorAll(".shape");
const cursor = document.querySelector(".cursor");

// Detect touch device
const isTouch = window.matchMedia("(pointer: coarse)").matches;

// Hide fake cursor on touch devices
if (isTouch && cursor) {
  cursor.style.display = "none";
}

// GSAP setters
const setCursorX = cursor ? gsap.quickSetter(cursor, "x", "px") : null;
const setCursorY = cursor ? gsap.quickSetter(cursor, "y", "px") : null;

// Main move function
function moveBlobs(x, y) {
  if (cursor && setCursorX && setCursorY) {
    setCursorX(x);
    setCursorY(y);
  }

  gsap.to(shapes, {
    x: x,
    y: y,
    stagger: -0.1,
    duration: 0.6,
    ease: "power3.out",
  });
}

// ===== DESKTOP =====
window.addEventListener("mousemove", (e) => {
  moveBlobs(e.clientX, e.clientY);
});

// ===== MOBILE TOUCH =====
window.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  moveBlobs(t.clientX, t.clientY);
}, { passive: true });

window.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  moveBlobs(t.clientX, t.clientY);
}, { passive: true });

// ===== POINTER FALLBACK =====
window.addEventListener("pointermove", (e) => {
  moveBlobs(e.clientX, e.clientY);
});

// =======================
// PAGE 1 → PAGE 2
// =======================
let birthdayShown = false;

document.addEventListener(
  "click",
  () => {
    if (birthdayShown) return;
    birthdayShown = true;

    const page2 = document.getElementById("birthday-page");

    const tl = gsap.timeline({ defaults: { duration: 0.8, ease: "power2.inOut" } });

    tl.to(".shapes", { y: "-120%" }, 0)
      .to(".content", { y: "-120%" }, 0)
      .to(
        "#birthday-page",
        {
          top: "0%",
          opacity: 1,
          onStart: () => {
            page2.style.pointerEvents = "auto";
          },
        },
        0.1
      )
      .to(".cursor", { scale: 0.85, duration: 0.4 }, 0.05)
      .fromTo(
        "#birthday-page h1",
        { scale: 0.86 },
        { scale: 1, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.2"
      )
      .call(() => {
        initBirthdayGallery();
      });
  },
  { once: true }
);

// =======================
// PAGE 2: GALLERY + SCROLL + PORTAL
// =======================
function initBirthdayGallery() {
  const page = document.getElementById("birthday-page");
  if (page.__inited) return;
  page.__inited = true;

  const scrollContainer = page.querySelector("[data-scroll-container]");
  const gallery = page.querySelector(".img-gallery-container");
  const images = gsap.utils.toArray(page.querySelectorAll(".img"));
  const btn = page.querySelector(".btn");
  const portal = page.querySelector("#go-time");

  // --- Force stacked start ---
  gallery.classList.add("order");
  images.forEach((img) => img.classList.add("reorder"));

  const startRotations = [8, -6, 3, -3];
  images.forEach((img, i) => gsap.set(img, { rotate: startRotations[i] || 0 }));

  // --- Locomotive ---
  const scroller = new LocomotiveScroll({
    el: scrollContainer,
    smooth: true,
    lerp: 0.08,
  });

  setTimeout(() => scroller.update(), 300);

  // --- GSAP ---
  gsap.registerPlugin(Flip);

  // --- Flip logic ---
  let isFlipped = false;
  const rotationValues = [10, -5, 2, -2];

  function applyRotation() {
    images.forEach((img, i) => {
      const r = isFlipped ? 0 : rotationValues[i] || 0;
      gsap.to(img, { rotate: r, duration: 1.4, ease: "power3.out" });
    });
  }

  // SIMPLE: direct click handler on the button
  btn.addEventListener("click", (e) => {
    console.log('Explore clicked, isFlipped:', isFlipped);
    e.preventDefault();
    e.stopPropagation();

    isFlipped = !isFlipped;
    btn.textContent = isFlipped ? "Hide Memories" : "Explore Ideas";

    const state = Flip.getState(page.querySelectorAll(".img-gallery-container, .img"));

    gallery.classList.toggle("order");
    images.forEach((img) => img.classList.toggle("reorder"));

    Flip.from(state, {
      absolute: true,
      duration: 1.6,
      stagger: 0.05,
      ease: "power3.inOut",
      onStart: applyRotation,
      onComplete: () => setTimeout(() => scroller.update(), 300),
    });
  });

  // Portal visibility on scroll
  let hasScrolled = false;
  scroller.on("scroll", (obj) => {
    const current = obj.scroll.y;
    if (current > 24) hasScrolled = true;

    // Show portal only if user scrolled and reached near the end
    const lastImg = images[images.length - 1];
    if (lastImg && hasScrolled) {
      const rect = lastImg.getBoundingClientRect();
      if (rect.bottom <= (window.innerHeight + 8)) {
        if (portal) {
          gsap.to(portal, { opacity: 1, duration: 0.5 });
          portal.style.pointerEvents = "auto";
        }
        return;
      }
    }

    // Hide portal when not at end
    if (portal) {
      gsap.to(portal, { opacity: 0, duration: 0.3 });
      portal.style.pointerEvents = "none";
    }
  });
}

// =======================
// PAGE 2 → PAGE 3
// =======================
document.getElementById("go-time")?.addEventListener("click", () => {
  const page2 = document.getElementById("birthday-page");
  const page3 = document.getElementById("time-page");

  const tl = gsap.timeline();

  tl.to("#go-time", { scale: 3, opacity: 0, duration: 0.6 })
    .to(page2, { opacity: 0, duration: 0.6 }, 0.1)
    .set(page2, { display: "none" })
    .set(page3, { display: "block" })
    .fromTo(page3, { opacity: 0 }, { opacity: 1, duration: 1 })
    .call(() => {
  startTimeCounter();
  animateTimePageIn();
});
});

// =======================
// PAGE 3: TIME COUNTER
// =======================
const START_DATE = "2006-02-05T00:00:00";

let timeInterval = null;

function startTimeCounter() {
  const startTime = new Date(START_DATE).getTime();

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  function update() {
    const diff = Date.now() - startTime;

    daysEl.textContent = Math.floor(diff / 86400000).toLocaleString();
    hoursEl.textContent = Math.floor(diff / 3600000).toLocaleString();
    minutesEl.textContent = Math.floor(diff / 60000).toLocaleString();
    secondsEl.textContent = Math.floor(diff / 1000).toLocaleString();
  }

  update();
  if (timeInterval) clearInterval(timeInterval);
  timeInterval = setInterval(update, 1000);

  // ANIMATIONS on page 3 load
  const heading = document.querySelector('#time-page h2');
  const boxes = gsap.utils.toArray('#time-page .time-box');

  const tl = gsap.timeline();

  // Fade in heading from top
  if (heading) {
    tl.fromTo(heading, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0);
  }

  // Stagger animate boxes from bottom
  tl.fromTo(
    boxes,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 },
    0.3
  );
}

document.getElementById("go-final").addEventListener("click", () => {
  const page3 = document.getElementById("time-page");
  const page4 = document.getElementById("final-page");

  const tl = gsap.timeline();

  tl.to(page3, { opacity: 0, duration: 0.8 })
    .set(page3, { display: "none" })
    .set(page4, { display: "block" })
    .fromTo(page4, { opacity: 0 }, { opacity: 1, duration: 1 })
    .call(() => {
  startFinalStory();
  gsap.set("#final-page", { display: "block" });
gsap.to("#final-page", { opacity: 1, duration: 1 });
});

});


// =======================
// PAGE 4: STORY + MUSIC
// =======================

const storyLines = [
  "You’ve already come so far.",
  "Every late night. Every doubt. Every small win.",
  "You kept going — even when no one was watching.",
  "This is not the end of a chapter.",
  "This is the beginning of something bigger.",
  "Your story is just getting started. ✨"
];

function startFinalStory() {
  const page4 = document.getElementById("final-page");
  const lineEl = page4.querySelector(".story-line");
  const music = document.getElementById("bg-music");
  const nextBtn = page4.querySelector(".next-btn");

  let index = 0;

  // Reset
  gsap.set(lineEl, { opacity: 0, y: 20 });
  gsap.set(nextBtn, { opacity: 0 });
  nextBtn.style.pointerEvents = "none";

  // Play music (must be user triggered!)
  music.currentTime = 0;
  music.volume = 0.8;
  music.play();

  function showNextLine() {
    if (index >= storyLines.length) {
      // End → show Continue button
      gsap.to(nextBtn, { opacity: 1, duration: 1 });
      nextBtn.style.pointerEvents = "auto";
      return;
    }

    const text = storyLines[index];
    index++;

    gsap.to(lineEl, {
      opacity: 0,
      y: -10,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => {
        lineEl.textContent = text;

        gsap.fromTo(
          lineEl,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out"
          }
        );
      }
    });

    setTimeout(showNextLine, 3500); // ⏱️ 3.5 seconds per line
  }

  showNextLine();
}
document.querySelector("#final-page .next-btn").addEventListener("click", () => {
  const page4 = document.getElementById("final-page");

  gsap.to(page4, { opacity: 0, duration: 1 });

  setTimeout(() => {
    page4.style.display = "none";
    startBalloonEnding();
  }, 1000);
});

// =======================
// PAGE 5: BALLOON ENDING
// =======================

function startBalloonEnding() {
  const page5 = document.getElementById("balloon-page");
  const canvas = document.getElementById("balloon-canvas");
  const ctx = canvas.getContext("2d");

  // Show page
  gsap.set(page5, { display: "block" });
  gsap.to(page5, { opacity: 1, duration: 1.2 });

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // =========================
  // BALLOONS
  // =========================

  const colors = ["#ff5f7e", "#ffd166", "#4cc9f0", "#c77dff", "#80ffdb"];
  const balloons = [];

  function createBalloon() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 100,
      r: 18 + Math.random() * 18,
      speed: 0.4 + Math.random() * 0.8,
      sway: Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      grabbed: false
    };
  }

  for (let i = 0; i < 25; i++) balloons.push(createBalloon());

  // =========================
  // DRAG SYSTEM
  // =========================

  let grabbedBalloon = null;

  canvas.addEventListener("mousedown", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      const dx = mx - b.x;
      const dy = my - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.r) {
        grabbedBalloon = b;
        b.grabbed = true;
        break;
      }
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (grabbedBalloon) {
      grabbedBalloon.x = e.clientX;
      grabbedBalloon.y = e.clientY;
    }
  });

  window.addEventListener("mouseup", () => {
    if (grabbedBalloon) {
      grabbedBalloon.grabbed = false;
      grabbedBalloon = null;
    }
  });

  // =========================
  // DRAW LOOP
  // =========================

  function drawBalloon(b) {
    // string
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.moveTo(b.x, b.y + b.r);
    ctx.lineTo(b.x, b.y + b.r + 40);
    ctx.stroke();

    // balloon
    ctx.beginPath();
    ctx.fillStyle = b.color;
    ctx.ellipse(b.x, b.y, b.r * 0.8, b.r, 0, 0, Math.PI * 2);
    ctx.fill();

    // highlight
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.ellipse(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.2, b.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    balloons.forEach((b) => {
      if (!b.grabbed) {
        b.phase += 0.01;
        b.x += Math.sin(b.phase) * 0.3;
        b.y -= b.speed;
      }

      if (b.y < -100) {
        Object.assign(b, createBalloon());
      }

      drawBalloon(b);
    });

    requestAnimationFrame(animate);
  }

  animate();

  // =========================
  // UI FADE IN
  // =========================
  gsap.to("#balloon-page .final-line", { opacity: 1, duration: 2, delay: 1.5 });
  gsap.to("#balloon-page .restart-btn", { opacity: 1, duration: 1, delay: 2.5 });
}
document.querySelector("#balloon-page .restart-btn").addEventListener("click", () => {
  location.reload();
});
