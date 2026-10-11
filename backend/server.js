import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import { createClient } from "@supabase/supabase-js";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";



dotenv.config();



const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../frontend/dist");
const PORT = process.env.PORT || 5000;



if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {

  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env");

  process.exit(1);

}



const supabase = createClient(

  process.env.SUPABASE_URL,

  process.env.SUPABASE_SECRET_KEY

);



app.use(cors());

app.use(express.json());



if (!process.env.JWT_SECRET || !process.env.ADMIN_SETUP_KEY) {

  console.error("Missing JWT_SECRET or ADMIN_SETUP_KEY in backend/.env");

  process.exit(1);

}



const signToken = (account) =>

  jwt.sign(

    { sub: String(account.id), role: account.role, worker_id: account.worker_id || null },

    process.env.JWT_SECRET,

    { expiresIn: "12h" }

  );



function readBearer(req) {

  const header = req.headers.authorization || "";

  return header.startsWith("Bearer ") ? header.slice(7) : null;

}



async function requireAdminToken(req, res) {

  const token = readBearer(req);

  if (!token) {

    res.status(401).json({ success: false, message: "Please log in first." });

    return null;

  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {

      res.status(403).json({ success: false, message: "Admin permission required." });

      return null;

    }

    return decoded;

  } catch {

    res.status(401).json({ success: false, message: "Session expired. Please log in again." });

    return null;

  }

}



const attendanceStatuses = ["Present", "Absent", "Late", "Half-day"];

const transactionTypes = ["Advance", "Payment"];

const today = () => new Date().toISOString().slice(0, 10);



function sendError(res, error, message = "Database operation failed.") {

  console.error(message, error?.message || error);

  return res.status(500).json({

    success: false,

    message,

    ...(process.env.NODE_ENV === "development"

      ? { detail: error?.message || String(error) }

      : {})

  });

}



async function getTeamId(teamName) {

  const name = (teamName || "Unassigned").trim() || "Unassigned";



  const { data: existing, error: findError } = await supabase

    .from("teams")

    .select("id")

    .eq("name", name)

    .maybeSingle();



  if (findError) throw findError;

  if (existing) return existing.id;



  const { data, error } = await supabase

    .from("teams")

    .insert({ name })

    .select("id")

    .single();



  if (error) {

    const { data: retry, error: retryError } = await supabase

      .from("teams")

      .select("id")

      .eq("name", name)

      .maybeSingle();



    if (retryError) throw retryError;

    if (retry) return retry.id;

    throw error;

  }



  return data.id;

}



async function getWorkers() {

  const { data: rows, error } = await supabase

    .from("workers")

    .select("id, full_name, role, team_id, daily_wage, is_active")

    .eq("is_active", true)

    .order("id");



  if (error) throw error;



  const workerIds = rows.map((worker) => worker.id);

  const teamIds = [...new Set(rows.map((worker) => worker.team_id).filter(Boolean))];



  let teamsById = {};

  let statusesById = {};



  if (teamIds.length) {

    const { data: teamRows, error: teamError } = await supabase

      .from("teams")

      .select("id, name")

      .in("id", teamIds);



    if (teamError) throw teamError;

    teamsById = Object.fromEntries(teamRows.map((team) => [team.id, team.name]));

  }



  if (workerIds.length) {

    const { data: attendanceRows, error: attendanceError } = await supabase

      .from("attendance")

      .select("worker_id, status")

      .eq("work_date", today())

      .in("worker_id", workerIds);



    if (attendanceError) throw attendanceError;



    statusesById = Object.fromEntries(

      attendanceRows.map((entry) => [entry.worker_id, entry.status])

    );

  }



  return rows.map((worker) => ({

    id: worker.id,

    name: worker.full_name,

    role: worker.role,

    team: teamsById[worker.team_id] || "Unassigned",

    wage: Number(worker.daily_wage),

    status: statusesById[worker.id] || "Absent"

  }));

}



