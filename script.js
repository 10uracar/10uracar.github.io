/* =========================================
   Onur Acar — Theme, Color & Profile System
========================================= */

const body = document.body;

const themeToggle = document.getElementById("theme-toggle");
const colorToggle = document.getElementById("color-toggle");
const colorPanel = document.getElementById("color-panel");
const colorOptions = document.querySelectorAll(".color-option");

const profileButton = document.getElementById("profile-open");
const profileLightbox = document.getElementById("profile-lightbox");
const profileBackdrop = document.querySelector(".profile-lightbox-backdrop");
const profileLightboxImage = document.getElementById("profile-lightbox-image");


// -----------------------------------------
// Tema
// -----------------------------------------

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
    body.classList.add("light-mode");
    themeToggle.textContent = "☀";
} else {
    themeToggle.textContent = "☾";
}

themeToggle.addEventListener("click", () => {

    body.classList.toggle("light-mode");

    const isLightMode = body.classList.contains("light-mode");

    themeToggle.textContent = isLightMode ? "☀" : "☾";
    localStorage.setItem("theme", isLightMode ? "light" : "dark");

});


// -----------------------------------------
// Renk Sistemi
// -----------------------------------------

const colorThemes = ["galaxy", "gold", "mint", "sky"];
const savedColor = localStorage.getItem("color");

function applyColor(color) {

    const selectedColor =
        colorThemes.includes(color)
            ? color
            : "galaxy";

    body.classList.remove(
        "color-galaxy",
        "color-gold",
        "color-mint",
        "color-sky"
    );

    body.classList.add(`color-${selectedColor}`);

    colorOptions.forEach(option => {

        const isActive =
            option.dataset.color === selectedColor;

        option.classList.toggle("active", isActive);
        option.setAttribute(
            "aria-pressed",
            String(isActive)
        );

    });

    localStorage.setItem("color", selectedColor);

}

applyColor(savedColor || "galaxy");


function setColorPanel(open) {

    colorPanel.classList.toggle("is-open", open);
    colorPanel.setAttribute("aria-hidden", String(!open));
    colorToggle.setAttribute("aria-expanded", String(open));

}

colorToggle.addEventListener("click", event => {

    event.stopPropagation();

    const isOpen =
        colorPanel.classList.contains("is-open");

    setColorPanel(!isOpen);

});

colorOptions.forEach(option => {

    option.addEventListener("click", event => {

        event.stopPropagation();

        applyColor(option.dataset.color);
        setColorPanel(false);

    });

});

document.addEventListener("click", event => {

    if (
        colorPanel.classList.contains("is-open") &&
        !colorPanel.contains(event.target) &&
        event.target !== colorToggle
    ) {
        setColorPanel(false);
    }

});


// -----------------------------------------
// Profil Fotoğrafı Önizleme
// -----------------------------------------

let profileOrigin = null;
let profileOpen = false;
let profileAnimating = false;
let profileTransitionTimer = null;

function getProfileRect() {
    return document
        .querySelector(".profile-ring")
        .getBoundingClientRect();
}

function getTargetSize() {

    const maxWidth = Math.min(window.innerWidth * 0.82, 560);
    const maxHeight = Math.min(window.innerHeight * 0.78, 560);
    const size = Math.max(160, Math.min(maxWidth, maxHeight));

    return size;

}

function setLightboxSize(size) {

    profileLightboxImage.style.width = `${size}px`;
    profileLightboxImage.style.height = `${size}px`;

}

