document.addEventListener("DOMContentLoaded", function () {
  // 1. Logo flip animation
  const logo = document.querySelector("nav img");
  if (logo) {
    logo.style.transition = "transform 0.5s ease";
    logo.style.transform = "rotateY(360deg)";
    setTimeout(() => {
      logo.style.transform = "rotateY(0)";
    }, 500);
  }

  // 2. Feather icons
  if (window.feather) feather.replace();

  // 3. Mobile menu toggle
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  function setIcon(isOpen) {
    menuBtn.innerHTML = isOpen
      ? '<i data-feather="x"></i>'
      : '<i data-feather="menu"></i>';
    feather.replace();
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  }

  if (menuBtn && mobileMenu) {
    setIcon(false);
    menuBtn.addEventListener("click", () => {
      const isNowHidden = mobileMenu.classList.toggle("hidden");
      setIcon(!isNowHidden);
    });
  }

  // 4. Auto-update footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 5. Highlight active nav link
  const currentPage = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("text-[#5fbcff]");
    }
  });
});
