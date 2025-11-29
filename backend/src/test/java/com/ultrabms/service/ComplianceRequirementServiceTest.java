package com.ultrabms.service;

import com.ultrabms.dto.compliance.ComplianceRequirementDto;
import com.ultrabms.dto.compliance.CreateComplianceRequirementDto;
import com.ultrabms.dto.compliance.UpdateComplianceRequirementDto;
import com.ultrabms.entity.ComplianceRequirement;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.RequirementStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.ComplianceRequirementRepository;
import com.ultrabms.service.impl.ComplianceRequirementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ComplianceRequirementServiceImpl
 * Story 7.3: Compliance and Inspection Tracking
 * AC #51: Backend unit tests for service layer
 *
 * Tests CRUD operations for compliance requirements including:
 * - Create requirement
 * - Get requirement by ID
 * - Get all requirements with filters
 * - Update requirement
 * - Delete requirement (soft delete)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ComplianceRequirementService Unit Tests")
class ComplianceRequirementServiceTest {

    @Mock
    private ComplianceRequirementRepository requirementRepository;

    @InjectMocks
    private ComplianceRequirementServiceImpl requirementService;

    // Test data
    private ComplianceRequirement testRequirement;
    private CreateComplianceRequirementDto createDto;
    private UpdateComplianceRequirementDto updateDto;
    private UUID requirementId;
    private UUID propertyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        requirementId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testRequirement = ComplianceRequirement.builder()
                .requirementNumber("CMP-2025-0001")
                .requirementName("Fire Safety Inspection")
                .category(ComplianceCategory.FIRE)
                .description("Annual fire safety inspection requirement")
                .frequency(ComplianceFrequency.ANNUALLY)
                .applicableProperties(List.of(propertyId))
                .authorityAgency("Civil Defense")
                .status(RequirementStatus.ACTIVE)
                .isDeleted(false)
                .build();
        testRequirement.setId(requirementId);

        createDto = CreateComplianceRequirementDto.builder()
                .requirementName("Fire Safety Inspection")
                .category(ComplianceCategory.FIRE)
                .description("Annual fire safety inspection requirement")
                .frequency(ComplianceFrequency.ANNUALLY)
                .applicableProperties(List.of(propertyId))
                .authorityAgency("Civil Defense")
                .build();

