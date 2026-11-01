CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE activity_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE token_purpose AS ENUM ('verify_email', 'reset_password');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  full_name varchar(255) NOT NULL,
  registration_number varchar(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  email_verified_at timestamptz,
  session_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 1900 AND 2200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, name, year)
);

CREATE TABLE event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  event_type_id uuid REFERENCES event_types(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  description varchar(2000) NOT NULL,
  workload integer NOT NULL CHECK (workload > 0),
  completion_date date NOT NULL,
  status activity_status NOT NULL DEFAULT 'pending',
  observation varchar(2000),
  file_key varchar(1024) NOT NULL,
  file_hash char(64) NOT NULL UNIQUE,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose token_purpose NOT NULL,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_user_id_idx ON activities(user_id);
CREATE INDEX activities_status_archived_idx ON activities(status, archived);
CREATE INDEX projects_course_id_idx ON projects(course_id);
CREATE INDEX auth_tokens_lookup_idx ON auth_tokens(token_hash, purpose, expires_at) WHERE used_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS activities_file_key_unique_idx ON activities(file_key);

INSERT INTO event_types(name) VALUES ('Curso'), ('Palestra'), ('Projeto') ON CONFLICT DO NOTHING;
