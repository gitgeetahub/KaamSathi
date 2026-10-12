package com.kaamsathi.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
public class WorkerTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    public Worker worker;

    @Column(name = "transaction_type", nullable = false, length = 20)
    public String transactionType;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    public LocalDate transactionDate;

    @Column(name = "payment_method", length = 50)
    public String paymentMethod;

    @Column(length = 500)
    public String notes;

    protected WorkerTransaction() {}

    public WorkerTransaction(Worker worker, String transactionType, BigDecimal amount, LocalDate transactionDate) {
        this.worker = worker;
        this.transactionType = transactionType;
        this.amount = amount;
        this.transactionDate = transactionDate;
    }
}
