// src/app.js

// ---------- STATE ----------
const state = {
  step: "service", // "service" | "slot" | "confirm"
  selectedServiceId: null,
  selectedSlotId: null,
  selectedBookingId: null,

  lastConfirmPayload: null,
  lastConfirmOptions: null,

  confirmStatus: "idle", // "idle" | "submitting" | "success" | "error"

  api: {
    minDelayMs: 400,
    maxDelayMs: 2000,
    errorRate: 0.9,
},
};

// ---------- DOM ----------
const el = {
  // steps
  stepService: document.getElementById("step-service"),
  stepSlot: document.getElementById("step-slot"),
  stepConfirm: document.getElementById("step-confirm"),

  // step 1
  serviceButtons: Array.from(document.querySelectorAll("[data-service-id]")),
  toSlot: document.getElementById("to-slot"),

  // step 2
  slotButtons: Array.from(document.querySelectorAll("[data-slot-id]")),
  backToService: document.getElementById("back-to-service"),
  toConfirm: document.getElementById("to-confirm"),

  // step 3
  backToSlot: document.getElementById("back-to-slot"),
  summaryService: document.getElementById("summary-service"),
  summarySlot: document.getElementById("summary-slot"),
  confirmBtn: document.getElementById("confirm-btn"),
  statusText: document.getElementById("status-text"),

  confirmResult: document.getElementById("confirm-result"),
  bookingId: document.getElementById("booking-id"),
  idempotencyKey: document.getElementById("idempotency-key"),

  confirmError: document.getElementById("confirm-error"),
  retryBtn: document.getElementById("retry-btn"),

  newBookingBtn: document.getElementById("new-booking-btn"),

  // debug
  log: document.getElementById("log"),
  doubleClickTest: document.getElementById("double-click-test"),
};

// ---------- HELPERS ----------
function log(message) {
  const time = new Date().toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  el.log.textContent += `[${time}] ${message}\n`;
  el.log.scrollTop = el.log.scrollHeight;
}

function serviceLabel(serviceId) {
  const map = {
    cardiology: "Kardiológia",
    lab: "Labor",
    ultrasound: "Ultrahang",
  };
  return map[serviceId] ?? "–";
}

function slotLabel(slotId) {
  // A slot gombok szövegéből is kiolvashatnánk, de most legyen fix map
  const map = {
    "slot-1": "Jan 20 · 10:00",
    "slot-2": "Jan 20 · 10:30",
    "slot-3": "Jan 20 · 11:00",
    "slot-4": "Jan 20 · 11:30",
  };
  return map[slotId] ?? "–";
}

function setStep(nextStep) {
  state.step = nextStep;
  log(`STEP -> ${nextStep}`);
  render();
}

// ---------- RENDER ----------
function render() {
  // step visibility
  el.stepService.classList.toggle("hidden", state.step !== "service");
  el.stepSlot.classList.toggle("hidden", state.step !== "slot");
  el.stepConfirm.classList.toggle("hidden", state.step !== "confirm");

  // selected styles (step 1)
  for (const btn of el.serviceButtons) {
    const id = btn.dataset.serviceId;
    btn.classList.toggle("selected", id === state.selectedServiceId);
  }

  // selected styles (step 2)
  for (const btn of el.slotButtons) {
    const id = btn.dataset.slotId;
    btn.classList.toggle("selected", id === state.selectedSlotId);
  }

  // navigation enable/disable
  el.toSlot.disabled = !state.selectedServiceId;
  el.toConfirm.disabled = !state.selectedSlotId;

  // confirm summary
  el.summaryService.textContent = serviceLabel(state.selectedServiceId);
  el.summarySlot.textContent = slotLabel(state.selectedSlotId);

  // confirm UI (most még csak minimál státusz)
  el.confirmBtn.disabled = (state.confirmStatus === "submitting");
  el.statusText.textContent =
    state.confirmStatus === "idle" ? "Készen áll"
    : state.confirmStatus === "submitting" ? "Küldés…"
    : state.confirmStatus === "success" ? "Sikeres!"
    : "Hiba történt.";
  
  if (state.confirmStatus === "submitting") el.retryBtn.disabled = true;
  if (state.confirmStatus === "error") el.retryBtn.disabled = false;

  // ezekkel MOST még nem foglalkozunk, csak rejtsük el alapból
  // confirm result / error visibility
  el.confirmResult.classList.toggle(
    "hidden",
    state.confirmStatus !== "success"
  );

  el.confirmError.classList.toggle(
    "hidden",
    state.confirmStatus !== "error"
  );

  if (state.confirmStatus === "success") el.bookingId.textContent = state.selectedBookingId;
}

