package com.elevoraai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ElevoraAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElevoraAiApplication.class, args);
    }
}
