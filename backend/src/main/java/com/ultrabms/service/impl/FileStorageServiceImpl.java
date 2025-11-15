package com.ultrabms.service.impl;

import com.ultrabms.exception.FileStorageException;
import com.ultrabms.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Implementation of FileStorageService
 */
@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path uploadRoot;

    public FileStorageServiceImpl(@Value("${app.upload.dir:./uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadRoot);
            log.info("Upload directory initialized: {}", this.uploadRoot);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String directory) {
        // Sanitize filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Check for invalid characters
            if (originalFilename.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence: " + originalFilename);
            }

            // Create unique filename
            String fileExtension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = originalFilename.substring(dotIndex);
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Create directory if not exists
            Path targetDirectory = this.uploadRoot.resolve(directory);
            Files.createDirectories(targetDirectory);

            // Store file
            Path targetPath = targetDirectory.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path
            String relativePath = directory + "/" + uniqueFilename;
            log.info("File stored successfully: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalFilename, e);
        }
    }

    @Override
    public byte[] loadFile(String filePath) {
        try {
            Path path = this.uploadRoot.resolve(filePath).normalize();

            // Security check: ensure path is within upload root
            if (!path.startsWith(this.uploadRoot)) {
                throw new FileStorageException("Invalid file path: " + filePath);
            }

            if (!Files.exists(path)) {
                throw new FileStorageException("File not found: " + filePath);
            }

            return Files.readAllBytes(path);

        } catch (IOException e) {
            throw new FileStorageException("Failed to read file: " + filePath, e);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path path = this.uploadRoot.resolve(filePath).normalize();

            // Security check: ensure path is within upload root
            if (!path.startsWith(this.uploadRoot)) {
                throw new FileStorageException("Invalid file path: " + filePath);
            }

            if (Files.exists(path)) {
                Files.delete(path);
                log.info("File deleted successfully: {}", filePath);
            }

        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + filePath, e);
        }
    }

    @Override
    public boolean fileExists(String filePath) {
        Path path = this.uploadRoot.resolve(filePath).normalize();
        return Files.exists(path) && path.startsWith(this.uploadRoot);
    }
}
