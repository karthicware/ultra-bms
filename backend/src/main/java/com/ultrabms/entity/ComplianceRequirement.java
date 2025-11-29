package com.ultrabms.entity;

import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.RequirementStatus;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.util.List;
import java.util.UUID;

/**
 * ComplianceRequirement entity representing regulatory compliance requirements.
 * Stores requirement details, frequency, and applicable properties.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #1: ComplianceRequirement JPA entity
 */
@Entity
@Table(
    name = "compliance_requirements",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_compliance_requirement_number", columnNames = {"requirement_number"})
    },
    indexes = {
        @Index(name = "idx_compliance_requirements_category", columnList = "category"),
        @Index(name = "idx_compliance_requirements_status", columnList = "status"),
        @Index(name = "idx_compliance_requirements_frequency", columnList = "frequency"),
        @Index(name = "idx_compliance_requirements_number", columnList = "requirement_number")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceRequirement extends BaseEntity {

    // =================================================================
    // REQUIREMENT IDENTIFICATION
    // =================================================================

    /**
     * Unique requirement number in format CMP-{YEAR}-{SEQUENCE}
     * Example: CMP-2025-0001
     * Auto-generated on entity creation
     * AC #11: requirementNumber format
     */
    @NotBlank(message = "Requirement number cannot be blank")
    @Size(max = 20, message = "Requirement number must be less than 20 characters")
    @Column(name = "requirement_number", nullable = false, unique = true, length = 20)
    private String requirementNumber;

    /**
     * Name of the compliance requirement
     */
    @NotBlank(message = "Requirement name is required")
    @Size(max = 200, message = "Requirement name must be less than 200 characters")
    @Column(name = "requirement_name", nullable = false, length = 200)
    private String requirementName;

    // =================================================================
    // REQUIREMENT DETAILS
    // =================================================================

    /**
     * Category of compliance (SAFETY, FIRE, ELECTRICAL, etc.)
     */
    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private ComplianceCategory category;

    /**
     * Detailed description of the compliance requirement
     */
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    @Column(name = "description", length = 1000)
    private String description;

    /**
     * List of property IDs this requirement applies to
     * null means ALL properties
     * Stored as JSON array
     */
    @Type(JsonType.class)
    @Column(name = "applicable_properties", columnDefinition = "jsonb")
    private List<UUID> applicableProperties;

    /**
     * How often compliance needs to be met
     */
    @NotNull(message = "Frequency is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    private ComplianceFrequency frequency;

    /**
     * Authority or agency that enforces this requirement
     */
    @Size(max = 200, message = "Authority/Agency must be less than 200 characters")
    @Column(name = "authority_agency", length = 200)
    private String authorityAgency;

    /**
     * Description of penalties for non-compliance
     */
    @Size(max = 500, message = "Penalty description must be less than 500 characters")
    @Column(name = "penalty_description", length = 500)
    private String penaltyDescription;

    /**
     * Active status of the requirement (ACTIVE/INACTIVE)
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RequirementStatus status = RequirementStatus.ACTIVE;

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if requirement applies to all properties
     * @return true if applicableProperties is null (means all properties)
     */
    public boolean appliesToAllProperties() {
        return applicableProperties == null || applicableProperties.isEmpty();
    }

    /**
     * Check if requirement applies to a specific property
     * @param propertyId the property UUID to check
     * @return true if requirement applies to the property
     */
    public boolean appliesToProperty(UUID propertyId) {
        if (appliesToAllProperties()) {
            return true;
        }
        return applicableProperties.contains(propertyId);
    }

    /**
     * Check if this requirement generates recurring schedules
     * @return true if frequency is not ONE_TIME
     */
    public boolean isRecurring() {
        return frequency != ComplianceFrequency.ONE_TIME;
    }
}
