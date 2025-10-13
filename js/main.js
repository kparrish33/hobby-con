document.addEventListener("DOMContentLoaded", function () {
  // Get the current page name (e.g. "contact.html")
  const currentPage = window.location.pathname.split("/").pop();

  // Find all nav links
  const navLinks = document.querySelectorAll(".nav-link");

  // Loop through links and add blue color if it matches current page
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("text-[#5fbcff]");
    }
  });
});
