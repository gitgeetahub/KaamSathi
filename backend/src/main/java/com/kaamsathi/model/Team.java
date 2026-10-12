package com.kaamsathi.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teams")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 100)
    public String name;

    protected Team() {}

    public Team(String name) {
        this.name = name;
    }
}
