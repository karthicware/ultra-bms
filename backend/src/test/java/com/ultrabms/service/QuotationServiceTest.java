package com.ultrabms.service;

import com.ultrabms.service.IEmailService;

import com.ultrabms.dto.leads.LeadConversionResponse;
import com.ultrabms.dto.quotations.*;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.Quotation;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.UnitStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.LeadHistoryRepository;
import com.ultrabms.repository.LeadRepository;
import com.ultrabms.repository.QuotationRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.service.impl.QuotationServiceImpl;
import com.ultrabms.util.QuotationNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for QuotationService
 * Tests quotation creation, status management, and lead to tenant conversion
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationService Unit Tests")
class QuotationServiceTest {

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private LeadHistoryRepository leadHistoryRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private QuotationNumberGenerator quotationNumberGenerator;

    @Mock
    private QuotationPdfService quotationPdfService;

    @Mock
    private IEmailService emailService;

    @InjectMocks
    private QuotationServiceImpl quotationService;

    private UUID testUserId;
    private UUID testLeadId;
    private UUID testQuotationId;
    private UUID testUnitId;
    private Lead testLead;
    private Quotation testQuotation;
    private Unit testUnit;
    private CreateQuotationRequest createQuotationRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testLeadId = UUID.randomUUID();
        testQuotationId = UUID.randomUUID();
        testUnitId = UUID.randomUUID();

        testLead = Lead.builder()
                .id(testLeadId)
                .leadNumber("LEAD-20251115-0001")
                .fullName("Ahmed Hassan")
                .emiratesId("784-1234-1234567-1")
                .passportNumber("AB1234567")
                .passportExpiryDate(LocalDate.of(2026, 12, 31))
                .homeCountry("United Arab Emirates")
                .email("ahmed@example.com")
                .contactNumber("+971501234567")
                .leadSource(Lead.LeadSource.WEBSITE)
                .status(Lead.LeadStatus.NEW_LEAD)
                .createdBy(testUserId)
                .build();

        testUnit = new Unit();
        testUnit.setId(testUnitId);
        testUnit.setUnitNumber("101");
        testUnit.setStatus(UnitStatus.AVAILABLE);

        testQuotation = Quotation.builder()
                .id(testQuotationId)
                .quotationNumber("QUOT-20251115-0001")
                .leadId(testLeadId)
                .propertyId(UUID.randomUUID())
                .unitId(testUnitId)
                .stayType(Quotation.StayType.TWO_BHK)
                .issueDate(LocalDate.now())
                .validityDate(LocalDate.now().plusDays(30))
                .baseRent(new BigDecimal("5000"))
                .serviceCharges(new BigDecimal("500"))
                .parkingSpots(1)
                .parkingFee(new BigDecimal("200"))
                .securityDeposit(new BigDecimal("5000"))
                .adminFee(new BigDecimal("1000"))
                .totalFirstPayment(new BigDecimal("11700"))
                .paymentTerms("Payment due on 1st")
                .moveinProcedures("Complete inspection")
                .cancellationPolicy("30 days notice")
                .status(Quotation.QuotationStatus.DRAFT)
                .createdBy(testUserId)
                .build();

