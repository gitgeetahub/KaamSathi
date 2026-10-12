package com.kaamsathi.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "workers")
public class Worker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    public String fullName;

    @Column(name = "name", nullable = false, length = 100)
    public String legacyName;

    @Column(name = "phone", length = 10)
    public String legacyPhone;

    @Column(name = "active", nullable = false)
    public boolean legacyActive = true;

    @Column(nullable = false)
    public int streak;

    @Column(nullable = false)
    public int xp;

    @Column(name = "joined_date")
    public LocalDate joinedDate;

    @Column(name = "team", length = 100)
    public String legacyTeam;

    @Column(nullable = false, length = 100)
    public String role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    public Team team;

    @Column(name = "daily_wage", nullable = false, precision = 12, scale = 2)
    public BigDecimal dailyWage;

    @Column(name = "is_active", nullable = false)
    public boolean active = true;

    protected Worker() {}

    public Worker(String fullName, String role, Team team, BigDecimal dailyWage) {
        this.fullName = fullName;
        this.legacyName = fullName;
        this.role = role;
        this.team = team;
        this.legacyTeam = team == null ? null : team.name;
        this.dailyWage = dailyWage;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }
}
