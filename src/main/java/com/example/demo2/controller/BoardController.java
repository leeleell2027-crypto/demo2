package com.example.demo2.controller;

import com.example.demo2.mapper.BoardMapper;
import com.example.demo2.model.Board;
import com.example.demo2.model.BoardPageResponse;
import com.example.demo2.service.BoardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    @Autowired
    private BoardService boardService;

    @GetMapping
    public BoardPageResponse getBoards(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "16") int size) {
        return boardService.getPaginatedBoards(page, size);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> addBoard(
            @RequestParam("title") String title,
            @RequestParam("eventDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam("content") String content,
            @RequestParam("category1") String category1,
            @RequestParam("category2") String category2,
            @RequestParam("category3") String category3,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Board board = new Board();
            board.setTitle(title);
            board.setEventDate(eventDate);
            board.setContent(content);
            board.setCategory1(category1);
            board.setCategory2(category2);
            board.setCategory3(category3);

            boardService.createBoard(board, image);
            return ResponseEntity.ok("Board entry created successfully");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload image: " + e.getMessage());
        }
    }
}
