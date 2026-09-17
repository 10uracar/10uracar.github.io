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
// Spotify Now Playing
// -----------------------------------------

const spotifyWidget = document.getElementById("spotify-widget");
const spotifyToggle = document.getElementById("spotify-toggle");
const spotifyPanel = document.getElementById("spotify-panel");
const spotifyClose = document.getElementById("spotify-close");
const spotifyEyebrow = document.getElementById("spotify-eyebrow");
const spotifyTitle = document.getElementById("spotify-title");
const spotifyArtist = document.getElementById("spotify-artist");
const spotifyCover = document.getElementById("spotify-cover");
const spotifyProgressBar = document.getElementById("spotify-progress-bar");
const spotifyTime = document.getElementById("spotify-time");
const spotifyLink = document.getElementById("spotify-link");
const spotifyEmpty = document.getElementById("spotify-empty");

let spotifyData = null;
let spotifyProgressTimer = null;

function setSpotifyPanel(open) {
    spotifyWidget.classList.toggle("is-open", open);
    spotifyPanel.setAttribute("aria-hidden", String(!open));
    spotifyToggle.setAttribute("aria-expanded", String(open));
}

function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) {
        return "—:—";
    }

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getEffectiveProgress(data) {
    if (!data || !data.isPlaying) {
        return Math.max(0, Number(data?.progressMs) || 0);
    }

    const baseProgress = Math.max(0, Number(data.progressMs) || 0);
    const duration = Math.max(0, Number(data.durationMs) || 0);
    const updatedAt = Date.parse(data.updatedAt || "");

    if (!duration || !Number.isFinite(updatedAt)) {
        return baseProgress;
    }

    const elapsed = Math.max(0, Date.now() - updatedAt);
    return Math.min(duration, baseProgress + elapsed);
}

function renderSpotifyProgress() {
    const data = spotifyData;

    if (!data) {
        spotifyProgressBar.style.width = "0%";
        spotifyTime.textContent = "—:—";
        return;
    }

    const duration = Math.max(0, Number(data.durationMs) || 0);
    const progress = getEffectiveProgress(data);

    if (!duration) {
        spotifyProgressBar.style.width = "0%";
        spotifyTime.textContent = "—:—";
        return;
    }

    const percentage = Math.min(
        100,
        Math.max(0, (progress / duration) * 100)
    );

    spotifyProgressBar.style.width = `${percentage}%`;
    spotifyTime.textContent =
        `${formatDuration(progress)} / ${formatDuration(duration)}`;
}

function resetSpotifyArtwork() {
    spotifyCover.removeAttribute("src");
    spotifyCover.alt = "";
    spotifyCover.classList.remove("has-image");
}

function renderSpotify(data) {
    spotifyData = data;

    const isPlaying =
        data &&
        data.isPlaying === true &&
        data.track;

    const lastPlayed =
        data?.lastPlayed &&
        data.lastPlayed.track
            ? data.lastPlayed
            : null;

    const item =
        isPlaying
            ? {
                track: data.track,
                artist: data.artist,
                albumImage: data.albumImage,
                spotifyUrl: data.spotifyUrl
            }
            : lastPlayed;

    if (!item) {
        spotifyEyebrow.textContent = "Spotify";
        spotifyTitle.textContent = "Henüz dinlenen bir parça yok";
        spotifyArtist.textContent =
            "Spotify'da bir şey dinlediğinde burada görünecek.";
        spotifyLink.removeAttribute("href");
        spotifyLink.setAttribute("aria-disabled", "true");
        spotifyProgressBar.style.width = "0%";
        spotifyTime.textContent = "—:—";
        resetSpotifyArtwork();
        spotifyEmpty.classList.add("is-hidden");
        return;
    }

    spotifyEyebrow.textContent =
        isPlaying
            ? "Şimdi Çalıyor"
            : "Son Dinlenen";

    spotifyTitle.textContent =
        item.track || "Bilinmeyen parça";

    spotifyArtist.textContent =
        item.artist || "Bilinmeyen sanatçı";

    if (item.albumImage) {
        spotifyCover.src = item.albumImage;
        spotifyCover.alt =
            `${item.track || "Albüm"} albüm kapağı`;
        spotifyCover.classList.add("has-image");
    } else {
        resetSpotifyArtwork();
    }

    if (item.spotifyUrl) {
        spotifyLink.href = item.spotifyUrl;
        spotifyLink.removeAttribute("aria-disabled");
    } else {
        spotifyLink.removeAttribute("href");
        spotifyLink.setAttribute("aria-disabled", "true");
    }

    spotifyEmpty.classList.add("is-hidden");

    renderSpotifyProgress();
}

async function loadSpotifyData() {
    try {
        const response = await fetch(
            `spotify.json?ts=${Date.now()}`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Spotify data request failed: ${response.status}`
            );
        }

        const data = await response.json();

        renderSpotify(data);
    } catch (error) {
        console.error(
            "Spotify verisi alınamadı:",
            error
        );

        if (!spotifyData) {
            spotifyEyebrow.textContent = "Spotify";
            spotifyTitle.textContent =
                "Veri alınamadı";
            spotifyArtist.textContent =
                "Biraz sonra tekrar deneyebilirsin.";
        }
    }
}

spotifyToggle.addEventListener("click", event => {
    event.stopPropagation();

    const isOpen =
        spotifyWidget.classList.contains("is-open");

    setSpotifyPanel(!isOpen);

    if (!isOpen) {
        loadSpotifyData();
    }
});

spotifyClose.addEventListener("click", event => {
    event.stopPropagation();
    setSpotifyPanel(false);
});

spotifyPanel.addEventListener("click", event => {
    event.stopPropagation();
});

document.addEventListener("click", event => {
    if (
        spotifyWidget.classList.contains("is-open") &&
        !spotifyWidget.contains(event.target)
    ) {
        setSpotifyPanel(false);
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        spotifyWidget.classList.contains("is-open")
    ) {
        setSpotifyPanel(false);
    }
});

loadSpotifyData();

setInterval(
    loadSpotifyData,
    30 * 1000
);

spotifyProgressTimer = setInterval(
    renderSpotifyProgress,
    1000
);

// -----------------------------------------
// Reduced Motion
// -----------------------------------------

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduce-motion");
}
