/* ---------------------------
   0) Small utilities
--------------------------- */
function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function rafThrottle(fn) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      fn(...args);
    });
  };
}

/* ---------------------------
   1) Logo flip animation
--------------------------- */
function flipLogo() {
  const logo = qs("#logo");
  if (!logo) return;

  logo.style.transition = "transform 0.5s ease";
  logo.style.transform = "rotateY(360deg)";
  logo.style.transformStyle = "preserve-3d";
  logo.style.perspective = "1000px";

  setTimeout(() => {
    logo.style.transform = "rotateY(0)";
  }, 500);
}

/* ---------------------------
   2) Carousel Engine (shared)
   Markup expected:

   <div class="sga-carousel sga-carousel--home" data-carousel data-breakpoint="900" data-mobile-advance="4500" data-desktop-speed="0.45">
     <div class="sga-viewport">
       <div class="sga-track">
         <a class="sga-card event-card" href="..." target="_blank" rel="noopener">...</a>
         ...
       </div>
     </div>
     <div class="sga-dots" aria-label="Carousel pagination"></div>
   </div>

   Notes:
   - Desktop uses JS-driven infinite translate loop (no keyframes)
   - Mobile uses native scroll + snap; JS only updates dots + active + auto-advance
--------------------------- */
function initCarousels() {
  const carousels = qsa("[data-carousel]");
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const viewport = qs(".sga-viewport", carousel);
    const track = qs(".sga-track", carousel);
    const dots = qs(".sga-dots", carousel);
    if (!viewport || !track) return;

    const breakpoint = parseInt(carousel.dataset.breakpoint || "900", 10);
    const mobileAdvanceMs = parseInt(
      carousel.dataset.mobileAdvance || "4500",
      10,
    );
    const desktopSpeed = parseFloat(carousel.dataset.desktopSpeed || "0.45"); // px per frame-ish scaled below

    // Original (real) cards are those present at load
    const originalCards = qsa(".sga-card", track);
    const originalCount = originalCards.length;

    // Make sure cards are anchors (whole-card clickable requirement)
    // If someone accidentally uses divs later, this prevents silent failures.
    originalCards.forEach((card) => {
      if (card.tagName !== "A") {
        console.warn(
          "Carousel card is not an <a>. Whole-card click requires anchor.",
          card,
        );
      }
    });

    // State
    let mode = null; // "desktop" | "mobile"
    let paused = false;

    // Desktop loop state
    let x = 0;
    let rafId = null;
    let loopWidth = 0;

    // Mobile state
    let mobileTimer = null;
    let touchActive = false;
    let lastActiveIndex = 0;

    /* ---------- Dots ---------- */
    function buildDots() {
      if (!dots) return;
      dots.innerHTML = "";

      for (let i = 0; i < originalCount; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sga-dot";
        b.setAttribute("aria-label", `Go to slide ${i + 1}`);
        b.addEventListener("click", () => scrollToIndex(i));
        dots.appendChild(b);
      }
      setActiveDot(0);
    }

    function setActiveDot(idx) {
      if (!dots) return;
      const btns = qsa(".sga-dot", dots);
      btns.forEach((b, i) => b.classList.toggle("is-active", i === idx));
    }

    /* ---------- Mobile helpers ---------- */
    function getCardWidthStep() {
      const cards = qsa(".sga-card", track);
      if (cards.length < 2) return cards[0]?.getBoundingClientRect().width || 0;

      const r0 = cards[0].getBoundingClientRect();
      const r1 = cards[1].getBoundingClientRect();
      const diff = r1.left - r0.left;
      return diff > 0 ? diff : r0.width;
    }

    function getNearestIndexToCenter() {
      const cards = qsa(".sga-card", track);
      if (!cards.length) return 0;

      const vpRect = viewport.getBoundingClientRect();
      const vpCenter = vpRect.left + vpRect.width / 2;

      let bestI = 0;
      let bestD = Infinity;

      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - vpCenter);
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      });

      // Convert from duplicated list index -> original index
      return bestI % originalCount;
    }

    function updateMobileActive() {
      const cards = qsa(".sga-card", track);
      if (!cards.length) return;

      const activeOriginalIndex = getNearestIndexToCenter();
      lastActiveIndex = activeOriginalIndex;

      // Visual emphasis: only centered card emphasized (mobile only)
      cards.forEach((card) => {
        const idx = parseInt(card.dataset.originalIndex || "0", 10);
        card.classList.toggle("is-active", idx === activeOriginalIndex);
        card.classList.toggle("is-dim", idx !== activeOriginalIndex);
      });

      setActiveDot(activeOriginalIndex);
    }

    function scrollToIndex(originalIdx) {
      // Find the first matching card in the current DOM (works even if we duplicated)
      const cards = qsa(".sga-card", track);
      const target = cards.find(
        (c) => parseInt(c.dataset.originalIndex || "0", 10) === originalIdx,
      );
      if (!target) return;

      // Center it
      const left =
        target.offsetLeft - (viewport.clientWidth - target.clientWidth) / 2;

      viewport.scrollTo({ left, behavior: "smooth" });
    }

    function startMobileAutoAdvance() {
      stopMobileAutoAdvance();
      if (mobileAdvanceMs <= 0) return;

      mobileTimer = window.setInterval(() => {
        if (touchActive) return;
        const next = (lastActiveIndex + 1) % originalCount;
        scrollToIndex(next);
      }, mobileAdvanceMs);
    }

    function stopMobileAutoAdvance() {
      if (!mobileTimer) return;
      window.clearInterval(mobileTimer);
      mobileTimer = null;
    }

    /* ---------------------------
    3) Desktop Helpers
  --------------------------- */
    function ensureDesktopLoop() {
      // Build duplicates ONCE so we can loop seamlessly
      // Desktop loop uses transform translateX; duplicates are necessary.
      // We'll rebuild from originals every time we enter desktop to avoid drift.
      track.innerHTML = "";
      originalCards.forEach((card, i) => {
        const c = card.cloneNode(true);
        c.dataset.originalIndex = String(i);
        track.appendChild(c);
      });
      originalCards.forEach((card, i) => {
        const c = card.cloneNode(true);
        c.dataset.originalIndex = String(i);
        track.appendChild(c);
      });

      // Measure width of first set (loop length)
      // Must wait a frame to ensure layout is ready.
      requestAnimationFrame(() => {
        const cards = qsa(".sga-card", track);
        const firstSet = cards.slice(0, originalCount);
        loopWidth = firstSet.reduce(
          (sum, el) => sum + el.getBoundingClientRect().width,
          0,
        );

        // Include gap between cards (flex gap)
        // Easiest reliable method: measure offset between first two cards
        if (firstSet.length >= 2) {
          const a = firstSet[0].getBoundingClientRect();
          const b = firstSet[1].getBoundingClientRect();
          const gap = Math.max(0, b.left - a.right);
          loopWidth += gap * (originalCount - 1);
        }

        // Reset translate
        x = 0;
        track.style.transform = "translate3d(0,0,0)";
      });
    }

    function startDesktopLoop() {
      stopDesktopLoop();
      paused = false;

      const speedPxPerFrame = desktopSpeed; // tuned via data-desktop-speed
      const step = () => {
        if (!paused) {
          x -= speedPxPerFrame;
          if (Math.abs(x) >= loopWidth && loopWidth > 0) {
            // Wrap back seamlessly
            x += loopWidth;
          }
          track.style.transform = `translate3d(${x}px, 0, 0)`;
        }
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }

    function stopDesktopLoop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* ---------- Mode switch ---------- */
    function enterMobile() {
      if (mode === "mobile") return;
      mode = "mobile";

      // Stop desktop loop
      stopDesktopLoop();
      track.style.transform = "none";

      // Mobile should be native scroll; no duplicates needed, but we DO want looping feel.
      // We keep a 3x list so user can swipe a bit without "end", and auto-advance stays smooth.
      track.innerHTML = "";
      for (let rep = 0; rep < 3; rep++) {
        originalCards.forEach((card, i) => {
          const c = card.cloneNode(true);
          c.dataset.originalIndex = String(i);
          track.appendChild(c);
        });
      }

      // Build dots once
      buildDots();

      // Set up scroll listener to update active + dots
      viewport.addEventListener(
        "scroll",
        rafThrottle(() => updateMobileActive()),
        { passive: true },
      );

      // Touch / pointer pause
      const onTouchStart = () => {
        touchActive = true;
        stopMobileAutoAdvance();
      };
      const onTouchEnd = () => {
        touchActive = false;
        startMobileAutoAdvance();
      };

      viewport.addEventListener("touchstart", onTouchStart, { passive: true });
      viewport.addEventListener("touchend", onTouchEnd, { passive: true });
      viewport.addEventListener("pointerdown", onTouchStart, { passive: true });
      viewport.addEventListener("pointerup", onTouchEnd, { passive: true });
      viewport.addEventListener("pointercancel", onTouchEnd, { passive: true });

      // Center the first card nicely
      requestAnimationFrame(() => {
        scrollToIndex(0);
        updateMobileActive();
        startMobileAutoAdvance();
      });
    }

    function enterDesktop() {
      if (mode === "desktop") return;
      mode = "desktop";

      stopMobileAutoAdvance();
      touchActive = false;

      // Desktop uses overflow hidden and transforms
      ensureDesktopLoop();
      startDesktopLoop();

      // Pause on hover (desktop only)
      carousel.addEventListener("mouseenter", () => (paused = true));
      carousel.addEventListener("mouseleave", () => (paused = false));
    }

    function setModeFromWidth() {
      const w = window.innerWidth;
      if (w < breakpoint) enterMobile();
      else enterDesktop();
    }

    // Init with mode + rebuild on resize
    setModeFromWidth();
    window.addEventListener("resize", rafThrottle(setModeFromWidth));
  });
}

