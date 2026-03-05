package com.example.demo2.controller;

import com.example.demo2.model.Notice;
import com.example.demo2.model.NoticeComment;
import com.example.demo2.model.NoticePageResponse;
import com.example.demo2.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    @Autowired
    private NoticeService noticeService;

    @GetMapping
    public ResponseEntity<NoticePageResponse> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String searchTitle,
            @RequestParam(required = false) String memberId) {
        return ResponseEntity.ok(noticeService.getPaginatedNotices(page, size, searchTitle, memberId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notice> getNotice(@PathVariable Long id) {
        Notice notice = noticeService.getNoticeDetail(id);
        if (notice == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(notice);
    }

    @PostMapping
    public ResponseEntity<?> createNotice(
            @RequestPart("notice") Notice notice,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            HttpServletRequest request) throws IOException {
        notice.setIpAddress(request.getRemoteAddr());
        noticeService.createNotice(notice, files);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{parentId}/replies")
    public ResponseEntity<?> createReply(
            @PathVariable Long parentId,
            @RequestPart("notice") Notice reply,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            HttpServletRequest request) throws IOException {
        reply.setIpAddress(request.getRemoteAddr());
        noticeService.createReply(parentId, reply, files);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNotice(
            @PathVariable Long id,
            @RequestPart("notice") Notice notice,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "deleteFileIds", required = false) List<Long> deleteFileIds,
            Authentication authentication) throws IOException {
        notice.setId(id);
        noticeService.updateNotice(notice, files, deleteFileIds, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotice(@PathVariable Long id, Authentication authentication) {
        noticeService.deleteNotice(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    // Comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody NoticeComment comment) {
        comment.setNoticeId(id);
        noticeService.addComment(comment);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, Authentication authentication) {
        noticeService.deleteComment(commentId, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
