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
        // ref, step, depth 珥덇린媛?(?먭???寃쎌슦)
        notice.setRef(0); // ?꾩떆媛?
        notice.setStep(0);
        notice.setDepth(0);

        noticeMapper.insert(notice);
        noticeMapper.updateRef(notice.getId()); // ref瑜??먯떊??id濡??낅뜲?댄듃

        saveAttachments(notice.getId(), files);
    }

    @Transactional
    public void createReply(Long parentId, Notice reply, List<MultipartFile> files) throws IOException {
        Notice parent = noticeMapper.findById(parentId);
        if (parent == null)
            throw new RuntimeException("?먭???李얠쓣 ???놁뒿?덈떎.");

        // 怨꾩링??濡쒖쭅: 遺紐⑥쓽 ref瑜??곕Ⅴ怨? step??遺紐??ㅻ줈 諛湲?
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
            throw new RuntimeException("寃뚯떆湲??李얠쓣 ???놁뒿?덈떎.");
        if (!original.getMemberId().equals(requesterId)) {
            throw new RuntimeException("?섏젙 沅뚰븳???놁뒿?덈떎.");
        }

        noticeMapper.update(notice);

        // 湲곗〈 ?뚯씪 ??젣 泥섎━
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
            throw new RuntimeException("寃뚯떆湲??李얠쓣 ???놁뒿?덈떎.");
        if (!original.getMemberId().equals(requesterId)) {
            throw new RuntimeException("??젣 沅뚰븳???놁뒿?덈떎.");
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
            throw new RuntimeException("?볤???李얠쓣 ???놁뒿?덈떎.");
        if (!comment.getMemberId().equals(requesterId)) {
            throw new RuntimeException("??젣 沅뚰븳???놁뒿?덈떎.");
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
        // ?ㅼ젣 ?뚯씪 ??젣 濡쒖쭅 異붽? 媛??
        String fileName = attachment.getFilePath().substring(attachment.getFilePath().lastIndexOf("/") + 1);
        File file = new File(uploadPath + File.separator + fileName);
        if (file.exists())
            file.delete();
    }
}


