CREATE TYPE user_status AS ENUM ('registered', 'pending', 'verified', 'suspended');
CREATE TYPE user_role AS ENUM ('passenger', 'pilot', 'airfield_operator', 'admin');
CREATE TYPE document_type AS ENUM (
  'id_card',
  'ppl_license',
  'medical_certificate',
  'airfield_operating_license'
);
CREATE TYPE doc_review_status AS ENUM ('pending', 'approved', 'rejected');
