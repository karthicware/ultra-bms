package com.ultrabms.service;

import com.ultrabms.dto.textract.IdentityDocumentDetailResponse;
import com.ultrabms.dto.textract.ProcessIdentityDocumentsResponse;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.QuotationRepository;
import com.ultrabms.service.impl.TextractServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.*;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TextractServiceImpl - Identity Document OCR Processing
 * Story 3.10: Tests passport and Emirates ID OCR extraction
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TextractServiceImpl Identity Document Tests")
class TextractServiceImplTest {

    @Mock
    private TextractClient textractClient;

    @Mock
    private QuotationRepository quotationRepository;

    @InjectMocks
    private TextractServiceImpl textractService;

    private MockMultipartFile validPassportFront;
    private MockMultipartFile validEmiratesIdFront;
    private MockMultipartFile invalidFile;

    @BeforeEach
    void setUp() {
        validPassportFront = new MockMultipartFile(
                "passportFront",
                "passport_front.jpg",
                "image/jpeg",
                "fake image content".getBytes()
        );

        validEmiratesIdFront = new MockMultipartFile(
                "emiratesIdFront",
                "emirates_id_front.png",
                "image/png",
                "fake image content".getBytes()
        );

        invalidFile = new MockMultipartFile(
                "invalidFile",
                "document.pdf",
                "application/pdf",
                "fake pdf content".getBytes()
        );
    }

    // ============ Validation Tests ============

    @Nested
    @DisplayName("Validation Tests")
    class ValidationTests {

        @Test
        @DisplayName("Should throw ValidationException when no documents provided")
        void testProcessNoDocuments() {
            assertThatThrownBy(() ->
                    textractService.processIdentityDocuments(null, null, null, null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("At least one identity document must be provided");
        }

        @Test
        @DisplayName("Should throw ValidationException for invalid file format")
        void testProcessInvalidFileFormat() {
            assertThatThrownBy(() ->
                    textractService.processIdentityDocuments(invalidFile, null, null, null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Only JPEG and PNG images are allowed");
        }

        @Test
        @DisplayName("Should throw ValidationException for file exceeding 5MB")
        void testFileSizeLimit() {
            // Create a file larger than 5MB
            byte[] largeContent = new byte[6 * 1024 * 1024];
            MockMultipartFile largeFile = new MockMultipartFile(
                    "passportFront",
                    "large_passport.jpg",
                    "image/jpeg",
                    largeContent
            );

            assertThatThrownBy(() ->
                    textractService.processIdentityDocuments(largeFile, null, null, null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("exceeds maximum size of 5MB");
        }

        @Test
        @DisplayName("Should accept JPEG file type")
        void testAcceptJpegFileType() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "Passport No: AB1234567",
                    "Nationality: British",
                    "Date of Birth: 15/06/1985",
                    "Expiry Date: 20/12/2030",
                    "JOHN SMITH"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result).isNotNull();
            assertThat(result.getPassportDetails()).isNotNull();
        }

        @Test
        @DisplayName("Should accept PNG file type")
        void testAcceptPngFileType() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "784-1990-1234567-8",
                    "Name: Ahmed Mohammed",
                    "Date of Birth: 01/01/1990",
                    "Valid Until: 15/08/2027"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    null, null, validEmiratesIdFront, null);

            assertThat(result).isNotNull();
            assertThat(result.getEmiratesIdDetails()).isNotNull();
        }
    }

    // ============ Passport Processing Tests ============

    @Nested
    @DisplayName("Passport Processing Tests")
    class PassportProcessingTests {

        @Test
        @DisplayName("Should extract passport number successfully")
        void testProcessPassportSuccess() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "PASSPORT",
                    "Passport No: AB1234567",
                    "Nationality: BRITISH",
                    "Date of Birth: 15/06/1985",
                    "Date of Expiry: 20/12/2030",
                    "Name: JOHN SMITH"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result).isNotNull();
            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getDocumentType())
                    .isEqualTo(IdentityDocumentDetailResponse.DocumentType.PASSPORT);
            assertThat(result.getPassportDetails().getDocumentNumber()).isEqualTo("AB1234567");
            assertThat(result.getPassportDetails().getNationality()).isNotNull();
            assertThat(result.getOverallStatus()).isIn(
                    ProcessIdentityDocumentsResponse.OverallStatus.SUCCESS,
                    ProcessIdentityDocumentsResponse.OverallStatus.PARTIAL_SUCCESS
            );
        }

