package com.ultrabms.service;

import com.ultrabms.dto.leads.*;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.LeadDocument;
import com.ultrabms.entity.LeadHistory;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.LeadDocumentRepository;
import com.ultrabms.repository.LeadHistoryRepository;
import com.ultrabms.repository.LeadRepository;
import com.ultrabms.service.impl.LeadServiceImpl;
import com.ultrabms.util.LeadNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LeadService
 * Tests lead creation, update, search, and document management
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LeadService Unit Tests")
class LeadServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private LeadDocumentRepository leadDocumentRepository;

    @Mock
    private LeadHistoryRepository leadHistoryRepository;

    @Mock
    private LeadNumberGenerator leadNumberGenerator;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private LeadServiceImpl leadService;

    private UUID testUserId;
    private UUID testLeadId;
    private Lead testLead;
    private CreateLeadRequest createLeadRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testLeadId = UUID.randomUUID();

        testLead = Lead.builder()
                .id(testLeadId)
                .leadNumber("LEAD-20251115-0001")
                .fullName("Ahmed Hassan")
                .email("ahmed@example.com")
                .contactNumber("+971501234567")
                .leadSource(Lead.LeadSource.WEBSITE)
                .status(Lead.LeadStatus.NEW_LEAD)
                .createdBy(testUserId)
                .build();

        createLeadRequest = CreateLeadRequest.builder()
                .fullName("Ahmed Hassan")
                .email("ahmed@example.com")
                .contactNumber("+971501234567")
                .leadSource(Lead.LeadSource.WEBSITE)
                .notes("Looking for 2 BHK apartment")
                .build();
    }

    @Test
    @DisplayName("Should create lead successfully")
    void testCreateLead_Success() {
        // Arrange
        when(leadNumberGenerator.generate()).thenReturn("LEAD-20251115-0001");
        when(leadRepository.save(any(Lead.class))).thenReturn(testLead);

        // Act
        LeadResponse response = leadService.createLead(createLeadRequest, testUserId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getLeadNumber()).isEqualTo("LEAD-20251115-0001");
        assertThat(response.getFullName()).isEqualTo("Ahmed Hassan");
        assertThat(response.getStatus()).isEqualTo(Lead.LeadStatus.NEW_LEAD);

        verify(leadRepository).save(any(Lead.class));
        verify(leadHistoryRepository).save(any(LeadHistory.class));
    }

    @Test
    @DisplayName("Should get lead by ID successfully")
    void testGetLeadById_Success() {
        // Arrange
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));

        // Act
        LeadResponse response = leadService.getLeadById(testLeadId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(testLeadId);
        assertThat(response.getFullName()).isEqualTo("Ahmed Hassan");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when lead not found")
    void testGetLeadById_NotFound() {
        // Arrange
        when(leadRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> leadService.getLeadById(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Lead not found");
    }

    @Test
    @DisplayName("Should update lead successfully")
    void testUpdateLead_Success() {
        // Arrange
        UpdateLeadRequest updateRequest = UpdateLeadRequest.builder()
                .fullName("Updated Name")
                .email("updated@example.com")
                .build();

        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(leadRepository.save(any(Lead.class))).thenReturn(testLead);

        // Act
        LeadResponse response = leadService.updateLead(testLeadId, updateRequest);

        // Assert
        assertThat(response).isNotNull();
        verify(leadRepository).save(any(Lead.class));
    }

    @Test
    @DisplayName("Should search leads with filters")
    void testSearchLeads_WithFilters() {
        // Arrange
        List<Lead> leads = Arrays.asList(testLead);
        Page<Lead> page = new PageImpl<>(leads);
        Pageable pageable = PageRequest.of(0, 20);

        when(leadRepository.searchLeads(
                any(Lead.LeadStatus.class),
                any(Lead.LeadSource.class),
                anyString(),
                any(Pageable.class)
        )).thenReturn(page);

        // Act
        Page<LeadResponse> result = leadService.searchLeads(
                Lead.LeadStatus.NEW_LEAD,
                Lead.LeadSource.WEBSITE,
                "Ahmed",
                pageable
        );

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getFullName()).isEqualTo("Ahmed Hassan");
    }

    @Test
    @DisplayName("Should update lead status successfully")
    void testUpdateLeadStatus_Success() {
        // Arrange
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(leadRepository.save(any(Lead.class))).thenReturn(testLead);

        // Act
        LeadResponse response = leadService.updateLeadStatus(
                testLeadId,
                Lead.LeadStatus.QUOTATION_SENT,
                testUserId
        );

        // Assert
        assertThat(response).isNotNull();
        verify(leadRepository).save(any(Lead.class));
        verify(leadHistoryRepository).save(any(LeadHistory.class));
    }

    @Test
    @DisplayName("Should upload document successfully")
    void testUploadDocument_Success() {
        // Arrange
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getOriginalFilename()).thenReturn("emirates-id.pdf");

        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(fileStorageService.storeFile(any(), anyString())).thenReturn("leads/123/doc.pdf");
        when(leadDocumentRepository.save(any(LeadDocument.class))).thenReturn(new LeadDocument());

        // Act
        LeadDocumentResponse response = leadService.uploadDocument(
                testLeadId,
                mockFile,
                LeadDocument.DocumentType.EMIRATES_ID,
                testUserId
        );

        // Assert
        assertThat(response).isNotNull();
        verify(fileStorageService).storeFile(any(), anyString());
        verify(leadDocumentRepository).save(any(LeadDocument.class));
        verify(leadHistoryRepository).save(any(LeadHistory.class));
    }

    @Test
    @DisplayName("Should throw ValidationException when file is empty")
    void testUploadDocument_EmptyFile() {
        // Arrange
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(true);
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));

        // Act & Assert
        assertThatThrownBy(() -> leadService.uploadDocument(
                testLeadId,
                mockFile,
                LeadDocument.DocumentType.EMIRATES_ID,
                testUserId
        ))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("File is empty");
    }

    @Test
    @DisplayName("Should throw ValidationException when file exceeds max size")
    void testUploadDocument_FileTooLarge() {
        // Arrange
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(6 * 1024 * 1024L); // 6MB
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));

        // Act & Assert
        assertThatThrownBy(() -> leadService.uploadDocument(
                testLeadId,
                mockFile,
                LeadDocument.DocumentType.EMIRATES_ID,
                testUserId
        ))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("exceeds maximum limit");
    }

    @Test
    @DisplayName("Should delete lead successfully")
    void testDeleteLead_Success() {
        // Arrange
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));

        // Act
        leadService.deleteLead(testLeadId);

        // Assert
        verify(leadRepository).delete(testLead);
    }
}
