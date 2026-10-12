import { useEffect, useState } from "react";
import "./App.css";
import api from "./api/api";

const kaamsathiTextRecords = new WeakMap();

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "bih", label: "भोजपुरी / बिहारी (Bihari)" },
];

const UI_TRANSLATIONS = {
  hi: {
    "Loading KaamSathi…": "KaamSathi लोड हो रहा है…",
    "KAAMSATHI": "कामसाथी",
    "Kaam bhi, hisaab bhi": "काम भी, हिसाब भी",
    "Log in to view your work account.": "अपना काम का खाता देखने के लिए लॉग इन करें।",
    "Choose language": "भाषा चुनें",
    "Login as": "इस रूप में लॉग इन करें",
    "Admin": "एडमिन",
    "Worker": "मज़दूर",
    "Gutha Leader": "गुथा लीडर",
    "Username": "यूज़रनेम",
    "Password": "पासवर्ड",
    "Phone number": "फोन नंबर",
    "PIN": "PIN",
    "Log in": "लॉग इन करें",
    "Logging in…": "लॉग इन हो रहा है…",
    "Log out": "लॉग आउट",
    "Dashboard": "डैशबोर्ड",
    "Workers": "मज़दूर",
    "Attendance": "उपस्थिति",
    "Teams": "टीम",
    "Payments": "भुगतान",
    "Reports": "रिपोर्ट",
    "Namaste": "नमस्ते",
    "Phone": "फोन",
    "Work role": "काम की भूमिका",
    "Team": "टीम",
    "Daily wage": "दैनिक मज़दूरी",
    "Total earned": "कुल कमाई",
    "Payments received": "मिला हुआ भुगतान",
    "Pending wages": "बाकी मज़दूरी",
    "Advances taken": "लिए गए एडवांस",
    "Present / late days": "हाज़िरी / देर से आए दिन",
    "Half days": "आधे दिन",
    "My attendance": "मेरी उपस्थिति",
    "Date": "तारीख",
    "Status": "स्थिति",
    "Earned": "कमाई",
    "Notes": "नोट्स",
    "No attendance records yet.": "अभी तक उपस्थिति रिकॉर्ड नहीं हैं।",
    "My payments & advances": "मेरे भुगतान और एडवांस",
    "Type": "प्रकार",
    "Amount": "राशि",
    "Method": "तरीका",
    "No payment or advance records yet.": "अभी तक भुगतान या एडवांस रिकॉर्ड नहीं हैं।",
    "KAAMSATHI WORKER PORTAL": "कामसाथी मज़दूर पोर्टल",
    "YOUR WORKSPACE": "आपका कार्यक्षेत्र",
    "Good day, Admin ✦": "नमस्ते, एडमिन ✦",
    "Total workers": "कुल मज़दूर",
    "Present today": "आज उपस्थित",
    "Absent today": "आज अनुपस्थित",
    "Estimated wages": "अनुमानित मज़दूरी",
    "Today's payout": "आज का भुगतान"
  },
  or: {
    "Loading KaamSathi…": "KaamSathi ଲୋଡ୍ ହେଉଛି…",
    "KAAMSATHI": "କାମସାଥୀ",
    "Kaam bhi, hisaab bhi": "କାମ ବି, ହିସାବ ବି",
    "Log in to view your work account.": "ଆପଣଙ୍କ କାମ ଖାତା ଦେଖିବାକୁ ଲଗ୍ ଇନ୍ କରନ୍ତୁ।",
    "Choose language": "ଭାଷା ବାଛନ୍ତୁ",
    "Login as": "ଏହି ଭାବେ ଲଗ୍ ଇନ୍ କରନ୍ତୁ",
    "Admin": "ଆଡମିନ୍",
    "Worker": "ଶ୍ରମିକ",
    "Gutha Leader": "ଗୁଠା ଲିଡର୍",
    "Username": "ୟୁଜରନେମ୍",
    "Password": "ପାସୱାର୍ଡ",
    "Phone number": "ଫୋନ୍ ନମ୍ବର",
    "PIN": "PIN",
    "Log in": "ଲଗ୍ ଇନ୍ କରନ୍ତୁ",
    "Log out": "ଲଗ୍ ଆଉଟ୍",
    "Dashboard": "ଡ୍ୟାସବୋର୍ଡ",
    "Workers": "ଶ୍ରମିକ",
    "Attendance": "ଉପସ୍ଥିତି",
    "Teams": "ଦଳ",
    "Payments": "ପେମେଣ୍ଟ",
    "Reports": "ରିପୋର୍ଟ",
    "Namaste": "ନମସ୍କାର",
    "Total earned": "ମୋଟ ରୋଜଗାର",
    "Payments received": "ମିଳିଥିବା ପେମେଣ୍ଟ",
    "Pending wages": "ବାକି ମଜୁରି",
    "Advances taken": "ନିଆଯାଇଥିବା ଅଗ୍ରିମ"
  },
  bn: {
    "Loading KaamSathi…": "KaamSathi লোড হচ্ছে…",
    "KAAMSATHI": "কামসাথী",
    "Kaam bhi, hisaab bhi": "কাজও, হিসাবও",
    "Log in to view your work account.": "আপনার কাজের অ্যাকাউন্ট দেখতে লগ ইন করুন।",
    "Choose language": "ভাষা বেছে নিন",
    "Login as": "যে হিসেবে লগ ইন করবেন",
    "Admin": "অ্যাডমিন",
    "Worker": "শ্রমিক",
    "Gutha Leader": "গুঠা লিডার",
    "Log in": "লগ ইন করুন",
    "Log out": "লগ আউট",
    "Dashboard": "ড্যাশবোর্ড",
    "Workers": "শ্রমিক",
    "Attendance": "উপস্থিতি",
    "Teams": "দল",
    "Payments": "পেমেন্ট",
    "Reports": "রিপোর্ট",
    "Namaste": "নমস্কার",
    "Total earned": "মোট আয়",
    "Payments received": "পাওয়া পেমেন্ট",
    "Pending wages": "বাকি মজুরি",
    "Advances taken": "নেওয়া অগ্রিম"
  },
  bih: {
    "Loading KaamSathi…": "KaamSathi लोड होत बा…",
    "KAAMSATHI": "कामसाथी",
    "Kaam bhi, hisaab bhi": "काम भी, हिसाब भी",
    "Log in to view your work account.": "अपना काम के खाता देखे खातिर लॉग इन करीं।",
    "Choose language": "भाषा चुनीं",
    "Login as": "एह रूप में लॉग इन करीं",
    "Admin": "एडमिन",
    "Worker": "मजदूर",
    "Gutha Leader": "गुठा लीडर",
    "Log in": "लॉग इन करीं",
    "Log out": "लॉग आउट",
    "Dashboard": "डैशबोर्ड",
    "Workers": "मजदूर",
    "Attendance": "हाजिरी",
    "Teams": "टीम",
    "Payments": "भुगतान",
    "Reports": "रिपोर्ट",
    "Namaste": "प्रणाम",
    "Total earned": "कुल कमाई",
    "Payments received": "मिलल भुगतान",
    "Pending wages": "बाकी मजदूरी",
    "Advances taken": "लिहल एडवांस"
  }
};

