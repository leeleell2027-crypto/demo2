package com.example.demo2.model;

import lombok.*;

import java.time.LocalDateTime;

import static com.example.demo2.model.Enums.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeLog {

  private Long logId;

  private Long actorId;

  private String actorRole;

  private ChangeTargetType targetType;

  private Long productId;

  private Long optionId;

  private ChangeType changeType;

  private String beforeJson;

  private String afterJson;

  private String reason;

  private LocalDateTime createdAt;
}




