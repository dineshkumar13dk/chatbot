package com.chatbot.controller;

import java.io.File;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.chatbot.entity.ChatBotQA;
import com.chatbot.service.ChatBotService;

@RestController
@RequestMapping("/api")
public class FileController {

	private final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private ChatBotService chatBotService;

	@GetMapping("/files")
	public List<String> getFiles(@RequestParam String path) {
		File folder = new File(path);
		List<String> fileNames = new ArrayList<>();
		if (folder.exists() && folder.isDirectory()) {
			File[] files = folder.listFiles();
			if (files != null) {
				for (File file : files) {
					fileNames.add(file.getAbsolutePath()); // Return full path
				}
			}
		}
		return fileNames;
	}

	@GetMapping("/files/*")
	public Resource serveFile(@RequestParam String path, @RequestParam String fileName,
			RedirectAttributes redirectAttributes) {
		try {
			File file = new File(path, fileName);
			if (file.exists() && !file.isDirectory()) {
				return new UrlResource(file.toURI());
			}
		} catch (MalformedURLException e) {
			e.printStackTrace();
		}
		return null;
	}
	
	@GetMapping("/get-answer-by-id")
	public ResponseEntity<?> getAnswerById(@RequestParam Integer id) {
		ChatBotQA chatBotQA = chatBotService.getAnswerById(id);
		if (chatBotQA != null) {
			System.out.println("Retrieved Answer By id:" + chatBotQA);
			logger.info("Answer Got By iD:" + id);
			return ResponseEntity.ok(chatBotQA);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping("/get-answer")
	public ResponseEntity<?> getAnswer(@RequestParam String input) {
		// Check if input is a specific question
		ChatBotQA question = chatBotService.getQuestion(input);
		if (question != null) {
			System.out.println("Recieved Question:" + question);
			logger.info("Get Answer by specific question");
			return ResponseEntity.ok(Collections.singletonList(question)); // Return the answer for the specific
																			// question
		}

		// Check if input matches multiple questions for a keyword
		List<ChatBotQA> keywordMatches = chatBotService.getQuestionsByKeyword(input);
		if (keywordMatches != null && !keywordMatches.isEmpty()) {
			System.out.println("Keyword Matched:" + keywordMatches);
			logger.info("Get Answer for Multiple Question");
			return ResponseEntity.ok(keywordMatches); // Return all related questions and answers
		}

		// Return a default message if no match is found
		logger.info("No Answer Found");
		return ResponseEntity.ok("No answer found. Try asking in a different way.");
	}
	
    @PostMapping("/save-question")
    public ResponseEntity<String> saveQuestion(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        String label = request.get("label");

        if (!isQuestionFormat(question)) {
        	System.out.println("<<--Invalid Question Format!!-->>");
			logger.info("Question Format is Invalid:" + question);
            return ResponseEntity.badRequest().body("Try again later.");
        }

        if (question != null && !question.trim().isEmpty()) {
            if (chatBotService.questionExists(question)) {
            	System.out.println("<<--Question Already Exists!!-->>");
				System.out.println("Recieved Question exists:" + question);
				logger.info("Question Already Exists:" + question);
                return ResponseEntity.badRequest().body("Question already exists.");
            }
            chatBotService.saveQuestion(question, label);
        	System.out.println("<<--Question Saved Successfully!!-->>");
			System.out.println("Recieved Question saved:" + question);
			logger.info("Question has been saved:" + question);
            return ResponseEntity.ok("Question saved successfully.");
        }
    	System.out.println("<<--Question is not a valid!!-->>");
		logger.info("Question is not valid" + question);
        return ResponseEntity.badRequest().body("Invalid question.");
    }

	private boolean isQuestionFormat(String question) {
		String[] questionWords = { "what", "where", "how", "why", "when", "which", "who", "whose", "whom" };
		String lowerCaseQuestion = question.toLowerCase().trim();
		for (String word : questionWords) {
			if (lowerCaseQuestion.startsWith(word)) {
				logger.info("Question is in valid with question patterns like 'what,where,etc..': true(boolean)");
				return true;
			}
		}
		return false;
	}

}