async function findWorker(id) {

  const { data, error } = await supabase

    .from("workers")

    .select("id, full_name, role, team_id, daily_wage, is_active")

    .eq("id", Number(id))

    .eq("is_active", true)

    .maybeSingle();



  if (error) throw error;

  if (!data) return null;



  const { data: team, error: teamError } = await supabase

    .from("teams")

    .select("name")

    .eq("id", data.team_id)

    .maybeSingle();



  if (teamError) throw teamError;



  const { data: attendance, error: attendanceError } = await supabase

    .from("attendance")

    .select("status")

    .eq("worker_id", data.id)

    .eq("work_date", today())

    .maybeSingle();



  if (attendanceError) throw attendanceError;



  return {

    id: data.id,

    name: data.full_name,

    role: data.role,

    team: team?.name || "Unassigned",

    wage: Number(data.daily_wage),

    status: attendance?.status || "Absent"

  };

}



// -------------------------------------------------------------

// Public & Authentication Endpoints

// -------------------------------------------------------------



// Health check

app.get("/api/health", async (req, res) => {

  try {

    const { error } = await supabase.from("teams").select("id").limit(1);

    if (error) throw error;



    res.json({

      ok: true,

      message: "KaamSathi backend and Supabase are connected."

    });

  } catch (error) {

    sendError(res, error, "Backend is running, but the database connection failed.");

  }

});



// Setup Initial Admin

app.post("/api/auth/setup-admin", async (req, res) => {

  try {

    if (req.headers["x-admin-setup-key"] !== process.env.ADMIN_SETUP_KEY) {

      return res.status(403).json({ success: false, message: "Invalid setup key." });

    }

    const { data: existing, error: countError } = await supabase

      .from("kaamsathi_accounts").select("id").limit(1);

    if (countError) throw countError;

    if (existing?.length) {

      return res.status(409).json({ success: false, message: "Admin setup has already been completed." });

    }

    const username = String(req.body.username || "").trim();

    const password = String(req.body.password || "");

    if (username.length < 3 || password.length < 8) {

      return res.status(400).json({ success: false, message: "Username must be at least 3 characters and password at least 8 characters." });

    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase.from("kaamsathi_accounts").insert({

      username, password_hash, role: "admin", preferred_language: "en", is_active: true

    }).select("id,username,role").single();

    if (error) throw error;

    return res.status(201).json({ success: true, message: "Admin account created. Log in now.", account: data });

  } catch (error) {

    return sendError(res, error, "Could not create the admin account.");

  }

});



// Login

app.post("/api/auth/login", async (req, res) => {

  try {

    const mode = String(req.body.mode || "admin");

    let query = supabase.from("kaamsathi_accounts").select("*").eq("is_active", true);

    if (mode === "admin") {

      const username = String(req.body.username || "").trim();

      query = query.eq("username", username).eq("role", "admin");

    } else if (mode === "worker" || mode === "gutha_leader") {

      const phone = String(req.body.phone || "").trim();

      query = query.eq("phone", phone).eq("role", mode);

    } else {

      return res.status(400).json({ success: false, message: "Invalid login type." });

    }

    const { data: account, error } = await query.maybeSingle();

    if (error) throw error;

    const supplied = mode === "admin" ? String(req.body.password || "") : String(req.body.pin || "");

    const storedHash = mode === "admin" ? account?.password_hash : account?.pin_hash;

    if (!account || !storedHash || !(await bcrypt.compare(supplied, storedHash))) {

      return res.status(401).json({ success: false, message: "Invalid login details." });

    }

    const supportedLanguages = ["en", "hi", "or", "bn", "bih"];

    const requestedLanguage = String(req.body.preferred_language || account.preferred_language || "en");

    const preferred_language = supportedLanguages.includes(requestedLanguage) ? requestedLanguage : "en";

    const { error: languageError } = await supabase.from("kaamsathi_accounts")

      .update({ preferred_language }).eq("id", account.id);

    if (languageError) throw languageError;

    account.preferred_language = preferred_language;

    const token = signToken(account);

    return res.json({

      success: true,

      token,

      profile: {

        id: account.id,

        username: account.username,

        phone: account.phone,

        role: account.role,

        worker_id: account.worker_id,

        preferred_language: account.preferred_language

      }

    });

  } catch (error) {

    return sendError(res, error, "Login failed.");

  }

});



// Current User Profile

app.get("/api/auth/me", async (req, res) => {

  const token = readBearer(req);

  if (!token) return res.status(401).json({ success: false, message: "Please log in first." });

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: account, error } = await supabase.from("kaamsathi_accounts")

      .select("id,username,phone,role,worker_id,preferred_language,is_active")

      .eq("id", Number(decoded.sub)).maybeSingle();

    if (error) throw error;

    if (!account || !account.is_active) return res.status(401).json({ success: false, message: "Account is inactive or missing." });

    return res.json({ profile: account });

  } catch (error) {

    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {

      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });

    }

    return sendError(res, error, "Could not verify session.");

  }

});



