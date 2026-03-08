package com.example.demo2.service;

import com.example.demo2.mapper.NoticeMapper;
import com.example.demo2.model.Notice;
import com.example.demo2.model.NoticeAttachment;
import com.example.demo2.model.NoticeComment;
import com.example.demo2.model.NoticePageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NoticeService {

    @Autowired
    private NoticeMapper noticeMapper;

    private final String uploadPath = System.getProperty("user.dir") + File.separator + "uploads" + File.separator
            + "notices";

    public NoticePageResponse getPaginatedNotices(int page, int size, String searchTitle, String memberId,
            String currentMemberId) {
        int offset = page * size;
        List<Notice> notices = noticeMapper.findAll(size, offset, searchTitle, memberId, currentMemberId);

        if (!notices.isEmpty()) {
            List<Long> noticeIds = notices.stream().map(Notice::getId).collect(Collectors.toList());
            List<NoticeAttachment> allAttachments = noticeMapper.findAttachmentsByNoticeIds(noticeIds);

            // grouping
            Map<Long, List<NoticeAttachment>> attachmentMap = allAttachments.stream()
                    .collect(Collectors.groupingBy(NoticeAttachment::getNoticeId));

            notices.forEach(n -> n.setAttachments(attachmentMap.get(n.getId())));
        }

        int totalCount = noticeMapper.countAll(searchTitle, memberId);
        int totalPages = (int) Math.ceil((double) totalCount / size);
        return new NoticePageResponse(notices, totalCount, totalPages, page);
    }

    @Transactional
    public void createNotice(Notice notice, List<MultipartFile> files) throws IOException {
        // ref, step, depth 초기값 (원글인 경우)
        notice.setRef(0); // 임시값
        notice.setStep(0);
        notice.setDepth(0);

        noticeMapper.insert(notice);
        noticeMapper.updateRef(notice.getId()); // ref를 자신의 id로 업데이트

        saveAttachments(notice.getId(), files);
    }

    @Transactional
    public void createReply(Long parentId, Notice reply, List<MultipartFile> files) throws IOException {
        Notice parent = noticeMapper.findById(parentId);
        if (parent == null)
            throw new RuntimeException("원글을 찾을 수 없습니다.");

        // 계층형 로직: 부모의 ref를 따르고, step을 부모 뒤로 밀기
        reply.setRef(parent.getRef());
        reply.setStep(parent.getStep() + 1);
        reply.setDepth(parent.getDepth() + 1);

        noticeMapper.updateReplyStep(parent.getRef(), parent.getStep());
        noticeMapper.insert(reply);

        saveAttachments(reply.getId(), files);
    }

    @Transactional
    public Notice getNoticeDetail(Long id, String currentMemberId) {
        noticeMapper.updateViewCount(id);
        if (currentMemberId != null) {
            noticeMapper.insertReadStatus(id, currentMemberId);
        }
        Notice notice = noticeMapper.findById(id);
        if (notice != null) {
            notice.setAttachments(noticeMapper.findAttachmentsByNoticeId(id));
            notice.setComments(noticeMapper.findCommentsByNoticeId(id));
        }
        return notice;
    }

    @Transactional
    public void updateNotice(Notice notice, List<MultipartFile> files, List<Long> deleteFileIds, String requesterId)
            throws IOException {
        Notice original = noticeMapper.findById(notice.getId());
        if (original == null)
            throw new RuntimeException("게시글을 찾을 수 없습니다.");
        if (!original.getMemberId().equals(requesterId)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        noticeMapper.update(notice);

        // 기존 파일 삭제 처리
        if (deleteFileIds != null) {
            for (Long fileId : deleteFileIds) {
                NoticeAttachment att = noticeMapper.findAttachmentById(fileId);
                if (att != null) {
                    deleteFile(att);
                    noticeMapper.deleteAttachment(fileId);
                }
            }
        }

        saveAttachments(notice.getId(), files);
    }

    @Transactional
    public void deleteNotice(Long id, String requesterId) {
        Notice original = noticeMapper.findById(id);
        if (original == null)
            throw new RuntimeException("게시글을 찾을 수 없습니다.");
        if (!original.getMemberId().equals(requesterId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        List<NoticeAttachment> attachments = noticeMapper.findAttachmentsByNoticeId(id);
        for (NoticeAttachment att : attachments) {
            deleteFile(att);
        }
        noticeMapper.delete(id);
    }

    // Comments
    public void addComment(NoticeComment comment) {
        noticeMapper.insertComment(comment);
    }

    public void deleteComment(Long commentId, String requesterId) {
        NoticeComment comment = noticeMapper.findCommentById(commentId);
        if (comment == null)
            throw new RuntimeException("댓글을 찾을 수 없습니다.");
        if (!comment.getMemberId().equals(requesterId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }
        noticeMapper.deleteComment(commentId);
    }

    public int getUnreadCount(String memberId) {
        return noticeMapper.countUnread(memberId);
    }

    @Transactional
    public void markAllAsRead(String memberId) {
        noticeMapper.insertAllReadStatus(memberId);
    }

    // Helper methods
    private void saveAttachments(Long noticeId, List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty())
            return;

        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists())
            uploadDir.mkdirs();

        for (MultipartFile file : files) {
            if (file.isEmpty())
                continue;

            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            File fileToSave = new File(uploadPath + File.separator + savedFilename);
            file.transferTo(fileToSave);

            NoticeAttachment attachment = new NoticeAttachment();
            attachment.setNoticeId(noticeId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath("/api/notices/files/" + savedFilename);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            noticeMapper.insertAttachment(attachment);
        }
    }

    private void deleteFile(NoticeAttachment attachment) {
        // 실제 파일 삭제 로직 추가 가능
        String fileName = attachment.getFilePath().substring(attachment.getFilePath().lastIndexOf("/") + 1);
        File file = new File(uploadPath + File.separator + fileName);
        if (file.exists())
            file.delete();
    }
}
