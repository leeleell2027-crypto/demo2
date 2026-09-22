package com.example.demo2.admin;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ActorResolver {

  @Value("${app.audit.actor-header:X-Actor-Id}")
  private String actorHeader;

  @Value("${app.audit.role-header:X-Actor-Role}")
  private String roleHeader;

  public Actor resolve(HttpServletRequest req) {
    String actorId = req.getHeader(actorHeader);
    String role = req.getHeader(roleHeader);
    long id = 0L;
    try {
      if (actorId != null && !actorId.isBlank()) id = Long.parseLong(actorId);
    } catch (NumberFormatException ignored) {
      id = 0L;
    }
    if (role == null || role.isBlank()) role = "ADMIN";
    return new Actor(id, role);
  }
}