// Admin creates worker phone/PIN login

app.post("/api/auth/accounts", async (req, res) => {

  const admin = await requireAdminToken(req, res);

  if (!admin) return;

  try {

    const role = String(req.body.role || "worker");

    const phone = String(req.body.phone || "").trim();

    const pin = String(req.body.pin || "");

    const worker_id = Number(req.body.worker_id);

    if (!["worker", "gutha_leader"].includes(role) || !phone || !/^\d{4,8}$/.test(pin) || !Number.isInteger(worker_id)) {

      return res.status(400).json({ success: false, message: "Provide role, phone, existing worker_id, and a 4–8 digit PIN." });

    }

    const { data: worker, error: workerError } = await supabase.from("workers").select("id").eq("id", worker_id).maybeSingle();

    if (workerError) throw workerError;

    if (!worker) return res.status(404).json({ success: false, message: "Worker record not found." });

    const pin_hash = await bcrypt.hash(pin, 12);

    const { data, error } = await supabase.from("kaamsathi_accounts").insert({

      phone, pin_hash, role, worker_id, preferred_language: req.body.preferred_language || "en", is_active: true

    }).select("id,phone,role,worker_id,preferred_language").single();

    if (error) throw error;

    return res.status(201).json({ success: true, account: data });

  } catch (error) {

    return sendError(res, error, "Could not create the worker login.");

  }

});



// Link account to worker record

app.patch("/api/auth/accounts/:id/link-worker", async (req, res) => {

  const admin = await requireAdminToken(req, res);

  if (!admin) return;

  try {

    const accountId = Number(req.params.id);

    const workerId = Number(req.body.worker_id);

    if (!Number.isInteger(accountId) || accountId < 1 || !Number.isInteger(workerId) || workerId < 1) {

      return res.status(400).json({ success: false, message: "Valid account id and worker_id are required." });

    }

    const { data: account, error: accountError } = await supabase

      .from("kaamsathi_accounts").select("id,role,worker_id,is_active")

      .eq("id", accountId).maybeSingle();

    if (accountError) throw accountError;

    if (!account || !["worker", "gutha_leader"].includes(account.role)) {

      return res.status(404).json({ success: false, message: "Worker login account not found." });

    }

    const { data: worker, error: workerError } = await supabase

      .from("workers").select("id,full_name,is_active").eq("id", workerId).maybeSingle();

    if (workerError) throw workerError;

    if (!worker || worker.is_active === false) return res.status(404).json({ success: false, message: "Active worker record not found." });

    const { data: existing, error: existingError } = await supabase

      .from("kaamsathi_accounts").select("id").eq("worker_id", workerId).neq("id", accountId).maybeSingle();

    if (existingError) throw existingError;

    if (existing) return res.status(409).json({ success: false, message: "This worker record is already linked to another login account." });

    const { error: updateError } = await supabase.from("kaamsathi_accounts")

      .update({ worker_id: workerId }).eq("id", accountId);

    if (updateError) throw updateError;

    return res.json({ success: true, message: `Login account linked to ${worker.full_name}.` });

  } catch (error) {

    return sendError(res, error, "Could not link worker login.");

  }

});



// Admin-only accounts list

app.get("/api/auth/accounts", async (req, res) => {

  const admin = await requireAdminToken(req, res);

  if (!admin) return;

  try {

    const { data, error } = await supabase

      .from("kaamsathi_accounts")

      .select("id,username,phone,role,worker_id,preferred_language,is_active,created_at")

      .order("created_at", { ascending: false });

    if (error) throw error;

    const workerIds = [...new Set((data || []).map((a) => a.worker_id).filter(Boolean))];

    let namesById = {};

    if (workerIds.length) {

      const { data: workerRows, error: workerError } = await supabase

        .from("workers").select("id,full_name").in("id", workerIds);

      if (workerError) throw workerError;

      namesById = Object.fromEntries((workerRows || []).map((w) => [w.id, w.full_name]));

    }

    return res.json({ success: true, accounts: (data || []).map((a) => ({

      ...a, worker_name: namesById[a.worker_id] || null

    })) });

  } catch (error) {

    return sendError(res, error, "Could not retrieve user accounts.");

  }

});



