const CSS = `
@keyframes emojiBurstFloat {
  0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
  70%  { opacity: 1; }
  100% { transform: translateY(-200px) scale(0.4) rotate(var(--rot)); opacity: 0; }
}
`;

const tag = document.createElement("style");
tag.textContent = CSS;
document.head.appendChild(tag);

export function triggerEmojiBurst(containerEl, emote, count = 1) {
  const stage = document.createElement("div");
  stage.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 10;
  `;
  containerEl.appendChild(stage);

  const particles = count;
  let done = 0;

  for (let i = 0; i < particles; i++) {
    const el = document.createElement("span");
    el.textContent = emote;

    const spreadX = (Math.random() - 0.5) * 160;
    const startX = 40 + Math.random() * 20;
    const startY = 8 + Math.random() * 16;
    const rot = (Math.random() - 0.5) * 50;
    const delay = Math.random() * 300;
    const duration = 1400 + Math.random() * 400;

    el.style.cssText = `
      position: absolute;
      font-size: ${20 + Math.random() * 14}px;
      left: calc(${startX}% + ${spreadX}px);
      bottom: ${startY}%;
      pointer-events: none;
      user-select: none;
      animation: emojiBurstFloat ${duration}ms ease-out ${delay}ms forwards;
      --rot: ${rot}deg;
    `;

    stage.appendChild(el);
    el.addEventListener("animationend", () => {
      el.remove();
      done++;
      if (done === particles) stage.remove();
    }, { once: true });
  }
}