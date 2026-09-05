package org.nexasphere.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.nexasphere.model.entity.ActivityEvent;
import org.nexasphere.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.startsWith;

@SpringBootTest
@AutoConfigureMockMvc
class ActivityEventsControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TokenService tokenService;

    @Test
    void getEvents_ValidKey_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/content/activity-events/insight-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getEvents_InvalidKey_Returns400() throws Exception {
        mockMvc.perform(get("/api/content/activity-events/invalid-key"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_ValidAdmin_Succeeds() throws Exception {
        String token = tokenService.createSession("admin@nexasphere.org").token();
        
        ActivityEvent event = new ActivityEvent();
        event.setName("New KSS");
        event.setDateText("April 2025");
        event.setTagline("New Tagline");
        event.setDescription("New Description");
        event.setStatus("upcoming");

        mockMvc.perform(post("/api/admin/activity-events/insight-session")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(event)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(startsWith("manual-")))
                .andExpect(jsonPath("$.activityKey").value("insight-session"));
    }

    @Test
    void createEvent_NoAuth_Returns401OrForbidden() throws Exception {
        ActivityEvent event = new ActivityEvent();
        event.setName("Unauthorized Event");

        mockMvc.perform(post("/api/admin/activity-events/insight-session")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(event)))
                .andExpect(status().is4xxClientError());
    }
}
