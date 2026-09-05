package org.nexasphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NexaSphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(NexaSphereApplication.class, args);
    }
}