function setImageTransformFromOrigin(origin, targetSize) {

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const originCenterX = origin.left + origin.width / 2;
    const originCenterY = origin.top + origin.height / 2;

    const deltaX = originCenterX - viewportCenterX;
    const deltaY = originCenterY - viewportCenterY;
    const scale = origin.width / targetSize;

    profileLightboxImage.style.transform =
        `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;

}

function setImageTransformExpanded() {

    profileLightboxImage.style.transform =
        "translate(-50%, -50%) translate(0, 0) scale(1)";

}

function clearTransitionTimer() {

    if (profileTransitionTimer !== null) {
        clearTimeout(profileTransitionTimer);
        profileTransitionTimer = null;
    }

}

function finishOpen() {

    clearTransitionTimer();
    profileOpen = true;
    profileAnimating = false;

}

function finishClose() {

    clearTransitionTimer();

    // Önce mevcut kapanış animasyonunu tamamen görünür halde bitir.
    // Ardından lightbox'ı gizleyip başlangıç transformunu geçişsiz sıfırla.
    // Böylece fotoğrafın tekrar merkeze sıçramasına neden olan ikinci
    // animasyon oluşmaz.
    profileLightbox.classList.remove("is-visible");
    profileLightbox.setAttribute("aria-hidden", "true");

    body.classList.remove("lightbox-open");
    profileButton.classList.remove("is-lightbox-active");

    profileOpen = false;
    profileAnimating = false;
    profileOrigin = null;

    const previousTransition = profileLightboxImage.style.transition;

    profileLightboxImage.style.transition = "none";
    profileLightboxImage.style.transform =
        "translate(-50%, -50%) translate(0, 0) scale(0)";

    // Stil değişikliğinin uygulanmasını garanti ettikten sonra CSS
    // transition'ını geri ver.
    void profileLightboxImage.offsetWidth;
    profileLightboxImage.style.transition = previousTransition;

}

function openProfileLightbox() {

    if (profileAnimating || profileOpen) {
        return;
    }

    profileAnimating = true;
    profileOrigin = getProfileRect();

    const targetSize = getTargetSize();

    setLightboxSize(targetSize);
    setImageTransformFromOrigin(profileOrigin, targetSize);

    profileLightbox.classList.add("is-visible");
    profileLightbox.setAttribute("aria-hidden", "false");

    body.classList.add("lightbox-open");
    profileButton.classList.add("is-lightbox-active");

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            setImageTransformExpanded();
            profileLightboxImage.classList.add("is-expanded");

        });

    });

    clearTransitionTimer();
    profileTransitionTimer = setTimeout(finishOpen, 430);

}

function closeProfileLightbox() {

    if (!profileLightbox.classList.contains("is-visible") || profileAnimating || !profileOrigin) {
        return;
    }

    profileAnimating = true;

    const currentSize = profileLightboxImage.getBoundingClientRect().width;

    setLightboxSize(currentSize);

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            const origin = profileOrigin;
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;

            const originCenterX = origin.left + origin.width / 2;
            const originCenterY = origin.top + origin.height / 2;

            const deltaX = originCenterX - viewportCenterX;
            const deltaY = originCenterY - viewportCenterY;
            const scale = origin.width / currentSize;

            profileLightboxImage.style.transform =
                `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;

            profileLightboxImage.classList.remove("is-expanded");

        });

    });

    clearTransitionTimer();
    profileTransitionTimer = setTimeout(finishClose, 430);

}

profileButton.addEventListener("click", openProfileLightbox);

profileBackdrop.addEventListener("click", closeProfileLightbox);

profileLightbox.addEventListener("click", event => {

    if (event.target !== profileLightboxImage) {
        closeProfileLightbox();
    }

});

profileLightboxImage.addEventListener("click", event => {
    event.stopPropagation();
});

// Sağ tık / sürükleyerek resim alma ve yeni sekmede açmayı engelle.
profileButton.addEventListener("contextmenu", event => {
    event.preventDefault();
});

profileLightboxImage.addEventListener("contextmenu", event => {
    event.preventDefault();
});

profileButton.addEventListener("dragstart", event => {
    event.preventDefault();
});

profileLightboxImage.addEventListener("dragstart", event => {
    event.preventDefault();
});

document.addEventListener("keydown", event => {

    if (
        event.key === "Escape" &&
        profileLightbox.classList.contains("is-visible") &&
        !profileAnimating
    ) {
        closeProfileLightbox();
    }

});

window.addEventListener("resize", () => {

    if (!profileLightbox.classList.contains("is-visible") || profileAnimating) {
        return;
    }

    const targetSize = getTargetSize();
    setLightboxSize(targetSize);
    setImageTransformExpanded();

});


// -----------------------------------------
// Reduced Motion
// -----------------------------------------

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduce-motion");
}
