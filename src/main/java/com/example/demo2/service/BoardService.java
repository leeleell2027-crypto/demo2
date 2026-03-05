package com.example.demo2.service;

import com.example.demo2.mapper.BoardMapper;
import com.example.demo2.model.Board;
import com.example.demo2.model.BoardPageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class BoardService {

    @Autowired
    private BoardMapper boardMapper;

    // 이미지 저장 경로 (프로젝트 루트의 uploads 폴더)
    private final String uploadPath = System.getProperty("user.dir") + File.separator + "uploads";

    public BoardPageResponse getPaginatedBoards(
            int page,
            int size,
            String searchTitle,
            String startDate,
            String endDate,
            String category1,
            String category2,
            String category3) {
        int offset = page * size;
        List<Board> boards = boardMapper.findAll(size, offset, searchTitle, startDate, endDate, category1, category2,
                category3);
        int totalCount = boardMapper.countAll(searchTitle, startDate, endDate, category1, category2, category3);
        int totalPages = (int) Math.ceil((double) totalCount / size);

        return new BoardPageResponse(boards, totalCount, totalPages, page);
    }

    public void createBoard(Board board, MultipartFile imageFile) throws IOException {
        String imageUrl = saveImage(imageFile);
        if (imageUrl != null) {
            board.setImageUrl(imageUrl);
        }
        boardMapper.insert(board);
    }

    public void updateBoard(Board board, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = saveImage(imageFile);
            board.setImageUrl(imageUrl);
        }
        boardMapper.update(board);
    }

    public void deleteBoard(Long id) {
        boardMapper.delete(id);
    }

    private String saveImage(MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            // 폴더 생성
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 파일명 중복 방지 (UUID)
            String originalFilename = imageFile.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "unknown.jpg";
            }
            String extension = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String savedFilename = UUID.randomUUID().toString() + extension;

            // 파일 저장
            File fileToSave = new File(uploadPath + File.separator + savedFilename);
            imageFile.transferTo(fileToSave);

            // 이미지 URL 설정 (클라이언트 접근용)
            return "/api/images/" + savedFilename;
        }
        return null;
    }
}