// Admin resets PIN

app.patch("/api/auth/accounts/:id/reset-pin", async (req, res) => {

  const admin = await requireAdminToken(req, res);

  if (!admin) return;

  try {

    const accountId = Number(req.params.id);

    const pin = String(req.body.pin || "");

    if (!Number.isInteger(accountId) || accountId < 1 || !/^\d{4,8}$/.test(pin)) {

      return res.status(400).json({ success: false, message: "Enter a new PIN containing 4–8 digits." });

    }

    const { data: account, error: findError } = await supabase

      .from("kaamsathi_accounts").select("id,role,phone")

      .eq("id", accountId).in("role", ["worker", "gutha_leader"]).maybeSingle();

    if (findError) throw findError;

    if (!account) return res.status(404).json({ success: false, message: "Worker or Gutha Leader account not found." });

    const pin_hash = await bcrypt.hash(pin, 12);

    const { error: updateError } = await supabase

      .from("kaamsathi_accounts").update({ pin_hash }).eq("id", accountId);

    if (updateError) throw updateError;

    return res.json({ success: true, message: "PIN reset successfully. Share the new PIN privately with the user.", account: { id: account.id, role: account.role, phone: account.phone } });

  } catch (error) {

    return sendError(res, error, "Could not reset the PIN.");

  }

});



// Worker Self-Service Dashboard

app.get("/api/me/dashboard", async (req, res) => {

  const token = readBearer(req);

  if (!token) return res.status(401).json({ success: false, message: "Please log in first." });

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!["worker", "gutha_leader"].includes(decoded.role)) {

      return res.status(403).json({ success: false, message: "This endpoint is for worker accounts." });

    }

    const { data: account, error: accountError } = await supabase

      .from("kaamsathi_accounts")

      .select("id, phone, role, worker_id, preferred_language, is_active")

      .eq("id", Number(decoded.sub))

      .maybeSingle();

    if (accountError) throw accountError;

    if (!account || !account.is_active) return res.status(401).json({ success: false, message: "Account is inactive or missing." });

    if (!account.worker_id) return res.status(409).json({ success: false, message: "Your login is not linked to a worker record. Ask the admin to link your account to your worker profile." });



    const { data: worker, error: workerError } = await supabase

      .from("workers")

      .select("id, full_name, role, team_id, daily_wage, is_active")

      .eq("id", account.worker_id)

      .eq("is_active", true)

      .maybeSingle();

    if (workerError) throw workerError;

    if (!worker) return res.status(404).json({ success: false, message: "Your worker profile was not found. Ask the admin to check your account link." });



    const [teamResult, attendanceResult, transactionResult] = await Promise.all([

      worker.team_id

        ? supabase.from("teams").select("name").eq("id", worker.team_id).maybeSingle()

        : Promise.resolve({ data: null, error: null }),

      supabase.from("attendance")

        .select("id, work_date, status, wage_amount, notes")

        .eq("worker_id", worker.id)

        .order("work_date", { ascending: false }),

      supabase.from("transactions")

        .select("id, transaction_type, amount, transaction_date, payment_method, notes")

        .eq("worker_id", worker.id)

        .order("transaction_date", { ascending: false })

    ]);

    if (teamResult.error) throw teamResult.error;

    if (attendanceResult.error) throw attendanceResult.error;

    if (transactionResult.error) throw transactionResult.error;



    const attendance = attendanceResult.data || [];

    const transactions = transactionResult.data || [];

    const earned = attendance.reduce((sum, row) => {

      const wage = Number(row.wage_amount ?? worker.daily_wage) || 0;

      if (row.status === "Present" || row.status === "Late") return sum + wage;

      if (row.status === "Half-day") return sum + wage / 2;

      return sum;

    }, 0);

    const payments = transactions.filter(t => t.transaction_type === "Payment").reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const advances = transactions.filter(t => t.transaction_type === "Advance").reduce((sum, t) => sum + Number(t.amount || 0), 0);



    return res.json({

      success: true,

      profile: {

        id: worker.id,

        name: worker.full_name,

        phone: account.phone || null,

        role: worker.role,

        team: teamResult.data?.name || "Unassigned",

        dailyWage: Number(worker.daily_wage) || 0

      },

      summary: {

        earned: Math.round(earned * 100) / 100,

        payments: Math.round(payments * 100) / 100,

        advances: Math.round(advances * 100) / 100,

        pendingWages: Math.round((earned - payments) * 100) / 100,

        advanceBalance: Math.round(advances * 100) / 100,

        presentDays: attendance.filter(a => a.status === "Present" || a.status === "Late").length,

        halfDays: attendance.filter(a => a.status === "Half-day").length

      },

      attendance,

      transactions

    });

  } catch (error) {

    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {

      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });

    }

    return sendError(res, error, "Could not load your worker dashboard.");

  }

});



