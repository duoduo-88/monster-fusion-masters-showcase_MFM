/* Local media only; the public wiki never loads the private game runtime. */
(() => {
  "use strict";
  const images = [...document.querySelectorAll("img[data-animation]")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = reduced.matches;
  const renderImage = image => {
    const source = paused || document.hidden ? image.dataset.still : image.dataset.animation;
    // Avoid restarting every GIF when a reader changes just one example.
    if (image.getAttribute ? image.getAttribute("src") !== source : image.src !== source) image.src = source;
  };
  const syncMotion = () => {
    images.forEach(renderImage);
  };
  for (const gallery of document.querySelectorAll("[data-demo-gallery]")) {
    const image = gallery.querySelector("img");
    const caption = gallery.querySelector(".demo-caption");
    const buttons = [...gallery.querySelectorAll("button[data-demo-src]")];
    for (const button of buttons) button.addEventListener("click", () => {
      image.dataset.animation = button.dataset.demoSrc;
      image.dataset.still = button.dataset.demoStill;
      image.alt = button.dataset.demoCaption;
      caption.textContent = button.dataset.demoCaption;
      for (const candidate of buttons) candidate.setAttribute("aria-pressed", String(candidate === button));
      renderImage(image);
    });
  }
  document.addEventListener("visibilitychange", syncMotion);
  reduced.addEventListener?.("change", event => {
    paused = event.matches;
    syncMotion();
  });
  syncMotion();
})();
