package com.example.demo2.model;

import lombok.*;

import java.time.LocalDateTime;

import static com.example.demo2.model.Enums.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkJob {

  private Long jobId;

  private BulkJobType jobType;

  private BulkJobStatus status;

  private Integer totalCount;

  private Integer errorCount;

  private Long actorId;

  private String actorRole;

  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;
}