// -------------------------------------------------------------

// Admin Route Guard (Applies to all other /api routes below)

// -------------------------------------------------------------

app.use("/api", async (req, res, next) => {

  if (req.path === "/health") return next();

  const token = readBearer(req);

  if (!token) return res.status(401).json({ success: false, message: "Please log in first." });

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {

      return res.status(403).json({ success: false, message: "This screen is available to admins only." });

    }

    req.auth = decoded;

    return next();

  } catch {

    return res.status(401).json({ success: false, message: "Session expired. Please log in again." });

  }

});



// -------------------------------------------------------------

// Admin Business Logic Endpoints

// -------------------------------------------------------------



// Get all workers

app.get("/api/workers", async (req, res) => {

  try {

    res.json(await getWorkers());

  } catch (error) {

    sendError(res, error, "Could not retrieve workers.");

  }

});



// Get single worker

app.get("/api/workers/:id", async (req, res) => {

  try {

    const worker = await findWorker(req.params.id);

    if (!worker) {

      return res.status(404).json({ success: false, message: "Worker not found." });

    }

    res.json({ success: true, data: worker });

  } catch (error) {

    sendError(res, error, "Could not retrieve worker.");

  }

});



// Add a worker

app.post("/api/workers", async (req, res) => {

  try {

    const { name, role, team = "Unassigned", wage } = req.body;

    if (

      typeof name !== "string" ||

      !name.trim() ||

      typeof role !== "string" ||

      !role.trim() ||

      wage === undefined ||

      wage === null ||

      wage === "" ||

      !Number.isFinite(Number(wage)) ||

      Number(wage) < 0

    ) {

      return res.status(400).json({

        success: false,

        message: "Enter a valid name, role and non-negative wage."

      });

    }



    const teamId = await getTeamId(

      typeof team === "string" && team.trim() ? team.trim() : "Unassigned"

    );



    const { data: worker, error } = await supabase

      .from("workers")

      .insert({

        full_name: name.trim(),

        role: role.trim(),

        team_id: teamId,

        daily_wage: Number(wage)

      })

      .select("id, full_name, role, team_id, daily_wage")

      .single();



    if (error) throw error;



    const { error: attendanceError } = await supabase

      .from("attendance")

      .insert({

        worker_id: worker.id,

        work_date: today(),

        status: "Absent",

        wage_amount: Number(wage)

      });



    if (attendanceError) {

      await supabase.from("workers").delete().eq("id", worker.id);

      throw attendanceError;

    }



    const result = await findWorker(worker.id);

    res.status(201).json({

      success: true,

      message: "Worker added successfully.",

      data: result

    });

  } catch (error) {

    sendError(res, error, "Could not add worker.");

  }

});



// Update a worker

app.put("/api/workers/:id", async (req, res) => {

  try {

    const current = await findWorker(req.params.id);

    if (!current) {

      return res.status(404).json({ success: false, message: "Worker not found." });

    }



    const { name, role, team, wage, status } = req.body;

    const updates = {};



    if (name !== undefined) {

      if (typeof name !== "string" || !name.trim()) {

        return res.status(400).json({ success: false, message: "Invalid worker name." });

      }

      updates.full_name = name.trim();

    }



    if (role !== undefined) {

      if (typeof role !== "string" || !role.trim()) {

        return res.status(400).json({ success: false, message: "Invalid worker role." });

      }

      updates.role = role.trim();

    }



    if (wage !== undefined) {

      if (wage === "" || !Number.isFinite(Number(wage)) || Number(wage) < 0) {

        return res.status(400).json({ success: false, message: "Invalid wage." });

      }

      updates.daily_wage = Number(wage);

    }



    if (team !== undefined) {

      if (typeof team !== "string" || !team.trim()) {

        return res.status(400).json({ success: false, message: "Invalid team name." });

      }

      updates.team_id = await getTeamId(team.trim());

    }



    if (status !== undefined && !attendanceStatuses.includes(status)) {

      return res.status(400).json({ success: false, message: "Invalid attendance status." });

    }



    if (Object.keys(updates).length) {

      const { error } = await supabase

        .from("workers")

        .update(updates)

        .eq("id", Number(req.params.id));

      if (error) throw error;

    }



    if (status !== undefined) {

      const { error } = await supabase

        .from("attendance")

        .upsert(

          {

            worker_id: Number(req.params.id),

            work_date: today(),

            status,

            wage_amount: Number(updates.daily_wage ?? current.wage)

          },

          { onConflict: "worker_id,work_date" }

        );

      if (error) throw error;

    }



    res.json({

      success: true,

      message: "Worker updated successfully.",

      data: await findWorker(req.params.id)

    });

  } catch (error) {

    sendError(res, error, "Could not update worker.");

  }

});