/* ---------------------------
   4) Main DOM Ready
--------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  // Flip logo on page load
  flipLogo();

  // Flip logo when Home is clicked (if present)
  const homeLink = qs("#home-link");
  if (homeLink) {
    homeLink.addEventListener("click", function (e) {
      e.preventDefault();
      flipLogo();
      setTimeout(() => {
        window.location.href = homeLink.getAttribute("href");
      }, 600);
    });
  }

  // 5. Feather icons
  if (window.feather) feather.replace();

  // 6. Mobile menu toggle
  const menuBtn = qs("#menu-btn");
  const mobileMenu = qs("#mobile-menu");

  function setIcon(isOpen) {
    if (!menuBtn) return;
    menuBtn.innerHTML = isOpen
      ? '<i data-feather="x"></i>'
      : '<i data-feather="menu"></i>';
    if (window.feather) feather.replace();
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  }

  if (menuBtn && mobileMenu) {
    setIcon(false);
    menuBtn.addEventListener("click", () => {
      const isNowHidden = mobileMenu.classList.toggle("hidden");
      setIcon(!isNowHidden);
    });
  }

  // 7. Auto-update footer year
  const yearSpan = qs("#year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // 8. Highlight active nav link
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  qsa(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // supports "community" AND "community.html"
    const match =
      href === currentPage ||
      href === currentPage.replace(".html", "") ||
      href + ".html" === currentPage;

    if (match) link.classList.add("active");
  });

  // 9. Form animation on scroll
  const formSection = qs("#contact-form .animate-slide-up");
  if (formSection) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("slide-up-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(formSection);
  }

  // 10. Thank-you message logic (contact form)
  const form = qs("#contactForm");
  const thankYou = qs("#thankYouMessage");

  if (form && thankYou) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = new FormData(form);

      fetch(form.action, {
        method: form.method,
        body: data,
        headers: { Accept: "application/json" },
      }).then((response) => {
        if (response.ok) {
          form.reset();
          thankYou.classList.remove("hidden", "text-red-500");
          thankYou.textContent = "Thanks! Your message has been sent.";
        } else {
          thankYou.classList.remove("hidden");
          thankYou.classList.add("text-red-500");
          thankYou.textContent = "Oops! Something went wrong.";
        }
      });
    });
  }

  // Retreat interest form Thank You
(function () {
  const form = document.getElementById("retreatInterestForm");
  const thanks = document.getElementById("retreatInterestThanks");
  const errorMsg = document.getElementById("retreatInterestError");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Hide previous messages
    if (thanks) thanks.classList.add("hidden");
    if (errorMsg) errorMsg.classList.add("hidden");

    // Native validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        form.reset();
        if (thanks) thanks.classList.remove("hidden");
      } else {
        if (errorMsg) errorMsg.classList.remove("hidden");
      }
    } catch {
      if (errorMsg) errorMsg.classList.remove("hidden");
    }

    if (submitBtn) submitBtn.disabled = false;
  });
})();


  // 11. Facility Event Form submission feedback
  const facilityForm = qs("#eventApplicationForm");
  const facilityThankYou = qs("#thankYouMsg");
  if (facilityForm && facilityThankYou) {
    facilityForm.addEventListener("submit", function (e) {
      e.preventDefault();
      facilityForm.reset();
      facilityThankYou.classList.remove("hidden");
    });
  }

  // 12. Expanding Stripes on Hover Animation
  qsa(".stripe-container").forEach((stripe) => {
    stripe.addEventListener("mouseenter", () => {
      stripe.style.transform = "skewY(-12deg) scale(1.02)";
    });
    stripe.addEventListener("mouseleave", () => {
      stripe.style.transform = "skewY(-12deg)";
    });
  });

  // 13. Livestream Auto-Detection & Glow Animation (FULL REWRITE)
  (function initLivestreamBadge() {
    const LIVE_PORTAL_URL = "";
    const LIVE_LIST_URL = "";
    const POLL_MS = 90000;

    let liveEventUrl = LIVE_PORTAL_URL;
    let pollId = null;

    function getEls() {
      return {
        cards: document.querySelectorAll("#livestreamCard"),
        inlineBadges: document.querySelectorAll("#liveBadge"),
      };
    }

    function showUI() {
      const { cards, inlineBadges } = getEls();

      cards.forEach((card) => card.classList.add("livestream-glow"));

      inlineBadges.forEach((badge) => {
        badge.classList.remove("hidden");
        badge.classList.add("flex");
      });

      if (window.feather) feather.replace();
    }

    function hideUI() {
      const { card, inlineBadge } = getEls();

      if (card) card.classList.remove("livestream-glow");

      if (inlineBadge) {
        inlineBadge.classList.add("hidden");
        inlineBadge.classList.remove("flex", "opacity-100");
      }
    }

    async function fetchLiveEvent() {
      const payload = {
        page: 0,
        size: 20,
        next: true,
        count: false,
        filters: { status: "live" },
        isHomePage: true,
      };

      const res = await fetch(LIVE_LIST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const entries = data?.content?.entries || [];
      return entries[0] || null; // filtered to live, so first is enough
    }

    async function checkLivestream() {
      try {
        console.log("[LIVE] check start");

        const liveEvent = await fetchLiveEvent();
        console.log("[LIVE] result:", liveEvent ? liveEvent.status : "none");

        if (liveEvent) {
          const eventId = liveEvent.event_id || liveEvent._id;
          liveEventUrl = eventId
            ? `https://impactenvi.watch.pixellot.tv/events/${eventId}`
            : LIVE_PORTAL_URL;

          showUI();
        } else {
          liveEventUrl = LIVE_PORTAL_URL;

          // If you want the badges to disappear when not live, uncomment:
          // hideUI();
        }
      } catch (err) {
        console.warn("[LIVE] check failed:", err);
      }
    }

    function wireClicksOnce() {
      const { floatingBadge, closeBtn } = getEls();

      if (floatingBadge && !floatingBadge.dataset.liveWired) {
        floatingBadge.dataset.liveWired = "1";

        floatingBadge.addEventListener("click", () => {
          window.open(liveEventUrl || LIVE_PORTAL_URL, "_blank");
        });
      }

      if (closeBtn && !closeBtn.dataset.liveWired) {
        closeBtn.dataset.liveWired = "1";

        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const { floatingBadge: fb } = getEls();
          if (fb) fb.classList.add("hidden");
        });
      }
    }

    function start() {
      console.log("[LIVE] script init");

      wireClicksOnce();
      checkLivestream();

      if (pollId) clearInterval(pollId);
      pollId = setInterval(() => {
        wireClicksOnce(); // in case DOM is injected later
        checkLivestream();
      }, POLL_MS);
    }

    // Start after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  })();

  // HOME-only popup: delay before showing + one-time fade-in per "go live"
(function homeLivePopup() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const isHome = path === "" || path === "/" || path.endsWith("/index.html");
  if (!isHome) return;

  const badge = document.getElementById("liveBadgePopup");
  const closeBtn = document.getElementById("dismissLiveBadgePopup");
  if (!badge) return;

  const DISMISS_KEY = "liveBadgePopupDismissed";

  // tweak these
  const SHOW_DELAY_MS = 6000;   // <-- delay before showing after LIVE
  const POLL_MS = 2000;         // UI check interval (no API calls)

  let prevLive = false;
  let showTimer = null;

  function isLive() {
    // Mirrors your existing live UI state
    return !!document.querySelector("#livestreamCard.livestream-glow");
  }

  function hardHide() {
    // cancel any pending delayed show
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }

    badge.classList.add("hidden");
    badge.classList.remove("flex");

    // reset to invisible for next fade-in
    badge.classList.add("opacity-0");
    badge.classList.remove("opacity-100");
  }

  function fadeInOnce() {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    // ensure it's displayed but still transparent first
    badge.classList.remove("hidden");
    badge.classList.add("flex");

    // next frame → fade to visible
    requestAnimationFrame(() => {
      badge.classList.remove("opacity-0");
      badge.classList.add("opacity-100");
    });
  }

  function scheduleShow() {
    if (showTimer) return; // already scheduled
    showTimer = setTimeout(() => {
      showTimer = null;
      // only show if still live at the moment delay finishes
      if (isLive()) fadeInOnce();
    }, SHOW_DELAY_MS);
  }

  function tick() {
    const liveNow = isLive();

    // LIVE just started (edge: false -> true)
    if (liveNow && !prevLive) {
      scheduleShow(); // delay, then fade in once
    }

    // LIVE ended (true -> false)
    if (!liveNow && prevLive) {
      hardHide();
    }

    // If not live and badge is somehow visible, keep it hidden
    if (!liveNow) {
      // (don’t re-hide constantly; hardHide already does it on transition)
    }

    prevLive = liveNow;
  }

  // Dismiss button
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, "1");
    hardHide();
  });

  // Clicking badge opens stream portal (or change URL)
  badge.addEventListener("click", () => {
    window.open("https://impactenvi.watch.pixellot.tv/", "_blank");
  });

  // init: start hidden
  hardHide();
  tick();
  setInterval(tick, POLL_MS);
})();

  // 14. Smooth Scroll
  const SCROLL_OFFSET = -500;
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const targetEl = qs(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const y =
        targetEl.getBoundingClientRect().top +
        window.pageYOffset -
        SCROLL_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  // 15. Mobile Dropdown Logic
  qsa(".mobile-dropdown").forEach((dropdown) => {
    const btn = qs("button", dropdown);
    const submenu = qs(".submenu", dropdown);
    const arrow = qs(".arrow", dropdown);
    if (!btn || !submenu || !arrow) return;

    btn.addEventListener("click", () => {
      submenu.classList.toggle("hidden");
      arrow.classList.toggle("rotate-180");
    });
  });

  // 16. Delayed CTA show (if present)
  const delayedCTA = qs("#delayed-cta");
  if (delayedCTA) {
    setTimeout(() => delayedCTA.classList.add("show-cta"), 2500);
  }

  // ✅ Init the unified carousels LAST (so layout is stable)
  initCarousels();

  // ✅ DOTS CLICK (horizontal-only) — works with duplicated cards, no scrollIntoView
  (function wireCarouselDotsHorizontalOnly() {
    document.querySelectorAll("[data-carousel]").forEach((carousel) => {
      const viewport = carousel.querySelector(".sga-viewport");
      const track = carousel.querySelector(".sga-track");
      const dotsWrap = carousel.querySelector(".sga-dots");
      if (!viewport || !track || !dotsWrap) return;

      function centerCard(card) {
        const left =
          card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
        viewport.scrollTo({ left, behavior: "smooth" });
      }

      function getMiddleDuplicate(originalIdx) {
        const cards = Array.from(track.querySelectorAll(".sga-card")).filter(
          (c) => {
            const v =
              c.getAttribute("data-original-index") ?? c.dataset.originalIndex;
            return Number(v) === Number(originalIdx);
          },
        );

        if (!cards.length) return null;

        // Choose the MIDDLE copy (index ≈ cards.length / 2)
        return cards[Math.floor(cards.length / 2)];
      }

      dotsWrap.onclick = (e) => {
        const btn = e.target.closest(".sga-dot");
        if (!btn) return;

        e.preventDefault();

        // Determine the intended index
        const idx =
          btn.dataset.index != null
            ? Number(btn.dataset.index)
            : Array.from(dotsWrap.children).indexOf(btn);

        if (idx < 0) return;

        const target = getMiddleDuplicate(idx);
        if (!target) return;

        centerCard(target);
      };
    });
  })();

  // Feather icons again (in case cards were cloned)
  if (window.feather) feather.replace();
});

// ===============================
// 17) COUNTDOWN TIMER (RETREAT)
// ========================
function startCountdown(targetISO) {
  const daysEl = document.getElementById("cdDays");
  const hoursEl = document.getElementById("cdHours");
  const minsEl = document.getElementById("cdMins");
  const secsEl = document.getElementById("cdSecs");
  const doneEl = document.getElementById("cdDone");

  // If any element is missing (or duplicate ID confusion), don't crash the page.
  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  const target = new Date(targetISO).getTime();
  if (Number.isNaN(target)) return;

  function tick() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      daysEl.textContent = "0";
      hoursEl.textContent = "0";
      minsEl.textContent = "0";
      secsEl.textContent = "0";
      if (doneEl) doneEl.classList.remove("hidden");
      clearInterval(timer);
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    daysEl.textContent = String(days);
    hoursEl.textContent = String(hours).padStart(2, "0");
    minsEl.textContent = String(mins).padStart(2, "0");
    secsEl.textContent = String(secs).padStart(2, "0");
  }

  tick();
  const timer = setInterval(tick, 1000);
}

// Run AFTER the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Retreat start (ISO, with timezone offset for NY)
  startCountdown("2026-05-22T15:00:00-04:00");
});


// ===============================
// 18) VENDOR + FORM LOGIC (FIXED)
// ===============================

// Run AFTER the DOM exists
document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // A) Vendor form toggles (multiple) - version 1
  // -----------------------------
  (function () {
    const pairs = [
      { btn: "#toggleHobbyconNYForm", panel: "#vendorFormHobbyconNY" },
      { btn: "#toggleInlineHockeyAZForm", panel: "#vendorFormInlineHockeyAZ" },
    ];

    const getEl = (sel) => document.querySelector(sel);

    pairs.forEach(({ btn, panel }) => {
      const btnEl = getEl(btn);
      const panelEl = getEl(panel);
      if (!btnEl || !panelEl) return;

      btnEl.addEventListener("click", () => {
        const isOpen = !panelEl.classList.contains("hidden");

        // close all panels first
        pairs.forEach(({ btn: b, panel: p }) => {
          const bEl = getEl(b);
          const pEl = getEl(p);
          if (!bEl || !pEl) return;

          pEl.classList.add("hidden");
          bEl.setAttribute("aria-expanded", "false");

          const caret = bEl.querySelector("span");
          if (caret) {
            caret.style.transition = "transform 200ms ease";
            caret.style.transform = "rotate(0deg)";
          }
        });

        // open clicked one
        if (!isOpen) {
          panelEl.classList.remove("hidden");
          btnEl.setAttribute("aria-expanded", "true");

          const caret = btnEl.querySelector("span");
          if (caret) {
            caret.style.transition = "transform 200ms ease";
            caret.style.transform = "rotate(180deg)";
          }

          if (window.feather) window.feather.replace();
        }
      });
    });
  })();

  // -----------------------------
  // B) Vendor form toggles + submissions - version 2
  // (leave it if your HTML uses these IDs)
  // -----------------------------
  (function () {
    const configs = [
      {
        btn: "toggleVendorFormNY",
        panel: "vendorFormPanelNY",
        caret: "toggleVendorFormNYCaret",
        form: "vendorFormNY",
        thanks: "vendorFormNYThanks",
        error: "vendorFormNYError"
      },
      {
        btn: "toggleVendorFormAZ",
        panel: "vendorFormPanelAZ",
        caret: "toggleVendorFormAZCaret",
        form: "vendorFormAZ",
        thanks: "vendorFormAZThanks",
        error: "vendorFormAZError"
      }
    ];

    function closeAll() {
      configs.forEach(c => {
        const panel = document.getElementById(c.panel);
        const btn = document.getElementById(c.btn);
        const caret = document.getElementById(c.caret);

        if (panel) panel.classList.add("hidden");
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (caret) caret.style.transform = "rotate(0deg)";
      });
    }

    configs.forEach(c => {
      const btn = document.getElementById(c.btn);
      const panel = document.getElementById(c.panel);
      const caret = document.getElementById(c.caret);
      const form = document.getElementById(c.form);
      const thanks = document.getElementById(c.thanks);
      const errorMsg = document.getElementById(c.error);

      if (btn && panel) {
        btn.addEventListener("click", () => {
          const isOpen = !panel.classList.contains("hidden");
          closeAll();

          if (!isOpen) {
            panel.classList.remove("hidden");
            btn.setAttribute("aria-expanded", "true");
            if (caret) caret.style.transform = "rotate(180deg)";
            if (window.feather) window.feather.replace();
          }
        });
      }

      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          if (thanks) thanks.classList.add("hidden");
          if (errorMsg) errorMsg.classList.add("hidden");

          const submitBtn = form.querySelector("button[type='submit']");
          if (submitBtn) submitBtn.disabled = true;

          try {
            const res = await fetch(form.action, {
              method: "POST",
              body: new FormData(form),
              headers: { Accept: "application/json" }
            });

            if (res.ok) {
              form.reset();
              if (thanks) thanks.classList.remove("hidden");
            } else {
              if (errorMsg) errorMsg.classList.remove("hidden");
            }
          } catch {
            if (errorMsg) errorMsg.classList.remove("hidden");
          }

          if (submitBtn) submitBtn.disabled = false;
        });
      }
    });
  })();

  // -----------------------------
  // C) Limit secondary categories to 2
  // -----------------------------
  (function () {
    const boxes = document.querySelectorAll('input[name="second_category[]"]');
    if (!boxes.length) return;

    boxes.forEach(box => {
      box.addEventListener("change", function () {
        const checked = document.querySelectorAll('input[name="second_category[]"]:checked');
        if (checked.length > 2) {
          this.checked = false;
          alert("You may select up to 2 categories.");
        }
      });
    });
  })();

// -----------------------------
// D) "Other" + "Referral" select reveals textbox
// -----------------------------
(function () {
  const sel = document.getElementById("ny_hear_about");
  if (!sel) return;

  const otherWrap = document.getElementById("ny_hear_about_other_wrap");
  const otherInput = document.getElementById("ny_hear_about_other");

  const referralWrap = document.getElementById("ny_hear_about_referral_wrap");
  const referralInput = document.getElementById("ny_hear_about_referral");

  function sync() {
    const val = sel.value;

    const isOther = val === "other";
    const isReferral = val === "referral";

    // OTHER
    if (otherWrap) otherWrap.classList.toggle("hidden", !isOther);
    if (otherInput) {
      otherInput.required = isOther;
      if (!isOther) otherInput.value = "";
    }

    // REFERRAL
    if (referralWrap) referralWrap.classList.toggle("hidden", !isReferral);
    if (referralInput) {
      referralInput.required = isReferral;
      if (!isReferral) referralInput.value = "";
    }
  }

  sel.addEventListener("change", sync);
  sync(); // run once on load
})();


// -----------------------------
// E) Primary category -> dynamic subcategory rows (NY)
// - 1st subcategory required
// - + adds more rows
// - options depend on primary
// Uses hidden "library" selects: <select data-subcat="art">...</select>
// -----------------------------
(function () {
  const primary = document.getElementById("ny_hobby_category");
  if (!primary) return;

  const wrap = document.getElementById("nySubcategoryWrap");
  const list = document.getElementById("nySubcatList");
  const addBtn = document.getElementById("nyAddSubcategoryBtn");
  const libraries = document.getElementById("nySubcategoryLibraries");
  const rowTemplate = document.getElementById("nySubcatRowTemplate");
  const otherInput = document.getElementById("ny_primary_detail_other"); // optional

  if (!wrap || !list || !addBtn || !libraries || !rowTemplate) return;

  let activePrimary = "";

  function getLibrarySelect(categoryValue) {
    return libraries.querySelector(`select[data-subcat="${categoryValue}"]`);
  }

  function clearRows() {
    list.innerHTML = "";
    if (otherInput) {
      otherInput.classList.add("hidden");
      otherInput.value = "";
      otherInput.required = false;
    }
  }

  function syncOtherVisibility() {
    if (!otherInput) return;
    const anyOtherSelected = [...list.querySelectorAll("select")].some(
      (s) => s.value === "other"
    );
    otherInput.classList.toggle("hidden", !anyOtherSelected);
    otherInput.required = anyOtherSelected;
    if (!anyOtherSelected) otherInput.value = "";
  }

  function updateRowRules() {
    const rows = list.querySelectorAll(".ny-subcat-row");
    rows.forEach((row, idx) => {
      const sel = row.querySelector("select");
      const removeBtn = row.querySelector(".nyRemoveSubcat");

      // only first row required
      if (sel) sel.required = idx === 0;

      // can't remove last remaining row
      if (removeBtn) removeBtn.style.display = rows.length > 1 ? "inline-flex" : "none";
    });
  }

  function createRow() {
    const lib = getLibrarySelect(activePrimary);
    if (!lib) return null;

    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    const slot = row.querySelector(".flex-1") || row.querySelector("div");

    // clone library select (options included)
    const sel = lib.cloneNode(true);

    // IMPORTANT: each row name uses [] so multiple values submit
    sel.name = `primary_detail_${activePrimary}[]`;

    // ensure visible (library is hidden)
    sel.classList.remove("hidden");

    sel.addEventListener("change", syncOtherVisibility);

    // inject select into row
    if (slot) slot.appendChild(sel);

    // remove handler
    const removeBtn = row.querySelector(".nyRemoveSubcat");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        updateRowRules();
        syncOtherVisibility();
      });
    }

    return row;
  }

  function showForCategory(categoryValue) {
    activePrimary = categoryValue;

    // hide for empty/other
    if (!activePrimary || activePrimary === "other") {
      wrap.classList.add("hidden");
      clearRows();
      return;
    }

    // require that a library exists for that category
    const lib = getLibrarySelect(activePrimary);
    if (!lib) {
      wrap.classList.add("hidden");
      clearRows();
      return;
    }

    wrap.classList.remove("hidden");
    clearRows();

    // inject FIRST row (required)
    const first = createRow();
    if (first) list.appendChild(first);

    updateRowRules();
    syncOtherVisibility();
  }

  primary.addEventListener("change", () => showForCategory(primary.value));

  addBtn.addEventListener("click", () => {
    if (!activePrimary) return;
    const row = createRow();
    if (row) {
      list.appendChild(row);
      updateRowRules();
    }
  });

  // run once on load (handles back button / prefilled)
  if (primary.value) showForCategory(primary.value);
})();

// -----------------------------
// F) Experience Type (NY) - first dropdown stays, + adds extra rows
// -----------------------------
(function () {
  const addBtn = document.getElementById("nyAddExperienceBtn");
  const list = document.getElementById("nyExperienceExtraList");
  const template = document.getElementById("nyExperienceRowTemplate");

  // quick sanity log
  console.log("[Experience] elements:", { addBtn: !!addBtn, list: !!list, template: !!template });

  if (!addBtn || !list || !template) return;

  function addRow() {
    const row = template.content.firstElementChild.cloneNode(true);

    const removeBtn = row.querySelector(".nyRemoveExperience");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => row.remove());
    }

    list.appendChild(row);
  }

  addBtn.addEventListener("click", addRow);
})();

// G. RETREAT ACKNOWLEDGEMENT: require "Open PDF" click before enabling agreement checkbox
(() => {
  const openBtn = document.getElementById("openWaiverPdf");
  const agree = document.getElementById("agreeTerms");
  const dateSigned = document.getElementById("dateSigned");

  // Default date signed = today
  if (dateSigned && !dateSigned.value) {
    dateSigned.value = new Date().toISOString().split("T")[0];
  }

  if (!openBtn || !agree) return;

  // Keep it locked until user opens PDF
  agree.disabled = true;

  openBtn.addEventListener("click", () => {
    // "Open PDF" was clicked — unlock checkbox
    agree.disabled = false;
    agree.focus();
  });
})();


});

// -----------------------------
// Retreat page: collapsible signup form (auto-opens via #interest + button click)
// -----------------------------
(function () {
  const btn = document.getElementById("toggleRetreatFormBtn");
  const panel = document.getElementById("retreatFormPanel");
  const caret = document.getElementById("toggleRetreatFormCaret");

  if (!btn || !panel) return;

  function openPanel() {
    panel.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    if (caret) caret.style.transform = "rotate(180deg)";
    if (window.feather) window.feather.replace();
  }

  function closePanel() {
    panel.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
    if (caret) caret.style.transform = "rotate(0deg)";
  }

  // Toggle via the in-card button
  btn.addEventListener("click", () => {
    const isOpen = !panel.classList.contains("hidden");
    if (isOpen) closePanel();
    else openPanel();
  });

  // ✅ If user clicks "Sign Up Now" (or any link to #interest), open immediately
  document.querySelectorAll('a[href="#interest"]').forEach((a) => {
    a.addEventListener("click", () => {
      // let the browser jump to the anchor first, then open
      setTimeout(openPanel, 50);
    });
  });

  // ✅ Also open when arriving at /page#interest (or hash changes)
  function syncToHash() {
    if (location.hash === "#interest") {
      setTimeout(openPanel, 50);
    }
  }

  syncToHash();
  window.addEventListener("hashchange", syncToHash);
})();


// ===============================
// Retreat: Accommodations Toggle (hardened)
// ===============================
(function () {
  function initAccomToggle() {
    try {
      const btn = document.getElementById("toggleAccomBtn");
      const panel = document.getElementById("accomPanel");
      const caret = document.getElementById("toggleAccomCaret");

      if (!btn || !panel) return false;

      // prevent double-binding if init runs twice
      if (btn.dataset.bound === "1") return true;
      btn.dataset.bound = "1";

      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const isOpen = !panel.classList.contains("hidden");
        panel.classList.toggle("hidden", isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
        if (caret) caret.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
      });

      return true;
    } catch (err) {
      // don't let this kill the rest of your file
      return false;
    }
  }

  // Try now, and also after full load (covers ordering issues)
  initAccomToggle();
  window.addEventListener("load", initAccomToggle);
})();


// =====================
// SHOP PAGE (HTML products + cart + mobile scroll)
// Requirements:
// - Shop page has: #productsGrid, #cartPanel, #cartItems, #cartSubtotal, #cartCount, #checkoutBtn
// - Each product card has: [data-product][data-id][data-title][data-session][data-description][data-price]
// - Each product button calls: onclick="addToCartFromHtml(this)"
// =====================
(function () {
  // --- 0) Only run on Shop page ---
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  // --- 1) Required cart UI elements ---
  const cartPanelEl = document.getElementById("cartPanel");
  const cartItemsEl = document.getElementById("cartItems");
  const cartSubtotalEl = document.getElementById("cartSubtotal");
  const cartCountEl = document.getElementById("cartCount");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (
    !cartPanelEl ||
    !cartItemsEl ||
    !cartSubtotalEl ||
    !cartCountEl ||
    !checkoutBtn
  )
    return;

  const STORAGE_KEY = "sga_cart_v1";
  const cart = new Map(); // id -> { product, qty }
  const fmt = (n) => `$${Number(n).toFixed(2)}`;

  // --- 2) Helpers ---
  function scrollToCartOnMobile() {
    if (!window.matchMedia("(max-width: 1024px)").matches) return; // only mobile/tablet
    cartPanelEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function productFromCard(card) {
    if (!card) return null;
    const id = (card.dataset.id || "").trim();
    const title = (card.dataset.title || "").trim();
    const session = (card.dataset.session || "").trim();
    const description = (card.dataset.description || "").trim();
    const price = Number(card.dataset.price || 0);

    if (!id || !title || !price) return null;
    return { id, title, session, description, price };
  }

  function saveCart() {
    const arr = Array.from(cart.values()).map(({ product, qty }) => ({
      id: product.id,
      title: product.title,
      session: product.session,
      description: product.description,
      price: product.price,
      qty,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;

      arr.forEach((i) => {
        if (!i?.id || !i?.title || !i?.price || !i?.qty) return;
        cart.set(i.id, {
          product: {
            id: i.id,
            title: i.title,
            session: i.session || "",
            description: i.description || "",
            price: Number(i.price),
          },
          qty: Number(i.qty),
        });
      });
    } catch {
      // ignore
    }
  }

  // --- 3) Render cart UI (ONLY place this once) ---
  function renderCart() {
    const items = Array.from(cart.values());
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.product.price, 0);

    cartCountEl.textContent = `${count} ${count === 1 ? "item" : "items"}`;
    cartSubtotalEl.textContent = fmt(subtotal);

    if (items.length === 0) {
      cartItemsEl.innerHTML = `<p class="text-gray-500">Your cart is empty.</p>`;
      checkoutBtn.disabled = true;
      return;
    }

    checkoutBtn.disabled = false;

    cartItemsEl.innerHTML = items
      .map(({ product, qty }) => {
        const lineTotal = product.price * qty;

        return `
          <div class="border border-gray-200 rounded-2xl p-4">
            <div class="flex justify-between items-start gap-3">
              <div>
                <p class="font-semibold text-gray-900">${product.title}</p>
                <p class="text-sm text-gray-600">${product.session || ""}</p>
              </div>
              <p class="font-semibold">${fmt(lineTotal)}</p>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <div class="inline-flex items-center gap-2">
                <button type="button"
                  class="w-9 h-9 rounded-full border border-gray-300 hover:bg-gray-50"
                  onclick="updateQty('${product.id}', -1)"
                  aria-label="Decrease quantity">−</button>

                <span class="min-w-[2ch] text-center font-semibold">${qty}</span>

                <button type="button"
                  class="w-9 h-9 rounded-full border border-gray-300 hover:bg-gray-50"
                  onclick="updateQty('${product.id}', 1)"
                  aria-label="Increase quantity">+</button>
              </div>

              <button type="button"
                class="text-sm underline text-gray-600 hover:text-gray-900"
                onclick="removeItem('${product.id}')">Remove</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // --- 4) Expose button handlers (inline onclick needs window.*) ---
  window.addToCartFromHtml = function (btn) {
    const card = btn?.closest?.("[data-product]");
    const product = productFromCard(card);
    if (!product) return;

    const current = cart.get(product.id);
    cart.set(product.id, { product, qty: current ? current.qty + 1 : 1 });

    saveCart();
    renderCart();
    scrollToCartOnMobile(); // ✅ mobile: jump user to cart after add
  };

  window.updateQty = function (id, delta) {
    const current = cart.get(id);
    if (!current) return;

    const next = current.qty + delta;
    if (next <= 0) cart.delete(id);
    else cart.set(id, { product: current.product, qty: next });

    saveCart();
    renderCart();
  };

  window.removeItem = function (id) {
    cart.delete(id);
    saveCart();
    renderCart();
  };

  // --- 5) Auto-add from URL (?add=PRODUCT_ID) ---
  function autoAddFromUrlOnce() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("add");
    if (!id) return;

    const card = document.querySelector(
      `[data-product][data-id="${CSS.escape(id)}"]`,
    );
    const product = productFromCard(card);
    if (!product) return;

    const current = cart.get(product.id);
    cart.set(product.id, { product, qty: current ? current.qty + 1 : 1 });

    saveCart();
    renderCart();
    scrollToCartOnMobile(); // ✅ mobile: jump to cart on deep link too

    // clean URL so refresh doesn't keep re-adding
    params.delete("add");
    const next = params.toString();
    history.replaceState(
      {},
      "",
      window.location.pathname + (next ? `?${next}` : ""),
    );
  }

  // --- 6) Checkout button ---
  checkoutBtn.addEventListener("click", () => {
    saveCart();
    window.location.href = "/checkout.html";
  });

  // --- 7) Start ---
  loadCart();
  renderCart();
  autoAddFromUrlOnce();
})();


