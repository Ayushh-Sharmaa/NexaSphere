package org.nexasphere.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
public class EventEntity {

    @Id
    private String id;

    @NotBlank
    @Size(max = 120)
    private String name;

    @Size(max = 60)
    private String shortName;

    @NotBlank
    @Size(max = 120)
    private String dateText;

    @NotBlank
    @Size(max = 1200)
    private String description;

    @NotBlank
    @Pattern(regexp = "upcoming|completed")
    private String status;

    private String icon = "📌";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_tags", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "tags")
    @Size(max = 12)
    private List<@Size(max = 40) String> tags = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @PrePersist
    public void generateId() {
        if (this.id == null || this.id.isEmpty()) {
            this.id = slugify(this.name);
        }
    }

    private String slugify(String text) {
        if (text == null) return "event-" + System.currentTimeMillis();
        String slug = text.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        return slug.isEmpty() ? "event-" + System.currentTimeMillis() : slug;
    }
}