// Delete a worker

app.delete("/api/workers/:id", async (req, res) => {

  try {

    const current = await findWorker(req.params.id);

    if (!current) {

      return res.status(404).json({ success: false, message: "Worker not found." });

    }



    const { error } = await supabase

      .from("workers")

      .delete()

      .eq("id", Number(req.params.id));



    if (error) throw error;

    res.json({ success: true, message: "Worker deleted successfully." });

  } catch (error) {

    sendError(res, error, "Could not delete worker.");

  }

});



// Get today's attendance

app.get("/api/attendance", async (req, res) => {

  try {

    const workers = await getWorkers();

    res.json({

      success: true,

      date: today(),

      data: workers.map((worker) => ({

        workerId: worker.id,

        workerName: worker.name,

        status: worker.status

      }))

    });

  } catch (error) {

    sendError(res, error, "Could not retrieve attendance.");

  }

});



// Update today's attendance for a worker

app.put("/api/attendance/:id", async (req, res) => {

  try {

    const worker = await findWorker(req.params.id);

    const { status } = req.body;



    if (!worker) {

      return res.status(404).json({ success: false, message: "Worker not found." });

    }



    if (!attendanceStatuses.includes(status)) {

      return res.status(400).json({

        success: false,

        message: `Status must be: ${attendanceStatuses.join(", ")}.`

      });

    }



    const { error } = await supabase

      .from("attendance")

      .upsert(

        {

          worker_id: worker.id,

          work_date: today(),

          status,

          wage_amount: worker.wage

        },

        { onConflict: "worker_id,work_date" }

      );



    if (error) throw error;



    res.json({

      success: true,

      data: { ...worker, status }

    });

  } catch (error) {

    sendError(res, error, "Could not update attendance.");

  }

});



// Get teams

app.get("/api/teams", async (req, res) => {

  try {

    const { data: teamRows, error } = await supabase

      .from("teams")

      .select("id, name")

      .order("name");



    if (error) throw error;



    const { data: workerRows, error: workerError } = await supabase

      .from("workers")

      .select("team_id")

      .eq("is_active", true);



    if (workerError) throw workerError;



    res.json({

      success: true,

      data: teamRows.map((team) => ({

        name: team.name,

        workerCount: workerRows.filter((worker) => worker.team_id === team.id).length

      }))

    });

  } catch (error) {

    sendError(res, error, "Could not retrieve teams.");

  }

});



// Create a team

app.post("/api/teams", async (req, res) => {

  try {

    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {

      return res.status(400).json({ success: false, message: "Team name is required." });

    }



    const normalizedName = name.trim();

    const { data: existing, error: findError } = await supabase

      .from("teams")

      .select("id")

      .ilike("name", normalizedName)

      .maybeSingle();



    if (findError) throw findError;

    if (existing) {

      return res.status(409).json({ success: false, message: "Team already exists." });

    }



    const { data: team, error } = await supabase

      .from("teams")

      .insert({ name: normalizedName })

      .select("id, name")

      .single();



    if (error) throw error;



    res.status(201).json({

      success: true,

      data: { name: team.name, workerCount: 0 }

    });

  } catch (error) {

    sendError(res, error, "Could not create team.");

  }

});



// Get all transactions

