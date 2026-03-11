package com.example.demo2.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/images/profile")
public class ProfileImageController {

    private final String uploadPath = System.getProperty("user.dir") + File.separator + "uploads" + File.separator + "profile";

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadPath).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                MediaType mediaType = MediaType.IMAGE_JPEG;
                if (filename.toLowerCase().endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
                else if (filename.toLowerCase().endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;
                else if (filename.toLowerCase().endsWith(".webp")) mediaType = MediaType.parseMediaType("image/webp");

                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
