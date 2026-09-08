-- Consumer Attention Mapping System (CAMS) - PostgreSQL Schema

CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  store_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  manager_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  shelf_count INT DEFAULT 0,
  camera_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shelves (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  shelf_number VARCHAR(50) NOT NULL,
  store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  store_name VARCHAR(150),
  category VARCHAR(100),
  section VARCHAR(100),
  product_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cameras (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  camera_code VARCHAR(50) NOT NULL,
  shelf_id VARCHAR(50) REFERENCES shelves(id) ON DELETE SET NULL,
  shelf_name VARCHAR(150),
  store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  store_name VARCHAR(150),
  status VARCHAR(50) DEFAULT 'Active',
  stream_url TEXT,
  resolution VARCHAR(50),
  fps INT DEFAULT 30,
  last_active VARCHAR(50) DEFAULT 'Just now',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  assigned_store_id VARCHAR(50) REFERENCES stores(id) ON DELETE SET NULL,
  assigned_store_name VARCHAR(150),
  status VARCHAR(50) DEFAULT 'Active',
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_analyses (
  id VARCHAR(50) PRIMARY KEY,
  video_filename VARCHAR(255) NOT NULL,
  video_path TEXT,
  store_id VARCHAR(50) REFERENCES stores(id) ON DELETE SET NULL,
  camera_id VARCHAR(50) REFERENCES cameras(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  total_people INT DEFAULT 0,
  unique_people INT DEFAULT 0,
  duration_sec FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id VARCHAR(50) PRIMARY KEY,
  analysis_id VARCHAR(50) NOT NULL REFERENCES video_analyses(id) ON DELETE CASCADE,
  results_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
