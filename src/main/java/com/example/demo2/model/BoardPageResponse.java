package com.example.demo2.model;

import java.util.List;

public class BoardPageResponse {
    private List<Board> boards;
    private int totalCount;
    private int totalPages;
    private int currentPage;

    public BoardPageResponse(List<Board> boards, int totalCount, int totalPages, int currentPage) {
        this.boards = boards;
        this.totalCount = totalCount;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
    }

    // Getters
    public List<Board> getBoards() {
        return boards;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public int getCurrentPage() {
        return currentPage;
    }
}
