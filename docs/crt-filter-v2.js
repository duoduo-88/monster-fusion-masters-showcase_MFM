(() => {
  if (document.getElementById("mfmCrtDynamicSvg")) return;

  /*
   * Original phosphor beam with a dark teal glass finish and a slim black rim.
   * The rim stays inside the existing page padding. No opaque lower cabinet
   * covers the hand dock. Rounded glass is an optical cue, not a geometric
   * barrel warp: game coordinates and pointer hit testing remain unchanged.
   */

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.id = "mfmCrtDynamicSvg";
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none";
  svg.innerHTML = `
    <defs>
      <filter id="mfmCrtDynamicBeam" x="-3%" y="-1%" width="106%" height="102%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.42 0.025" result="beamTight"/>
        <feComponentTransfer in="beamTight" result="beamTightDim">
          <feFuncA type="linear" slope="0.24"/>
        </feComponentTransfer>

        <feGaussianBlur in="SourceGraphic" stdDeviation="1.10 0.045" result="beamWide"/>
        <feComponentTransfer in="beamWide" result="beamWideDim">
          <feFuncA type="linear" slope="0.18"/>
        </feComponentTransfer>

        <feBlend in="SourceGraphic" in2="beamTightDim" mode="screen" result="beamNear"/>
        <feBlend in="beamNear" in2="beamWideDim" mode="screen" result="beamSpread"/>

        <feComponentTransfer in="beamSpread" result="beamOutput">
          <feFuncR type="gamma" amplitude="1" exponent="0.965" offset="0"/>
          <feFuncG type="gamma" amplitude="1" exponent="0.965" offset="0"/>
          <feFuncB type="gamma" amplitude="1" exponent="0.965" offset="0"/>
          <feFuncA type="identity"/>
        </feComponentTransfer>
      </filter>
    </defs>`;
  document.documentElement.appendChild(svg);

  const style = document.createElement("style");
  style.id = "mfmCrtFilterV2";
  style.textContent = `
#noise,
#crtNoise{display:none!important}
html::before,
html::after{content:none!important;display:none!important;animation:none!important}

body > :not(script):not(style):not(#noise):not(#crtNoise):not(dialog:modal),
dialog:modal > :not([data-mfm-crt-layer]){
  filter:url(#mfmCrtDynamicBeam)!important;
}

#mfmCrtScanOverlay,
#mfmCrtPhosphorOverlay,
#mfmCrtGlassOverlay,
#mfmCrtCabinetOverlay{
  position:fixed;
  inset:2px;
  border-radius:18px;
  pointer-events:none;
}

/* Original 4 px CRT raster and phosphor grain. */
#mfmCrtScanOverlay{
  z-index:2147482998;
  background:repeating-linear-gradient(
    180deg,
    rgba(0,0,0,.14) 0 .34px,
    rgba(0,0,0,.08) .34px .72px,
    rgba(0,0,0,.035) .72px 1.10px,
    rgba(0,0,0,0) 1.10px 2.90px,
    rgba(0,0,0,.035) 2.90px 3.28px,
    rgba(0,0,0,.08) 3.28px 3.66px,
    rgba(0,0,0,.14) 3.66px 4px
  );
  opacity:.82;
  mix-blend-mode:multiply;
}

#mfmCrtPhosphorOverlay{
  z-index:2147482999;
  opacity:.18;
  mix-blend-mode:soft-light;
  image-rendering:pixelated;
  background-repeat:repeat;
  background-size:64px 64px;
}

/* Teal is the screen's underlying tone, not an opaque strip below it.
   Normal alpha compositing also lifts pure black panels very slightly. */
#mfmCrtGlassOverlay{
  z-index:2147483000;
  box-shadow:
    inset 0 0 0 1px rgba(98,151,152,.07),
    inset 0 0 24px rgba(0,0,0,.24);
  background:
    radial-gradient(ellipse 90% 85% at 50% 48%,transparent 58%,rgba(0,0,0,.24) 100%),
    radial-gradient(ellipse 70% 18% at 50% 0%,rgba(127,174,174,.022),transparent 80%),
    radial-gradient(ellipse 110% 100% at 50% 70%,rgba(35,87,108,.10),rgba(15,38,57,.06));
}

/* The outer shadow fills only the 2 px rim and rounded corner cutouts.
   All four sides share the same geometry; no thick border over the UI. */
#mfmCrtCabinetOverlay{
  z-index:2147483001;
  box-shadow:0 0 0 24px #000;
}
`;
  document.head.appendChild(style);

  const makeOverlay = id => {
    const element = document.createElement("div");
    element.id = id;
    element.dataset.mfmCrtLayer = "";
    element.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(element);
    return element;
  };

  const scan = makeOverlay("mfmCrtScanOverlay");
  const phosphor = makeOverlay("mfmCrtPhosphorOverlay");
  const glass = makeOverlay("mfmCrtGlassOverlay");
  const cabinet = makeOverlay("mfmCrtCabinetOverlay");
  const overlays = [scan, phosphor, glass, cabinet];

  // Keep the official rating mark free of scanlines, including when its body
  // is scaled. A higher z-index on the image cannot escape that stacking context.
  let ratingSymbol = document.querySelector(".rating-symbol");
  let ratingClipFrame = 0;
  const updateRatingClip = () => {
    ratingClipFrame = 0;
    if (!ratingSymbol?.getClientRects().length || scan.parentElement !== document.documentElement) {
      scan.style.clipPath = "";
      return;
    }
    const mark = ratingSymbol.getBoundingClientRect();
    const layer = scan.getBoundingClientRect();
    const left = mark.left - layer.left, top = mark.top - layer.top;
    const right = mark.right - layer.left, bottom = mark.bottom - layer.top;
    scan.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0,
      ${left}px ${top}px, ${left}px ${bottom}px, ${right}px ${bottom}px,
      ${right}px ${top}px, ${left}px ${top}px, 0 0)`;
  };
  const scheduleRatingClip = () => {
    if (!ratingClipFrame) ratingClipFrame = requestAnimationFrame(updateRatingClip);
  };
  if (ratingSymbol) {
    const ratingResize = new ResizeObserver(scheduleRatingClip);
    const observeRatingLayout = () => {
      ratingResize.disconnect();
      ratingSymbol = document.querySelector(".rating-symbol");
      for (let node = ratingSymbol; node; node = node.parentElement) ratingResize.observe(node);
      const identityScreen = document.getElementById("identityScreen");
      if (identityScreen) ratingResize.observe(identityScreen);
      scheduleRatingClip();
    };
    observeRatingLayout();
    document.addEventListener("wiki:navigated", observeRatingLayout);
    document.addEventListener("scroll", scheduleRatingClip, { capture:true, passive:true });
    window.addEventListener("resize", scheduleRatingClip, { passive:true });
    window.addEventListener("mfm:desktop-scale-applied", scheduleRatingClip);
  }

  // A modal dialog is painted in the browser's top layer. Keep the same
  // viewport overlays above it while it is open, then return them to the page.
  const syncOverlayHost = () => {
    const modals = document.querySelectorAll("dialog:modal");
    const focused = document.activeElement?.closest?.("dialog:modal");
    const host = focused || modals[modals.length - 1] || document.documentElement;
    if (scan.parentElement !== host) host.append(...overlays);
    if (ratingSymbol) scheduleRatingClip();
  };
  const dialogObserver = new MutationObserver(records => {
    if (records.some(record => record.type === "attributes" ||
      [...record.addedNodes, ...record.removedNodes].some(node =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches("dialog") || node.querySelector("dialog"))))) syncOverlayHost();
  });
  dialogObserver.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:["open"] });
  document.addEventListener("focusin", syncOverlayHost, true);
  syncOverlayHost();

  const makeNoiseFrame = seedStart => {
    const grain = document.createElement("canvas");
    grain.width = 64;
    grain.height = 64;
    const context = grain.getContext("2d", { alpha:true });
    const image = context.createImageData(grain.width, grain.height);
    let seed = seedStart >>> 0;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    for (let i = 0; i < image.data.length; i += 4) {
      const randomValue = random();
      if (randomValue < .30) {
        const bright = random() > .84;
        const value = bright ? 235 + Math.floor(random() * 20) : 8 + Math.floor(random() * 28);
        const alpha = bright ? 7 + Math.floor(random() * 10) : 6 + Math.floor(random() * 15);
        image.data[i] = value;
        image.data[i + 1] = value;
        image.data[i + 2] = value;
        image.data[i + 3] = alpha;
      }
    }

    context.putImageData(image, 0, 0);
    return `url(${grain.toDataURL("image/png")})`;
  };

  const noiseFrames = [
    makeNoiseFrame(0x4d464d61),
    makeNoiseFrame(0x4d464d62),
    makeNoiseFrame(0x4d464d63),
    makeNoiseFrame(0x4d464d64)
  ];

  let noiseFrame = 0;
  phosphor.style.backgroundImage = noiseFrames[noiseFrame];
  const advanceNoise = () => {
    noiseFrame = (noiseFrame + 1) % noiseFrames.length;
    phosphor.style.backgroundImage = noiseFrames[noiseFrame];
  };

  let noiseTimer = null;
  const startNoise = () => {
    if (noiseTimer != null) return;
    noiseTimer = window.setInterval(advanceNoise, 100);
  };
  const stopNoise = () => {
    if (noiseTimer == null) return;
    window.clearInterval(noiseTimer);
    noiseTimer = null;
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopNoise();
    else startNoise();
  });
  startNoise();

  window.__MFM_CRT_FILTER__ = "dynamic-beam-v8-teal-glass";
})();
