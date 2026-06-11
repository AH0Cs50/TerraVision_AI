import mongoose from "../shared/db.js";
import { PlantModel } from "../model/plant.model.js";
import { PlantCareModel } from "../model/plant-care.model.js";

const PORT = process.env.PORT || 5500;
const BASE = `http://localhost:${PORT}/api/v1`;
const EMAIL = `lifecycle_${Date.now()}@x.com`;

const C = {
  reset: "\x1b[0m", g: "\x1b[32m", y: "\x1b[33m", b: "\x1b[34m",
  r: "\x1b[31m", c: "\x1b[36m", bold: "\x1b[1m", dim: "\x1b[2m",
};
const $ = (c, s) => C[c] + s + C.reset;
const bold = (s) => $("bold", s);
const green = (s) => $("g", s);
const yellow = (s) => $("y", s);
const red = (s) => $("r", s);
const cyan = (s) => $("c", s);
const dim = (s) => $("dim", s);

let token, userUUID = null, plantUUID = null;

async function api(method, path, body) {
  const url = path.startsWith("http") ? path : BASE + path;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

function pad(s, n) { return String(s).padEnd(n); }

function printTable(snapshots) {
  console.log();
  const h = ["STEP", "WATER", "NUTRIENTS", "HEALTH", "LIGHT", "TASKS"];
  const w = [20, 14, 14, 12, 12, 8];
  let sep = "╟" + w.map(w => "─".repeat(w + 2)).join("┼") + "╢";
  let top = "╔" + w.map(w => "═".repeat(w + 2)).join("╤") + "╗";
  let bot = "╚" + w.map(w => "═".repeat(w + 2)).join("╧") + "╝";
  console.log(top);
  console.log("║ " + h.map((h, i) => bold(pad(h, w[i]))).join(" │ ") + " ║");
  console.log(sep);
  snapshots.forEach(s => {
    let vals = [
      cyan(pad(s.label, w[0])),
      pad(s.water || "?", w[1]),
      pad(s.nutrients || "?", w[2]),
      pad(s.health || "?", w[3]),
      pad(s.light || "?", w[4]),
      pad(String(s.tasks ?? "?"), w[5]),
    ];
    console.log("║ " + vals.join(" │ ") + " ║");
  });
  console.log(bot);
  console.log();
}

function printTask(t, i) {
  const prioColor = t.priority === "high" ? red : t.priority === "medium" ? yellow : dim;
  const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "no-due";
  console.log(`  ${i}. ${bold(t.title)} [${t.type}] ${prioColor(t.priority)} due:${due}`);
  if (t.description) console.log(`     ${dim(t.description)}`);
}

async function main() {
  console.log(bold("\n═══ PLANT CARE — TASK LIFECYCLE & STATUS TRACE ═══"));
  console.log(dim(`Server: ${BASE} | Email: ${EMAIL}\n`));

  const snapshots = [];

  // ── AUTH ────────────────────────────────────────
  let r = await api("POST", "/auth/signup", {
    name: "LifecycleTest", email: EMAIL,
    password: "Test1234!", location: { city: "Cairo" },
  });
  if (!r.data?.user?.uuid) { console.error(red("SIGNUP FAILED"), JSON.stringify(r.data)); process.exit(1); }
  userUUID = r.data.user.uuid;
  token = r.data.tokens.accessToken;
  console.log(green("✓") + " Signed up  " + dim(userUUID));

  r = await api("POST", "/auth/login", { email: EMAIL, password: "Test1234!" });
  token = r.data.tokens.accessToken;
  console.log(green("✓") + " Logged in");

  // ── CREATE PLANT — extreme conditions ────────────
  r = await api("POST", "/plants", {
    name: "Stress Tomato",
    category: "crop",
    family: "fruiting_nightshade",
    plantedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    watering: { hoursSinceLastWatering: 168 },
    soil: { type: "sandy", moisture: 10 },
  });
  if (!r.data?.data?.uuid) { console.error(red("PLANT CREATE FAILED"), JSON.stringify(r.data)); process.exit(1); }
  plantUUID = r.data.data.uuid;
  console.log(green("✓") + " Plant created  " + dim(plantUUID));

  // ── PHASE 1: INITIAL ANALYSIS ───────────────────
  console.log(bold("\n── PHASE 1: INITIAL ANALYSIS ──"));
  r = await api("POST", `/plants/${plantUUID}/analyze`);
  const s1 = r.data.data.status;
  snapshots.push({ label: "INITIAL", water: s1.water, nutrients: s1.nutrients, health: s1.health, light: s1.light, tasks: 0 });
  console.log("  Status: water=" + cyan(s1.water) + " nutrients=" + cyan(s1.nutrients) +
    " health=" + cyan(s1.health) + " light=" + cyan(s1.light));

  // ── PHASE 2: WATER → GENERATE TASKS ─────────────
  console.log(bold("\n── PHASE 2: WATERING (triggers re-analysis + task generation) ──"));
  const sBefore = { ...snapshots[snapshots.length - 1] };
  r = await api("PATCH", `/plants/${plantUUID}/water`);
  const s2 = r.data.data.status;
  const tasks2 = r.data.data.activeTasks || [];
  snapshots.push({ label: "AFTER WATER", water: s2.water, nutrients: s2.nutrients, health: s2.health, light: s2.light, tasks: tasks2.length });
  console.log("  " + yellow("BEFORE") + "  water=" + sBefore.water + " nutrients=" + sBefore.nutrients +
    " health=" + sBefore.health + " light=" + sBefore.light);
  console.log("  " + green("AFTER") + "   water=" + s2.water + " nutrients=" + s2.nutrients +
    " health=" + s2.health + " light=" + s2.light);

  if (tasks2.length > 0) {
    console.log(green(`  ✓ ${tasks2.length} task(s) generated:`));
    tasks2.forEach((t, i) => printTask(t, i + 1));
  } else {
    console.log(yellow("  ~ No tasks generated (all statuses already optimal or LLM returned empty)"));
  }

  // ── PHASE 3: COMPLETE A GENERATED TASK ───────────
  console.log(bold("\n── PHASE 3: COMPLETE A GENERATED TASK ──"));
  const taskMap = {
    fertilizing: { endpoint: "fertilize", label: "FERTILIZE" },
    pruning: { endpoint: "prune", label: "PRUNE" },
    harvest: { endpoint: "harvest", label: "HARVEST" },
    watering: { endpoint: "water", label: "WATER" },
    disease_treatment: { endpoint: "treat-disease", label: "TREAT" },
    move_light: { endpoint: "light", label: "LIGHT" },
  };

  let taskToComplete = null;
  for (const t of tasks2) {
    if (taskMap[t.type]) { taskToComplete = t; break; }
  }

  if (taskToComplete) {
    const action = taskMap[taskToComplete.type];
    console.log(`  Completing: ${bold(taskToComplete.title)} (type=${taskToComplete.type})`);

    const body = action.endpoint === "light" ? { lightCondition: "partial_shade" } : undefined;
    r = await api("POST", `/plants/${plantUUID}/${action.endpoint}`, body);
    const s3 = r.data.data.status;
    const tasks3 = r.data.data.activeTasks || [];
    snapshots.push({
      label: `AFTER ${action.label}`,
      water: s3.water, nutrients: s3.nutrients,
      health: s3.health, light: s3.light, tasks: tasks3.length,
    });

    console.log("  Status: water=" + cyan(s3.water) + " nutrients=" + cyan(s3.nutrients) +
      " health=" + cyan(s3.health) + " light=" + cyan(s3.light));

    const stillThere = tasks3.some(t => t.taskId === taskToComplete.taskId);
    if (!stillThere) {
      console.log(green("  ✓ Task auto-archived (removed from activeTasks)"));
    } else {
      console.log(yellow("  ~ Task still in activeTasks"));
    }

    if (tasks3.length > 0) {
      console.log(`  ${tasks3.length} task(s) remaining:`);
      tasks3.forEach((t, i) => printTask(t, i + 1));
    } else {
      console.log(green("  ✓ All tasks completed, activeTasks empty"));
    }
  } else {
    console.log(yellow("  ~ No completable task found in generated tasks"));
  }

  // ── PHASE 4: DISEASE CYCLE ──────────────────────
  console.log(bold("\n── PHASE 4: DISEASE CYCLE ──"));
  await PlantModel.findOneAndUpdate({ uuid: plantUUID }, {
    $set: {
      hasDisease: true,
      "disease.name": "leaf_spot",
      "disease.confidence": 0.85,
      "disease.detectedAt": new Date(),
      "stress.diseaseType": "fungal",
      "stress.severity": "high",
    },
  });
  console.log(dim("  Plant disease fields set via Mongoose"));

  r = await api("POST", `/plants/${plantUUID}/analyze`);
  const s4 = r.data.data.status;
  snapshots.push({
    label: "DISEASED",
    water: s4.water, nutrients: s4.nutrients,
    health: s4.health, light: s4.light, tasks: "—",
  });
  console.log("  Health after disease: " + (s4.health !== "healthy" ? red(s4.health) : yellow(s4.health)));

  r = await api("POST", `/plants/${plantUUID}/treat-disease`);
  const s5 = r.data.data.status;
  const tasks5 = r.data.data.activeTasks || [];
  snapshots.push({
    label: "TREATED",
    water: s5.water, nutrients: s5.nutrients,
    health: s5.health, light: s5.light, tasks: tasks5.length,
  });
  console.log("  Health after treatment: " + green(s5.health));

  // ── PHASE 5: OVERDUE TIME LAPSE ─────────────────
  console.log(bold("\n── PHASE 5: OVERDUE TIME LAPSE ──"));

  r = await api("GET", `/plants/${plantUUID}/tasks`);
  const tasksPayload = r.data.data;
  const allTasks = (tasksPayload?.tasks || tasksPayload || []);
  const activeTasks = allTasks.filter(t => t.status !== "completed");

  if (activeTasks.length > 0) {
    const taskId = activeTasks[0].taskId;
    const pastDate = new Date(Date.now() - 86400000);
    await PlantCareModel.findOneAndUpdate(
      { plantUUID, "activeTasks.taskId": taskId },
      { $set: { "activeTasks.$.dueDate": pastDate } },
    );
    console.log(dim(`  Backdated task "${activeTasks[0].title}" dueDate → ${pastDate.toLocaleDateString()}`));

    r = await api("GET", `/plants/${plantUUID}/tasks/overdue`);
    const overdueList = r.data.data || [];
    if (overdueList.length > 0) {
      console.log(green(`  ✓ ${overdueList.length} overdue task(s):`));
      overdueList.forEach(t => {
        const d = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "?";
        console.log(`    · ${bold(t.title)} — due ${d} (${red("OVERDUE")})`);
      });
    } else {
      console.log(yellow("  ~ No overdue tasks detected"));
    }
  } else {
    console.log(yellow("  ~ No active tasks to backdate"));
  }

  // ── PRINT SUMMARY TABLE ──────────────────────────
  console.log(bold("\n══════════════════ STATUS TRANSITION SUMMARY ══════════════════"));
  printTable(snapshots);

  // ── CLEANUP ──────────────────────────────────────
  console.log(bold("── CLEANUP ──"));
  await api("DELETE", `/plants/${plantUUID}`);
  await api("DELETE", `/users/${userUUID}`);
  console.log(green("✓") + " Plant & user deleted\n");
}

main().catch(e => { console.error(red("\n✗ FATAL:"), e); process.exit(1); });