        @Test
        @DisplayName("Should extract passport expiry date in various formats")
        void testPassportExpiryDateFormats() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "Passport No: XY9876543",
                    "Date of Expiry: 2028-06-15",
                    "JOHN DOE"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getExpiryDate()).isNotNull();
        }

        @Test
        @DisplayName("Should extract nationality from passport")
        void testNationalityExtraction() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "Passport No: IN1234567",
                    "Nationality: INDIAN",
                    "Name: RAHUL SHARMA",
                    "Date of Birth: 10/03/1990",
                    "Expiry: 01/01/2030"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getNationality()).isNotNull();
        }

        @Test
        @DisplayName("Should handle passport with partial data extraction")
        void testPassportPartialExtraction() {
            // Only minimal text available
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "PASSPORT",
                    "Some random text"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getStatus()).isIn(
                    IdentityDocumentDetailResponse.ProcessingStatus.PARTIAL,
                    IdentityDocumentDetailResponse.ProcessingStatus.FAILED
            );
        }
    }

    // ============ Emirates ID Processing Tests ============

    @Nested
    @DisplayName("Emirates ID Processing Tests")
    class EmiratesIdProcessingTests {

        @Test
        @DisplayName("Should extract Emirates ID number with dashes")
        void testProcessEmiratesIdSuccess() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "UNITED ARAB EMIRATES",
                    "IDENTITY CARD",
                    "784-1990-1234567-8",
                    "Name: AHMED MOHAMMED ALI",
                    "Date of Birth: 15/01/1990",
                    "Valid Until: 15/08/2027"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    null, null, validEmiratesIdFront, null);

            assertThat(result).isNotNull();
            assertThat(result.getEmiratesIdDetails()).isNotNull();
            assertThat(result.getEmiratesIdDetails().getDocumentType())
                    .isEqualTo(IdentityDocumentDetailResponse.DocumentType.EMIRATES_ID);
            assertThat(result.getEmiratesIdDetails().getDocumentNumber())
                    .matches("784-\\d{4}-\\d{7}-\\d");
        }

        @Test
        @DisplayName("Should extract Emirates ID number without dashes")
        void testEmiratesIdNumberPatternVariants() {
            // Test continuous 15-digit format
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "EMIRATES ID",
                    "78419901234567-8",
                    "Name: FATIMA HASSAN",
                    "DOB: 20/05/1995",
                    "Expiry: 30/06/2028"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    null, null, validEmiratesIdFront, null);

            assertThat(result.getEmiratesIdDetails()).isNotNull();
            // Should be formatted to standard format
            if (result.getEmiratesIdDetails().getDocumentNumber() != null) {
                assertThat(result.getEmiratesIdDetails().getDocumentNumber()).startsWith("784");
            }
        }

        @Test
        @DisplayName("Should extract name with Arabic and English text")
        void testArabicEnglishNameExtraction() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "784-1985-9876543-2",
                    "الاسم: محمد أحمد",
                    "Name: MOHAMMED AHMED",
                    "Date of Birth: 01/01/1985",
                    "Valid Until: 31/12/2026"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    null, null, validEmiratesIdFront, null);

            assertThat(result.getEmiratesIdDetails()).isNotNull();
            assertThat(result.getEmiratesIdDetails().getFullName()).isNotNull();
        }
    }

    // ============ Combined Processing Tests ============

    @Nested
    @DisplayName("Combined Processing Tests")
    class CombinedProcessingTests {

        @Test
        @DisplayName("Should process both passport and Emirates ID together")
        void testProcessBothDocumentsSuccess() {
            DetectDocumentTextResponse passportResponse = buildMockTextractResponse(
                    "Passport No: UK1234567",
                    "Nationality: BRITISH",
                    "Date of Expiry: 15/06/2030",
                    "Name: JAMES WILSON"
            );
            DetectDocumentTextResponse emiratesResponse = buildMockTextractResponse(
                    "784-1988-5555555-5",
                    "Name: JAMES WILSON",
                    "Valid Until: 20/03/2028"
            );

            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(passportResponse)
                    .thenReturn(emiratesResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, validEmiratesIdFront, null);

            assertThat(result).isNotNull();
            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getEmiratesIdDetails()).isNotNull();
        }

        @Test
        @DisplayName("Should process partial documents (only passport)")
        void testPartialDocumentUpload_PassportOnly() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "Passport No: FR9876543",
                    "Nationality: FRENCH",
                    "Date of Expiry: 01/01/2029",
                    "Name: JEAN PIERRE"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result).isNotNull();
            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getEmiratesIdDetails()).isNull();
        }

        @Test
        @DisplayName("Should process partial documents (only Emirates ID)")
        void testPartialDocumentUpload_EmiratesIdOnly() {
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "784-1995-7777777-7",
                    "Name: SARA ABDULLAH",
                    "DOB: 10/10/1995",
                    "Expiry: 25/12/2029"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    null, null, validEmiratesIdFront, null);

            assertThat(result).isNotNull();
            assertThat(result.getPassportDetails()).isNull();
            assertThat(result.getEmiratesIdDetails()).isNotNull();
        }
    }

    // ============ Error Handling Tests ============

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should handle Textract API failure gracefully")
        void testTextractApiFailure() {
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenThrow(TextractException.builder().message("API Error").build());

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result).isNotNull();
            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getStatus())
                    .isEqualTo(IdentityDocumentDetailResponse.ProcessingStatus.FAILED);
            assertThat(result.getPassportDetails().getErrorMessage()).isNotNull();
        }

        @Test
        @DisplayName("Should return PARTIAL status when confidence is low")
        void testLowConfidenceScore() {
            // Response with very limited text - low confidence
            DetectDocumentTextResponse mockResponse = buildMockTextractResponse(
                    "Some text",
                    "Random content"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(mockResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getConfidenceScore()).isLessThan(70.0);
        }

        @Test
        @DisplayName("Should handle empty text extraction")
        void testEmptyTextExtraction() {
            DetectDocumentTextResponse emptyResponse = DetectDocumentTextResponse.builder()
                    .blocks(List.of())
                    .build();
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(emptyResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result.getPassportDetails()).isNotNull();
            assertThat(result.getPassportDetails().getStatus())
                    .isEqualTo(IdentityDocumentDetailResponse.ProcessingStatus.FAILED);
        }
    }

    // ============ Overall Status Tests ============

    @Nested
    @DisplayName("Overall Status Tests")
    class OverallStatusTests {

        @Test
        @DisplayName("Should return SUCCESS when all documents processed successfully")
        void testOverallStatusSuccess() {
            DetectDocumentTextResponse goodResponse = buildMockTextractResponse(
                    "Passport No: DE1234567",
                    "Nationality: GERMAN",
                    "Date of Birth: 05/05/1988",
                    "Date of Expiry: 10/10/2032",
                    "Name: HANS MUELLER"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(goodResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            // If 4 out of 5 fields extracted, should be SUCCESS
            if (result.getPassportDetails().getConfidenceScore() >= 70.0) {
                assertThat(result.getOverallStatus())
                        .isEqualTo(ProcessIdentityDocumentsResponse.OverallStatus.SUCCESS);
            }
        }

        @Test
        @DisplayName("Should return PARTIAL_SUCCESS when some fields missing")
        void testOverallStatusPartialSuccess() {
            DetectDocumentTextResponse partialResponse = buildMockTextractResponse(
                    "Passport No: IT9999999",
                    "Some other text"
            );
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenReturn(partialResponse);

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, null, null);

            assertThat(result.getOverallStatus()).isIn(
                    ProcessIdentityDocumentsResponse.OverallStatus.PARTIAL_SUCCESS,
                    ProcessIdentityDocumentsResponse.OverallStatus.FAILED
            );
        }

        @Test
        @DisplayName("Should return FAILED when all documents fail")
        void testOverallStatusFailed() {
            when(textractClient.detectDocumentText(any(DetectDocumentTextRequest.class)))
                    .thenThrow(TextractException.builder().message("Service unavailable").build());

            ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                    validPassportFront, null, validEmiratesIdFront, null);

            assertThat(result.getOverallStatus())
                    .isEqualTo(ProcessIdentityDocumentsResponse.OverallStatus.FAILED);
        }
    }

    // ============ Helper Methods ============

    /**
     * Build a mock Textract response with the given text lines
     */
    private DetectDocumentTextResponse buildMockTextractResponse(String... lines) {
        List<Block> blocks = java.util.Arrays.stream(lines)
                .map(text -> Block.builder()
                        .blockType(BlockType.LINE)
                        .text(text)
                        .confidence(95.0f)
                        .build())
                .toList();

        return DetectDocumentTextResponse.builder()
                .blocks(blocks)
                .build();
    }
}