// ---------- EVENTS ----------
function onSelectService(serviceId) {
  state.selectedServiceId = serviceId;
  log(`SERVICE selected: ${serviceId}`);
  render();
}

function onSelectSlot(slotId) {
  state.selectedSlotId = slotId;
  log(`SLOT selected: ${slotId}`);
  render();
}


function onConfirmClick() {
    if (state.confirmStatus === "submitting") {
        log("CONFIRM ignored (already submitting)");
        return;
    }
    log("CONFIRM clicked");

    const payload = {
      serviceId: state.selectedServiceId,
      slotId: state.selectedSlotId,
    }
    state.lastConfirmPayload = payload;
    log("CONFIRM PAYLOAD: " + JSON.stringify(payload));

    const options = {
      minDelayMs: state.api.minDelayMs,
      maxDelayMs: state.api.maxDelayMs,
      errorRate: state.api.errorRate,
    }
    state.lastConfirmOptions = options;
    submitConfirm(payload, options);
}

function submitConfirm(payload, options) {
  state.confirmStatus = "submitting";
  render();
  fakeConfirmBooking(payload, options)
  .then((result) => {
    state.confirmStatus = "success";
    log("API success");
    state.selectedBookingId = result.bookingId;
    render();
  })
  .catch((error) => {
    state.confirmStatus = "error";
    log("API error: " + error.message);
    render();
  });
}

// “Double click test” gomb: direkt kétszer hívja.
function onDoubleClickTest() {
  log("DOUBLE CLICK TEST fired (2x confirm)");
  onConfirmClick();
  setTimeout(onConfirmClick, 10);
}

// Retry gomb most még ne csináljon semmit érdemit
function onRetryClick() {
  if (!state.lastConfirmPayload) {log("Retry ERROR: Nincs mentett payload!"); return; }
  if (state.confirmStatus === "submitting") return;
  submitConfirm(state.lastConfirmPayload, state.lastConfirmOptions);
}

function resetAll() {
  state.step = "service";
  state.selectedServiceId = null;
  state.selectedSlotId = null;
  state.selectedBookingId = null;
  state.confirmStatus = "idle";
  log("RESET");
  render();
}

function fakeConfirmBooking(payload, options) {
  return new Promise((resolve, reject) => {
    const { minDelayMs, maxDelayMs, errorRate } = options;

    const delay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;

    setTimeout(() => {
      const shouldFail = Math.random() < errorRate;
      if (shouldFail) {
        reject(new Error("Booking failed!"));
      } else {
        resolve({
          bookingId: "BKG-" + Math.floor(Math.random() * 10000),
          serviceId: payload.serviceId,
          slotId: payload.slotId,
        })
      }
    }, delay)
  })
}

// ---------- WIRE UP ----------
function init() {
  // step 1 buttons
  for (const btn of el.serviceButtons) {
    btn.addEventListener("click", () => onSelectService(btn.dataset.serviceId));
  }

  el.toSlot.addEventListener("click", () => setStep("slot"));

  // step 2 buttons
  for (const btn of el.slotButtons) {
    btn.addEventListener("click", () => onSelectSlot(btn.dataset.slotId));
  }

  el.backToService.addEventListener("click", () => setStep("service"));
  el.toConfirm.addEventListener("click", () => setStep("confirm"));

  // step 3
  el.backToSlot.addEventListener("click", () => setStep("slot"));
  el.confirmBtn.addEventListener("click", onConfirmClick);
  el.retryBtn.addEventListener("click", onRetryClick);

  // debug
  el.doubleClickTest.addEventListener("click", onDoubleClickTest);

  el.newBookingBtn.addEventListener("click", resetAll);

  log("INIT");
  render();
}

init();