app.get("/api/transactions", async (req, res) => {

  try {

    const { data: rows, error } = await supabase

      .from("transactions")

      .select("id, worker_id, transaction_type, amount, transaction_date, workers(full_name)")

      .order("transaction_date", { ascending: false });



    if (error) throw error;



    const data = rows.map((item) => ({

      id: item.id,

      workerId: item.worker_id,

      worker: item.workers?.full_name || "Unknown worker",

      kind: item.transaction_type,

      amount: Number(item.amount),

      date: new Date(item.transaction_date).toLocaleDateString("en-IN")

    }));



    res.json({ success: true, count: data.length, data });

  } catch (error) {

    sendError(res, error, "Could not retrieve transactions.");

  }

});



// Record an advance or payment (includes fixed date destructuring)

app.post("/api/transactions", async (req, res) => {

  try {

    const { workerId, kind, amount, date } = req.body;

    const worker = await findWorker(workerId);



    if (!worker) {

      return res.status(404).json({ success: false, message: "Worker not found." });

    }



    if (!transactionTypes.includes(kind)) {

      return res.status(400).json({

        success: false,

        message: "Type must be Advance or Payment."

      });

    }



    if (

      amount === undefined ||

      amount === null ||

      amount === "" ||

      !Number.isFinite(Number(amount)) ||

      Number(amount) <= 0

    ) {

      return res.status(400).json({

        success: false,

        message: "Amount must be greater than zero."

      });

    }



    const transactionDate = date || today();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) || Number.isNaN(Date.parse(`${transactionDate}T00:00:00Z`))) {

      return res.status(400).json({ success: false, message: "Please provide a valid transaction date." });

    }



    const { data: saved, error } = await supabase

      .from("transactions")

      .insert({

        worker_id: worker.id,

        transaction_type: kind,

        amount: Number(amount),

        transaction_date: `${transactionDate}T12:00:00+05:30`

      })

      .select("id, worker_id, transaction_type, amount, transaction_date")

      .single();



    if (error) throw error;



    const transaction = {

      id: saved.id,

      workerId: saved.worker_id,

      worker: worker.name,

      kind: saved.transaction_type,

      amount: Number(saved.amount),

      date: new Date(saved.transaction_date).toLocaleDateString("en-IN")

    };



    res.status(201).json({

      success: true,

      message: "Transaction recorded successfully.",

      data: transaction

    });

  } catch (error) {

    sendError(res, error, "Could not record transaction.");

  }

});



// Downloadable worker attendance and wage report

app.get("/api/reports/worker", async (req, res) => {

  try {

    const workerId = Number(req.query.workerId);

    const from = String(req.query.from || "");

    const to = String(req.query.to || "");

    const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));



    if (!Number.isInteger(workerId) || workerId <= 0) {

      return res.status(400).json({ success: false, message: "Select a valid worker." });

    }

    if (!validDate(from) || !validDate(to) || from > to) {

      return res.status(400).json({ success: false, message: "Provide a valid date range." });

    }



    const { data: worker, error: workerError } = await supabase

      .from("workers")

      .select("id, full_name, role, daily_wage")

      .eq("id", workerId)

      .eq("is_active", true)

      .maybeSingle();



    if (workerError) throw workerError;

    if (!worker) return res.status(404).json({ success: false, message: "Worker not found." });



    const endExclusive = new Date(`${to}T00:00:00Z`);

    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    const endExclusiveDate = endExclusive.toISOString().slice(0, 10);



    const [attendanceResult, transactionResult] = await Promise.all([

      supabase.from("attendance")

        .select("work_date, status, wage_amount, notes")

        .eq("worker_id", workerId)

        .gte("work_date", from)

        .lte("work_date", to)

        .order("work_date", { ascending: true }),

      supabase.from("transactions")

        .select("transaction_date, transaction_type, amount, notes, payment_method")

        .eq("worker_id", workerId)

        .gte("transaction_date", `${from}T00:00:00+05:30`)

        .lt("transaction_date", `${endExclusiveDate}T00:00:00+05:30`)

        .order("transaction_date", { ascending: true })

    ]);



    if (attendanceResult.error) throw attendanceResult.error;

    if (transactionResult.error) throw transactionResult.error;



    const byDate = new Map();

    const ensureDay = (date) => {

      if (!byDate.has(date)) byDate.set(date, { date, status: "", earned: 0, transactions: [] });

      return byDate.get(date);

    };



    let earnedTotal = 0;

    for (const row of attendanceResult.data || []) {

      const day = ensureDay(row.work_date);

      day.status = row.status;

      const wage = Number(row.wage_amount ?? worker.daily_wage) || 0;

      day.earned = row.status === "Present" || row.status === "Late" ? wage : row.status === "Half-day" ? wage / 2 : 0;

      earnedTotal += day.earned;

    }



    let paymentTotal = 0;

    let advanceTotal = 0;

    for (const row of transactionResult.data || []) {

      const date = String(row.transaction_date).slice(0, 10);

      const day = ensureDay(date);

      const amount = Number(row.amount) || 0;

      day.transactions.push({

        type: row.transaction_type,

        amount,

        notes: row.notes || "",

        paymentMethod: row.payment_method || ""

      });

      if (row.transaction_type === "Payment") paymentTotal += amount;

      if (row.transaction_type === "Advance") advanceTotal += amount;

    }



    const data = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    res.json({

      success: true,

      worker: { id: worker.id, name: worker.full_name, role: worker.role },

      from,

      to,

      data,

      summary: {

        earned: Math.round(earnedTotal * 100) / 100,

        payments: Math.round(paymentTotal * 100) / 100,

        advances: Math.round(advanceTotal * 100) / 100,

        balance: Math.round((earnedTotal - paymentTotal - advanceTotal) * 100) / 100

      }

    });

  } catch (error) {

    sendError(res, error, "Could not generate worker report.");

  }

});



