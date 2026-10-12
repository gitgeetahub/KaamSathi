package com.kaamsathi.api;

import com.kaamsathi.model.*;
import com.kaamsathi.repository.*;
import com.kaamsathi.service.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${kaamsathi.cors-origin}")
@Transactional
public class ApiController {
    private static final List<String> ATTENDANCE_STATUSES = List.of("Present", "Absent", "Late", "Half-day");
    private static final List<String> TRANSACTION_TYPES = List.of("Advance", "Payment");
    private static final List<String> LANGUAGES = List.of("en", "hi", "or", "bn", "bih");

    private final WorkerRepository workers;
    private final TeamRepository teams;
    private final AttendanceRepository attendance;
    private final WorkerTransactionRepository transactions;
    private final AccountRepository accounts;
    private final TokenService tokens;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
    private final String adminSetupKey;

    public ApiController(WorkerRepository workers, TeamRepository teams, AttendanceRepository attendance,
                         WorkerTransactionRepository transactions, AccountRepository accounts, TokenService tokens,
                         @Value("${kaamsathi.admin-setup-key}") String adminSetupKey) {
        this.workers = workers;
        this.teams = teams;
        this.attendance = attendance;
        this.transactions = transactions;
        this.accounts = accounts;
        this.tokens = tokens;
        this.adminSetupKey = adminSetupKey;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        teams.count();
        return Map.of("ok", true, "message", "KaamSathi backend and MySQL are connected.");
    }

