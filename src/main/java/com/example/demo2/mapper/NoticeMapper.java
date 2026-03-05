package com.example.demo2.mapper;

import com.example.demo2.model.Notice;
import com.example.demo2.model.NoticeAttachment;
import com.example.demo2.model.NoticeComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface NoticeMapper {
        // Notice
        List<Notice> findAll(@Param("limit") int limit,
                        @Param("offset") int offset,
                        @Param("searchTitle") String searchTitle,
                        @Param("memberId") String memberId);

        int countAll(@Param("searchTitle") String searchTitle,
                        @Param("memberId") String memberId);

        Notice findById(Long id);

        int insert(Notice notice);

        int update(Notice notice);

        int delete(Long id);

        int updateViewCount(Long id);

        // Hierarchy
        int updateReplyStep(@Param("ref") Integer ref, @Param("step") Integer step);

        int updateRef(Long id);

        // Attachments
        int insertAttachment(NoticeAttachment attachment);

        List<NoticeAttachment> findAttachmentsByNoticeId(Long noticeId);

        List<NoticeAttachment> findAttachmentsByNoticeIds(@Param("noticeIds") List<Long> noticeIds);

        NoticeAttachment findAttachmentById(Long id);

        int deleteAttachment(Long id);

        // Comments
        int insertComment(NoticeComment comment);

        List<NoticeComment> findCommentsByNoticeId(Long noticeId);

        NoticeComment findCommentById(Long id);

        int deleteComment(Long id);
}
