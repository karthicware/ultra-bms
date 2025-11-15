-- Create leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    emirates_id VARCHAR(50) NOT NULL,
    passport_number VARCHAR(50) NOT NULL,
    passport_expiry_date DATE NOT NULL,
    home_country VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    lead_source VARCHAR(20) NOT NULL,
    notes VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    property_interest VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    CONSTRAINT fk_lead_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for leads table
CREATE INDEX idx_leads_lead_number ON leads(lead_number);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_emirates_id ON leads(emirates_id);
CREATE INDEX idx_leads_passport_number ON leads(passport_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_lead_source ON leads(lead_source);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Create quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id UUID NOT NULL,
    property_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    stay_type VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    validity_date DATE NOT NULL,
    base_rent DECIMAL(10, 2) NOT NULL,
    service_charges DECIMAL(10, 2) NOT NULL,
    parking_spots INTEGER NOT NULL,
    parking_fee DECIMAL(10, 2) NOT NULL,
    security_deposit DECIMAL(10, 2) NOT NULL,
    admin_fee DECIMAL(10, 2) NOT NULL,
    total_first_payment DECIMAL(10, 2) NOT NULL,
    document_requirements TEXT,
    payment_terms TEXT NOT NULL,
    movein_procedures TEXT NOT NULL,
    cancellation_policy TEXT NOT NULL,
    special_terms TEXT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_by UUID NOT NULL,
    CONSTRAINT fk_quotation_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
    CONSTRAINT fk_quotation_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for quotations table
CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_lead_id ON quotations(lead_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_validity_date ON quotations(validity_date);
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);

-- Create lead_documents table
CREATE TABLE lead_documents (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_document_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
    CONSTRAINT fk_document_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create indexes for lead_documents table
CREATE INDEX idx_lead_documents_lead_id ON lead_documents(lead_id);
CREATE INDEX idx_lead_documents_uploaded_at ON lead_documents(uploaded_at DESC);

-- Create lead_history table
CREATE TABLE lead_history (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    CONSTRAINT fk_history_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
    CONSTRAINT fk_history_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for lead_history table
CREATE INDEX idx_lead_history_lead_id ON lead_history(lead_id);
CREATE INDEX idx_lead_history_created_at ON lead_history(created_at DESC);
CREATE INDEX idx_lead_history_event_type ON lead_history(event_type);