    @PostMapping("/auth/setup-admin")
    public ResponseEntity<?> setupAdmin(@RequestHeader(value = "x-admin-setup-key", required = false) String key,
                                        @RequestBody Map<String, Object> body) {
        if (!Objects.equals(adminSetupKey, key)) return failure(HttpStatus.FORBIDDEN, "Invalid setup key.");
        if (!accounts.findAll().isEmpty()) return failure(HttpStatus.CONFLICT, "Admin setup has already been completed.");
        String username = text(body.get("username")).trim();
        String password = text(body.get("password"));
        if (username.length() < 3 || password.length() < 8) {
            return failure(HttpStatus.BAD_REQUEST, "Username must be at least 3 characters and password at least 8 characters.");
        }
        Account account = new Account();
        account.username = username;
        account.passwordHash = passwordEncoder.encode(password);
        account.role = "admin";
        account.preferredLanguage = "en";
        account.active = true;
        accounts.save(account);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true,
                "message", "Admin account created. Log in now.",
                "account", Map.of("id", account.id, "username", account.username, "role", account.role)));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String mode = text(body.getOrDefault("mode", "admin"));
        Optional<Account> matching;
        String supplied;
        String storedHash;
        if ("admin".equals(mode)) {
            matching = accounts.findFirstByUsernameAndRoleAndActiveTrue(text(body.get("username")).trim(), "admin");
            supplied = text(body.get("password"));
        } else if ("worker".equals(mode) || "gutha_leader".equals(mode)) {
            matching = accounts.findFirstByPhoneAndRoleAndActiveTrue(text(body.get("phone")).trim(), mode);
            supplied = text(body.get("pin"));
        } else {
            return failure(HttpStatus.BAD_REQUEST, "Invalid login type.");
        }
        Account account = matching.orElse(null);
        storedHash = account == null ? null : ("admin".equals(mode) ? account.passwordHash : account.pinHash);
        if (account == null || storedHash == null || !passwordEncoder.matches(supplied, storedHash)) {
            return failure(HttpStatus.UNAUTHORIZED, "Invalid login details.");
        }
        String language = text(body.getOrDefault("preferred_language", account.preferredLanguage));
        account.preferredLanguage = LANGUAGES.contains(language) ? language : "en";
        accounts.save(account);
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", account.id);
        profile.put("username", account.username);
        profile.put("phone", account.phone);
        profile.put("role", account.role);
        profile.put("worker_id", account.worker == null ? null : account.worker.getId());
        profile.put("preferred_language", account.preferredLanguage);
        return ResponseEntity.ok(Map.of("success", true, "token", tokens.create(account), "profile", profile));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> currentProfile(HttpServletRequest request) {
        Claims claims = token(request);
        if (claims == null) return unauthorized();
        Account account = accounts.findById(Long.parseLong(claims.getSubject())).orElse(null);
        if (account == null || !account.active) return failure(HttpStatus.UNAUTHORIZED, "Account is inactive or missing.");
        return ResponseEntity.ok(Map.of("profile", accountProfile(account)));
    }

    @PostMapping("/auth/accounts")
    public ResponseEntity<?> createWorkerAccount(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        String role = text(body.getOrDefault("role", "worker"));
        String phone = text(body.get("phone")).trim();
        String pin = text(body.get("pin"));
        Long workerId = numberId(body.get("worker_id"));
        if (!List.of("worker", "gutha_leader").contains(role) || phone.isBlank()
                || !pin.matches("\\d{4,8}") || workerId == null) {
            return failure(HttpStatus.BAD_REQUEST, "Provide role, phone, existing worker_id, and a 4–8 digit PIN.");
        }
        Worker worker = workers.findById(workerId).orElse(null);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker record not found.");
        Account account = new Account();
        account.phone = phone;
        account.pinHash = passwordEncoder.encode(pin);
        account.role = role;
        account.worker = worker;
        account.preferredLanguage = language(body.get("preferred_language"));
        accounts.save(account);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "account", accountProfile(account)));
    }

    @PatchMapping("/auth/accounts/{id}/link-worker")
    public ResponseEntity<?> linkWorker(HttpServletRequest request, @PathVariable Long id,
                                        @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Long workerId = numberId(body.get("worker_id"));
        if (id == null || id < 1 || workerId == null || workerId < 1) {
            return failure(HttpStatus.BAD_REQUEST, "Valid account id and worker_id are required.");
        }
        Account account = accounts.findById(id).orElse(null);
        if (account == null || !List.of("worker", "gutha_leader").contains(account.role)) {
            return failure(HttpStatus.NOT_FOUND, "Worker login account not found.");
        }
        Worker worker = workers.findById(workerId).filter(w -> w.active).orElse(null);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Active worker record not found.");
        if (accounts.existsByWorkerIdAndIdNot(workerId, id)) {
            return failure(HttpStatus.CONFLICT, "This worker record is already linked to another login account.");
        }
        account.worker = worker;
        accounts.save(account);
        return ResponseEntity.ok(Map.of("success", true, "message", "Login account linked to " + worker.fullName + "."));
    }

    @GetMapping("/auth/accounts")
    public ResponseEntity<?> listAccounts(HttpServletRequest request) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        List<Map<String, Object>> data = accounts.findAll().stream()
                .sorted(Comparator.comparing(a -> a.id, Comparator.reverseOrder()))
                .map(this::accountProfile)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("success", true, "accounts", data));
    }

    @PatchMapping("/auth/accounts/{id}/reset-pin")
    public ResponseEntity<?> resetPin(HttpServletRequest request, @PathVariable Long id,
                                      @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        String pin = text(body.get("pin"));
        if (id == null || id < 1 || !pin.matches("\\d{4,8}")) {
            return failure(HttpStatus.BAD_REQUEST, "Enter a new PIN containing 4–8 digits.");
        }
        Account account = accounts.findById(id).orElse(null);
        if (account == null || !List.of("worker", "gutha_leader").contains(account.role)) {
            return failure(HttpStatus.NOT_FOUND, "Worker or Gutha Leader account not found.");
        }
        account.pinHash = passwordEncoder.encode(pin);
        accounts.save(account);
        return ResponseEntity.ok(Map.of("success", true, "message", "PIN reset successfully. Share the new PIN privately with the user.",
                "account", Map.of("id", account.id, "role", account.role, "phone", account.phone)));
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<?> workerDashboard(HttpServletRequest request) {
        Claims claims = token(request);
        if (claims == null) return unauthorized();
        if (!List.of("worker", "gutha_leader").contains(claims.get("role", String.class))) {
            return failure(HttpStatus.FORBIDDEN, "This endpoint is for worker accounts.");
        }
        Account account = accounts.findById(Long.parseLong(claims.getSubject())).orElse(null);
        if (account == null || !account.active) return failure(HttpStatus.UNAUTHORIZED, "Account is inactive or missing.");
        if (account.worker == null) return failure(HttpStatus.CONFLICT, "Your login is not linked to a worker record. Ask the admin to link your account to your worker profile.");
        Worker worker = workers.findById(account.worker.getId()).filter(w -> w.active).orElse(null);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Your worker profile was not found. Ask the admin to check your account link.");
        List<Attendance> workerAttendance = attendance.findByWorkerIdOrderByWorkDateDesc(worker.id);
        List<WorkerTransaction> workerTransactions = transactions.findByWorkerIdOrderByTransactionDateDescIdDesc(worker.id);
        BigDecimal earned = workerAttendance.stream().map(a -> wageEarned(a, worker.dailyWage)).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal payments = sumTransactions(workerTransactions, "Payment");
        BigDecimal advances = sumTransactions(workerTransactions, "Advance");
        List<Map<String, Object>> attendanceData = workerAttendance.stream().map(this::attendanceMap).toList();
        List<Map<String, Object>> transactionData = workerTransactions.stream().map(this::transactionDetailsMap).toList();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "profile", map("id", worker.id, "name", worker.fullName, "phone", account.phone, "role", worker.role,
                        "team", teamName(worker), "dailyWage", worker.dailyWage),
                "summary", Map.of("earned", money(earned), "payments", money(payments), "advances", money(advances),
                        "pendingWages", money(earned.subtract(payments)), "advanceBalance", money(advances),
                        "presentDays", workerAttendance.stream().filter(a -> List.of("Present", "Late").contains(a.status)).count(),
                        "halfDays", workerAttendance.stream().filter(a -> "Half-day".equals(a.status)).count()),
                "attendance", attendanceData, "transactions", transactionData));
    }

    @GetMapping("/workers")
    public ResponseEntity<?> listWorkers(HttpServletRequest request) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        return ResponseEntity.ok(workers.findAll().stream().filter(w -> w.active)
                .sorted(Comparator.comparing(w -> w.id))
                .map(w -> workerMap(w, todayStatus(w))).toList());
    }

    @GetMapping("/workers/{id}")
    public ResponseEntity<?> getWorker(HttpServletRequest request, @PathVariable Long id) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Worker worker = activeWorker(id);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker not found.");
        return ResponseEntity.ok(Map.of("success", true, "data", workerMap(worker, todayStatus(worker))));
    }

    @PostMapping("/workers")
    public ResponseEntity<?> createWorker(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        String name = text(body.get("name")).trim();
        String role = text(body.get("role")).trim();
        BigDecimal wage = decimal(body.get("wage"));
        if (name.isBlank() || role.isBlank() || wage == null || wage.signum() < 0) {
            return failure(HttpStatus.BAD_REQUEST, "Enter a valid name, role and non-negative wage.");
        }
        Worker worker = new Worker(name, role, team(body.get("team")), wage);
        workers.save(worker);
        attendance.save(new Attendance(worker, LocalDate.now(), "Absent", wage));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true,
                "message", "Worker added successfully.", "data", workerMap(worker, "Absent")));
    }

    @PutMapping("/workers/{id}")
    public ResponseEntity<?> updateWorker(HttpServletRequest request, @PathVariable Long id,
                                          @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Worker worker = activeWorker(id);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker not found.");
        if (body.containsKey("name")) {
            String name = text(body.get("name")).trim();
            if (name.isBlank()) return failure(HttpStatus.BAD_REQUEST, "Invalid worker name.");
            worker.fullName = name;
            worker.legacyName = name;
        }
        if (body.containsKey("role")) {
            String role = text(body.get("role")).trim();
            if (role.isBlank()) return failure(HttpStatus.BAD_REQUEST, "Invalid worker role.");
            worker.role = role;
        }
        if (body.containsKey("wage")) {
            BigDecimal wage = decimal(body.get("wage"));
            if (wage == null || wage.signum() < 0) return failure(HttpStatus.BAD_REQUEST, "Invalid wage.");
            worker.dailyWage = wage;
        }
        if (body.containsKey("team")) {
            String teamName = text(body.get("team")).trim();
            if (teamName.isBlank()) return failure(HttpStatus.BAD_REQUEST, "Invalid team name.");
            worker.team = team(teamName);
            worker.legacyTeam = teamName;
        }
        String status = body.containsKey("status") ? text(body.get("status")) : null;
        if (status != null && !ATTENDANCE_STATUSES.contains(status)) return failure(HttpStatus.BAD_REQUEST, "Invalid attendance status.");
        workers.save(worker);
        if (status != null) upsertAttendance(worker, status);
        return ResponseEntity.ok(Map.of("success", true, "message", "Worker updated successfully.",
                "data", workerMap(worker, status == null ? todayStatus(worker) : status)));
    }

    @DeleteMapping("/workers/{id}")
    public ResponseEntity<?> deleteWorker(HttpServletRequest request, @PathVariable Long id) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Worker worker = activeWorker(id);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker not found.");
        worker.active = false;
        worker.legacyActive = false;
        workers.save(worker);
        accounts.findAll().stream().filter(a -> a.worker != null && a.worker.getId().equals(id)).forEach(a -> {
            a.active = false;
            accounts.save(a);
        });
        return ResponseEntity.ok(Map.of("success", true, "message", "Worker deleted successfully."));
    }

    @GetMapping("/attendance")
    public ResponseEntity<?> listAttendance(HttpServletRequest request) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        List<Map<String, Object>> data = workers.findByActiveTrueOrderByIdAsc().stream()
                .map(w -> map("workerId", w.id, "workerName", w.fullName, "status", todayStatus(w))).toList();
        return ResponseEntity.ok(Map.of("success", true, "date", LocalDate.now(), "data", data));
    }

    @PutMapping("/attendance/{id}")
    public ResponseEntity<?> updateAttendance(HttpServletRequest request, @PathVariable Long id,
                                              @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Worker worker = activeWorker(id);
        String status = text(body.get("status"));
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker not found.");
        if (!ATTENDANCE_STATUSES.contains(status)) {
            return failure(HttpStatus.BAD_REQUEST, "Status must be: " + String.join(", ", ATTENDANCE_STATUSES) + ".");
        }
        upsertAttendance(worker, status);
        return ResponseEntity.ok(Map.of("success", true, "data", workerMap(worker, status)));
    }

    @GetMapping("/teams")
    public ResponseEntity<?> listTeams(HttpServletRequest request) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        List<Map<String, Object>> data = teams.findAll().stream().sorted(Comparator.comparing(t -> t.name, String.CASE_INSENSITIVE_ORDER))
                .map(t -> map("name", t.name, "workerCount", workers.findByActiveTrueOrderByIdAsc().stream()
                        .filter(w -> w.team != null && w.team.id.equals(t.id)).count())).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @PostMapping("/teams")
    public ResponseEntity<?> createTeam(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        String name = text(body.get("name")).trim();
        if (name.isBlank()) return failure(HttpStatus.BAD_REQUEST, "Team name is required.");
        if (teams.findByNameIgnoreCase(name).isPresent()) return failure(HttpStatus.CONFLICT, "Team already exists.");
        Team team = teams.save(new Team(name));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true,
                "data", Map.of("name", team.name, "workerCount", 0)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions(HttpServletRequest request) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        List<Map<String, Object>> data = transactions.findAllByOrderByTransactionDateDescIdDesc().stream()
                .map(t -> map("id", t.id, "workerId", t.worker.getId(), "worker", t.worker.getFullName(),
                        "kind", t.transactionType, "amount", t.amount, "date", t.transactionDate.format(DateTimeFormatter.ofPattern("d/M/yyyy"))))
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "count", data.size(), "data", data));
    }

    @PostMapping("/transactions")
    public ResponseEntity<?> createTransaction(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Long workerId = numberId(body.get("workerId"));
        Worker worker = workerId == null ? null : activeWorker(workerId);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker not found.");
        String kind = text(body.get("kind"));
        if (!TRANSACTION_TYPES.contains(kind)) return failure(HttpStatus.BAD_REQUEST, "Type must be Advance or Payment.");
        BigDecimal amount = decimal(body.get("amount"));
        if (amount == null || amount.signum() <= 0) return failure(HttpStatus.BAD_REQUEST, "Amount must be greater than zero.");
        LocalDate date;
        try {
            date = body.get("date") == null || text(body.get("date")).isBlank() ? LocalDate.now() : LocalDate.parse(text(body.get("date")));
        } catch (DateTimeParseException e) {
            return failure(HttpStatus.BAD_REQUEST, "Please provide a valid transaction date.");
        }
        WorkerTransaction tx = transactions.save(new WorkerTransaction(worker, kind, amount, date));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "message", "Transaction recorded successfully.",
                "data", map("id", tx.id, "workerId", worker.id, "worker", worker.fullName, "kind", kind,
                        "amount", tx.amount, "date", date.format(DateTimeFormatter.ofPattern("d/M/yyyy")))));
    }

    @GetMapping("/reports/worker")
    public ResponseEntity<?> workerReport(HttpServletRequest request, @RequestParam(required = false) String workerId,
                                          @RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        Long id;
        LocalDate start;
        LocalDate end;
        try {
            id = Long.parseLong(workerId == null ? "" : workerId);
            start = LocalDate.parse(from == null ? "" : from);
            end = LocalDate.parse(to == null ? "" : to);
        } catch (RuntimeException e) {
            return failure(HttpStatus.BAD_REQUEST, "Provide a valid date range and worker.");
        }
        if (id <= 0) return failure(HttpStatus.BAD_REQUEST, "Select a valid worker.");
        if (start.isAfter(end)) return failure(HttpStatus.BAD_REQUEST, "Provide a valid date range.");
        Worker worker = activeWorker(id);
        if (worker == null) return failure(HttpStatus.NOT_FOUND, "Worker not found.");
        Map<LocalDate, Map<String, Object>> byDate = new TreeMap<>();
        List<Attendance> attendanceRows = attendance.findByWorkDateBetween(start, end).stream()
                .filter(a -> a.worker.getId().equals(id)).toList();
        BigDecimal earnedTotal = BigDecimal.ZERO;
        for (Attendance row : attendanceRows) {
            BigDecimal earned = wageEarned(row, worker.dailyWage);
            byDate.put(row.workDate, map("date", row.workDate, "status", row.status, "earned", money(earned), "transactions", new ArrayList<>()));
            earnedTotal = earnedTotal.add(earned);
        }
        BigDecimal paid = BigDecimal.ZERO;
        BigDecimal advances = BigDecimal.ZERO;
        for (WorkerTransaction tx : transactions.findByTransactionDateBetween(start, end)) {
            if (!tx.worker.getId().equals(id)) continue;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> txs = (List<Map<String, Object>>) byDate
                    .computeIfAbsent(tx.transactionDate, date -> map("date", date, "status", "", "earned", 0, "transactions", new ArrayList<>()))
                    .get("transactions");
            txs.add(map("type", tx.transactionType, "amount", tx.amount, "notes", Optional.ofNullable(tx.notes).orElse(""),
                    "paymentMethod", Optional.ofNullable(tx.paymentMethod).orElse("")));
            if ("Payment".equals(tx.transactionType)) paid = paid.add(tx.amount);
            if ("Advance".equals(tx.transactionType)) advances = advances.add(tx.amount);
        }
        return ResponseEntity.ok(Map.of("success", true, "worker", map("id", worker.id, "name", worker.fullName, "role", worker.role),
                "from", from, "to", to, "data", new ArrayList<>(byDate.values()),
                "summary", Map.of("earned", money(earnedTotal), "payments", money(paid), "advances", money(advances),
                        "balance", money(earnedTotal.subtract(paid).subtract(advances)))));
    }

    @GetMapping("/wages")
    public ResponseEntity<?> wageBalances(HttpServletRequest request) {
        ResponseEntity<?> denied = requireAdmin(request);
        if (denied != null) return denied;
        List<Attendance> allAttendance = attendance.findAll();
        List<WorkerTransaction> allTransactions = transactions.findAll();
        List<Map<String, Object>> data = workers.findByActiveTrueOrderByIdAsc().stream().map(worker -> {
            List<Attendance> rows = allAttendance.stream().filter(a -> a.worker.getId().equals(worker.id)).toList();
            List<WorkerTransaction> workerTx = allTransactions.stream().filter(t -> t.worker.getId().equals(worker.id)).toList();
            BigDecimal earned = rows.stream().map(a -> wageEarned(a, worker.dailyWage)).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal paid = sumTransactions(workerTx, "Payment");
            BigDecimal advances = sumTransactions(workerTx, "Advance");
            return map("workerId", worker.id, "worker", worker.fullName, "dailyWage", worker.dailyWage,
                    "daysPresent", rows.stream().filter(a -> List.of("Present", "Late").contains(a.status)).count(),
                    "halfDays", rows.stream().filter(a -> "Half-day".equals(a.status)).count(),
                    "earned", money(earned), "payments", money(paid), "advances", money(advances),
                    "balance", money(earned.subtract(paid).subtract(advances)));
        }).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    private ResponseEntity<?> requireAdmin(HttpServletRequest request) {
        Claims claims = token(request);
        if (claims == null) return unauthorized();
        if (!"admin".equals(claims.get("role", String.class))) {
            return failure(HttpStatus.FORBIDDEN, "This screen is available to admins only.");
        }
        return null;
    }

    private Claims token(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        try {
            return tokens.verify(header.substring(7));
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    private ResponseEntity<Map<String, Object>> unauthorized() {
        return failure(HttpStatus.UNAUTHORIZED, "Session expired. Please log in again.");
    }

    private ResponseEntity<Map<String, Object>> failure(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", message));
    }

    private Map<String, Object> accountProfile(Account account) {
        return map("id", account.id, "username", account.username, "phone", account.phone, "role", account.role,
                "worker_id", account.worker == null ? null : account.worker.getId(),
                "worker_name", account.worker == null ? null : account.worker.fullName,
                "preferred_language", account.preferredLanguage, "is_active", account.active);
    }

    private Worker activeWorker(Long id) {
        return workers.findById(id).filter(w -> w.active).orElse(null);
    }

    private Team team(Object nameValue) {
        String name = nameValue instanceof String value && !value.isBlank() ? value.trim() : "Unassigned";
        return teams.findByNameIgnoreCase(name).orElseGet(() -> teams.save(new Team(name)));
    }

    private String todayStatus(Worker worker) {
        return attendance.findByWorkerIdAndWorkDate(worker.id, LocalDate.now()).map(a -> a.status).orElse("Absent");
    }

    private void upsertAttendance(Worker worker, String status) {
        Attendance record = attendance.findByWorkerIdAndWorkDate(worker.id, LocalDate.now())
                .orElseGet(() -> new Attendance(worker, LocalDate.now(), status, worker.dailyWage));
        record.status = status;
        record.wageAmount = worker.dailyWage;
        attendance.save(record);
    }

    private Map<String, Object> workerMap(Worker worker, String status) {
        return map("id", worker.id, "name", worker.fullName, "role", worker.role, "team", teamName(worker),
                "wage", worker.dailyWage, "status", status);
    }

    private String teamName(Worker worker) {
        if (worker.team != null) return worker.team.name;
        return worker.legacyTeam == null || worker.legacyTeam.isBlank() ? "Unassigned" : worker.legacyTeam;
    }

    private Map<String, Object> attendanceMap(Attendance row) {
        return map("id", row.id, "work_date", row.workDate, "status", row.status,
                "wage_amount", row.wageAmount, "notes", row.notes);
    }

    private Map<String, Object> transactionDetailsMap(WorkerTransaction tx) {
        return map("id", tx.id, "transaction_type", tx.transactionType, "amount", tx.amount,
                "transaction_date", tx.transactionDate, "payment_method", tx.paymentMethod, "notes", tx.notes);
    }

    private BigDecimal wageEarned(Attendance row, BigDecimal dailyWage) {
        BigDecimal wage = row.wageAmount == null ? dailyWage : row.wageAmount;
        if ("Present".equals(row.status) || "Late".equals(row.status)) return wage;
        if ("Half-day".equals(row.status)) return wage.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        return BigDecimal.ZERO;
    }

    private BigDecimal sumTransactions(List<WorkerTransaction> rows, String kind) {
        return rows.stream().filter(t -> kind.equals(t.transactionType)).map(t -> t.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String language(Object value) {
        String language = text(value);
        return LANGUAGES.contains(language) ? language : "en";
    }

    private String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Long numberId(Object value) {
        try {
            if (value == null) return null;
            long id = new BigDecimal(String.valueOf(value)).longValueExact();
            return id > 0 ? id : null;
        } catch (NumberFormatException | ArithmeticException e) {
            return null;
        }
    }

    private BigDecimal decimal(Object value) {
        try {
            if (value == null || String.valueOf(value).isBlank()) return null;
            return new BigDecimal(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, Object> map(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
        return result;
    }
}
