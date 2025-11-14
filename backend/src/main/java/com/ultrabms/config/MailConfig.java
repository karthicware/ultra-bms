package com.ultrabms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration for JavaMailSender bean.
 * Explicitly creates JavaMailSender to ensure it's available in all profiles.
 */
@Configuration
@RequiredArgsConstructor
public class MailConfig {

    private final Environment environment;

    @Bean
    @ConditionalOnMissingBean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(environment.getProperty("spring.mail.host", "localhost"));
        mailSender.setPort(Integer.parseInt(environment.getProperty("spring.mail.port", "1025")));
        mailSender.setUsername(environment.getProperty("spring.mail.username", "dev"));
        mailSender.setPassword(environment.getProperty("spring.mail.password", "dev"));

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", environment.getProperty("spring.mail.properties.mail.smtp.auth", "false"));
        props.put("mail.smtp.starttls.enable", environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "false"));

        return mailSender;
    }
}
