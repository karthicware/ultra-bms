package com.ultrabms.service.impl;

import com.ultrabms.dto.textract.ChequeDetailResponse;
import com.ultrabms.dto.textract.IdentityDocumentDetailResponse;
import com.ultrabms.dto.textract.ProcessChequesResponse;
import com.ultrabms.dto.textract.ProcessIdentityDocumentsResponse;
import com.ultrabms.entity.Quotation;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.QuotationRepository;
import com.ultrabms.service.TextractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.Block;
import software.amazon.awssdk.services.textract.model.BlockType;
import software.amazon.awssdk.services.textract.model.DetectDocumentTextRequest;
import software.amazon.awssdk.services.textract.model.DetectDocumentTextResponse;
import software.amazon.awssdk.services.textract.model.Document;
import software.amazon.awssdk.services.textract.model.TextractException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Textract Service Implementation
 * Processes cheque images using AWS Textract and extracts relevant details.
 *
 * SCP-2025-12-10: Added for tenant onboarding Step 3 cheque processing
 * Region: ap-south-1 (Mumbai) - closest to UAE with Textract support
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TextractServiceImpl implements TextractService {

    private final TextractClient textractClient;
    private final QuotationRepository quotationRepository;

    // Common patterns for UAE bank cheques
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:AED|Dhs?\\.?|Dirham[s]?)?\\s*([\\d,]+(?:\\.\\d{2})?)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CHEQUE_NUMBER_PATTERN = Pattern.compile(
            "(?:Cheque\\s*(?:No\\.?|Number|#)?|CHQ|Check\\s*No\\.?)\\s*:?\\s*(\\d{6,12})",
            Pattern.CASE_INSENSITIVE
    );

    // UAE bank names to detect
    private static final List<String> UAE_BANKS = List.of(
            "Emirates NBD", "ENBD", "Abu Dhabi Commercial Bank", "ADCB",
            "First Abu Dhabi Bank", "FAB", "Dubai Islamic Bank", "DIB",
            "Mashreq", "Commercial Bank of Dubai", "CBD", "RAK Bank",
            "RAKBANK", "Sharjah Islamic Bank", "SIB", "Emirates Islamic",
            "Abu Dhabi Islamic Bank", "ADIB", "National Bank of Fujairah",
            "NBF", "United Arab Bank", "UAB", "Arab Bank", "HSBC", "Citibank",
            "Standard Chartered", "Barclays"
    );

    // Date formats commonly used on UAE cheques
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy")
    );

    // ============ Story 3.10: Identity Document OCR Patterns ============

    // Emirates ID pattern: 784-YYYY-XXXXXXX-X or 784YYYYXXXXXXXX (15 digits)
    private static final Pattern EMIRATES_ID_PATTERN = Pattern.compile(
            "(784[-\\s]?\\d{4}[-\\s]?\\d{7}[-\\s]?\\d)",
            Pattern.CASE_INSENSITIVE
    );

    // Passport number pattern: requires explicit label (No/Number/#) or colon before the number
    // This prevents matching "PASSPORT" text itself as a passport number
    private static final Pattern PASSPORT_NUMBER_PATTERN = Pattern.compile(
            "(?:Passport\\s*(?:No\\.?|Number|#)|Pass\\.?\\s*No\\.?|P/?N)\\s*:?\\s*([A-Z0-9]{6,12})|" +
            "Passport\\s*:\\s*([A-Z0-9]{6,12})",
            Pattern.CASE_INSENSITIVE
    );

    // Fallback passport pattern - alphanumeric codes starting with 1-2 letters followed by 6+ digits
    // More strict: requires at least 6 digits after the letter prefix
    private static final Pattern PASSPORT_NUMBER_FALLBACK = Pattern.compile(
            "\\b([A-Z]{1,2}\\d{6,9})\\b"
    );

    // Nationality keywords
    private static final List<String> NATIONALITY_KEYWORDS = List.of(
            "NATIONALITY", "NATIONAL", "CITIZEN OF", "COUNTRY", "CITIZENSHIP"
    );

    // Name keywords
    private static final List<String> NAME_KEYWORDS = List.of(
            "NAME", "GIVEN NAMES", "SURNAME", "FAMILY NAME", "FULL NAME", "الاسم"
    );

    // Date of birth keywords
    private static final List<String> DOB_KEYWORDS = List.of(
            "DATE OF BIRTH", "DOB", "BIRTH DATE", "BORN", "D.O.B", "تاريخ الميلاد"
    );

    // Expiry date keywords
    private static final List<String> EXPIRY_KEYWORDS = List.of(
            "DATE OF EXPIRY", "EXPIRY", "VALID UNTIL", "EXPIRES", "EXP DATE",
            "تنتهي صلاحيته", "تاريخ الانتهاء", "DATE D'EXPIRATION"
    );

    // Common nationalities for extraction validation
    private static final Set<String> KNOWN_NATIONALITIES = Set.of(
            "EMIRATI", "INDIAN", "PAKISTANI", "FILIPINO", "EGYPTIAN", "BANGLADESHI",
            "BRITISH", "AMERICAN", "CANADIAN", "AUSTRALIAN", "FRENCH", "GERMAN",
            "CHINESE", "JAPANESE", "KOREAN", "INDONESIAN", "MALAYSIAN", "THAI",
            "JORDANIAN", "LEBANESE", "SYRIAN", "IRAQI", "IRANIAN", "SAUDI",
            "KUWAITI", "QATARI", "BAHRAINI", "OMANI", "YEMENI", "SUDANESE",
            "MOROCCAN", "TUNISIAN", "ALGERIAN", "NIGERIAN", "SOUTH AFRICAN",
            "RUSSIAN", "UKRAINIAN", "POLISH", "ITALIAN", "SPANISH", "PORTUGUESE",
            "DUTCH", "BELGIAN", "SWISS", "AUSTRIAN", "SWEDISH", "NORWEGIAN",
            "DANISH", "FINNISH", "IRISH", "SCOTTISH", "WELSH", "NEW ZEALANDER"
    );

    // Allowed image content types
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png"
    );

    // Maximum file size: 5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Override
    public ProcessChequesResponse processChequeImages(List<MultipartFile> chequeImages, UUID quotationId) {
        log.info("Processing {} cheque images for quotation: {}", chequeImages.size(), quotationId);

        // Validate quotation exists and get expected cheque count
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found: " + quotationId));

        // SCP-2025-12-10: Use numberOfCheques directly (already calculated correctly based on firstMonthPaymentMethod)
        // numberOfCheques = numberOfPayments - 1 if first month is CASH, else same as numberOfPayments
        int expectedCount = quotation.getNumberOfCheques() != null ? quotation.getNumberOfCheques() : 12;
        int uploadedCount = chequeImages.size();

        log.info("Expected cheques: {}, Uploaded: {}, First month payment: {}",
                expectedCount, uploadedCount, quotation.getFirstMonthPaymentMethod());

        // Validate count matches
        if (uploadedCount != expectedCount) {
            log.warn("Cheque count mismatch: expected {}, uploaded {}", expectedCount, uploadedCount);
            String paymentNote = quotation.getFirstMonthPaymentMethod() == Quotation.FirstMonthPaymentMethod.CASH
                    ? " (First payment will be by cash)"
                    : "";
            return ProcessChequesResponse.builder()
                    .expectedChequeCount(expectedCount)
                    .uploadedChequeCount(uploadedCount)
                    .cheques(new ArrayList<>())
                    .totalAmount(BigDecimal.ZERO)
                    .successfulCount(0)
                    .failedCount(0)
                    .overallStatus(ProcessChequesResponse.OverallStatus.VALIDATION_ERROR)
                    .validationMessage(String.format(
                            "Expected %d cheques but received %d.%s Please upload exactly %d cheque images.",
                            expectedCount, uploadedCount, paymentNote, expectedCount))
                    .build();
        }

        // Process each cheque
        List<ChequeDetailResponse> processedCheques = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int successCount = 0;
        int failedCount = 0;

        for (int i = 0; i < chequeImages.size(); i++) {
            MultipartFile chequeImage = chequeImages.get(i);
            ChequeDetailResponse result = processSingleCheque(chequeImage, i + 1);
            processedCheques.add(result);

            if (result.getStatus() == ChequeDetailResponse.ProcessingStatus.SUCCESS ||
                result.getStatus() == ChequeDetailResponse.ProcessingStatus.PARTIAL) {
                successCount++;
                if (result.getAmount() != null) {
                    totalAmount = totalAmount.add(result.getAmount());
                }
            } else {
                failedCount++;
            }
        }

        // Determine overall status
        ProcessChequesResponse.OverallStatus overallStatus;
        String validationMessage;

        if (failedCount == 0 && successCount == uploadedCount) {
            overallStatus = ProcessChequesResponse.OverallStatus.SUCCESS;
            validationMessage = "All cheques processed successfully. Please verify the extracted details.";
        } else if (successCount > 0) {
            overallStatus = ProcessChequesResponse.OverallStatus.PARTIAL_SUCCESS;
            validationMessage = String.format(
                    "%d of %d cheques need review. Please verify and complete the missing details.",
                    failedCount, uploadedCount);
        } else {
            overallStatus = ProcessChequesResponse.OverallStatus.PROCESSING_ERROR;
            validationMessage = "Failed to process cheques. Please try again or enter details manually.";
        }

        log.info("Cheque processing complete: {} success, {} failed, total amount: {}",
                successCount, failedCount, totalAmount);

        return ProcessChequesResponse.builder()
                .cheques(processedCheques)
                .totalAmount(totalAmount)
                .expectedChequeCount(expectedCount)
                .uploadedChequeCount(uploadedCount)
                .successfulCount(successCount)
                .failedCount(failedCount)
                .overallStatus(overallStatus)
                .validationMessage(validationMessage)
                .build();
    }

    /**
     * Process a single cheque image using AWS Textract
     */
    private ChequeDetailResponse processSingleCheque(MultipartFile chequeImage, int index) {
        String fileName = chequeImage.getOriginalFilename();
        log.debug("Processing cheque {}: {}", index, fileName);

        try {
            // Read image bytes
            byte[] imageBytes = chequeImage.getBytes();

            // Call Textract DetectDocumentText API
            DetectDocumentTextRequest request = DetectDocumentTextRequest.builder()
                    .document(Document.builder()
                            .bytes(SdkBytes.fromByteArray(imageBytes))
                            .build())
                    .build();

            DetectDocumentTextResponse response = textractClient.detectDocumentText(request);

            // Extract all text lines from the response
            StringBuilder rawText = new StringBuilder();
            List<String> textLines = new ArrayList<>();

            for (Block block : response.blocks()) {
                if (block.blockType() == BlockType.LINE) {
                    String text = block.text();
                    textLines.add(text);
                    rawText.append(text).append("\n");
                }
            }

            // Parse the extracted text
            return parseChequeText(textLines, rawText.toString(), fileName, index);

        } catch (IOException e) {
            log.error("Failed to read cheque image {}: {}", fileName, e.getMessage());
            return buildFailedResponse(index, fileName, "Failed to read image file: " + e.getMessage());
        } catch (TextractException e) {
            log.error("Textract API error for cheque {}: {}", fileName, e.getMessage());
            return buildFailedResponse(index, fileName, "Text extraction failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing cheque {}: {}", fileName, e.getMessage(), e);
            return buildFailedResponse(index, fileName, "Unexpected error: " + e.getMessage());
        }
    }

    /**
     * Parse extracted text to identify cheque details
     */
    private ChequeDetailResponse parseChequeText(List<String> textLines, String rawText,
                                                  String fileName, int index) {
        String bankName = extractBankName(textLines);
        String chequeNumber = extractChequeNumber(rawText);
        BigDecimal amount = extractAmount(rawText);
        LocalDate chequeDate = extractDate(rawText);
        String payTo = extractPayTo(textLines);
        String chequeFrom = extractChequeFrom(textLines);

        // Calculate confidence based on extracted fields
        int fieldsFound = 0;
        if (bankName != null) fieldsFound++;
        if (chequeNumber != null) fieldsFound++;
        if (amount != null) fieldsFound++;
        if (chequeDate != null) fieldsFound++;
        if (payTo != null) fieldsFound++;
        if (chequeFrom != null) fieldsFound++;

        double confidence = (fieldsFound / 6.0) * 100;

        ChequeDetailResponse.ProcessingStatus status;
        String errorMessage = null;

        if (fieldsFound >= 4) {
            status = ChequeDetailResponse.ProcessingStatus.SUCCESS;
        } else if (fieldsFound >= 2) {
            status = ChequeDetailResponse.ProcessingStatus.PARTIAL;
            errorMessage = "Some fields could not be extracted. Please verify and complete.";
        } else {
            status = ChequeDetailResponse.ProcessingStatus.PARTIAL;
            errorMessage = "Limited text extracted. Please enter details manually.";
        }

        return ChequeDetailResponse.builder()
                .chequeIndex(index)
                .fileName(fileName)
                .bankName(bankName)
                .chequeNumber(chequeNumber)
                .amount(amount)
                .chequeDate(chequeDate)
                .payTo(payTo)
                .chequeFrom(chequeFrom)
                .rawText(rawText)
                .status(status)
                .errorMessage(errorMessage)
                .confidenceScore(confidence)
                .build();
    }

    /**
     * Extract bank name from text lines
     */
    private String extractBankName(List<String> textLines) {
        for (String line : textLines) {
            String upperLine = line.toUpperCase();
            for (String bank : UAE_BANKS) {
                if (upperLine.contains(bank.toUpperCase())) {
                    return bank;
                }
            }
        }
        return null;
    }

    /**
     * Extract cheque number using regex pattern
     */
    private String extractChequeNumber(String rawText) {
        Matcher matcher = CHEQUE_NUMBER_PATTERN.matcher(rawText);
        if (matcher.find()) {
            return matcher.group(1);
        }

        // Fallback: look for 6-12 digit numbers that could be cheque numbers
        Pattern fallbackPattern = Pattern.compile("\\b(\\d{6,12})\\b");
        Matcher fallbackMatcher = fallbackPattern.matcher(rawText);
        if (fallbackMatcher.find()) {
            return fallbackMatcher.group(1);
        }

        return null;
    }

    /**
     * Extract amount from text
     */
    private BigDecimal extractAmount(String rawText) {
        Matcher matcher = AMOUNT_PATTERN.matcher(rawText);

        BigDecimal largestAmount = null;

        while (matcher.find()) {
            try {
                String amountStr = matcher.group(1).replace(",", "");
                BigDecimal amount = new BigDecimal(amountStr);

                // Keep track of largest amount (likely the cheque amount)
                if (largestAmount == null || amount.compareTo(largestAmount) > 0) {
                    // Reasonable cheque amount range
                    if (amount.compareTo(BigDecimal.valueOf(100)) >= 0 &&
                        amount.compareTo(BigDecimal.valueOf(10000000)) <= 0) {
                        largestAmount = amount;
                    }
                }
            } catch (NumberFormatException e) {
                log.debug("Could not parse amount: {}", matcher.group(1));
            }
        }

        return largestAmount;
    }

    /**
     * Extract date from text
     */
    private LocalDate extractDate(String rawText) {
        // Look for date patterns in the text
        Pattern datePattern = Pattern.compile(
                "(\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}[/.-]\\d{1,2}[/.-]\\d{1,2})");
        Matcher matcher = datePattern.matcher(rawText);

        while (matcher.find()) {
            String dateStr = matcher.group(1);
            for (DateTimeFormatter formatter : DATE_FORMATTERS) {
                try {
                    LocalDate date = LocalDate.parse(dateStr, formatter);
                    // Validate date is reasonable (not too far in past or future)
                    LocalDate now = LocalDate.now();
                    if (date.isAfter(now.minusYears(1)) && date.isBefore(now.plusYears(2))) {
                        return date;
                    }
                } catch (DateTimeParseException e) {
                    // Try next formatter
                }
            }
        }

        return null;
    }

    /**
     * Extract payee name (Pay To line)
     */
    private String extractPayTo(List<String> textLines) {
        for (int i = 0; i < textLines.size(); i++) {
            String line = textLines.get(i).toUpperCase();
            if (line.contains("PAY TO") || line.contains("PAYEE") || line.contains("PAY:")) {
                // Try to get the value from same line or next line
                String value = extractValueAfterLabel(textLines.get(i));
                if (value != null) return value;

                if (i + 1 < textLines.size()) {
                    String nextLine = textLines.get(i + 1).trim();
                    if (!nextLine.isEmpty() && !isLabelLine(nextLine)) {
                        return nextLine;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Extract payer/account holder name
     */
    private String extractChequeFrom(List<String> textLines) {
        for (int i = 0; i < textLines.size(); i++) {
            String line = textLines.get(i).toUpperCase();
            if (line.contains("A/C") || line.contains("ACCOUNT") ||
                line.contains("ACCOUNT HOLDER") || line.contains("NAME:")) {
                String value = extractValueAfterLabel(textLines.get(i));
                if (value != null) return value;

                if (i + 1 < textLines.size()) {
                    String nextLine = textLines.get(i + 1).trim();
                    if (!nextLine.isEmpty() && !isLabelLine(nextLine)) {
                        return nextLine;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Extract value after a label (e.g., "Pay To: John Doe" -> "John Doe")
     */
    private String extractValueAfterLabel(String line) {
        int colonIndex = line.indexOf(':');
        if (colonIndex > 0 && colonIndex < line.length() - 1) {
            String value = line.substring(colonIndex + 1).trim();
            if (!value.isEmpty()) {
                return value;
            }
        }
        return null;
    }

    /**
     * Check if a line is a label line (not a value)
     */
    private boolean isLabelLine(String line) {
        String upper = line.toUpperCase();
        return upper.contains("DATE") || upper.contains("AMOUNT") ||
               upper.contains("PAY TO") || upper.contains("A/C") ||
               upper.contains("CHEQUE") || upper.contains("BANK");
    }

    /**
     * Build a failed response for a cheque that couldn't be processed
     */
    private ChequeDetailResponse buildFailedResponse(int index, String fileName, String errorMessage) {
        return ChequeDetailResponse.builder()
                .chequeIndex(index)
                .fileName(fileName)
                .status(ChequeDetailResponse.ProcessingStatus.FAILED)
                .errorMessage(errorMessage)
                .confidenceScore(0.0)
                .build();
    }

    // ============ Story 3.10: Identity Document OCR Implementation ============

    @Override
    public ProcessIdentityDocumentsResponse processIdentityDocuments(
            MultipartFile passportFront,
            MultipartFile passportBack,
            MultipartFile emiratesIdFront,
            MultipartFile emiratesIdBack) {

        log.info("Processing identity documents - passport: {}/{}, emirates: {}/{}",
                passportFront != null, passportBack != null,
                emiratesIdFront != null, emiratesIdBack != null);

        long startTime = System.currentTimeMillis();

        // Validate at least one document provided
        if (passportFront == null && passportBack == null &&
            emiratesIdFront == null && emiratesIdBack == null) {
            throw new ValidationException("At least one identity document must be provided");
        }

        // Validate file formats and sizes
        validateIdentityDocumentFiles(passportFront, passportBack, emiratesIdFront, emiratesIdBack);

        IdentityDocumentDetailResponse passportDetails = null;
        IdentityDocumentDetailResponse emiratesIdDetails = null;

        // Process passport if provided
        if (passportFront != null || passportBack != null) {
            passportDetails = processPassportDocument(passportFront, passportBack);
        }

        // Process Emirates ID if provided
        if (emiratesIdFront != null || emiratesIdBack != null) {
            emiratesIdDetails = processEmiratesIdDocument(emiratesIdFront, emiratesIdBack);
        }

        // Determine overall status
        ProcessIdentityDocumentsResponse.OverallStatus overallStatus;
        String message;

        boolean passportSuccess = passportDetails == null ||
                passportDetails.getStatus() == IdentityDocumentDetailResponse.ProcessingStatus.SUCCESS;
        boolean emiratesSuccess = emiratesIdDetails == null ||
                emiratesIdDetails.getStatus() == IdentityDocumentDetailResponse.ProcessingStatus.SUCCESS;
        boolean passportPartial = passportDetails != null &&
                passportDetails.getStatus() == IdentityDocumentDetailResponse.ProcessingStatus.PARTIAL;
        boolean emiratesPartial = emiratesIdDetails != null &&
                emiratesIdDetails.getStatus() == IdentityDocumentDetailResponse.ProcessingStatus.PARTIAL;

        if (passportSuccess && emiratesSuccess && !passportPartial && !emiratesPartial) {
            overallStatus = ProcessIdentityDocumentsResponse.OverallStatus.SUCCESS;
            message = "All documents processed successfully. Please verify the extracted details.";
        } else if ((passportDetails != null && passportDetails.getStatus() == IdentityDocumentDetailResponse.ProcessingStatus.FAILED) &&
                   (emiratesIdDetails != null && emiratesIdDetails.getStatus() == IdentityDocumentDetailResponse.ProcessingStatus.FAILED)) {
            overallStatus = ProcessIdentityDocumentsResponse.OverallStatus.FAILED;
            message = "Failed to process documents. Please enter details manually.";
        } else {
            overallStatus = ProcessIdentityDocumentsResponse.OverallStatus.PARTIAL_SUCCESS;
            message = "Some fields could not be extracted. Please verify and complete missing details.";
        }

        long processingTime = System.currentTimeMillis() - startTime;
        log.info("Identity document processing completed in {}ms with status: {}", processingTime, overallStatus);

        return ProcessIdentityDocumentsResponse.builder()
                .passportDetails(passportDetails)
                .emiratesIdDetails(emiratesIdDetails)
                .overallStatus(overallStatus)
                .message(message)
                .build();
    }

    /**
     * Validate identity document files for format and size
     */
    private void validateIdentityDocumentFiles(MultipartFile... files) {
        for (MultipartFile file : files) {
            if (file != null) {
                String contentType = file.getContentType();
                if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                    throw new ValidationException(
                            "Invalid file format for " + file.getOriginalFilename() +
                            ". Only JPEG and PNG images are allowed.");
                }
                if (file.getSize() > MAX_FILE_SIZE) {
                    throw new ValidationException(
                            "File " + file.getOriginalFilename() +
                            " exceeds maximum size of 5MB.");
                }
            }
        }
    }

    /**
     * Process passport document (front side only)
     * Note: Back side is not processed for OCR - only front side contains relevant data
     */
    private IdentityDocumentDetailResponse processPassportDocument(
            MultipartFile passportFront, MultipartFile passportBack) {

        log.debug("Processing passport document (front side only)");
        long startTime = System.currentTimeMillis();

        StringBuilder combinedText = new StringBuilder();
        List<String> allLines = new ArrayList<>();

        // Process front side only - back side is ignored for OCR
        if (passportFront != null) {
            try {
                String[] frontResult = extractTextFromDocument(passportFront);
                combinedText.append(frontResult[0]).append("\n");
                allLines.addAll(Arrays.asList(frontResult[1].split("\n")));
            } catch (Exception e) {
                log.error("Failed to process passport front: {}", e.getMessage());
            }
        }

        // Note: passportBack is intentionally not processed - OCR only applies to front side

        String rawText = combinedText.toString();

        if (rawText.trim().isEmpty()) {
            return buildFailedIdentityResponse(
                    IdentityDocumentDetailResponse.DocumentType.PASSPORT,
                    "No text could be extracted from passport images");
        }

        // Extract passport fields
        String passportNumber = extractPassportNumber(rawText);
        String expiryDate = extractIdentityExpiryDate(rawText, allLines);
        String nationality = extractNationality(rawText, allLines);
        String fullName = extractFullName(allLines);
        String dateOfBirth = extractDateOfBirth(rawText, allLines);

        // Calculate confidence
        int fieldsFound = 0;
        if (passportNumber != null) fieldsFound++;
        if (expiryDate != null) fieldsFound++;
        if (nationality != null) fieldsFound++;
        if (fullName != null) fieldsFound++;
        if (dateOfBirth != null) fieldsFound++;

        double confidence = (fieldsFound / 5.0) * 100;

        IdentityDocumentDetailResponse.ProcessingStatus status;
        String errorMessage = null;

        if (confidence >= 70) {
            status = IdentityDocumentDetailResponse.ProcessingStatus.SUCCESS;
        } else if (fieldsFound >= 2) {
            status = IdentityDocumentDetailResponse.ProcessingStatus.PARTIAL;
            errorMessage = "Some passport fields could not be extracted. Please verify and complete.";
        } else {
            status = IdentityDocumentDetailResponse.ProcessingStatus.FAILED;
            errorMessage = "Limited text extracted from passport. Please enter details manually.";
        }

        long processingTime = System.currentTimeMillis() - startTime;
        log.info("Passport processing completed in {}ms. Fields: number={}, expiry={}, nationality={}, name={}, dob={}",
                processingTime, passportNumber != null, expiryDate != null,
                nationality != null, fullName != null, dateOfBirth != null);

        return IdentityDocumentDetailResponse.builder()
                .documentType(IdentityDocumentDetailResponse.DocumentType.PASSPORT)
                .documentNumber(passportNumber)
                .expiryDate(expiryDate)
                .nationality(nationality)
                .fullName(fullName)
                .dateOfBirth(dateOfBirth)
                .confidenceScore(confidence)
                .status(status)
                .errorMessage(errorMessage)
                .build();
    }

    /**
     * Process Emirates ID document (front side only)
     * Note: Back side is not processed for OCR - only front side contains relevant data
     */
    private IdentityDocumentDetailResponse processEmiratesIdDocument(
            MultipartFile emiratesIdFront, MultipartFile emiratesIdBack) {

        log.debug("Processing Emirates ID document (front side only)");
        long startTime = System.currentTimeMillis();

        StringBuilder combinedText = new StringBuilder();
        List<String> allLines = new ArrayList<>();

        // Process front side only - back side is ignored for OCR
        if (emiratesIdFront != null) {
            try {
                String[] frontResult = extractTextFromDocument(emiratesIdFront);
                combinedText.append(frontResult[0]).append("\n");
                allLines.addAll(Arrays.asList(frontResult[1].split("\n")));
            } catch (Exception e) {
                log.error("Failed to process Emirates ID front: {}", e.getMessage());
            }
        }

        // Note: emiratesIdBack is intentionally not processed - OCR only applies to front side

        String rawText = combinedText.toString();

        if (rawText.trim().isEmpty()) {
            return buildFailedIdentityResponse(
                    IdentityDocumentDetailResponse.DocumentType.EMIRATES_ID,
                    "No text could be extracted from Emirates ID images");
        }

        // Extract Emirates ID fields
        String emiratesIdNumber = extractEmiratesIdNumber(rawText);
        String expiryDate = extractIdentityExpiryDate(rawText, allLines);
        String fullName = extractFullName(allLines);
        String dateOfBirth = extractDateOfBirth(rawText, allLines);
        String nationality = extractNationality(rawText, allLines);

        // Calculate confidence
        int fieldsFound = 0;
        if (emiratesIdNumber != null) fieldsFound++;
        if (expiryDate != null) fieldsFound++;
        if (fullName != null) fieldsFound++;
        if (dateOfBirth != null) fieldsFound++;
        if (nationality != null) fieldsFound++;

        double confidence = (fieldsFound / 5.0) * 100;

        IdentityDocumentDetailResponse.ProcessingStatus status;
        String errorMessage = null;

        if (confidence >= 70) {
            status = IdentityDocumentDetailResponse.ProcessingStatus.SUCCESS;
        } else if (fieldsFound >= 2) {
            status = IdentityDocumentDetailResponse.ProcessingStatus.PARTIAL;
            errorMessage = "Some Emirates ID fields could not be extracted. Please verify and complete.";
        } else {
            status = IdentityDocumentDetailResponse.ProcessingStatus.FAILED;
            errorMessage = "Limited text extracted from Emirates ID. Please enter details manually.";
        }

        long processingTime = System.currentTimeMillis() - startTime;
        log.info("Emirates ID processing completed in {}ms. Fields: id={}, expiry={}, name={}, dob={}, nationality={}",
                processingTime, emiratesIdNumber != null, expiryDate != null,
                fullName != null, dateOfBirth != null, nationality != null);

        return IdentityDocumentDetailResponse.builder()
                .documentType(IdentityDocumentDetailResponse.DocumentType.EMIRATES_ID)
                .documentNumber(emiratesIdNumber)
                .expiryDate(expiryDate)
                .fullName(fullName)
                .dateOfBirth(dateOfBirth)
                .nationality(nationality)
                .confidenceScore(confidence)
                .status(status)
                .errorMessage(errorMessage)
                .build();
    }

    /**
     * Extract text from a document using AWS Textract
     * Returns [rawText, linesSeparatedByNewline]
     */
    private String[] extractTextFromDocument(MultipartFile document) throws IOException {
        byte[] imageBytes = document.getBytes();

        DetectDocumentTextRequest request = DetectDocumentTextRequest.builder()
                .document(Document.builder()
                        .bytes(SdkBytes.fromByteArray(imageBytes))
                        .build())
                .build();

        DetectDocumentTextResponse response = textractClient.detectDocumentText(request);

        StringBuilder rawText = new StringBuilder();
        StringBuilder lines = new StringBuilder();

        for (Block block : response.blocks()) {
            if (block.blockType() == BlockType.LINE) {
                String text = block.text();
                rawText.append(text).append(" ");
                lines.append(text).append("\n");
            }
        }

        return new String[]{rawText.toString(), lines.toString()};
    }

    /**
     * Extract passport number from text
     */
    private String extractPassportNumber(String rawText) {
        // Try primary pattern first
        Matcher matcher = PASSPORT_NUMBER_PATTERN.matcher(rawText);
        if (matcher.find()) {
            // Pattern has two capture groups in alternation - check which one matched
            String result = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            if (result != null) {
                return sanitizeExtractedText(result.toUpperCase());
            }
        }

        // Try fallback pattern
        Matcher fallback = PASSPORT_NUMBER_FALLBACK.matcher(rawText);
        if (fallback.find()) {
            return sanitizeExtractedText(fallback.group(1).toUpperCase());
        }

        return null;
    }

    /**
     * Extract Emirates ID number (784-YYYY-XXXXXXX-X format)
     */
    private String extractEmiratesIdNumber(String rawText) {
        Matcher matcher = EMIRATES_ID_PATTERN.matcher(rawText);
        if (matcher.find()) {
            String idNumber = matcher.group(1).replaceAll("[\\s-]", "");
            // Format to standard: 784-YYYY-XXXXXXX-X
            if (idNumber.length() == 15) {
                return String.format("%s-%s-%s-%s",
                        idNumber.substring(0, 3),
                        idNumber.substring(3, 7),
                        idNumber.substring(7, 14),
                        idNumber.substring(14));
            }
            return sanitizeExtractedText(idNumber);
        }
        return null;
    }

    /**
     * Extract expiry date from identity document
     */
    private String extractIdentityExpiryDate(String rawText, List<String> lines) {
        // Look for expiry keywords followed by dates
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).toUpperCase();
            for (String keyword : EXPIRY_KEYWORDS) {
                if (line.contains(keyword)) {
                    // Try to extract date from same line
                    LocalDate date = extractDateFromText(line);
                    if (date != null && isValidExpiryDate(date)) {
                        return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                    }
                    // Try next line
                    if (i + 1 < lines.size()) {
                        date = extractDateFromText(lines.get(i + 1));
                        if (date != null && isValidExpiryDate(date)) {
                            return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                        }
                    }
                }
            }
        }

        // Fallback: Look for any date in the future (likely expiry)
        Pattern datePattern = Pattern.compile(
                "(\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}[/.-]\\d{1,2}[/.-]\\d{1,2})");
        Matcher matcher = datePattern.matcher(rawText);

        LocalDate bestExpiryDate = null;
        while (matcher.find()) {
            LocalDate date = parseDate(matcher.group(1));
            if (date != null && isValidExpiryDate(date)) {
                if (bestExpiryDate == null || date.isAfter(bestExpiryDate)) {
                    bestExpiryDate = date;
                }
            }
        }

        return bestExpiryDate != null ? bestExpiryDate.format(DateTimeFormatter.ISO_LOCAL_DATE) : null;
    }

    /**
     * Extract nationality from document
     */
    private String extractNationality(String rawText, List<String> lines) {
        // Look for nationality keywords
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).toUpperCase();
            for (String keyword : NATIONALITY_KEYWORDS) {
                if (line.contains(keyword)) {
                    // Try to extract nationality from same line after keyword
                    String value = extractValueAfterKeyword(lines.get(i), keyword);
                    if (value != null && isValidNationality(value)) {
                        return sanitizeExtractedText(capitalize(value));
                    }
                    // Try next line
                    if (i + 1 < lines.size()) {
                        String nextLine = lines.get(i + 1).trim();
                        if (isValidNationality(nextLine)) {
                            return sanitizeExtractedText(capitalize(nextLine));
                        }
                    }
                }
            }
        }

        // Fallback: scan for known nationalities
        String upperText = rawText.toUpperCase();
        for (String nationality : KNOWN_NATIONALITIES) {
            if (upperText.contains(nationality)) {
                return capitalize(nationality);
            }
        }

        return null;
    }

    /**
     * Extract full name from document
     */
    private String extractFullName(List<String> lines) {
        // Look for name keywords
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).toUpperCase();
            for (String keyword : NAME_KEYWORDS) {
                if (line.contains(keyword)) {
                    // Try to extract name from same line after keyword
                    String value = extractValueAfterKeyword(lines.get(i), keyword);
                    if (value != null && isValidName(value)) {
                        return sanitizeExtractedText(capitalize(value));
                    }
                    // Try next line
                    if (i + 1 < lines.size()) {
                        String nextLine = lines.get(i + 1).trim();
                        if (isValidName(nextLine)) {
                            return sanitizeExtractedText(capitalize(nextLine));
                        }
                    }
                }
            }
        }

        // Fallback: Look for lines that appear to be names (multiple words, no numbers)
        for (String line : lines) {
            String trimmed = line.trim();
            if (isValidName(trimmed) && trimmed.split("\\s+").length >= 2) {
                // Skip if contains common non-name keywords
                String upper = trimmed.toUpperCase();
                if (!upper.contains("PASSPORT") && !upper.contains("EMIRATES") &&
                    !upper.contains("UNITED") && !upper.contains("AUTHORITY") &&
                    !upper.contains("GOVERNMENT") && !upper.contains("IDENTITY")) {
                    return sanitizeExtractedText(capitalize(trimmed));
                }
            }
        }

        return null;
    }

    /**
     * Extract date of birth from document
     */
    private String extractDateOfBirth(String rawText, List<String> lines) {
        // Look for DOB keywords
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).toUpperCase();
            for (String keyword : DOB_KEYWORDS) {
                if (line.contains(keyword)) {
                    // Try to extract date from same line
                    LocalDate date = extractDateFromText(line);
                    if (date != null && isValidBirthDate(date)) {
                        return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                    }
                    // Try next line
                    if (i + 1 < lines.size()) {
                        date = extractDateFromText(lines.get(i + 1));
                        if (date != null && isValidBirthDate(date)) {
                            return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                        }
                    }
                }
            }
        }

        // Fallback: Look for dates that could be birth dates (past, reasonable age)
        Pattern datePattern = Pattern.compile(
                "(\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}[/.-]\\d{1,2}[/.-]\\d{1,2})");
        Matcher matcher = datePattern.matcher(rawText);

        LocalDate bestDobDate = null;
        while (matcher.find()) {
            LocalDate date = parseDate(matcher.group(1));
            if (date != null && isValidBirthDate(date)) {
                if (bestDobDate == null || date.isBefore(bestDobDate)) {
                    bestDobDate = date;
                }
            }
        }

        return bestDobDate != null ? bestDobDate.format(DateTimeFormatter.ISO_LOCAL_DATE) : null;
    }

    /**
     * Extract date from text segment
     */
    private LocalDate extractDateFromText(String text) {
        Pattern datePattern = Pattern.compile(
                "(\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}[/.-]\\d{1,2}[/.-]\\d{1,2})");
        Matcher matcher = datePattern.matcher(text);
        if (matcher.find()) {
            return parseDate(matcher.group(1));
        }
        return null;
    }

    /**
     * Parse date string using multiple formats
     */
    private LocalDate parseDate(String dateStr) {
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }
        return null;
    }

    /**
     * Extract value after a keyword (e.g., "Nationality: British" -> "British")
     */
    private String extractValueAfterKeyword(String line, String keyword) {
        int keywordIndex = line.toUpperCase().indexOf(keyword.toUpperCase());
        if (keywordIndex >= 0) {
            String after = line.substring(keywordIndex + keyword.length()).trim();
            // Remove leading colon and spaces
            after = after.replaceFirst("^[:\\s]+", "").trim();
            if (!after.isEmpty()) {
                // Take first word or phrase up to next keyword/punctuation
                String[] words = after.split("[,;/\\|]");
                if (words.length > 0 && !words[0].trim().isEmpty()) {
                    return words[0].trim();
                }
            }
        }
        return null;
    }

    /**
     * Check if date is a valid expiry date (in the future but not too far)
     */
    private boolean isValidExpiryDate(LocalDate date) {
        LocalDate now = LocalDate.now();
        return date.isAfter(now.minusMonths(6)) && date.isBefore(now.plusYears(20));
    }

    /**
     * Check if date is a valid birth date (in the past, reasonable age)
     */
    private boolean isValidBirthDate(LocalDate date) {
        LocalDate now = LocalDate.now();
        return date.isBefore(now.minusYears(16)) && date.isAfter(now.minusYears(120));
    }

    /**
     * Check if string is a valid nationality
     */
    private boolean isValidNationality(String value) {
        if (value == null || value.length() < 3 || value.length() > 30) return false;
        // Should be mostly alphabetic
        return value.matches("^[A-Za-z\\s\\-]+$");
    }

    /**
     * Check if string is a valid name
     */
    private boolean isValidName(String value) {
        if (value == null || value.length() < 2 || value.length() > 100) return false;
        // Should contain letters and possibly spaces, hyphens, apostrophes
        // Allow Arabic characters as well
        return value.matches("^[A-Za-z\\u0600-\\u06FF\\s\\-']+$") ||
               value.matches("^[\\p{L}\\s\\-']+$");
    }

    /**
     * Capitalize string properly
     */
    private String capitalize(String input) {
        if (input == null || input.isEmpty()) return input;
        String[] words = input.toLowerCase().split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                if (result.length() > 0) result.append(" ");
                result.append(Character.toUpperCase(word.charAt(0)));
                if (word.length() > 1) {
                    result.append(word.substring(1));
                }
            }
        }
        return result.toString();
    }

    /**
     * Sanitize extracted text to prevent injection attacks
     */
    private String sanitizeExtractedText(String text) {
        if (text == null) return null;
        // Remove potentially dangerous characters
        return text.replaceAll("[<>\"'&;\\\\]", "").trim();
    }

    /**
     * Build a failed response for identity document processing
     */
    private IdentityDocumentDetailResponse buildFailedIdentityResponse(
            IdentityDocumentDetailResponse.DocumentType documentType, String errorMessage) {
        return IdentityDocumentDetailResponse.builder()
                .documentType(documentType)
                .status(IdentityDocumentDetailResponse.ProcessingStatus.FAILED)
                .errorMessage(errorMessage)
                .confidenceScore(0.0)
                .build();
    }
}
