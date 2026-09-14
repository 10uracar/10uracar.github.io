/* =========================================
   Onur Acar — Theme System
========================================= */

const themeToggle = document.getElementById("theme-toggle");


// Daha önce seçilmiş temayı kontrol et
const savedTheme = localStorage.getItem("theme");


// Sayfa açılırken kayıtlı temayı uygula
if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀";
}


// Tema değiştirme
themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const isLightMode =
        document.body.classList.contains("light-mode");


    if (isLightMode) {

        themeToggle.textContent = "☀";

        localStorage.setItem("theme", "light");

    } else {

        themeToggle.textContent = "☾";

        localStorage.setItem("theme", "dark");

    }

});