const menu = [
  { name: "Dashboard", icon: "▦" },
  { name: "Workers", icon: "♙" },
  { name: "Attendance", icon: "✓" },
  { name: "Teams", icon: "♧" },
  { name: "Payments", icon: "₹" },
  { name: "Reports", icon: "▤" },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function GlobalBackdrop() {
  return (
    <div className="global-scene-backdrop" aria-hidden="true">
      {/* FAR-LEFT: Construction Crane */}
      <svg
        className="backdrop-crane"
        viewBox="0 0 320 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="25" y="500" width="110" height="24" rx="4" fill="#334155" />
        <rect x="15" y="524" width="130" height="8" rx="2" fill="#1e293b" />
        <circle cx="45" cy="512" r="6" fill="#64748b" />
        <circle cx="75" cy="512" r="6" fill="#64748b" />
        <circle cx="105" cy="512" r="6" fill="#64748b" />
        <rect x="35" y="475" width="45" height="25" fill="#e28743" />
        <rect x="40" y="455" width="35" height="20" fill="#c97132" />
        <rect x="68" y="110" width="24" height="390" fill="#f59e0b" />
        <path
          d="M68 110 L92 150 M92 110 L68 150
             M68 150 L92 190 M92 150 L68 190
             M68 190 L92 230 M92 190 L68 230
             M68 230 L92 270 M92 230 L68 270
             M68 270 L92 310 M92 270 L68 310
             M68 310 L92 350 M92 310 L68 350
             M68 350 L92 390 M92 350 L68 390
             M68 390 L92 430 M92 390 L68 430
             M68 430 L92 470 M92 430 L68 470
             M68 470 L92 500 M92 470 L68 500"
          stroke="#d97706"
          strokeWidth="3"
        />
        <rect x="74" y="125" width="32" height="34" rx="4" fill="#1e293b" />
        <polygon points="76,130 98,130 92,150 76,150" fill="#67e8f9" opacity="0.8" />
        <rect x="10" y="95" width="305" height="15" fill="#f59e0b" />
        <path
          d="M10 95 L315 95 M10 110 L315 110
             M10 95 L30 110 M30 95 L50 110 M50 95 L70 110
             M100 95 L120 110 M120 95 L140 110 M140 95 L160 110
             M160 95 L180 110 M180 95 L200 110 M200 95 L220 110
             M220 95 L240 110 M240 95 L260 110 M260 95 L280 110
             M280 95 L300 110"
          stroke="#d97706"
          strokeWidth="2"
        />
        <rect x="12" y="85" width="40" height="25" rx="3" fill="#475569" />
        <polygon points="75,95 80,35 85,95" fill="#d97706" />
        <line x1="80" y1="35" x2="25" y2="95" stroke="#64748b" strokeWidth="2.5" />
        <line x1="80" y1="35" x2="225" y2="95" stroke="#64748b" strokeWidth="2.5" />
        <rect x="195" y="110" width="16" height="8" rx="1" fill="#334155" />
        <line x1="203" y1="118" x2="203" y2="215" stroke="#475569" strokeWidth="2" />
        <circle cx="203" cy="222" r="6" fill="#f59e0b" />
        <path
          d="M203 228 C203 240 190 238 190 230"
          stroke="#334155"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* FAR-RIGHT: Construction Building */}
      <svg
        className="backdrop-building"
        viewBox="0 0 280 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="30" y="440" width="220" height="90" fill="#334155" />
        <rect x="50" y="470" width="40" height="60" fill="#0f172a" />
        <rect x="110" y="470" width="45" height="60" fill="#0f172a" />
        <rect x="180" y="470" width="45" height="60" fill="#0f172a" />
        <rect x="35" y="340" width="210" height="100" fill="#475569" />
        <rect x="35" y="240" width="210" height="100" fill="#64748b" />
        <rect x="35" y="150" width="210" height="90" fill="#94a3b8" />
        <rect x="55" y="360" width="35" height="48" fill="#1e293b" />
        <rect x="115" y="360" width="45" height="48" fill="#1e293b" />
        <rect x="185" y="360" width="40" height="48" fill="#1e293b" />
        <rect x="55" y="260" width="35" height="48" fill="#334155" />
        <rect x="115" y="260" width="45" height="48" fill="#334155" />
        <rect x="185" y="260" width="40" height="48" fill="#334155" />
        <rect x="55" y="165" width="35" height="45" fill="#cbd5e1" />
        <rect x="115" y="165" width="45" height="45" fill="#cbd5e1" />
        <rect x="185" y="165" width="40" height="45" fill="#cbd5e1" />
        <rect x="30" y="145" width="220" height="7" fill="#f59e0b" />
        <rect x="30" y="235" width="220" height="7" fill="#f59e0b" />
        <rect x="30" y="335" width="220" height="7" fill="#f59e0b" />
        <rect x="30" y="435" width="220" height="7" fill="#f59e0b" />
        <line x1="50" y1="145" x2="50" y2="85" stroke="#334155" strokeWidth="3" />
        <line x1="60" y1="145" x2="60" y2="85" stroke="#334155" strokeWidth="3" />
        <line x1="120" y1="145" x2="120" y2="70" stroke="#334155" strokeWidth="3" />
        <line x1="130" y1="145" x2="130" y2="70" stroke="#334155" strokeWidth="3" />
        <line x1="190" y1="145" x2="190" y2="85" stroke="#334155" strokeWidth="3" />
        <line x1="200" y1="145" x2="200" y2="85" stroke="#334155" strokeWidth="3" />
        <rect x="42" y="105" width="195" height="4" fill="#f59e0b" />
        <line x1="75" y1="145" x2="75" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
        <line x1="155" y1="145" x2="155" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
        <line x1="215" y1="145" x2="215" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem("kaamsathi_language") || "en");

  // Dynamic TreeWalker UI translation
  useEffect(() => {
    const dictionary = UI_TRANSLATIONS[selectedLanguage] || {};
    const translateTree = (root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue || !node.nodeValue.trim() || node.parentElement?.closest("script,style,svg,option[data-language-option='true']")) continue;
        let record = kaamsathiTextRecords.get(node);
        if (!record) record = { original: node.nodeValue, translated: null };
        else if (record.translated !== null && node.nodeValue !== record.translated) record.original = node.nodeValue;
        const key = record.original.trim();
        const replacement = dictionary[key];
        const next = replacement ? record.original.replace(key, replacement) : record.original;
        record.translated = next;
        kaamsathiTextRecords.set(node, record);
        if (node.nodeValue !== next) node.nodeValue = next;
      }
      root.querySelectorAll?.("input[placeholder],textarea[placeholder],button[title]").forEach((el) => {
        const attr = el.hasAttribute("placeholder") ? "placeholder" : "title";
        const original = el.getAttribute(`data-kaamsathi-${attr}`) || el.getAttribute(attr);
        if (!el.hasAttribute(`data-kaamsathi-${attr}`)) el.setAttribute(`data-kaamsathi-${attr}`, original);
        el.setAttribute(attr, dictionary[original] || original);
      });
    };
    translateTree(document.body);
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) translateTree(node.parentElement || document.body);
            else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
          });
        } else if (mutation.type === "characterData") {
          translateTree(mutation.target.parentElement || document.body);
        }
      })
    );
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [selectedLanguage]);

  // Auth State
  const [authProfile, setAuthProfile] = useState(null);
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem("kaamsathi_token"));
  const [loginMode, setLoginMode] = useState("admin");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // Worker Portal Data
  const [myDashboard, setMyDashboard] = useState(null);
  const [myDashboardError, setMyDashboardError] = useState("");
  const [myDashboardLoading, setMyDashboardLoading] = useState(false);

  // Admin Portal State
  const [active, setActive] = useState("Dashboard");
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [workerRole, setWorkerRole] = useState("Helper");
  const [workerWage, setWorkerWage] = useState("600");
  const [records, setRecords] = useState([]);
  const [wageBalances, setWageBalances] = useState([]);
  const [wagesLoading, setWagesLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionWorkerId, setTransactionWorkerId] = useState("");
  const [transactionKind, setTransactionKind] = useState("Payment");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportWorkerId, setReportWorkerId] = useState("");
  const [reportFromDate, setReportFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportToDate, setReportToDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportLoading, setReportLoading] = useState(false);

  // Check saved session on startup
  useEffect(() => {
    const token = localStorage.getItem("kaamsathi_token");
    if (!token) return;
    api.get("/auth/me")
      .then((response) => {
        const profile = response.data?.profile || null;
        if (profile?.preferred_language) {
          localStorage.setItem("kaamsathi_language", profile.preferred_language);
          setSelectedLanguage(profile.preferred_language);
        }
        setAuthProfile(profile);
      })
      .catch(() => {
        localStorage.removeItem("kaamsathi_token");
        setAuthProfile(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  async function submitLogin(event) {
    event.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    setMyDashboardLoading(loginMode !== "admin");
    setMyDashboardError("");
    try {
      const payload =
        loginMode === "admin"
          ? { mode: "admin", username: loginUsername.trim(), password: loginPassword, preferred_language: selectedLanguage }
          : { mode: loginMode, phone: loginPhone.trim(), pin: loginPin, preferred_language: selectedLanguage };
      const response = await api.post("/auth/login", payload);
      if (!response.data?.success || !response.data?.token) {
        throw new Error(response.data?.message || "Login failed.");
      }
      localStorage.setItem("kaamsathi_token", response.data.token);
      const nextProfile = response.data.profile || {};
      nextProfile.preferred_language = nextProfile.preferred_language || selectedLanguage;
      localStorage.setItem("kaamsathi_language", nextProfile.preferred_language);
      setSelectedLanguage(nextProfile.preferred_language);
      setAuthProfile(nextProfile);
      setLoginPin("");
      setLoginPassword("");
    } catch (error) {
      setLoginError(error.response?.data?.message || error.message || "Could not log in.");
    } finally {
      setLoginBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("kaamsathi_token");
    setAuthProfile(null);
    setMyDashboard(null);
  }

  // Load Worker Dashboard
  useEffect(() => {
    if (!authProfile || !["worker", "gutha_leader"].includes(authProfile.role)) return;
    let cancelled = false;
    api.get("/me/dashboard")
      .then((response) => {
        if (!cancelled) setMyDashboard(response.data);
      })
      .catch((error) => {
        if (!cancelled) setMyDashboardError(error.response?.data?.message || "Could not load your details.");
      })
      .finally(() => {
        if (!cancelled) setMyDashboardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authProfile]);

  // Admin Data Loading
  async function loadWorkers() {
    setWorkersLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/workers");
      setWorkers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setLoadError("Could not load saved workers. Check backend connection.");
    } finally {
      setWorkersLoading(false);
    }
  }

  async function loadTeams() {
    try {
      const response = await api.get("/teams");
      setTeams(response.data?.success && Array.isArray(response.data.data) ? response.data.data.map((t) => t.name) : []);
    } catch (error) {
      console.error(error);
      setTeams([]);
    }
  }

  async function loadTransactions() {
    try {
      const response = await api.get("/transactions");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setRecords(
          response.data.data.map((item) => ({
            id: item.id,
            worker: item.worker,
            workerId: item.workerId,
            type: item.kind,
            amount: item.amount,
            date: item.date,
          }))
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadWageBalances() {
    setWagesLoading(true);
    try {
      const response = await api.get("/wages");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setWageBalances(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setWagesLoading(false);
    }
  }

  useEffect(() => {
    if (authProfile?.role !== "admin") return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      loadWorkers();
      loadTeams();
      loadTransactions();
      loadWageBalances();
    });
    return () => {
      cancelled = true;
    };
  }, [authProfile]);

  const present = workers.filter((w) => w.status === "Present").length;
  const absent = workers.filter((w) => w.status === "Absent").length;
  const filteredWorkers = workers.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));

  async function addWorker(e) {
    e.preventDefault();
    if (!workerName.trim()) return;
    try {
      const response = await api.post("/workers", {
        name: workerName.trim(),
        role: workerRole,
        team: teams[0] || "Unassigned",
        wage: Number(workerWage),
      });
      if (response.data?.success) {
        await Promise.all([loadWorkers(), loadWageBalances()]);
        setWorkerName("");
        setShowForm(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Could not save worker.");
    }
  }

  async function updateAttendance(id, newStatus) {
    try {
      await api.put(`/attendance/${id}`, { status: newStatus });
      await Promise.all([loadWorkers(), loadWageBalances()]);
    } catch (error) {
      alert(error.response?.data?.message || "Attendance could not be saved.");
    }
  }

  async function addTeam(e) {
    e.preventDefault();
    if (!newTeam.trim()) return;
    try {
      await api.post("/teams", { name: newTeam.trim() });
      await loadTeams();
      setNewTeam("");
    } catch (error) {
      alert(error.response?.data?.message || "Could not save team.");
    }
  }

  async function deleteWorker(worker) {
    if (!window.confirm(`Delete ${worker.name}?`)) return;
    try {
      await api.delete(`/workers/${worker.id}`);
      await Promise.all([loadWorkers(), loadTeams(), loadTransactions(), loadWageBalances()]);
    } catch (error) {
      alert(error.response?.data?.message || "Worker could not be deleted.");
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    try {
      await api.post("/transactions", {
        workerId: Number(transactionWorkerId),
        kind: transactionKind,
        amount: Number(transactionAmount),
        date: transactionDate,
      });
      await Promise.all([loadTransactions(), loadWageBalances()]);
      setShowTransactionForm(false);
      setTransactionAmount("");
    } catch (error) {
      alert(error.response?.data?.message || "Could not save transaction.");
    }
  }

  async function downloadWorkerReport() {
    if (!reportWorkerId) return alert("Select worker");
    setReportLoading(true);
    try {
      const response = await api.get("/reports/worker", {
        params: { workerId: reportWorkerId, from: reportFromDate, to: reportToDate },
      });
      const report = response.data;
      const rows = [
        ["KaamSathi Worker Report"],
        ["Worker", report.worker.name],
        ["Role", report.worker.role],
        [],
        ["Date", "Attendance", "Earned Wage (INR)", "Type", "Money (INR)"],
      ];
      report.data.forEach((day) => {
        if (!day.transactions.length) {
          rows.push([day.date, day.status || "—", day.earned, "", ""]);
        } else {
          day.transactions.forEach((tx) => rows.push([day.date, day.status || "—", day.earned, tx.type, tx.amount]));
        }
      });
      const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report_${report.worker.name}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || "Could not download report.");
    } finally {
      setReportLoading(false);
    }
  }

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Loading KaamSathi…
      </div>
    );
  }

  return (
    <>
      <GlobalBackdrop />

      <div className="app-shell">
        <header className="app-header">
          <div className="header-inner">
            <div className="brand">
              <div className="brand-icon">K</div>
              <div>
                <h2 className="brand-title">KaamSathi</h2>
                <span className="brand-subtitle">Kaam bhi, hisaab bhi</span>
              </div>
            </div>

            {authProfile && (
              <button className="secondary-button" onClick={logout}>
                Log out
              </button>
            )}
          </div>
        </header>

        {/* 1. LOGIN VIEW */}
        {!authProfile ? (
          <div className="login-corridor">
            <div className="login-card">
              <div className="app-badge">KAAMSATHI</div>
              <h1>Kaam bhi, hisaab bhi</h1>
              <p>Log in to view your work account.</p>

              <form onSubmit={submitLogin}>
                <div className="login-form-group">
                  <label htmlFor="kaamsathi-language">Choose language</label>
                  <select
                    id="kaamsathi-language"
                    className="login-input"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      localStorage.setItem("kaamsathi_language", e.target.value);
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} data-language-option="true">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="login-form-group">
                  <label>Login as</label>
                  <select
                    className="login-input"
                    value={loginMode}
                    onChange={(e) => setLoginMode(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="worker">Worker</option>
                    <option value="gutha_leader">Gutha Leader</option>
                  </select>
                </div>

                {loginMode === "admin" ? (
                  <>
                    <div className="login-form-group">
                      <label>Username</label>
                      <input
                        className="login-input"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="e.g. geetaadmin"
                        required
                        autoComplete="username"
                      />
                    </div>
                    <div className="login-form-group">
                      <label>Password</label>
                      <input
                        className="login-input"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="login-form-group">
                      <label>Phone number</label>
                      <input
                        className="login-input"
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        required
                        autoComplete="tel"
                      />
                    </div>
                    <div className="login-form-group">
                      <label>PIN</label>
                      <input
                        className="login-input"
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="4 to 8 digit PIN"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </>
                )}

                {loginError && (
                  <div style={{ color: "#dc3545", fontSize: "13px", margin: "10px 0" }}>
                    {loginError}
                  </div>
                )}

                <button type="submit" disabled={loginBusy} className="login-submit-button">
                  {loginBusy ? "Logging in…" : "Log in"}
                </button>
              </form>
            </div>
          </div>
        ) : ["worker", "gutha_leader"].includes(authProfile.role) ? (
          /* ================= 2. WORKER PORTAL VIEW ================= */
          <main className="main-corridor">
            <div className="page-eyebrow">KAAMSATHI WORKER PORTAL</div>
            <h1 className="page-title">
              Namaste, {myDashboard?.profile?.name || authProfile.phone}! 👋
            </h1>
            <p className="page-subtitle">Your work details, attendance and payment summary.</p>

            {myDashboardLoading && (
              <div className="panel" style={{ textAlign: "center" }}>
                Loading your saved details…
              </div>
            )}
            {myDashboardError && (
              <div className="panel" style={{ color: "#dc3545", textAlign: "center" }}>
                {myDashboardError}
              </div>
            )}

            {myDashboard && (
              <>
                <div className="panel" style={{ padding: "18px 24px", marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div className="worker-cell">
                      <div className="worker-avatar" style={{ width: "44px", height: "44px", fontSize: "17px" }}>
                        {myDashboard.profile.name?.charAt(0) || "W"}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                          {myDashboard.profile.name}
                        </h2>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Phone: {myDashboard.profile.phone || "—"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <span className="team-label">{myDashboard.profile.role}</span>
                      <span className="team-label">{myDashboard.profile.team}</span>
                      <span className="team-label" style={{ background: "#e8f5e9", color: "#198754" }}>
                        Wage: {formatMoney(myDashboard.profile.dailyWage)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Total earned</span>
                    <strong>{formatMoney(myDashboard.summary.earned)}</strong>
                    <small>Calculated wages</small>
                  </div>
                  <div className="stat-card">
                    <span>Payments received</span>
                    <strong>{formatMoney(myDashboard.summary.payments)}</strong>
                    <small>Transferred</small>
                  </div>
                  <div className="stat-card">
                    <span>Pending wages</span>
                    <strong>{formatMoney(myDashboard.summary.pendingWages)}</strong>
                    <small>Balance owed</small>
                  </div>
                  <div className="stat-card">
                    <span>Advances taken</span>
                    <strong>{formatMoney(myDashboard.summary.advances)}</strong>
                    <small>Advance pool</small>
                  </div>
                  <div className="stat-card">
                    <span>Present / late days</span>
                    <strong>{myDashboard.summary.presentDays}</strong>
                    <small>Full days checked-in</small>
                  </div>
                  <div className="stat-card">
                    <span>Half days</span>
                    <strong>{myDashboard.summary.halfDays}</strong>
                    <small>0.5 rate</small>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>My attendance</h3>
                      <p>Full daily log and wage crediting.</p>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="worker-table">
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th>STATUS</th>
                          <th>EARNED</th>
                          <th>NOTES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!myDashboard.attendance.length ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                              No attendance records yet.
                            </td>
                          </tr>
                        ) : (
                          myDashboard.attendance.map((a) => (
                            <tr key={a.id}>
                              <td>{a.work_date}</td>
                              <td>
                                <span
                                  style={{
                                    color:
                                      a.status === "Present"
                                        ? "#198754"
                                        : a.status === "Late"
                                        ? "#f59e0b"
                                        : "#dc3545",
                                    fontWeight: 700,
                                  }}
                                >
                                  ● {a.status}
                                </span>
                              </td>
                              <td className="wage-cell">
                                {formatMoney(
                                  a.status === "Present" || a.status === "Late"
                                    ? a.wage_amount ?? myDashboard.profile.dailyWage
                                    : a.status === "Half-day"
                                    ? (a.wage_amount ?? myDashboard.profile.dailyWage) / 2
                                    : 0
                                )}
                              </td>
                              <td style={{ color: "#64748b" }}>{a.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>My payments & advances</h3>
                      <p>Direct disbursement and cash history.</p>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="worker-table">
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th>TYPE</th>
                          <th>AMOUNT</th>
                          <th>METHOD</th>
                          <th>NOTES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!myDashboard.transactions.length ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                              No payment or advance records yet.
                            </td>
                          </tr>
                        ) : (
                          myDashboard.transactions.map((t) => (
                            <tr key={t.id}>
                              <td>{String(t.transaction_date || "").slice(0, 10)}</td>
                              <td>{t.transaction_type}</td>
                              <td className="wage-cell">{formatMoney(t.amount)}</td>
                              <td>{t.payment_method || "—"}</td>
                              <td style={{ color: "#64748b" }}>{t.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <footer className="page-footer">© 2026 KaamSathi · Kaam bhi, hisaab bhi.</footer>
          </main>
        ) : (
          /* ================= 3. ADMIN PORTAL VIEW ================= */
          <main className="main-corridor">
            <div className="admin-view">
              <div className="page-eyebrow">YOUR WORKSPACE</div>
              <h1 className="page-title">Good day, Admin ✦</h1>
              <p className="page-subtitle">Here's what's happening with your workforce today.</p>

              <nav className="centered-nav">
                {menu.map((item) => (
                  <button
                    key={item.name}
                    className={`nav-pill ${active === item.name ? "active" : ""}`}
                    onClick={() => setActive(item.name)}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>Total workers</span>
                  <strong>{workersLoading ? "…" : workers.length}</strong>
                  <small>Registered</small>
                </div>
                <div className="stat-card">
                  <span>Present today</span>
                  <strong>{workersLoading ? "…" : present}</strong>
                  <small>Checked in</small>
                </div>
                <div className="stat-card">
                  <span>Absent today</span>
                  <strong>{workersLoading ? "…" : absent}</strong>
                  <small>Not present</small>
                </div>
                <div className="stat-card">
                  <span>Estimated wages</span>
                  <strong>
                    {formatMoney(
                      workers
                        .filter((w) => w.status === "Present" || w.status === "Late")
                        .reduce((acc, curr) => acc + Number(curr.wage || 0), 0)
                    )}
                  </strong>
                  <small>Today's payout</small>
                </div>
              </div>

              {/* TAB 1: WORKERS / DASHBOARD */}
              {(active === "Dashboard" || active === "Workers") && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>All Workers ({workers.length})</h3>
                      <p>Manage worker details and daily wage rates.</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        className="search-input"
                        placeholder="⌕ Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "140px" }}
                      />
                      <button className="primary-button" onClick={() => setShowForm(!showForm)}>
                        ＋ Add
                      </button>
                    </div>
                  </div>

                  {showForm && (
                    <form
                      onSubmit={addWorker}
                      style={{
                        marginBottom: "16px",
                        padding: "14px",
                        background: "#f8faf8",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <label>
                          Full Name
                          <input
                            className="search-input"
                            style={{ width: "100%", marginTop: "4px" }}
                            value={workerName}
                            onChange={(e) => setWorkerName(e.target.value)}
                            placeholder="e.g. Raju Verma"
                            required
                          />
                        </label>
                        <label>
                          Role
                          <select
                            className="search-input"
                            style={{ width: "100%", marginTop: "4px" }}
                            value={workerRole}
                            onChange={(e) => setWorkerRole(e.target.value)}
                          >
                            <option>Helper</option>
                            <option>Mason</option>
                            <option>Painter</option>
                            <option>Electrician</option>
                          </select>
                        </label>
                        <label>
                          Daily Wage (₹)
                          <input
                            type="number"
                            className="search-input"
                            style={{ width: "100%", marginTop: "4px" }}
                            value={workerWage}
                            onChange={(e) => setWorkerWage(e.target.value)}
                            required
                          />
                        </label>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="primary-button">
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="table-wrap">
                    <table className="worker-table">
                      <thead>
                        <tr>
                          <th>WORKER</th>
                          <th>ROLE</th>
                          <th>TEAM</th>
                          <th>WAGE</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workersLoading ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                              Loading saved workers...
                            </td>
                          </tr>
                        ) : loadError ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#dc3545" }}>
                              {loadError}
                            </td>
                          </tr>
                        ) : (
                          filteredWorkers.map((w) => (
                            <tr key={w.id}>
                              <td>
                                <div className="worker-cell">
                                  <div className="worker-avatar">{w.name.charAt(0)}</div>
                                  <strong>{w.name}</strong>
                                </div>
                              </td>
                              <td>{w.role}</td>
                              <td>
                                <span className="team-label">{w.team}</span>
                              </td>
                              <td className="wage-cell">{formatMoney(w.wage)}</td>
                              <td>
                                <span
                                  style={{
                                    color: w.status === "Present" ? "#198754" : "#dc3545",
                                    fontWeight: 700,
                                  }}
                                >
                                  ● {w.status}
                                </span>
                              </td>
                              <td>
                                <button type="button" className="secondary-button" onClick={() => deleteWorker(w)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE */}
              {active === "Attendance" && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Mark Attendance</h3>
                      <p>Update attendance status for today.</p>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="worker-table">
                      <thead>
                        <tr>
                          <th>WORKER</th>
                          <th>CURRENT STATUS</th>
                          <th>CHANGE STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((w) => (
                          <tr key={w.id}>
                            <td>
                              <strong>{w.name}</strong>
                            </td>
                            <td>
                              <span
                                style={{
                                  color: w.status === "Present" ? "#198754" : "#dc3545",
                                  fontWeight: 700,
                                }}
                              >
                                ● {w.status}
                              </span>
                            </td>
                            <td>
                              <select
                                className="attendance-select"
                                value={w.status}
                                onChange={(e) => updateAttendance(w.id, e.target.value)}
                              >
                                <option>Present</option>
                                <option>Late</option>
                                <option>Absent</option>
                                <option>Half-day</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: TEAMS */}
              {active === "Teams" && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Teams Management</h3>
                      <p>Group workers into site groups.</p>
                    </div>
                  </div>
                  <form onSubmit={addTeam} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <input
                      className="search-input"
                      placeholder="New team name..."
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="primary-button" type="submit">
                      ＋ Add Team
                    </button>
                  </form>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {teams.map((t) => (
                      <div
                        key={t}
                        style={{
                          padding: "14px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          background: "#fafcfa",
                        }}
                      >
                        <strong style={{ fontSize: "14px" }}>{t}</strong>
                        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
                          {workers.filter((w) => w.team === t).length} assigned workers
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENTS */}
              {active === "Payments" && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Payments & Advances</h3>
                      <p>Record money paid to workers or advances given to them.</p>
                    </div>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        setTransactionWorkerId(workers[0] ? String(workers[0].id) : "");
                        setShowTransactionForm(!showTransactionForm);
                      }}
                    >
                      {showTransactionForm ? "Cancel" : "+ Record Transaction"}
                    </button>
                  </div>

                  {showTransactionForm && (
                    <form
                      onSubmit={addTransaction}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "12px",
                        marginBottom: "20px",
                        padding: "16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        background: "#fafcfa",
                      }}
                    >
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                        Worker
                        <select
                          className="search-input"
                          value={transactionWorkerId}
                          onChange={(e) => setTransactionWorkerId(e.target.value)}
                          required
                        >
                          {workers.map((w) => (
                            <option key={w.id} value={String(w.id)}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                        Transaction type
                        <select
                          className="search-input"
                          value={transactionKind}
                          onChange={(e) => setTransactionKind(e.target.value)}
                        >
                          <option value="Payment">Payment</option>
                          <option value="Advance">Advance</option>
                        </select>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                        Date
                        <input
                          className="search-input"
                          type="date"
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                          required
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                        Amount (₹)
                        <input
                          className="search-input"
                          type="number"
                          placeholder="Amount"
                          value={transactionAmount}
                          onChange={(e) => setTransactionAmount(e.target.value)}
                          required
                        />
                      </label>
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button className="primary-button" type="submit">
                          Save Transaction
                        </button>
                      </div>
                    </form>
                  )}

                  <h4 style={{ margin: "16px 0 6px" }}>Worker Wage Balances</h4>
                  <div className="table-wrap" style={{ marginBottom: "20px" }}>
                    <table className="worker-table">
                      <thead>
                        <tr>
                          <th>WORKER</th>
                          <th>EARNED</th>
                          <th>PAYMENTS</th>
                          <th>ADVANCES</th>
                          <th>REMAINING BALANCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wagesLoading ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", padding: "16px" }}>
                              Calculating balances...
                            </td>
                          </tr>
                        ) : (
                          wageBalances.map((w) => (
                            <tr key={w.workerId}>
                              <td>
                                <strong>{w.worker}</strong>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  {w.daysPresent} days · {w.halfDays} half-days
                                </div>
                              </td>
                              <td className="wage-cell">{formatMoney(w.earned)}</td>
                              <td>{formatMoney(w.payments)}</td>
                              <td>{formatMoney(w.advances)}</td>
                              <td
                                className="wage-cell"
                                style={{ color: w.balance >= 0 ? "#198754" : "#dc3545" }}
                              >
                                {w.balance >= 0
                                  ? formatMoney(w.balance) + " owed"
                                  : formatMoney(Math.abs(w.balance)) + " overpaid"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ margin: "16px 0 6px" }}>Transaction History</h4>
                  <div className="table-wrap">
                    <table className="worker-table">
                      <thead>
                        <tr>
                          <th>WORKER</th>
                          <th>TYPE</th>
                          <th>DATE</th>
                          <th>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.worker}</strong>
                            </td>
                            <td>{r.type}</td>
                            <td>{r.date}</td>
                            <td className="wage-cell">{formatMoney(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: REPORTS */}
              {active === "Reports" && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Attendance & Wages Reports</h3>
                      <p>Download formatted CSV summary for selected periods.</p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: "12px",
                      alignItems: "end",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                      Worker
                      <select
                        className="search-input"
                        value={reportWorkerId}
                        onChange={(e) => setReportWorkerId(e.target.value)}
                      >
                        <option value="">Select worker</option>
                        {workers.map((w) => (
                          <option key={w.id} value={String(w.id)}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                      From date
                      <input
                        className="search-input"
                        type="date"
                        value={reportFromDate}
                        onChange={(e) => setReportFromDate(e.target.value)}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                      To date
                      <input
                        className="search-input"
                        type="date"
                        value={reportToDate}
                        onChange={(e) => setReportToDate(e.target.value)}
                      />
                    </label>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={downloadWorkerReport}
                      disabled={reportLoading}
                    >
                      {reportLoading ? "Generating..." : "Download CSV Report"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <footer className="page-footer">© 2026 KaamSathi · Kaam bhi, hisaab bhi.</footer>
          </main>
        )}
      </div>
    </>
  );
}

export default App;