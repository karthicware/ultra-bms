package com.ultrabms.service;

import com.ultrabms.entity.Lead;
import com.ultrabms.entity.Quotation;

/**
 * Service interface for generating quotation PDFs
 */
public interface QuotationPdfService {

    /**
     * Generate PDF for a quotation
     * @param quotation The quotation entity
     * @param lead The associated lead entity
     * @return PDF content as byte array
     */
    byte[] generatePdf(Quotation quotation, Lead lead);
}
