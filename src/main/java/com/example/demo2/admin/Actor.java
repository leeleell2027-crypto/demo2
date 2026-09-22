package com.example.demo2.admin;

public record Actor(long actorId, String role) {
  public static Actor system() {
    return new Actor(0L, "SYSTEM");
  }
}


