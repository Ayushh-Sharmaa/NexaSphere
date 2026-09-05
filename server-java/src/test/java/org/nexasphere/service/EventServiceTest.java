package org.nexasphere.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.nexasphere.model.entity.EventEntity;
import org.nexasphere.model.events.AdminEvent;
import org.nexasphere.model.events.EventCreatedEvent;
import org.nexasphere.model.events.EventDeletedEvent;
import org.nexasphere.model.events.EventUpdatedEvent;
import org.nexasphere.repository.EventRepository;
import org.nexasphere.service.crud.EventService;
import org.nexasphere.util.Sanitizer;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock EventRepository repo;
    @Mock AdminEventPublisher publisher;
    @Mock Sanitizer sanitizer;
    @InjectMocks EventService service;

    @BeforeEach
    void setupSanitizer() {
        lenient().when(sanitizer.clean(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private EventEntity sampleEvent() {
        EventEntity e = new EventEntity();
        e.setName("KSS #154 — Advanced AI Topics");
        e.setShortName("KSS #154");
        e.setDateText("April 20, 2025");
        e.setDescription("Deep dive into advanced AI concepts.");
        e.setStatus("upcoming");
        e.setIcon("🤖");
        e.setTags(List.of("AI", "ML"));
        return e;
    }

    @Test
    void createEvent_autoGeneratesSlugId() {
        EventEntity input = sampleEvent();
        EventEntity saved = sampleEvent();
        saved.setId("kss-154-advanced-ai-topics");

        when(repo.existsById(anyString())).thenReturn(false);
        when(repo.save(any())).thenReturn(saved);

        EventEntity result = service.createEvent(input, "admin@test.com");

        assertThat(result.getId()).isEqualTo("kss-154-advanced-ai-topics");
        ArgumentCaptor<AdminEvent> cap = ArgumentCaptor.forClass(AdminEvent.class);
        verify(publisher).publish(cap.capture());
        assertThat(cap.getValue()).isInstanceOf(EventCreatedEvent.class);
        assertThat(cap.getValue().getAdminEmail()).isEqualTo("admin@test.com");
    }

    @Test
    void createEvent_slugCollision_appendsTimestamp() {
        EventEntity input = sampleEvent();
        when(repo.existsById(anyString())).thenReturn(true);
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EventEntity result = service.createEvent(input, "admin@test.com");

        assertThat(result.getId()).contains("-");
        // slug + "-" + timestamp means at least 2 dashes
        long dashCount = result.getId().chars().filter(c -> c == '-').count();
        assertThat(dashCount).isGreaterThan(1);
    }

    @Test
    void updateEvent_modifiesFieldsAndPublishesEvent() {
        EventEntity existing = sampleEvent();
        existing.setId("kss-154");
        existing.setStatus("upcoming");

        EventEntity updates = sampleEvent();
        updates.setStatus("completed");

        when(repo.findById("kss-154")).thenReturn(Optional.of(existing));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EventEntity result = service.updateEvent("kss-154", updates, "admin@test.com");

        assertThat(result.getStatus()).isEqualTo("completed");
        ArgumentCaptor<AdminEvent> cap = ArgumentCaptor.forClass(AdminEvent.class);
        verify(publisher).publish(cap.capture());
        assertThat(cap.getValue()).isInstanceOf(EventUpdatedEvent.class);
    }

    @Test
    void deleteEvent_notFound_throws404() {
        when(repo.findById("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteEvent("missing", "admin@test.com"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void deleteEvent_publishesDeletedEvent() {
        EventEntity existing = sampleEvent();
        existing.setId("kss-154");
        when(repo.findById("kss-154")).thenReturn(Optional.of(existing));

        service.deleteEvent("kss-154", "admin@test.com");

        ArgumentCaptor<AdminEvent> cap = ArgumentCaptor.forClass(AdminEvent.class);
        verify(publisher).publish(cap.capture());
        assertThat(cap.getValue()).isInstanceOf(EventDeletedEvent.class);
        assertThat(cap.getValue().getMetadata()).containsEntry("eventId", "kss-154");
    }

    @Test
    void getAllEvents_returnsSortedList() {
        EventEntity e1 = sampleEvent(); e1.setId("e1");
        EventEntity e2 = sampleEvent(); e2.setId("e2");
        when(repo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(e1, e2));

        List<EventEntity> result = service.getAllEvents();
        assertThat(result).containsExactly(e1, e2);
    }
}