// Wage balances calculated from saved attendance and transactions

app.get("/api/wages", async (req, res) => {

  try {

    const { data: workers, error: workersError } = await supabase

      .from("workers")

      .select("id, full_name, daily_wage")

      .eq("is_active", true)

      .order("id");

    if (workersError) throw workersError;



    const { data: attendanceRows, error: attendanceError } = await supabase

      .from("attendance")

      .select("worker_id, status, wage_amount, work_date");

    if (attendanceError) throw attendanceError;



    const { data: transactionRows, error: transactionsError } = await supabase

      .from("transactions")

      .select("worker_id, transaction_type, amount");

    if (transactionsError) throw transactionsError;



    const balances = workers.map((worker) => {

      const attendance = attendanceRows.filter((row) => row.worker_id === worker.id);

      const earned = attendance.reduce((sum, row) => {

        const wage = Number(row.wage_amount ?? worker.daily_wage) || 0;

        if (row.status === "Present" || row.status === "Late") return sum + wage;

        if (row.status === "Half-day") return sum + wage / 2;

        return sum;

      }, 0);

      const workerTransactions = transactionRows.filter((row) => row.worker_id === worker.id);

      const paid = workerTransactions

        .filter((row) => row.transaction_type === "Payment")

        .reduce((sum, row) => sum + Number(row.amount || 0), 0);

      const advances = workerTransactions

        .filter((row) => row.transaction_type === "Advance")

        .reduce((sum, row) => sum + Number(row.amount || 0), 0);

      return {

        workerId: worker.id,

        worker: worker.full_name,

        dailyWage: Number(worker.daily_wage) || 0,

        daysPresent: attendance.filter((row) => row.status === "Present" || row.status === "Late").length,

        halfDays: attendance.filter((row) => row.status === "Half-day").length,

        earned: Math.round(earned * 100) / 100,

        payments: Math.round(paid * 100) / 100,

        advances: Math.round(advances * 100) / 100,

        balance: Math.round((earned - paid - advances) * 100) / 100

      };

    });

    res.json({ success: true, data: balances });

  } catch (error) {

    sendError(res, error, "Could not calculate wage balances.");

  }

});



app.use(express.static(frontendDist));

// 404 Route Handler for undefined API endpoints

app.use("/api", (req, res) => {

  res.status(404).json({

    success: false,

    message: "API endpoint not found."

  });

});



// Send the React app for browser routes, but leave API requests as JSON.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next(err);
  });
});

// Global Error Handler

app.use((err, req, res, next) => {

  if (err instanceof SyntaxError && "body" in err) {

    return res.status(400).json({

      success: false,

      message: "Invalid JSON request body."

    });

  }

  console.error(err);

  res.status(500).json({

    success: false,

    message: "An unexpected server error occurred."

  });

});



app.listen(PORT, () => {

  console.log(`KaamSathi backend running at http://localhost:${PORT}`);

  console.log(`Health check: http://localhost:${PORT}/api/health`);

});