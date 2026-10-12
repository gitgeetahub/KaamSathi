package com.kaamsathi.api;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> dataConflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("success", false, "message", "The requested record conflicts with existing data."));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> invalidJson(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid JSON request body."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> unexpected(Exception exception) {
        System.err.println("Unexpected API error: " + exception.getMessage());
        return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", "An unexpected server error occurred."));
    }
}
