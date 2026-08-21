import { createHash } from "node:crypto";

const port = Number(process.argv[2] ?? 9222);
const mode = process.argv[3] ?? "protected-storage";
const requestedValue = process.argv.slice(4).join(" ");
const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
if (!page) throw new Error(`No debuggable WebView page found on port ${port}`);

function evaluate(expression) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("CDP evaluation timed out"));
    }, 10_000);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression, returnByValue: true, awaitPromise: true },
      }));
    });
    socket.addEventListener("message", (message) => {
      const payload = JSON.parse(String(message.data));
      if (payload.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (payload.error || payload.result?.exceptionDetails) {
        reject(new Error(JSON.stringify(payload.error ?? payload.result.exceptionDetails)));
        return;
      }
      resolve(payload.result?.result?.value);
    });
    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("CDP WebSocket failed"));
    });
  });
}

if (mode === "protected-storage") {
  const values = await evaluate(`(() => ({
    profile: localStorage.getItem("sololeveler_player_data"),
    history: localStorage.getItem("sololeveler_history_data")
  }))()`);
  const result = Object.fromEntries(Object.entries(values).map(([key, value]) => {
    const text = typeof value === "string" ? value : "";
    return [key, {
      present: typeof value === "string",
      bytes: Buffer.byteLength(text),
      sha256: createHash("sha256").update(text).digest("hex"),
    }];
  }));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (mode === "summary") {
  const summary = await evaluate(`(() => ({
    title: document.title,
    url: location.href,
    text: (document.body?.innerText ?? "").slice(0, 4000),
    buttons: [...document.querySelectorAll("button")].map((button, index) => ({
      index,
      text: button.innerText,
      aria: button.getAttribute("aria-label"),
      pressed: button.getAttribute("aria-pressed"),
      disabled: button.disabled,
      className: button.className
    })).slice(0, 120)
  }))()`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else if (mode === "idle-save-summary") {
  const summary = await evaluate(`(() => {
    const raw = localStorage.getItem("solo-leveler:idle-rpg-v2:save");
    if (!raw) return { present: false };
    const save = JSON.parse(raw);
    return {
      present: true,
      updatedAt: save.updatedAt,
      phase: save.combat?.phase,
      phaseBeforePause: save.combat?.phaseBeforePause,
      location: save.combat?.location,
      lastActiveAt: save.offline?.lastActiveAt,
      powerCapturedAt: save.offline?.powerSnapshot?.capturedAt,
      pendingGrant: save.offline?.pendingGrant ? {
        id: save.offline.pendingGrant.id,
        fromMs: save.offline.pendingGrant.fromMs,
        toMs: save.offline.pendingGrant.toMs,
        durationSeconds: save.offline.pendingGrant.durationSeconds,
        gold: save.offline.pendingGrant.gold,
        experience: save.offline.pendingGrant.experience,
        materials: save.offline.pendingGrant.materials
      } : null,
      lastClaimedGrantId: save.offline?.lastClaimedGrantId ?? null
    };
  })()`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else if (mode === "click-aria") {
  if (!requestedValue) throw new Error("click-aria requires an exact aria-label");
  const outcome = await evaluate(`(() => {
    const requested = ${JSON.stringify(requestedValue)};
    const element = [...document.querySelectorAll("button")].find((button) => button.getAttribute("aria-label") === requested);
    if (!element) return { clicked: false, reason: "not-found" };
    if (element.disabled) return { clicked: false, reason: "disabled" };
    element.click();
    return { clicked: true, text: element.innerText };
  })()`);
  process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`);
} else if (mode === "click-text") {
  if (!requestedValue) throw new Error("click-text requires exact visible text");
  const outcome = await evaluate(`(() => {
    const requested = ${JSON.stringify(requestedValue)};
    const matches = [...document.querySelectorAll("button")].filter((button) => button.innerText.trim() === requested);
    const element = matches.find((button) => !button.disabled) ?? matches[0];
    if (!element) return { clicked: false, reason: "not-found" };
    if (element.disabled) return { clicked: false, reason: "disabled" };
    element.click();
    return { clicked: true, aria: element.getAttribute("aria-label") };
  })()`);
  process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`);
} else {
  throw new Error(`Unsupported mode: ${mode}`);
}
