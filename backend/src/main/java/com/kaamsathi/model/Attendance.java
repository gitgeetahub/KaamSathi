package com.kaamsathi.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "attendance", uniqueConstraints = @UniqueConstraint(
        name = "uk_attendance_worker_date", columnNames = {"worker_id", "work_date"}))
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    public Worker worker;

    @Column(name = "work_date", nullable = false)
    public LocalDate workDate;

    @Column(nullable = false, length = 20)
    public String status;

    @Column(name = "wage_amount", precision = 12, scale = 2)
    public BigDecimal wageAmount;

    @Column(length = 500)
    public String notes;

    protected Attendance() {}

    public Attendance(Worker worker, LocalDate workDate, String status, BigDecimal wageAmount) {
        this.worker = worker;
        this.workDate = workDate;
        this.status = status;
        this.wageAmount = wageAmount;
    }
}
