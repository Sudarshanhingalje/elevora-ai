package com.elevoraai.service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String mailFrom;

    public EmailService(JavaMailSender mailSender, @Value("${app.mail.from:no-reply@elevora.ai}") String mailFrom) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    @PostConstruct
    public void validateSmtpConnection() {
        log.info("Validating SMTP connectivity...");
        if (mailSender instanceof JavaMailSenderImpl mailSenderImpl) {
            try {
                mailSenderImpl.testConnection();
                log.info("SMTP connection validation SUCCESSFUL to {}:{}", mailSenderImpl.getHost(), mailSenderImpl.getPort());
            } catch (MessagingException e) {
                log.error("SMTP connection validation FAILED to {}:{}. Error: {}", 
                        mailSenderImpl.getHost(), mailSenderImpl.getPort(), e.getMessage());
            }
        } else {
            log.warn("JavaMailSender is not an instance of JavaMailSenderImpl. Skipping connectivity check.");
        }
    }

    public boolean send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            log.info("Attempting to send email to {} with subject: {}", to, subject);
            mailSender.send(message);
            log.info("Email successfully sent to {}", to);
            return true;
        } catch (MailException ex) {
            log.error("SMTP delivery FAILED to {}. Error: {}", to, ex.getMessage(), ex);
            return false;
        }
    }
}