        // SCP-2025-12-02: Changed from parkingSpots to parkingSpotId
        createQuotationRequest = CreateQuotationRequest.builder()
                .leadId(testLeadId)
                .propertyId(UUID.randomUUID())
                .unitId(testUnitId)
                .stayType(Quotation.StayType.TWO_BHK)
                .issueDate(LocalDate.now())
                .validityDate(LocalDate.now().plusDays(30))
                .baseRent(new BigDecimal("5000"))
                .serviceCharges(new BigDecimal("500"))
                .parkingSpotId(UUID.randomUUID())
                .parkingFee(new BigDecimal("200"))
                .securityDeposit(new BigDecimal("5000"))
                .adminFee(new BigDecimal("1000"))
                .paymentTerms("Payment due on 1st")
                .moveinProcedures("Complete inspection")
                .cancellationPolicy("30 days notice")
                .build();
    }

    @Test
    @DisplayName("Should create quotation successfully")
    void testCreateQuotation_Success() {
        // Arrange
        when(quotationNumberGenerator.generate()).thenReturn("QUOT-20251115-0001");
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(quotationRepository.save(any(Quotation.class))).thenReturn(testQuotation);

        // Act
        QuotationResponse response = quotationService.createQuotation(createQuotationRequest, testUserId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getQuotationNumber()).isEqualTo("QUOT-20251115-0001");
        assertThat(response.getStatus()).isEqualTo(Quotation.QuotationStatus.DRAFT);

        verify(leadRepository).findById(testLeadId);
        verify(quotationRepository).save(any(Quotation.class));
        verify(leadHistoryRepository).save(any());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when lead not found")
    void testCreateQuotation_LeadNotFound() {
        // Arrange
        when(leadRepository.findById(any())).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> quotationService.createQuotation(createQuotationRequest, testUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Lead not found");
    }

    @Test
    @DisplayName("Should throw ValidationException when validity date is before issue date")
    void testCreateQuotation_InvalidDates() {
        // Arrange
        // SCP-2025-12-02: Changed from parkingSpots to parkingSpotId
        CreateQuotationRequest invalidRequest = CreateQuotationRequest.builder()
                .leadId(testLeadId)
                .propertyId(UUID.randomUUID())
                .unitId(testUnitId)
                .stayType(Quotation.StayType.TWO_BHK)
                .issueDate(LocalDate.now())
                .validityDate(LocalDate.now().minusDays(1)) // Before issue date
                .baseRent(new BigDecimal("5000"))
                .serviceCharges(new BigDecimal("500"))
                .parkingSpotId(UUID.randomUUID())
                .parkingFee(new BigDecimal("200"))
                .securityDeposit(new BigDecimal("5000"))
                .adminFee(new BigDecimal("1000"))
                .paymentTerms("Payment due on 1st")
                .moveinProcedures("Complete inspection")
                .cancellationPolicy("30 days notice")
                .build();

        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));

        // Act & Assert
        assertThatThrownBy(() -> quotationService.createQuotation(invalidRequest, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Validity date must be after issue date");
    }

    @Test
    @DisplayName("Should convert lead to tenant successfully")
    void testConvertLeadToTenant_Success() {
        // Arrange
        testQuotation.setStatus(Quotation.QuotationStatus.ACCEPTED);
        testLead.setStatus(Lead.LeadStatus.QUOTATION_SENT);

        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(unitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));
        when(quotationRepository.save(any())).thenReturn(testQuotation);
        when(leadRepository.save(any())).thenReturn(testLead);
        when(unitRepository.save(any())).thenReturn(testUnit);

        // Act
        LeadConversionResponse response = quotationService.convertLeadToTenant(testQuotationId, testUserId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getLeadId()).isEqualTo(testLeadId);
        assertThat(response.getQuotationId()).isEqualTo(testQuotationId);
        assertThat(response.getMessage()).contains("converted to tenant");

        verify(quotationRepository).save(argThat(q -> q.getStatus() == Quotation.QuotationStatus.CONVERTED));
        verify(leadRepository).save(argThat(l -> l.getStatus() == Lead.LeadStatus.CONVERTED));
        verify(unitRepository).save(argThat(u -> u.getStatus() == UnitStatus.RESERVED));
        verify(leadHistoryRepository).save(any());
    }

    @Test
    @DisplayName("Should throw ValidationException when quotation is not ACCEPTED")
    void testConvertLeadToTenant_QuotationNotAccepted() {
        // Arrange
        testQuotation.setStatus(Quotation.QuotationStatus.DRAFT); // Not ACCEPTED

        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(unitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));

        // Act & Assert
        assertThatThrownBy(() -> quotationService.convertLeadToTenant(testQuotationId, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Only ACCEPTED quotations can be converted");
    }

    @Test
    @DisplayName("Should throw ValidationException when lead already converted")
    void testConvertLeadToTenant_LeadAlreadyConverted() {
        // Arrange
        testQuotation.setStatus(Quotation.QuotationStatus.ACCEPTED);
        testLead.setStatus(Lead.LeadStatus.CONVERTED); // Already converted

        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(unitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));

        // Act & Assert
        assertThatThrownBy(() -> quotationService.convertLeadToTenant(testQuotationId, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("already been converted");
    }

    @Test
    @DisplayName("Should throw ValidationException when unit is not available")
    void testConvertLeadToTenant_UnitNotAvailable() {
        // Arrange
        testQuotation.setStatus(Quotation.QuotationStatus.ACCEPTED);
        testUnit.setStatus(UnitStatus.OCCUPIED); // Not available

        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(unitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));

        // Act & Assert
        assertThatThrownBy(() -> quotationService.convertLeadToTenant(testQuotationId, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Unit is not available");
    }

    @Test
    @DisplayName("Should send quotation successfully")
    void testSendQuotation_Success() {
        // Arrange
        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(quotationRepository.save(any())).thenReturn(testQuotation);
        when(quotationPdfService.generatePdf(any(), any())).thenReturn(new byte[0]);

        // Act
        QuotationResponse response = quotationService.sendQuotation(testQuotationId, testUserId);

        // Assert
        assertThat(response).isNotNull();
        verify(quotationPdfService).generatePdf(any(), any());
        verify(emailService).sendQuotationEmail(any(), any(), any());
    }

    @Test
    @DisplayName("Should throw ValidationException when sending non-DRAFT quotation")
    void testSendQuotation_NotDraft() {
        // Arrange
        testQuotation.setStatus(Quotation.QuotationStatus.SENT);
        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));

        // Act & Assert
        assertThatThrownBy(() -> quotationService.sendQuotation(testQuotationId, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Only DRAFT quotations can be sent");
    }

    @Test
    @DisplayName("Should update quotation status to ACCEPTED and send admin notification")
    void testUpdateQuotationStatus_Accepted() {
        // Arrange
        testQuotation.setStatus(Quotation.QuotationStatus.SENT);
        QuotationStatusUpdateRequest request = QuotationStatusUpdateRequest.builder()
                .status(Quotation.QuotationStatus.ACCEPTED)
                .build();

        when(quotationRepository.findById(testQuotationId)).thenReturn(Optional.of(testQuotation));
        when(leadRepository.findById(testLeadId)).thenReturn(Optional.of(testLead));
        when(quotationRepository.save(any())).thenReturn(testQuotation);

        // Act
        QuotationResponse response = quotationService.updateQuotationStatus(testQuotationId, request, testUserId);

        // Assert
        assertThat(response).isNotNull();
        verify(emailService).sendQuotationAcceptedNotification(any(), any());
    }
}
