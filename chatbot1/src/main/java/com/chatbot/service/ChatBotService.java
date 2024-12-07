package com.chatbot.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.chatbot.entity.ChatBotQA;
import com.chatbot.repository.ChatBotRepo;

@Service
public class ChatBotService {

	@Autowired
	private ChatBotRepo chatBotRepo;

	public ChatBotQA getQuestion(String question) {
		// Lowercase the question and remove any question marks before searching
		String processedQuestion = question.toLowerCase().replace("?", "").trim();
		return chatBotRepo.findByQuestion(processedQuestion);
	}

	public List<ChatBotQA> getQuestionsByKeyword(String keyword) {
		// Lowercase the keyword and remove question marks for search
		String processedKeyword = keyword.toLowerCase().replace("?", "").trim();
		return chatBotRepo.findAllByKeyword(processedKeyword);
	}

	public ChatBotQA getAnswerById(Integer id) {
		return chatBotRepo.findById(id).orElse(null);
	}

	public ChatBotQA saveQuestion(String question, String label) {
		ChatBotQA chatBotQA = new ChatBotQA();
		chatBotQA.setQuestion(question);
		chatBotQA.setAnswer("Your question is under updating, try again later.");
		chatBotQA.setKeyword("general");
		chatBotQA.setLabel(label);

		try {
			return chatBotRepo.save(chatBotQA);
		} catch (DataIntegrityViolationException e) {
			System.err.println("Duplicate entry detected: " + e.getMessage());
			return null;
		} catch (Exception e) {
			System.err.println("An error occurred while saving the question: " + e.getMessage());
			return null;
		}
	}

	public boolean questionExists(String question) {
		return chatBotRepo.findByQuestion(question) != null;
	}
}
