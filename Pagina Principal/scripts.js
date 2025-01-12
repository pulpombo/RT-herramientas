function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("main-content").classList.toggle("sidebar-open");
}

function toggleTheme() {
  document.documentElement.setAttribute(
    "data-theme",
    document.documentElement.getAttribute("data-theme") === "light"
      ? "dark"
      : "light",
  );
}

if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "dark");
}

document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("theme"),
);

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}
