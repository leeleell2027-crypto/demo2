package com.example.demo2.service;

import com.example.demo2.admin.Actor;
import com.example.demo2.model.ChangeLog;
import com.example.demo2.mapper.ChangeLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.example.demo2.model.Enums.*;

@Service
@RequiredArgsConstructor
public class ChangeLogService {

  private final ChangeLogMapper changeLogMapper;

  public void log(Actor actor, ChangeTargetType targetType, Long productId, Long optionId,
                  ChangeType changeType, String beforeJson, String afterJson, String reason) {
    ChangeLog log = ChangeLog.builder()
        .actorId(actor.actorId())
        .actorRole(actor.role())
        .targetType(targetType)
        .productId(productId)
        .optionId(optionId)
        .changeType(changeType)
        .beforeJson(beforeJson)
        .afterJson(afterJson)
        .reason(reason)
        .build();
    changeLogMapper.insert(log);
  }
}


