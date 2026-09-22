package com.example.demo2.model;

import java.time.LocalDateTime;
import java.util.List;

public class BulkDtos {
  public record BulkJobResponse(
      Long jobId,
      Enums.BulkJobType jobType,
      Enums.BulkJobStatus status,
      Integer totalCount,
      Integer errorCount,
      LocalDateTime createdAt,
      List<BulkJobItemResponse> items) {
  }

  public record BulkJobItemResponse(
      Integer rowNo,
      Long productId,
      String optionSku,
      Enums.BulkJobItemStatus status,
      String errorMessage,
      String payloadJson) {
  }
}
