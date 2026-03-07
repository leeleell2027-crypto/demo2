package com.example.demo2.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
public class ImageController {

    private final List<String> IMAGE_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp");

    @GetMapping
    public ResponseEntity<?> listImages(@RequestParam String path) {
        File directory = new File(path);

        if (!directory.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Directory not found"));
        }

        if (!directory.isDirectory()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Path is not a directory"));
        }

        File[] files = directory.listFiles();
        List<Map<String, Object>> imageList = new ArrayList<>();
        List<Map<String, Object>> folderList = new ArrayList<>();

        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    Map<String, Object> folderInfo = new HashMap<>();
                    folderInfo.put("name", file.getName());
                    folderInfo.put("path", file.getAbsolutePath());
                    folderList.add(folderInfo);
                } else if (file.isFile() && isImageFile(file.getName())) {
                    Map<String, Object> imageInfo = new HashMap<>();
                    imageInfo.put("name", file.getName());
                    imageInfo.put("path", file.getAbsolutePath());
                    imageInfo.put("size", file.length());
                    imageList.add(imageInfo);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("images", imageList);
        response.put("folders", folderList);

        // Fetch Siblings
        List<Map<String, Object>> siblingList = new ArrayList<>();
        File parent = directory.getParentFile();
        if (parent != null && parent.exists() && parent.isDirectory()) {
            File[] siblings = parent.listFiles();
            if (siblings != null) {
                for (File s : siblings) {
                    if (s.isDirectory() && !s.getAbsolutePath().equals(directory.getAbsolutePath())) {
                        Map<String, Object> siblingInfo = new HashMap<>();
                        siblingInfo.put("name", s.getName());
                        siblingInfo.put("path", s.getAbsolutePath());
                        siblingList.add(siblingInfo);
                    }
                }
            }
        }
        response.put("siblings", siblingList);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/select")
    public ResponseEntity<?> selectFolder() {
        try {
            // JVM must not be in headless mode for JFileChooser
            System.setProperty("java.awt.headless", "false");

            javax.swing.JFileChooser chooser = new javax.swing.JFileChooser();
            chooser.setFileSelectionMode(javax.swing.JFileChooser.DIRECTORIES_ONLY);
            chooser.setDialogTitle("폴더를 선택하세요");

            int returnVal = chooser.showOpenDialog(null);
            if (returnVal == javax.swing.JFileChooser.APPROVE_OPTION) {
                File selected = chooser.getSelectedFile();
                return ResponseEntity.ok(Map.of("path", selected.getAbsolutePath()));
            } else {
                return ResponseEntity.ok(Map.of("cancelled", true));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not open folder picker: " + e.getMessage()));
        }
    }

    @GetMapping("/view")
    public ResponseEntity<Resource> viewImage(@RequestParam String path) throws IOException {
        File file = new File(path);

        if (!file.exists() || !file.isFile() || !isImageFile(file.getName())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new FileSystemResource(file);
        String contentType = Files.probeContentType(file.toPath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getName() + "\"")
                .body(resource);
    }

    /**
     * Asset Gallery 등에서 파일명으로 직접 요청 시 uploads 폴더에서 파일을 서빙하는 핸들러
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getImage(@org.springframework.web.bind.annotation.PathVariable String filename)
            throws IOException {
        String uploadPath = System.getProperty("user.dir") + File.separator + "uploads";
        File file = new File(uploadPath + File.separator + filename);

        if (!file.exists() || !file.isFile() || !isImageFile(file.getName())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new FileSystemResource(file);
        String contentType = Files.probeContentType(file.toPath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    private boolean isImageFile(String filename) {
        String lowerName = filename.toLowerCase();
        return IMAGE_EXTENSIONS.stream().anyMatch(lowerName::endsWith);
    }
}
