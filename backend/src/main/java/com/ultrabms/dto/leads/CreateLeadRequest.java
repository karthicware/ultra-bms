package com.ultrabms.dto.leads;

import com.ultrabms.entity.Lead;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for creating a new lead
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeadRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 200, message = "Full name must be between 2 and 200 characters")
    private String fullName;

    @NotBlank(message = "Emirates ID is required")
    @Pattern(regexp = "^\\d{3}-\\d{4}-\\d{7}-\\d{1}$", message = "Emirates ID must be in format XXX-XXXX-XXXXXXX-X")
    private String emiratesId;

    @NotBlank(message = "Passport number is required")
    @Size(min = 6, max = 50, message = "Passport number must be between 6 and 50 characters")
    private String passportNumber;

    @NotNull(message = "Passport expiry date is required")
    @Future(message = "Passport expiry date must be in the future")
    private LocalDate passportExpiryDate;

    @NotBlank(message = "Home country is required")
    @Size(min = 2, max = 100, message = "Home country must be between 2 and 100 characters")
    private String homeCountry;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Contact number must be valid E.164 format")
    private String contactNumber;

    @NotNull(message = "Lead source is required")
    private Lead.LeadSource leadSource;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @Size(max = 255, message = "Property interest must not exceed 255 characters")
    private String propertyInterest;
}
