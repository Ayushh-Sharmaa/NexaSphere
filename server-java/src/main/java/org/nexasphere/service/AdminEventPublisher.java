package org.nexasphere.service;

import org.nexasphere.model.events.AdminEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("modelAdminEventPublisher")
public class AdminEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(AdminEventPublisher.class);

    public void publish(AdminEvent event) {
        log.info("[{}] id={} admin={} metadata={}",
                event.getType(), event.getId(), event.getAdminEmail(), event.getMetadata());
    }
}
