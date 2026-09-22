package com.example.demo2.controller;

import com.example.demo2.admin.ActorResolver;
import com.example.demo2.model.Enums;
import com.example.demo2.service.BulkJobService;
import com.example.demo2.model.BulkDtos;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/bulk-jobs")
public class AdminBulkJobController {

  private final BulkJobService bulkJobService;
  private final ActorResolver actorResolver;

  public AdminBulkJobController(BulkJobService bulkJobService, ActorResolver actorResolver) {
    this.bulkJobService = bulkJobService;
    this.actorResolver = actorResolver;
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public long upload(HttpServletRequest req,
                     @RequestParam Enums.BulkJobType jobType,
                     @RequestPart MultipartFile file) throws Exception {
    var actor = actorResolver.resolve(req);
    return bulkJobService.uploadXlsx(actor, jobType, file.getInputStream());
  }

  @GetMapping("/{jobId}")
  public BulkDtos.BulkJobResponse get(@PathVariable long jobId) {
    return bulkJobService.get(jobId);
  }

  @PostMapping("/{jobId}/execute")
  public void execute(HttpServletRequest req, @PathVariable long jobId) {
    var actor = actorResolver.resolve(req);
    bulkJobService.execute(actor, jobId);
  }
}


