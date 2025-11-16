package com.ultrabms.service;

import com.ultrabms.dto.properties.CreatePropertyRequest;
import com.ultrabms.dto.properties.OccupancyResponse;
import com.ultrabms.dto.properties.PropertyResponse;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import com.ultrabms.entity.enums.UnitStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PropertyImageRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.impl.PropertyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PropertyService
 * AC: #1, #15 - Property CRUD operations and caching
 */
@ExtendWith(MockitoExtension.class)
class PropertyServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private PropertyImageRepository propertyImageRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private PropertyServiceImpl propertyService;

    private Property testProperty;
    private CreatePropertyRequest createRequest;
    private UUID propertyId;
    private UUID createdBy;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        createdBy = UUID.randomUUID();

        testProperty = new Property();
        testProperty.setId(propertyId);
        testProperty.setName("Sunset Towers");
        testProperty.setAddress("123 Main St, Dubai, UAE");
        testProperty.setPropertyType(PropertyType.RESIDENTIAL);
        testProperty.setTotalUnitsCount(50);
        testProperty.setStatus(PropertyStatus.ACTIVE);
        testProperty.setActive(true);
        testProperty.setCreatedBy(createdBy);

        createRequest = new CreatePropertyRequest();
        createRequest.setName("Sunset Towers");
        createRequest.setAddress("123 Main St, Dubai, UAE");
        createRequest.setPropertyType(PropertyType.RESIDENTIAL);
        createRequest.setTotalUnitsCount(50);
    }

    @Test
    void createProperty_WithValidData_ShouldReturnPropertyResponse() {
        // Arrange
        when(propertyRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(propertyRepository.save(any(Property.class))).thenReturn(testProperty);

        // Act
        PropertyResponse response = propertyService.createProperty(createRequest, createdBy);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Sunset Towers");
        assertThat(response.getPropertyType()).isEqualTo(PropertyType.RESIDENTIAL);
        assertThat(response.getTotalUnitsCount()).isEqualTo(50);

        verify(propertyRepository, times(1)).save(any(Property.class));
    }

    @Test
    void createProperty_WithDuplicateName_ShouldThrowException() {
        // Arrange
        when(propertyRepository.findByName("Sunset Towers")).thenReturn(Optional.of(testProperty));

        // Act & Assert
        assertThatThrownBy(() -> propertyService.createProperty(createRequest, createdBy))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Property with this name already exists");

        verify(propertyRepository, never()).save(any(Property.class));
    }

    @Test
    void getPropertyById_WithExistingId_ShouldReturnProperty() {
        // Arrange
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));

        // Act
        PropertyResponse response = propertyService.getPropertyById(propertyId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(propertyId);
        assertThat(response.getName()).isEqualTo("Sunset Towers");

        verify(propertyRepository, times(1)).findById(propertyId);
    }

    @Test
    void getPropertyById_WithNonExistingId_ShouldThrowException() {
        // Arrange
        UUID nonExistingId = UUID.randomUUID();
        when(propertyRepository.findById(nonExistingId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> propertyService.getPropertyById(nonExistingId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");

        verify(propertyRepository, times(1)).findById(nonExistingId);
    }

    @Test
    void getPropertyById_WithInactiveProperty_ShouldThrowException() {
        // Arrange
        testProperty.setActive(false);
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));

        // Act & Assert
        assertThatThrownBy(() -> propertyService.getPropertyById(propertyId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");

        verify(propertyRepository, times(1)).findById(propertyId);
    }

    @Test
    void getAllProperties_ShouldReturnPagedResults() {
        // Arrange
        List<Property> properties = Arrays.asList(testProperty);
        Page<Property> propertyPage = new PageImpl<>(properties);
        Pageable pageable = PageRequest.of(0, 20);

        when(propertyRepository.findByStatus(eq(PropertyStatus.ACTIVE), any(Pageable.class))).thenReturn(propertyPage);

        // Act
        Page<PropertyResponse> result = propertyService.getAllProperties(pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Sunset Towers");

        verify(propertyRepository, times(1)).findByStatus(eq(PropertyStatus.ACTIVE), any(Pageable.class));
    }

    @Test
    void deleteProperty_WithNoOccupiedUnits_ShouldSucceed() {
        // Arrange
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
        when(unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.OCCUPIED)).thenReturn(0L);
        when(propertyRepository.save(any(Property.class))).thenReturn(testProperty);

        // Act
        propertyService.deleteProperty(propertyId);

        // Assert
        verify(unitRepository, times(1)).countByPropertyIdAndStatus(propertyId, UnitStatus.OCCUPIED);
        verify(propertyRepository, times(1)).save(any(Property.class));
        assertThat(testProperty.getActive()).isFalse();
    }

    @Test
    void deleteProperty_WithOccupiedUnits_ShouldThrowException() {
        // Arrange
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
        when(unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.OCCUPIED)).thenReturn(5L);

        // Act & Assert
        assertThatThrownBy(() -> propertyService.deleteProperty(propertyId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("occupied units");

        verify(unitRepository, times(1)).countByPropertyIdAndStatus(propertyId, UnitStatus.OCCUPIED);
        verify(propertyRepository, never()).save(any(Property.class));
    }

    @Test
    void getPropertyOccupancy_ShouldReturnCorrectData() {
        // Arrange
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
        when(unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.AVAILABLE)).thenReturn(5L);
        when(unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.OCCUPIED)).thenReturn(40L);
        when(unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.UNDER_MAINTENANCE)).thenReturn(3L);
        when(unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.RESERVED)).thenReturn(2L);

        // Act
        OccupancyResponse response = propertyService.getPropertyOccupancy(propertyId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getTotal()).isEqualTo(50);
        assertThat(response.getAvailable()).isEqualTo(5);
        assertThat(response.getOccupied()).isEqualTo(40);
        assertThat(response.getUnderMaintenance()).isEqualTo(3);
        assertThat(response.getReserved()).isEqualTo(2);
        assertThat(response.getOccupancyPercentage()).isEqualTo(80.0); // 40/50 = 80%
    }

    @Test
    void restoreProperty_ShouldSetActiveToTrue() {
        // Arrange
        testProperty.setActive(false);
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
        when(propertyRepository.save(any(Property.class))).thenReturn(testProperty);

        // Act
        PropertyResponse response = propertyService.restoreProperty(propertyId);

        // Assert
        assertThat(response).isNotNull();
        verify(propertyRepository, times(1)).save(any(Property.class));
        assertThat(testProperty.getActive()).isTrue();
    }
}
