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

  // ---- coffee cards: scroll to the map, drop a pin on the origin, then open the origin page ----
  const map = document.querySelector("#menu-coffee .origin-map-wrap");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let navigating = false;

  const resetPins = () => {
    document.querySelectorAll(".drop-pin.is-dropped").forEach((pin) => pin.classList.remove("is-dropped"));
    navigating = false;
  };

  if (map) {
    document.querySelectorAll("#menu-coffee .coffee-card[href]").forEach((card) => {
      card.addEventListener("click", (event) => {
        const href = card.getAttribute("href");
        const pin = map.querySelector(`.drop-pin[data-origin="${href}"]`);
        if (!pin || navigating) return;
        event.preventDefault();
        navigating = true;

        const rect = map.getBoundingClientRect();
        const mapVisible = rect.top >= 60 && rect.bottom <= window.innerHeight;
        const scrollDelay = mapVisible || reduceMotion ? 0 : 650;
        if (!mapVisible) map.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

        window.setTimeout(() => {
          resetPins();
          navigating = true;
          pin.classList.add("is-dropped");
          window.setTimeout(() => { window.location.href = href; }, reduceMotion ? 300 : 1100);
        }, scrollDelay);
      });
    });

    // coming back with the browser's back button restores the page from cache; clear the old pin
    window.addEventListener("pageshow", resetPins);
  }
})();
