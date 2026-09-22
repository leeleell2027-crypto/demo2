package com.example.demo2.model;

import lombok.*;

import java.time.LocalDateTime;

import static com.example.demo2.model.Enums.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkJobItem {

  private Long itemId;

  private Long jobId;

  private Integer rowNo;

  private Long productId;

  private String optionSku;

  private String payloadJson;

  private BulkJobItemStatus status;

  private String errorMessage;

  private LocalDateTime createdAt;
}




