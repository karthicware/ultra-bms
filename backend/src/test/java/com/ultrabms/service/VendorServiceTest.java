package com.ultrabms.service;

import com.ultrabms.dto.vendors.UpdateVendorStatusDto;
import com.ultrabms.dto.vendors.VendorFilterDto;
import com.ultrabms.dto.vendors.VendorListDto;
import com.ultrabms.dto.vendors.VendorRequestDto;
import com.ultrabms.dto.vendors.VendorResponseDto;
import com.ultrabms.dto.vendors.VendorStatusResponseDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.PaymentTerms;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.VendorMapper;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.impl.VendorServiceImpl;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for VendorService
 * Story 5.1: Vendor Registration and Profile Management
 *
 * Tests vendor CRUD operations, status management, and validation logic.
 */
@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private VendorMapper vendorMapper;

    @InjectMocks
    private VendorServiceImpl vendorService;

    private Vendor testVendor;
    private VendorRequestDto createRequest;
    private VendorResponseDto responseDto;
    private VendorListDto listDto;
    private UUID vendorId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        vendorId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test vendor entity
        testVendor = Vendor.builder()
                .companyName("ABC Plumbing Services")
                .contactPersonName("John Doe")
                .emiratesIdOrTradeLicense("784-1234-5678901-1")
                .trn("100123456789012")
                .email("abc@plumbing.com")
                .phoneNumber("+971501234567")
                .secondaryPhoneNumber("+971509876543")
                .address("123 Industrial Area, Dubai")
                .serviceCategories(List.of(WorkOrderCategory.PLUMBING))
                .serviceAreas(List.of(UUID.randomUUID()))
                .hourlyRate(new BigDecimal("150.00"))
                .emergencyCalloutFee(new BigDecimal("250.00"))
                .paymentTerms(PaymentTerms.NET_30)
                .status(VendorStatus.ACTIVE)
                .build();
        testVendor.setId(vendorId);
        testVendor.setVendorNumber("VND-2025-0001");

        // Create request DTO
        createRequest = VendorRequestDto.builder()
                .companyName("ABC Plumbing Services")
                .contactPersonName("John Doe")
                .emiratesIdOrTradeLicense("784-1234-5678901-1")
                .trn("100123456789012")
                .email("abc@plumbing.com")
                .phoneNumber("+971501234567")
                .secondaryPhoneNumber("+971509876543")
                .address("123 Industrial Area, Dubai")
                .serviceCategories(List.of(WorkOrderCategory.PLUMBING))
                .serviceAreas(List.of(UUID.randomUUID()))
                .hourlyRate(new BigDecimal("150.00"))
                .emergencyCalloutFee(new BigDecimal("250.00"))
                .paymentTerms(PaymentTerms.NET_30)
                .build();

        // Create response DTO
        responseDto = VendorResponseDto.builder()
                .id(vendorId)
                .vendorNumber("VND-2025-0001")
                .companyName("ABC Plumbing Services")
                .contactPersonName("John Doe")
                .email("abc@plumbing.com")
                .phoneNumber("+971501234567")
                .serviceCategories(List.of(WorkOrderCategory.PLUMBING))
                .status(VendorStatus.ACTIVE)
                .build();

        // Create list DTO
        listDto = VendorListDto.builder()
                .id(vendorId)
                .vendorNumber("VND-2025-0001")
                .companyName("ABC Plumbing Services")
                .contactPersonName("John Doe")
                .serviceCategories(List.of(WorkOrderCategory.PLUMBING))
                .rating(new BigDecimal("4.5"))
                .status(VendorStatus.ACTIVE)
                .build();
    }

    // =========================================================================
    // CREATE VENDOR TESTS (AC #5, #11, #12)
    // =========================================================================

    @Nested
    @DisplayName("Create Vendor Tests")
    class CreateVendorTests {

        @Test
        @DisplayName("Should create vendor with valid data")
        void createVendor_WithValidData_ShouldReturnVendorResponse() {
            // Arrange
            when(vendorRepository.existsByEmailAndIsDeletedFalse(anyString())).thenReturn(false);
            when(vendorMapper.toEntity(any(VendorRequestDto.class))).thenReturn(testVendor);
            when(vendorRepository.getNextVendorNumberSequence()).thenReturn(1L);
            when(vendorRepository.existsByVendorNumber(anyString())).thenReturn(false);
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);
            when(vendorMapper.toResponseDto(any(Vendor.class))).thenReturn(responseDto);

            // Act
            VendorResponseDto result = vendorService.createVendor(createRequest);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getCompanyName()).isEqualTo("ABC Plumbing Services");
            assertThat(result.getVendorNumber()).isEqualTo("VND-2025-0001");
            assertThat(result.getStatus()).isEqualTo(VendorStatus.ACTIVE);

            verify(vendorRepository, times(1)).save(any(Vendor.class));
            verify(vendorRepository, times(1)).getNextVendorNumberSequence();
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void createVendor_WithDuplicateEmail_ShouldThrowException() {
            // Arrange
            when(vendorRepository.existsByEmailAndIsDeletedFalse("abc@plumbing.com")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> vendorService.createVendor(createRequest))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("abc@plumbing.com");

            verify(vendorRepository, never()).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should retry vendor number generation on collision")
        void createVendor_WithVendorNumberCollision_ShouldRetry() {
            // Arrange
            when(vendorRepository.existsByEmailAndIsDeletedFalse(anyString())).thenReturn(false);
            when(vendorMapper.toEntity(any(VendorRequestDto.class))).thenReturn(testVendor);
            when(vendorRepository.getNextVendorNumberSequence()).thenReturn(1L, 2L);
            when(vendorRepository.existsByVendorNumber(anyString())).thenReturn(true, false);
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);
            when(vendorMapper.toResponseDto(any(Vendor.class))).thenReturn(responseDto);

            // Act
            VendorResponseDto result = vendorService.createVendor(createRequest);

            // Assert
            assertThat(result).isNotNull();
            verify(vendorRepository, times(2)).getNextVendorNumberSequence();
        }
    }

    // =========================================================================
    // GET VENDOR BY ID TESTS (AC #13)
    // =========================================================================

    @Nested
    @DisplayName("Get Vendor By ID Tests")
    class GetVendorByIdTests {

        @Test
        @DisplayName("Should return vendor when found")
        void getVendorById_WithExistingId_ShouldReturnVendor() {
            // Arrange
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(workOrderRepository.findByAssignedToAndStatusIn(eq(vendorId), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            when(vendorMapper.toResponseDtoWithMetrics(any(Vendor.class), any(), any())).thenReturn(responseDto);

            // Act
            VendorResponseDto result = vendorService.getVendorById(vendorId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(vendorId);
            verify(vendorRepository, times(1)).findById(vendorId);
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void getVendorById_WithNonExistingId_ShouldThrowException() {
            // Arrange
            UUID nonExistingId = UUID.randomUUID();
            when(vendorRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vendorService.getVendorById(nonExistingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("not found");

            verify(vendorRepository, times(1)).findById(nonExistingId);
        }

        @Test
        @DisplayName("Should throw exception when vendor is deleted")
        void getVendorById_WithDeletedVendor_ShouldThrowException() {
            // Arrange
            testVendor.softDelete(userId);
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));

            // Act & Assert
            assertThatThrownBy(() -> vendorService.getVendorById(vendorId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("not found");
        }
    }

    // =========================================================================
    // GET ALL VENDORS TESTS (AC #1-4)
    // =========================================================================

    @Nested
    @DisplayName("Get All Vendors Tests")
    class GetAllVendorsTests {

        @Test
        @DisplayName("Should return paged vendors without filters")
        void getAllVendors_WithoutFilters_ShouldReturnPagedResults() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<Vendor> vendorPage = new PageImpl<>(List.of(testVendor), pageable, 1);

            when(vendorRepository.findByIsDeletedFalse(pageable)).thenReturn(vendorPage);
            when(vendorMapper.toListDto(any(Vendor.class))).thenReturn(listDto);

            // Act
            Page<VendorListDto> result = vendorService.getAllVendors(null, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).getCompanyName()).isEqualTo("ABC Plumbing Services");

            verify(vendorRepository, times(1)).findByIsDeletedFalse(pageable);
        }

        @Test
        @DisplayName("Should return filtered vendors with search criteria")
        void getAllVendors_WithFilters_ShouldReturnFilteredResults() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            VendorFilterDto filterDto = VendorFilterDto.builder()
                    .search("plumbing")
                    .status(VendorStatus.ACTIVE)
                    .build();
            Page<Vendor> vendorPage = new PageImpl<>(List.of(testVendor), pageable, 1);

            when(vendorRepository.searchWithFilters(anyString(), any(), any(), any(Pageable.class)))
                    .thenReturn(vendorPage);
            when(vendorMapper.toListDto(any(Vendor.class))).thenReturn(listDto);

            // Act
            Page<VendorListDto> result = vendorService.getAllVendors(filterDto, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalElements()).isEqualTo(1);

            verify(vendorRepository, times(1)).searchWithFilters(anyString(), any(), any(), any(Pageable.class));
        }
    }

    // =========================================================================
    // UPDATE VENDOR TESTS (AC #15)
    // =========================================================================

    @Nested
    @DisplayName("Update Vendor Tests")
    class UpdateVendorTests {

        @Test
        @DisplayName("Should update vendor with valid data")
        void updateVendor_WithValidData_ShouldReturnUpdatedVendor() {
            // Arrange
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.existsByEmailAndIdNotAndIsDeletedFalse(anyString(), eq(vendorId))).thenReturn(false);
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);
            when(vendorMapper.toResponseDto(any(Vendor.class))).thenReturn(responseDto);

            // Act
            VendorResponseDto result = vendorService.updateVendor(vendorId, createRequest);

            // Assert
            assertThat(result).isNotNull();
            verify(vendorMapper, times(1)).updateEntity(any(VendorRequestDto.class), any(Vendor.class));
            verify(vendorRepository, times(1)).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void updateVendor_WithNonExistingId_ShouldThrowException() {
            // Arrange
            UUID nonExistingId = UUID.randomUUID();
            when(vendorRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vendorService.updateVendor(nonExistingId, createRequest))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(vendorRepository, never()).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should throw exception when email already used by another vendor")
        void updateVendor_WithDuplicateEmail_ShouldThrowException() {
            // Arrange
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.existsByEmailAndIdNotAndIsDeletedFalse("abc@plumbing.com", vendorId))
                    .thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> vendorService.updateVendor(vendorId, createRequest))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("abc@plumbing.com");

            verify(vendorRepository, never()).save(any(Vendor.class));
        }
    }

    // =========================================================================
    // UPDATE VENDOR STATUS TESTS (AC #14, #16)
    // =========================================================================

    @Nested
    @DisplayName("Update Vendor Status Tests")
    class UpdateVendorStatusTests {

        @Test
        @DisplayName("Should allow ACTIVE to INACTIVE transition")
        void updateVendorStatus_ActiveToInactive_ShouldSucceed() {
            // Arrange
            testVendor.setStatus(VendorStatus.ACTIVE);
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.INACTIVE)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            // Act
            VendorStatusResponseDto result = vendorService.updateVendorStatus(vendorId, statusDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(VendorStatus.INACTIVE);
            assertThat(result.getPreviousStatus()).isEqualTo(VendorStatus.ACTIVE);
            verify(vendorRepository, times(1)).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should allow ACTIVE to SUSPENDED transition")
        void updateVendorStatus_ActiveToSuspended_ShouldSucceed() {
            // Arrange
            testVendor.setStatus(VendorStatus.ACTIVE);
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.SUSPENDED)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            // Act
            VendorStatusResponseDto result = vendorService.updateVendorStatus(vendorId, statusDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(VendorStatus.SUSPENDED);
        }

        @Test
        @DisplayName("Should allow INACTIVE to ACTIVE transition")
        void updateVendorStatus_InactiveToActive_ShouldSucceed() {
            // Arrange
            testVendor.setStatus(VendorStatus.INACTIVE);
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.ACTIVE)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            // Act
            VendorStatusResponseDto result = vendorService.updateVendorStatus(vendorId, statusDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(VendorStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should allow SUSPENDED to ACTIVE transition")
        void updateVendorStatus_SuspendedToActive_ShouldSucceed() {
            // Arrange
            testVendor.setStatus(VendorStatus.SUSPENDED);
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.ACTIVE)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            // Act
            VendorStatusResponseDto result = vendorService.updateVendorStatus(vendorId, statusDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(VendorStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should reject INACTIVE to SUSPENDED transition")
        void updateVendorStatus_InactiveToSuspended_ShouldThrowException() {
            // Arrange
            testVendor.setStatus(VendorStatus.INACTIVE);
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.SUSPENDED)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));

            // Act & Assert
            assertThatThrownBy(() -> vendorService.updateVendorStatus(vendorId, statusDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot suspend an inactive vendor");

            verify(vendorRepository, never()).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should reject same status transition")
        void updateVendorStatus_SameStatus_ShouldThrowException() {
            // Arrange
            testVendor.setStatus(VendorStatus.ACTIVE);
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.ACTIVE)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));

            // Act & Assert
            assertThatThrownBy(() -> vendorService.updateVendorStatus(vendorId, statusDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already in status");

            verify(vendorRepository, never()).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void updateVendorStatus_WithNonExistingId_ShouldThrowException() {
            // Arrange
            UUID nonExistingId = UUID.randomUUID();
            UpdateVendorStatusDto statusDto = UpdateVendorStatusDto.builder()
                    .status(VendorStatus.INACTIVE)
                    .build();

            when(vendorRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vendorService.updateVendorStatus(nonExistingId, statusDto, userId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // =========================================================================
    // DELETE VENDOR TESTS (AC #17)
    // =========================================================================

    @Nested
    @DisplayName("Delete Vendor Tests")
    class DeleteVendorTests {

        @Test
        @DisplayName("Should soft delete vendor")
        void deleteVendor_WithExistingId_ShouldSoftDelete() {
            // Arrange
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            // Act
            vendorService.deleteVendor(vendorId, userId);

            // Assert
            assertThat(testVendor.getIsDeleted()).isTrue();
            assertThat(testVendor.getDeletedAt()).isNotNull();
            assertThat(testVendor.getDeletedBy()).isEqualTo(userId);
            verify(vendorRepository, times(1)).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void deleteVendor_WithNonExistingId_ShouldThrowException() {
            // Arrange
            UUID nonExistingId = UUID.randomUUID();
            when(vendorRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vendorService.deleteVendor(nonExistingId, userId))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(vendorRepository, never()).save(any(Vendor.class));
        }

        @Test
        @DisplayName("Should throw exception when vendor already deleted")
        void deleteVendor_WithAlreadyDeletedVendor_ShouldThrowException() {
            // Arrange
            testVendor.softDelete(userId);
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));

            // Act & Assert
            assertThatThrownBy(() -> vendorService.deleteVendor(vendorId, userId))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(vendorRepository, never()).save(any(Vendor.class));
        }
    }

    // =========================================================================
    // GET VENDOR WORK ORDERS TESTS (AC #18)
    // =========================================================================

    @Nested
    @DisplayName("Get Vendor Work Orders Tests")
    class GetVendorWorkOrdersTests {

        @Test
        @DisplayName("Should return vendor work orders")
        void getVendorWorkOrders_WithExistingVendor_ShouldReturnWorkOrders() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            WorkOrder workOrder = WorkOrder.builder()
                    .workOrderNumber("WO-2025-0001")
                    .title("Fix leaky faucet")
                    .category(WorkOrderCategory.PLUMBING)
                    .priority(WorkOrderPriority.MEDIUM)
                    .status(WorkOrderStatus.IN_PROGRESS)
                    .build();
            workOrder.setId(UUID.randomUUID());
            workOrder.setCreatedAt(LocalDateTime.now());

            Page<WorkOrder> workOrderPage = new PageImpl<>(List.of(workOrder), pageable, 1);

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(workOrderRepository.findByAssignedToOrderByScheduledDateAsc(vendorId, pageable))
                    .thenReturn(workOrderPage);

            // Act
            Page<WorkOrderListDto> result = vendorService.getVendorWorkOrders(vendorId, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).getWorkOrderNumber()).isEqualTo("WO-2025-0001");
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void getVendorWorkOrders_WithNonExistingVendor_ShouldThrowException() {
            // Arrange
            UUID nonExistingId = UUID.randomUUID();
            Pageable pageable = PageRequest.of(0, 10);

            when(vendorRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> vendorService.getVendorWorkOrders(nonExistingId, pageable))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // =========================================================================
    // EMAIL AVAILABILITY TESTS
    // =========================================================================

    @Nested
    @DisplayName("Email Availability Tests")
    class EmailAvailabilityTests {

        @Test
        @DisplayName("Should return true when email is available")
        void isEmailAvailable_WithNewEmail_ShouldReturnTrue() {
            // Arrange
            when(vendorRepository.existsByEmailAndIsDeletedFalse("new@email.com")).thenReturn(false);

            // Act
            boolean result = vendorService.isEmailAvailable("new@email.com", null);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when email already exists")
        void isEmailAvailable_WithExistingEmail_ShouldReturnFalse() {
            // Arrange
            when(vendorRepository.existsByEmailAndIsDeletedFalse("existing@email.com")).thenReturn(true);

            // Act
            boolean result = vendorService.isEmailAvailable("existing@email.com", null);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should exclude specified ID when checking email availability")
        void isEmailAvailable_WithExcludeId_ShouldExcludeVendor() {
            // Arrange
            when(vendorRepository.existsByEmailAndIdNotAndIsDeletedFalse("abc@plumbing.com", vendorId))
                    .thenReturn(false);

            // Act
            boolean result = vendorService.isEmailAvailable("abc@plumbing.com", vendorId);

            // Assert
            assertThat(result).isTrue();
            verify(vendorRepository, times(1))
                    .existsByEmailAndIdNotAndIsDeletedFalse("abc@plumbing.com", vendorId);
        }
    }
}
