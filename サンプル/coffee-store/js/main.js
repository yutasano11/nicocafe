(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- mobile nav toggle ----
  const navToggle = document.getElementById("navToggle");
  const navList = document.getElementById("navList");

  if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navList.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- active nav link (完全一致を優先し、なければページ名で一致) ----
  const currentPage = location.pathname.split("/").pop() || "index.html";
  const navLinks = Array.from(document.querySelectorAll(".main-nav a"));
  const exact = navLinks.find((link) => link.getAttribute("href") === currentPage);
  const current = exact || navLinks.find((link) => link.getAttribute("href").split("#")[0] === currentPage);
  if (current) {
    current.classList.add("is-active");
  }

  // ---- hero slider ----
  const slider = document.getElementById("heroSlider");
  if (slider) {
    const slides = Array.from(slider.querySelectorAll(".slide"));
    const dots = Array.from(slider.querySelectorAll(".slider-dots button"));
    let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let timer = null;

    if (index < 0) {
      index = 0;
    }

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-selected", String(i === index));
      });
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const play = () => {
      if (reduceMotion || slides.length < 2) return;
      stop();
      timer = setInterval(() => show(index + 1), 6000);
    };

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        show(i);
        play();
      });
    });

    slider.querySelectorAll("[data-slide-step]").forEach((button) => {
      button.addEventListener("click", () => {
        show(index + Number(button.dataset.slideStep));
        play();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", play);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", play);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        play();
      }
    });

    show(index);
    play();
  }

  // ---- 店内検索(サンプル: ページ内リンクの案内のみ) ----
  const searchForm = document.getElementById("siteSearch");
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = searchForm.querySelector("input");
      const keyword = input ? input.value.trim() : "";
      window.location.href = keyword
        ? `menu.html?q=${encodeURIComponent(keyword)}`
        : "menu.html";
    });
  }

  // ---- メニューページ: 検索キーワードでの絞り込み ----
  const menuRoot = document.getElementById("menuList");
  if (menuRoot) {
    const keyword = new URLSearchParams(location.search).get("q");
    const status = document.getElementById("menuFilterStatus");
    if (keyword) {
      const needle = keyword.trim().toLowerCase();
      let hits = 0;
      menuRoot.querySelectorAll(".menu-item").forEach((item) => {
        const match = item.textContent.toLowerCase().includes(needle);
        item.hidden = !match;
        if (match) hits += 1;
      });
      menuRoot.querySelectorAll(".menu-category").forEach((category) => {
        const visible = category.querySelectorAll(".menu-item:not([hidden])").length;
        category.hidden = visible === 0;
      });
      if (status) {
        status.hidden = false;
        status.textContent = hits
          ? `「${keyword}」の検索結果: ${hits}件　`
          : `「${keyword}」に一致するメニューは見つかりませんでした。　`;
        const reset = document.createElement("a");
        reset.href = "menu.html";
        reset.textContent = "すべて表示";
        reset.className = "link-more";
        status.appendChild(reset);
      }
    }
  }

  // ---- scroll reveal ----
  const revealTargets = document.querySelectorAll(".reveal");
  if (revealTargets.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
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
})();
