package com.kaamsathi.model;

import jakarta.persistence.*;

@Entity
@Table(name = "kaamsathi_accounts")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(unique = true, length = 100)
    public String username;

    @Column(unique = true, length = 30)
    public String phone;

    @Column(name = "password_hash", length = 100)
    public String passwordHash;

    @Column(name = "pin_hash", length = 100)
    public String pinHash;

    @Column(nullable = false, length = 20)
    public String role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "worker_id")
    public Worker worker;

    @Column(name = "preferred_language", nullable = false, length = 10)
    public String preferredLanguage = "en";

    @Column(name = "is_active", nullable = false)
    public boolean active = true;
}
