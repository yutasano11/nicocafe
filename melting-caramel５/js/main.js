(() => {
  "use strict";

  // ---- mobile nav toggle ----
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- header shadow on scroll ----
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- active nav link (scroll-spy for single-page sections) ----
  const navLinks = document.querySelectorAll("#nav a[href^='#']");
  const sections = Array.from(navLinks)
    .map((link) => {
      const href = link.getAttribute("href");
      if (href.length < 2) return null;
      try {
        return document.querySelector(href);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => spy.observe(section));
  }

  // ---- scroll reveal ----
  const revealTargets = document.querySelectorAll(".reveal");
  if (revealTargets.length) {
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
        { threshold: 0.15 }
      );
      revealTargets.forEach((el) => observer.observe(el));
    } else {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    }
  }

  // ---- contact form (sample: no backend yet) ----
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = document.getElementById("formStatus");
      if (status) {
        status.textContent = "送信ありがとうございます。（サンプルのため実際には送信されません）";
      }
      contactForm.reset();
    });
  }

  // ---- coffee cards: scroll to the map, drop a pin on the origin, then show a speech bubble with details ----
  const stage = document.querySelector("#menu-coffee .map-stage");
  const bubble = document.getElementById("pinBubble");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timers = [];

  const clearTimers = () => { timers.forEach((t) => window.clearTimeout(t)); timers = []; };

  const closeBubble = () => {
    clearTimers();
    stage.querySelectorAll(".drop-pin.is-dropped").forEach((pin) => pin.classList.remove("is-dropped"));
    bubble.classList.remove("is-open");
    bubble.hidden = true;
  };

  const openBubble = (pin, origin) => {
    const detail = stage.querySelector(`.pin-details [data-origin="${origin}"]`);
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

  if (stage && bubble) {
    document.querySelectorAll("#menu-coffee .coffee-card[href]").forEach((card) => {
      card.addEventListener("click", (event) => {
        const origin = card.getAttribute("href");
        const pin = stage.querySelector(`.drop-pin[data-origin="${origin}"]`);
        if (!pin) return;
        event.preventDefault();
        closeBubble();

        const rect = stage.getBoundingClientRect();
        const inView = rect.top >= 60 && rect.bottom <= window.innerHeight;
        if (!inView) stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        const scrollDelay = inView || reduceMotion ? 0 : 650;

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
    // coming back with the browser's back button restores the page from cache; start fresh
    window.addEventListener("pageshow", closeBubble);
  }
})();