        updateDto = UpdateComplianceRequirementDto.builder()
                .requirementName("Updated Fire Safety Inspection")
                .description("Updated description")
                .status(RequirementStatus.INACTIVE)
                .build();
    }

    // =========================================================================
    // CREATE REQUIREMENT TESTS
    // =========================================================================
    @Nested
    @DisplayName("Create Requirement Tests")
    class CreateRequirementTests {

        @Test
        @DisplayName("Should create requirement successfully")
        void createRequirement_Success() {
            // Given
            when(requirementRepository.save(any(ComplianceRequirement.class))).thenReturn(testRequirement);

            // When
            ComplianceRequirementDto result = requirementService.createRequirement(createDto);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRequirementName()).isEqualTo("Fire Safety Inspection");
            assertThat(result.getCategory()).isEqualTo(ComplianceCategory.FIRE);
            assertThat(result.getFrequency()).isEqualTo(ComplianceFrequency.ANNUALLY);
            verify(requirementRepository).save(any(ComplianceRequirement.class));
        }

        @Test
        @DisplayName("Should create requirement with minimal data")
        void createRequirement_MinimalData() {
            // Given
            CreateComplianceRequirementDto minimalDto = CreateComplianceRequirementDto.builder()
                    .requirementName("Basic Requirement")
                    .category(ComplianceCategory.SAFETY)
                    .frequency(ComplianceFrequency.MONTHLY)
                    .build();

            ComplianceRequirement minimalRequirement = ComplianceRequirement.builder()
                    .requirementNumber("CMP-2025-0002")
                    .requirementName("Basic Requirement")
                    .category(ComplianceCategory.SAFETY)
                    .frequency(ComplianceFrequency.MONTHLY)
                    .status(RequirementStatus.ACTIVE)
                    .isDeleted(false)
                    .build();
            minimalRequirement.setId(UUID.randomUUID());

            when(requirementRepository.save(any(ComplianceRequirement.class))).thenReturn(minimalRequirement);

            // When
            ComplianceRequirementDto result = requirementService.createRequirement(minimalDto);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRequirementName()).isEqualTo("Basic Requirement");
            assertThat(result.getCategory()).isEqualTo(ComplianceCategory.SAFETY);
            verify(requirementRepository).save(any(ComplianceRequirement.class));
        }
    }

    // =========================================================================
    // GET REQUIREMENT BY ID TESTS
    // =========================================================================
    @Nested
    @DisplayName("Get Requirement By ID Tests")
    class GetRequirementByIdTests {

        @Test
        @DisplayName("Should get requirement by ID successfully")
        void getRequirementById_Success() {
            // Given
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.of(testRequirement));

            // When
            ComplianceRequirementDto result = requirementService.getRequirementById(requirementId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRequirementName()).isEqualTo("Fire Safety Inspection");
            verify(requirementRepository).findById(requirementId);
        }

        @Test
        @DisplayName("Should throw exception when requirement not found")
        void getRequirementById_NotFound() {
            // Given
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> requirementService.getRequirementById(requirementId))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(requirementRepository).findById(requirementId);
        }

        @Test
        @DisplayName("Should throw exception when requirement is deleted")
        void getRequirementById_DeletedRequirement() {
            // Given
            testRequirement.setIsDeleted(true);
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.of(testRequirement));

            // When/Then
            assertThatThrownBy(() -> requirementService.getRequirementById(requirementId))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(requirementRepository).findById(requirementId);
        }
    }

    // =========================================================================
    // GET ALL REQUIREMENTS TESTS
    // =========================================================================
    @Nested
    @DisplayName("Get All Requirements Tests")
    class GetAllRequirementsTests {

        @Test
        @DisplayName("Should get all requirements without filters")
        void getAllRequirements_NoFilters() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<ComplianceRequirement> requirementPage = new PageImpl<>(
                    List.of(testRequirement), pageable, 1);

            when(requirementRepository.findWithFilters(isNull(), isNull(), isNull(), eq(pageable)))
                    .thenReturn(requirementPage);

            // When
            Page<ComplianceRequirementDto> result = requirementService.getAllRequirements(
                    null, null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getRequirementName()).isEqualTo("Fire Safety Inspection");
            verify(requirementRepository).findWithFilters(isNull(), isNull(), isNull(), eq(pageable));
        }

        @Test
        @DisplayName("Should get requirements with category filter")
        void getAllRequirements_WithCategoryFilter() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<ComplianceRequirement> requirementPage = new PageImpl<>(
                    List.of(testRequirement), pageable, 1);

            when(requirementRepository.findWithFilters(eq(ComplianceCategory.FIRE), isNull(), isNull(), eq(pageable)))
                    .thenReturn(requirementPage);

            // When
            Page<ComplianceRequirementDto> result = requirementService.getAllRequirements(
                    null, ComplianceCategory.FIRE, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(requirementRepository).findWithFilters(eq(ComplianceCategory.FIRE), isNull(), isNull(), eq(pageable));
        }

        @Test
        @DisplayName("Should get requirements with search filter")
        void getAllRequirements_WithSearchFilter() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<ComplianceRequirement> requirementPage = new PageImpl<>(
                    List.of(testRequirement), pageable, 1);

            when(requirementRepository.findWithFilters(isNull(), isNull(), eq("Fire"), eq(pageable)))
                    .thenReturn(requirementPage);

            // When
            Page<ComplianceRequirementDto> result = requirementService.getAllRequirements(
                    "Fire", null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(requirementRepository).findWithFilters(isNull(), isNull(), eq("Fire"), eq(pageable));
        }
    }

    // =========================================================================
    // UPDATE REQUIREMENT TESTS
    // =========================================================================
    @Nested
    @DisplayName("Update Requirement Tests")
    class UpdateRequirementTests {

        @Test
        @DisplayName("Should update requirement successfully")
        void updateRequirement_Success() {
            // Given
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.of(testRequirement));

            ComplianceRequirement updatedRequirement = ComplianceRequirement.builder()
                    .requirementNumber("CMP-2025-0001")
                    .requirementName("Updated Fire Safety Inspection")
                    .category(ComplianceCategory.FIRE)
                    .description("Updated description")
                    .frequency(ComplianceFrequency.ANNUALLY)
                    .status(RequirementStatus.INACTIVE)
                    .isDeleted(false)
                    .build();
            updatedRequirement.setId(requirementId);

            when(requirementRepository.save(any(ComplianceRequirement.class))).thenReturn(updatedRequirement);

            // When
            ComplianceRequirementDto result = requirementService.updateRequirement(requirementId, updateDto);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRequirementName()).isEqualTo("Updated Fire Safety Inspection");
            assertThat(result.getDescription()).isEqualTo("Updated description");
            assertThat(result.getStatus()).isEqualTo(RequirementStatus.INACTIVE);
            verify(requirementRepository).findById(requirementId);
            verify(requirementRepository).save(any(ComplianceRequirement.class));
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent requirement")
        void updateRequirement_NotFound() {
            // Given
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> requirementService.updateRequirement(requirementId, updateDto))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(requirementRepository).findById(requirementId);
            verify(requirementRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should update only provided fields")
        void updateRequirement_PartialUpdate() {
            // Given
            UpdateComplianceRequirementDto partialUpdate = UpdateComplianceRequirementDto.builder()
                    .requirementName("Only Name Updated")
                    .build();

            when(requirementRepository.findById(requirementId)).thenReturn(Optional.of(testRequirement));
            when(requirementRepository.save(any(ComplianceRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            ComplianceRequirementDto result = requirementService.updateRequirement(requirementId, partialUpdate);

            // Then
            assertThat(result).isNotNull();
            verify(requirementRepository).findById(requirementId);
            verify(requirementRepository).save(any(ComplianceRequirement.class));
        }
    }

    // =========================================================================
    // DELETE REQUIREMENT TESTS
    // =========================================================================
    @Nested
    @DisplayName("Delete Requirement Tests")
    class DeleteRequirementTests {

        @Test
        @DisplayName("Should soft delete requirement successfully")
        void deleteRequirement_Success() {
            // Given
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.of(testRequirement));
            when(requirementRepository.save(any(ComplianceRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            requirementService.deleteRequirement(requirementId, userId);

            // Then
            verify(requirementRepository).findById(requirementId);
            verify(requirementRepository).save(argThat(req ->
                req.getIsDeleted() && req.getDeletedBy().equals(userId)));
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent requirement")
        void deleteRequirement_NotFound() {
            // Given
            when(requirementRepository.findById(requirementId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> requirementService.deleteRequirement(requirementId, userId))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(requirementRepository).findById(requirementId);
            verify(requirementRepository, never()).save(any());
        }
    }

    // =========================================================================
    // GET REQUIREMENTS FOR PROPERTY TESTS
    // =========================================================================
    @Nested
    @DisplayName("Get Requirements For Property Tests")
    class GetRequirementsForPropertyTests {

        @Test
        @DisplayName("Should get requirements for specific property")
        void getRequirementsForProperty_Success() {
            // Given
            String propertyIdJson = "[\"" + propertyId.toString() + "\"]";
            when(requirementRepository.findActiveRequirementsForProperty(propertyIdJson))
                    .thenReturn(List.of(testRequirement));

            // When
            List<ComplianceRequirementDto> result = requirementService.getRequirementsForProperty(propertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRequirementName()).isEqualTo("Fire Safety Inspection");
            verify(requirementRepository).findActiveRequirementsForProperty(propertyIdJson);
        }

        @Test
        @DisplayName("Should return empty list when no requirements for property")
        void getRequirementsForProperty_Empty() {
            // Given
            String propertyIdJson = "[\"" + propertyId.toString() + "\"]";
            when(requirementRepository.findActiveRequirementsForProperty(propertyIdJson))
                    .thenReturn(List.of());

            // When
            List<ComplianceRequirementDto> result = requirementService.getRequirementsForProperty(propertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result).isEmpty();
            verify(requirementRepository).findActiveRequirementsForProperty(propertyIdJson);
        }
    }
}
