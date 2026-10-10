(() => {
  "use strict";

  document.documentElement.classList.add("js");

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

  // ---- commitment panels: + opens the detail text ----
  document.querySelectorAll(".panel-plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".panel");
      const isOpen = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
      btn.setAttribute("aria-label", isOpen ? "閉じる" : "こだわりを読む");
    });
  });

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
