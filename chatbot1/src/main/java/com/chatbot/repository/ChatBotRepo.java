package com.chatbot.repository;
 
import java.util.List;
 
import org.springframework.data.jpa.repository.JpaRepository;
 
import com.chatbot.entity.ChatBotQA;
 
public interface ChatBotRepo extends JpaRepository<ChatBotQA, Integer> {
 
    ChatBotQA findByQuestion(String question);
 
    List<ChatBotQA> findAllByKeyword(String keyword);
 
    ChatBotQA findById(int id);
}