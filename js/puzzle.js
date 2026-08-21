/* =============================================================================
   puzzle.js - HobbyCon puzzle hunt
   Kept OUT of main.js on purpose: it used to live at the end of that file,
   where any earlier runtime error silently prevented it from ever running.
   Loaded with its own <script> tag so it fails (or works) independently.
   ============================================================================= */
/* -----------------------------------------------------------------------------
   PUZZLE HUNT
   Four hidden pieces, one each on index, events, community and news.
   A piece is any element carrying data-hc-piece="<id>".

   Purely additive and self-guarding: pages with no piece and no saved progress
   return immediately, so this costs nothing on retreats/vendors/contact/tickets.

   Progress lives in localStorage under hcPuzzlePieces. The tray is built here
   rather than in markup because it must not appear until the first find.
   NOTE: tray styles are injected as real CSS - the Tailwind CDN does not
   compile classes added by JS after load.
   -------------------------------------------------------------------------- */
(function () {
  var ALL = ["index", "contact", "community", "news"];
  var KEY = "hcPuzzlePieces";
  // Create this promo code in Eventbrite (10% off, with a redemption cap
  // and an end date - main.js is public, so the code is findable).
  var PROMO = "PUZZLE10";
  // Organizer page rather than a single event, so this never goes stale.
  var EVENTBRITE = "https://www.eventbrite.com/o/hobbycon-121280626948";

  var pieces = Array.prototype.slice.call(
    document.querySelectorAll("[data-hc-piece]")
  );

  function read() {
    try {
      var list = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      if (Object.prototype.toString.call(list) !== "[object Array]") return [];
      return list.filter(function (id) {
        return ALL.indexOf(id) !== -1;
      });
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* private mode / storage full - the hunt just won't persist */
    }
  }

  var found = read();
  if (!pieces.length && !found.length) return;

  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function css() {
    if (document.getElementById("hc-puzzle-css")) return;
    var s = document.createElement("style");
    s.id = "hc-puzzle-css";
    s.textContent =
      "@keyframes hcPieceIdle{0%,92%,100%{transform:none}96%{transform:scale(1.12) rotate(-8deg)}}" +
      "[data-hc-piece]{display:inline-flex;align-items:center;justify-content:center;opacity:.45;" +
      "color:#7c3aed;background:none;border:0;padding:6px;line-height:0;cursor:pointer;" +
      "transition:opacity .25s ease,transform .25s ease}" +
      "[data-hc-piece]:hover,[data-hc-piece]:focus-visible{opacity:1;transform:scale(1.25) rotate(-10deg);outline:none}" +
      "@media (hover:none){[data-hc-piece]{animation:hcPieceIdle 6s ease-in-out infinite}}" +
      // The index piece is the tutorial: brighter, always wiggling, so people
      // notice the game exists and go looking for the other three.
      "[data-hc-start]{opacity:.8;animation:hcPieceIdle 4s ease-in-out infinite}" +
      "[data-hc-start]:hover,[data-hc-start]:focus-visible{opacity:1}" +
      "#hc-tray{position:fixed;left:16px;bottom:16px;z-index:9990;display:flex;align-items:center;gap:8px;" +
      "padding:10px 14px;border-radius:9999px;background:#fff;border:1px solid #ddd6fe;" +
      "box-shadow:0 8px 24px rgba(80,50,160,.16);font-size:13px;color:#5b21b6;font-weight:600;" +
      "opacity:0;transform:translateY(8px);transition:opacity .3s ease,transform .3s ease;pointer-events:none}" +
      "#hc-tray.hc-on{opacity:1;transform:none;pointer-events:auto}" +
      // The index piece is fixed bottom-left too. If it is still unfound, lift
      // the tray above it so the counter never covers the starting piece.
      "#hc-tray.hc-raise{bottom:74px}" +
      ".hc-slot{width:14px;height:14px;border-radius:4px;border:1px dashed #c4b5fd;display:inline-block}" +
      ".hc-slot.hc-got{border-style:solid;background:#c4b5fd}" +
      ".hc-bang{position:fixed;z-index:9991;pointer-events:none;color:#7c3aed;line-height:0}" +
      "#hc-done{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;" +
      "padding:20px;background:rgba(15,23,42,.55);opacity:0;transition:opacity .25s ease}" +
      "#hc-done.hc-on{opacity:1}" +
      "#hc-done .hc-done-card{position:relative;width:100%;max-width:420px;text-align:center;" +
      "padding:36px 28px 28px;border-radius:24px;border:1px solid #ddd6fe;" +
      "background:linear-gradient(135deg,#faf5ff,#eef2ff);box-shadow:0 24px 60px rgba(60,40,120,.3);" +
      "transform:translateY(14px) scale(.97);transition:transform .3s cubic-bezier(.34,1.4,.64,1)}" +
      "#hc-done.hc-on .hc-done-card{transform:none}" +
      "#hc-done .hc-done-emoji{font-size:40px;line-height:1}" +
      "#hc-done h2{margin:14px 0 0;font-size:24px;font-weight:700;color:#0f172a}" +
      "#hc-done p{margin:10px 0 0;font-size:15px;color:#475569;line-height:1.6}" +
      "#hc-done .hc-done-code{margin:20px 0 0;display:flex;align-items:center;justify-content:center;gap:10px}" +
      "#hc-done .hc-done-code code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:19px;" +
      "font-weight:700;letter-spacing:.08em;color:#5b21b6;background:#fff;border:1px dashed #c4b5fd;" +
      "border-radius:12px;padding:10px 18px}" +
      "#hc-done .hc-done-copy{font-size:13px;font-weight:700;color:#6d28d9;background:none;border:0;" +
      "cursor:pointer;padding:8px}" +
      "#hc-done .hc-done-copy:hover{color:#4c1d95}" +
      "#hc-done .hc-done-cta{display:inline-flex;margin-top:22px;padding:12px 26px;border-radius:9999px;" +
      "font-weight:700;text-decoration:none;color:#fff;background:linear-gradient(135deg,#8b5cf6,#6366f1);" +
      "box-shadow:0 10px 24px rgba(120,80,220,.35)}" +
      "#hc-done .hc-done-x{position:absolute;top:12px;right:16px;font-size:26px;line-height:1;color:#94a3b8;" +
      "background:none;border:0;cursor:pointer;padding:4px 8px}" +
      "#hc-done .hc-done-x:hover{color:#475569}" +
      (reduce
        ? "[data-hc-piece]{animation:none!important;transition:none!important}" +
          "#hc-tray,#hc-done,#hc-done .hc-done-card{transition:none!important}" +
          "#hc-done .hc-done-card{transform:none!important}"
        : "");
    document.head.appendChild(s);
  }

  var tray, count, slots, hideTimer;

  function buildTray() {
    if (tray) return;
    tray = document.createElement("div");
    tray.id = "hc-tray";
    tray.setAttribute("role", "status");
    tray.setAttribute("aria-live", "polite");
    count = document.createElement("span");
    tray.appendChild(count);
    slots = [];
    for (var i = 0; i < ALL.length; i++) {
      var d = document.createElement("span");
      d.className = "hc-slot";
      tray.appendChild(d);
      slots.push(d);
    }
    document.body.appendChild(tray);
  }

  function paint() {
    buildTray();
    var n = found.length;
    count.textContent = n + " of " + ALL.length + " pieces";
    for (var i = 0; i < slots.length; i++) {
      if (i < n) slots[i].className = "hc-slot hc-got";
      else slots[i].className = "hc-slot";
    }
  }

  function show(sticky) {
    paint();
    var start = document.querySelector("[data-hc-piece][data-hc-start]");
    var startShowing = !!start && start.style.display !== "none";
    if (startShowing) tray.classList.add("hc-raise");
    else tray.classList.remove("hc-raise");
    window.clearTimeout(hideTimer);
    // next frame so the transition actually runs on a freshly added node
    window.requestAnimationFrame(function () {
      tray.classList.add("hc-on");
    });
    if (!sticky) {
      hideTimer = window.setTimeout(function () {
        tray.classList.remove("hc-on");
      }, 4500);
    }
  }

  function burst(el) {
    if (reduce) return;
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    for (var i = 0; i < 14; i++) {
      (function (i) {
        var d = document.createElement("span");
        d.className = "hc-bang";
        d.textContent = "🧩";
        d.style.left = cx + "px";
        d.style.top = cy + "px";
        d.style.fontSize = 10 + Math.random() * 8 + "px";
        document.body.appendChild(d);
        var a = ((Math.PI * 2) / 14) * i;
        var dist = 50 + Math.random() * 60;
        var anim = d.animate(
          [
            { transform: "translate(-50%,-50%) scale(.4)", opacity: 1 },
            {
              transform:
                "translate(calc(-50% + " + Math.cos(a) * dist + "px), calc(-50% + " +
                Math.sin(a) * dist + "px)) scale(1.1) rotate(" +
                (Math.random() * 300 - 150) + "deg)",
              opacity: 0
            }
          ],
          { duration: 850, easing: "cubic-bezier(.2,.7,.3,1)" }
        );
        anim.onfinish = function () {
          if (d.parentNode) d.parentNode.removeChild(d);
        };
      })(i);
    }
  }

  var modal;

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("hc-on");
    document.body.style.overflow = "";
    window.setTimeout(function () {
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      modal = null;
    }, 250);
  }

  function openModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "hc-done";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Puzzle complete");
    modal.innerHTML =
      '<div class="hc-done-card">' +
        '<button type="button" class="hc-done-x" aria-label="Close">&times;</button>' +
        '<div class="hc-done-emoji" aria-hidden="true">\uD83E\uDDE9</div>' +
        '<h2>You found all four pieces</h2>' +
        '<p>Here is 10% off any HobbyCon event on Eventbrite.</p>' +
        '<div class="hc-done-code"><code>' + PROMO + '</code>' +
          '<button type="button" class="hc-done-copy">Copy</button></div>' +
        '<a class="hc-done-cta" href="' + EVENTBRITE + '" target="_blank" rel="noopener">RSVP to an Event</a>' +
      '</div>';
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    modal.querySelector(".hc-done-x").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    var copyBtn = modal.querySelector(".hc-done-copy");
    copyBtn.addEventListener("click", function () {
      function done() {
        copyBtn.textContent = "Copied";
        window.setTimeout(function () { copyBtn.textContent = "Copy"; }, 1800);
      }
      try {
        navigator.clipboard.writeText(PROMO).then(done, function () {});
      } catch (e) {
        // older browsers: select the code so the user can copy it by hand
        try {
          var r = document.createRange();
          r.selectNodeContents(modal.querySelector(".hc-done-code code"));
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        } catch (e2) {}
      }
    });

    window.requestAnimationFrame(function () {
      modal.classList.add("hc-on");
      bigBurst();
    });
    copyBtn.focus();
  }

  document.addEventListener("keydown", function (e) {
    if (modal && (e.key === "Escape" || e.key === "Esc")) closeModal();
  });

  function bigBurst() {
    if (reduce) return;
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    for (var i = 0; i < 40; i++) {
      (function (i) {
        var d = document.createElement("span");
        d.className = "hc-bang";
        d.style.zIndex = "10001";
        d.textContent = "\uD83E\uDDE9";
        d.style.left = cx + "px";
        d.style.top = cy + "px";
        d.style.fontSize = 12 + Math.random() * 14 + "px";
        document.body.appendChild(d);
        var a = Math.random() * Math.PI * 2;
        var dist = 120 + Math.random() * 260;
        var anim = d.animate(
          [
            { transform: "translate(-50%,-50%) scale(.3)", opacity: 1 },
            {
              transform:
                "translate(calc(-50% + " + Math.cos(a) * dist + "px), calc(-50% + " +
                (Math.sin(a) * dist + 140) + "px)) scale(1.15) rotate(" +
                (Math.random() * 540 - 270) + "deg)",
              opacity: 0
            }
          ],
          { duration: 1400 + Math.random() * 500, easing: "cubic-bezier(.15,.7,.35,1)" }
        );
        anim.onfinish = function () {
          if (d.parentNode) d.parentNode.removeChild(d);
        };
      })(i);
    }
  }

  pieces.forEach(function (el) {
    var id = el.getAttribute("data-hc-piece");
    if (ALL.indexOf(id) === -1) return;

    if (found.indexOf(id) !== -1) {
      el.style.display = "none"; // already collected on a previous visit
      return;
    }

    el.addEventListener("click", function () {
      if (found.indexOf(id) !== -1) return;
      found.push(id);
      write(found);
      burst(el);
      el.style.display = "none";

      if (found.length === ALL.length) {
        openModal();
        // Reset straight away so the hunt is replayable: on the next page load
        // all four pieces are back. Nobody gets stuck in a "finished" state,
        // and testing needs no console command.
        found = [];
        write(found);
      } else {
        show(false);
      }
    });
  });

  css();

  // Returning visitor mid-hunt: remind them quietly, then get out of the way.
  // A finished hunt clears itself on completion, so found is never full here.
  if (found.length) show(false);
})();
