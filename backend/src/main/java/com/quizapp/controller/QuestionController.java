package com.quizapp.controller;

import com.quizapp.model.Question;
import com.quizapp.repository.QuestionRepository;
import com.quizapp.service.ExcelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "http://localhost:3000")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ExcelService excelService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            List<Question> questions = excelService.parseExcel(file);
            questionRepository.saveAll(questions);
            return ResponseEntity.ok(Map.of("message", "File uploaded successfully", "count", questions.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/topics")
    public ResponseEntity<List<String>> getAllTopics() {
        return ResponseEntity.ok(questionRepository.findDistinctTopics());
    }

    @GetMapping("/topic/{topic}")
    public ResponseEntity<List<Question>> getQuestionsByTopic(@PathVariable String topic) {
        return ResponseEntity.ok(questionRepository.findByTopic(topic));
    }

    @PutMapping("/{id}/mark-known")
    public ResponseEntity<?> markAsKnown(@PathVariable Long id) {
        return questionRepository.findById(id)
                .map(question -> {
                    question.setKnown(true);
                    questionRepository.save(question);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/increment-view")
    public ResponseEntity<?> incrementViewCount(@PathVariable Long id) {
        return questionRepository.findById(id)
                .map(question -> {
                    question.setViewCount(question.getViewCount() + 1);
                    questionRepository.save(question);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAll() {
        questionRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}