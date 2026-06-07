package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/media")
@PreAuthorize("hasRole('ADMIN')")
public class MediaUploadController {

    @Value("${app.upload.dir:D:/elevora_projects/elevora-ai/elevora-ai-main/frontend/public/assets}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "file";
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        
        // Validate size and extensions
        boolean isVideo = extension.equals("mp4") || extension.equals("webm") || extension.equals("mov");
        boolean isImage = extension.equals("png") || extension.equals("jpg") || extension.equals("jpeg") || extension.equals("webp") || extension.equals("gif");

        if (!isVideo && !isImage) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file format. Supported: MP4, WebM, MOV, PNG, JPG, JPEG, WEBP, GIF");
        }

        // Validate max sizes (100MB for video, 10MB for image)
        long maxSize = isVideo ? 100 * 1024 * 1024L : 10 * 1024 * 1024L;
        if (file.getSize() > maxSize) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds maximum allowed size (" + (isVideo ? "100MB" : "10MB") + ")");
        }

        try {
            // Ensure directory exists
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Create unique name
            String uniqueName = "upload_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
            Path targetPath = Paths.get(uploadDir, uniqueName);
            
            // Transfer/save file
            Files.write(targetPath, file.getBytes());

            // URL path relative to public frontend folder
            String urlPath = "/assets/" + uniqueName;

            return ResponseEntity.ok(new UploadResponse(urlPath, uniqueName, file.getSize()));
        } catch (IOException e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }

    public record UploadResponse(String url, String filename, long size) {}
}
