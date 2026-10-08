(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- nav toggle ----
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if (navToggle && nav) {
    const close = () => {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  }

  // ---- header border on scroll ----
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- product category tabs ----
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const activateTab = (name) => {
    tabButtons.forEach((btn) => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    tabPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
  };
  tabButtons.forEach((btn) => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));
  // links elsewhere on the page (hero, nav, commitment panels) can open a specific tab
  document.querySelectorAll("[data-open-tab]").forEach((link) => {
    link.addEventListener("click", () => activateTab(link.dataset.openTab));
  });

  // 詳細ページから #menu-coffee などで戻ってきたときは、その分類を開いておく
  const openTabFromHash = () => {
    const hash = location.hash.slice(1);
    if (!hash) return;
    const panel = document.getElementById(hash);
    if (panel && panel.classList.contains("tab-panel")) {
      activateTab(panel.dataset.panel);
      panel.scrollIntoView({ behavior: "auto", block: "start" });
    }
  };
  openTabFromHash();
  window.addEventListener("hashchange", openTabFromHash);

  // ---- coffee list: drop a pin on the faint background map and show a speech bubble with details ----
  const mapArea = document.querySelector(".coffee-map-area");
  const overlay = mapArea && mapArea.querySelector(".map-overlay");
  const bubble = document.getElementById("pinBubble");

  if (mapArea && overlay && bubble) {
    let timers = [];

    const closeBubble = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
      overlay.querySelectorAll(".drop-pin.is-dropped").forEach((pin) => pin.classList.remove("is-dropped"));
      bubble.classList.remove("is-open");
      bubble.hidden = true;
    };

    const openBubble = (pin, origin) => {
      const detail = mapArea.querySelector(`.pin-details [data-origin="${origin}"]`);
      if (!detail) return;
      const x = parseFloat(pin.style.left);
      const y = parseFloat(pin.style.top);
      bubble.querySelector(".pin-bubble-body").innerHTML = detail.innerHTML;
      bubble.style.setProperty("--bx", `${x}%`);
      bubble.style.setProperty("--by", `${y}%`);
      bubble.classList.toggle("is-left", x > 55);
      bubble.hidden = false;
      requestAnimationFrame(() => bubble.classList.add("is-open"));
      bubble.focus({ preventScroll: true });
    };

    mapArea.querySelectorAll("a.menu-item-main").forEach((item) => {
      item.addEventListener("click", (event) => {
        const origin = item.getAttribute("href");
        const pin = overlay.querySelector(`.drop-pin[data-origin="${origin}"]`);
        if (!pin) return;
        event.preventDefault();
        closeBubble();

        // make sure the part of the map where the pin lands is on screen
        const pinRect = pin.getBoundingClientRect();
        const pinVisible = pinRect.top >= 120 && pinRect.bottom <= window.innerHeight - 40;
        if (!pinVisible) pin.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        const scrollDelay = pinVisible || reduceMotion ? 0 : 600;

        timers.push(window.setTimeout(() => {
          pin.classList.add("is-dropped");
          timers.push(window.setTimeout(() => openBubble(pin, origin), reduceMotion ? 0 : 550));
        }, scrollDelay));
      });
    });

    bubble.querySelector(".pin-bubble-close").addEventListener("click", closeBubble);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !bubble.hidden) closeBubble();
    });
    window.addEventListener("pageshow", closeBubble);
  }

  // ---- gallery: 写真が一定の速さで自動で流れ続ける(端で途切れない) ----
  const gallery = document.getElementById("idGallery");
  if (gallery && gallery.children.length) {
    const SPEED = 26; // 1秒あたりに流れる距離(px)
    const originals = Array.from(gallery.children);
    let loopWidth = 0;
    let dragging = false;
    let hovering = false;
    let frame = null;
    let lastTime = 0;
    let smoothUntil = 0; // 矢印のなめらかな移動中は位置を戻さない

    // 1周ぶんの写真を複製して並べ、左右どちらへ動かしても途切れないようにする
    const buildLoop = () => {
      gallery.querySelectorAll('[data-clone="true"]').forEach((node) => node.remove());
      loopWidth = gallery.scrollWidth;
      if (loopWidth <= 0) return false;

      const sets = Math.max(3, Math.ceil((gallery.clientWidth * 2) / loopWidth) + 1);
      for (let i = 1; i < sets; i += 1) {
        originals.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.setAttribute("data-clone", "true");
          clone.setAttribute("aria-hidden", "true");
          // 複製は横スクロールの外側に並ぶので、遅延読み込みのままだと空のまま流れてくる
          clone.querySelectorAll("img").forEach((img) => img.setAttribute("loading", "eager"));
          gallery.appendChild(clone);
        });
      }
      gallery.scrollLeft = loopWidth; // 真ん中の1周から始める
      return true;
    };

    // 位置をいつも真ん中の1周(loopWidth〜loopWidth×2)に保つ。
    // 同じ並びが前後に続いているので、ここで戻しても見た目は変わらない。
    const wrap = () => {
      if (loopWidth <= 0 || dragging || performance.now() < smoothUntil) return;
      if (gallery.scrollLeft >= loopWidth * 2) gallery.scrollLeft -= loopWidth;
      else if (gallery.scrollLeft < loopWidth) gallery.scrollLeft += loopWidth;
    };

    const tick = (time) => {
      if (!lastTime) lastTime = time;
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      if (!dragging && !hovering) gallery.scrollLeft += SPEED * delta;
      wrap();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame !== null || reduceMotion) return;
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame === null) return;
      cancelAnimationFrame(frame);
      frame = null;
    };

    if (buildLoop()) start();

    window.addEventListener("resize", () => {
      stop();
      if (buildLoop()) start();
    });

    // 見たいときは止まるように
    gallery.addEventListener("pointerenter", () => { hovering = true; });
    gallery.addEventListener("pointerleave", () => { hovering = false; });
    gallery.addEventListener("focusin", () => { hovering = true; });
    gallery.addEventListener("focusout", () => { hovering = false; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    });

    // 矢印で1枚ぶん送る
    document.querySelectorAll("[data-gallery-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const first = gallery.querySelector(".id-photo");
        const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
        const step = first ? first.getBoundingClientRect().width + gap : gallery.clientWidth * 0.8;
        smoothUntil = performance.now() + (reduceMotion ? 0 : 700);
        gallery.scrollBy({ left: step * Number(btn.dataset.galleryStep), behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    // マウスでも掴んで左右に動かせるように(タッチは標準のスワイプに任せる)
    let startX = 0;
    let startScroll = 0;

    gallery.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      dragging = true;
      startX = event.clientX;
      startScroll = gallery.scrollLeft;
      gallery.classList.add("is-dragging");
      gallery.setPointerCapture(event.pointerId);
    });

    gallery.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      gallery.scrollLeft = startScroll - (event.clientX - startX);
    });

    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      gallery.classList.remove("is-dragging");
      if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
    };
    gallery.addEventListener("pointerup", endDrag);
    gallery.addEventListener("pointercancel", endDrag);
  }

  // ---- お問い合わせフォーム(デザイン確認用のダミー: 送信はしない) ----
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = contactForm.querySelector(".form-status");
      if (status) status.hidden = false;
    });
  }

  // ---- scroll reveal ----
  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }
})();
