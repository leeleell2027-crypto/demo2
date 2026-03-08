package com.example.demo2.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class Notice {
    private Long id;
    private String title;
    private String memberId;
    private String content;
    private String ipAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate noticeStartDate;
    private LocalDate noticeEndDate;
    private Integer ref;
    private Integer step;
    private Integer depth;
    private Integer viewCount;
    private String memberName;
    private Integer commentCount;
    private Integer attachmentCount;
    private Boolean isRead;

    private List<NoticeAttachment> attachments;
    private List<NoticeComment> comments;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(String memberId) {
        this.memberId = memberId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDate getNoticeStartDate() {
        return noticeStartDate;
    }

    public void setNoticeStartDate(LocalDate noticeStartDate) {
        this.noticeStartDate = noticeStartDate;
    }

    public LocalDate getNoticeEndDate() {
        return noticeEndDate;
    }

    public void setNoticeEndDate(LocalDate noticeEndDate) {
        this.noticeEndDate = noticeEndDate;
    }

    public Integer getRef() {
        return ref;
    }

    public void setRef(Integer ref) {
        this.ref = ref;
    }

    public Integer getStep() {
        return step;
    }

    public void setStep(Integer step) {
        this.step = step;
    }

    public Integer getDepth() {
        return depth;
    }

    public void setDepth(Integer depth) {
        this.depth = depth;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public List<NoticeAttachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<NoticeAttachment> attachments) {
        this.attachments = attachments;
    }

    public List<NoticeComment> getComments() {
        return comments;
    }

    public void setComments(List<NoticeComment> comments) {
        this.comments = comments;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public Integer getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
    }

    public Integer getAttachmentCount() {
        return attachmentCount;
    }

    public void setAttachmentCount(Integer attachmentCount) {
        this.attachmentCount = attachmentCount;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
}
