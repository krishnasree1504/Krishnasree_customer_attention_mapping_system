import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './postgres';

async function seed() {
  console.log('[Seed] Starting PostgreSQL database seeding...');

  try {
    // 1. Create tables if they do not exist
    await pool.query(`
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
    `);

    // 2. Insert Stores
    const stores = [
      {
        id: 'str-1',
        name: 'Mumbai Central Flagship',
        store_code: 'ST-MH-001',
        address: 'Lower Parel, Senapati Bapat Marg',
        city: 'Mumbai',
        state: 'MH',
        manager_name: 'Rajesh Sharma',
        status: 'Active',
        shelf_count: 3,
        camera_count: 3,
      },
      {
        id: 'str-2',
        name: 'Bengaluru Tech Park',
        store_code: 'ST-KA-002',
        address: '100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        state: 'KA',
        manager_name: 'Vikram Mehta',
        status: 'Active',
        shelf_count: 2,
        camera_count: 2,
      },
      {
        id: 'str-3',
        name: 'Delhi Connaught Plaza',
        store_code: 'ST-DL-003',
        address: 'Connaught Place, Block C',
        city: 'New Delhi',
        state: 'DL',
        manager_name: 'Unassigned',
        status: 'Active',
        shelf_count: 2,
        camera_count: 2,
      },
      {
        id: 'str-4',
        name: 'Hyderabad Cyber Towers',
        store_code: 'ST-TS-004',
        address: 'HITEC City, Madhapur',
        city: 'Hyderabad',
        state: 'TS',
        manager_name: 'Unassigned',
        status: 'Maintenance',
        shelf_count: 1,
        camera_count: 1,
      },
    ];

    for (const s of stores) {
      await pool.query(
        `INSERT INTO stores (id, name, store_code, address, city, state, manager_name, status, shelf_count, camera_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           store_code = EXCLUDED.store_code,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           manager_name = EXCLUDED.manager_name,
           status = EXCLUDED.status,
           shelf_count = EXCLUDED.shelf_count,
           camera_count = EXCLUDED.camera_count`,
        [s.id, s.name, s.store_code, s.address, s.city, s.state, s.manager_name, s.status, s.shelf_count, s.camera_count]
      );
    }
    console.log(`[Seed] Seeded ${stores.length} stores`);

    // 3. Insert Shelves
    const shelves = [
      {
        id: 'shf-1',
        name: 'Beverages Aisle A1',
        shelf_number: 'SH-01',
        store_id: 'str-1',
        store_name: 'Mumbai Central Flagship',
        category: 'Beverages',
        section: 'Aisle 1 Bay A',
        product_count: 140,
        status: 'Active',
      },
      {
        id: 'shf-2',
        name: 'Snacks & Confectionery B2',
        shelf_number: 'SH-02',
        store_id: 'str-1',
        store_name: 'Mumbai Central Flagship',
        category: 'Snacks',
        section: 'Aisle 2 Bay B',
        product_count: 220,
        status: 'Active',
      },
      {
        id: 'shf-3',
        name: 'Electronics Showcase C1',
        shelf_number: 'SH-03',
        store_id: 'str-1',
        store_name: 'Mumbai Central Flagship',
        category: 'Electronics',
        section: 'Aisle 3 Bay C',
        product_count: 85,
        status: 'Active',
      },
      {
        id: 'shf-4',
        name: 'Dairy Essentials Section E1',
        shelf_number: 'SH-04',
        store_id: 'str-2',
        store_name: 'Bengaluru Tech Park',
        category: 'Dairy',
        section: 'Aisle 1 Bay E',
        product_count: 95,
        status: 'Active',
      },
      {
        id: 'shf-5',
        name: 'Gadgets & Accessories F2',
        shelf_number: 'SH-05',
        store_id: 'str-2',
        store_name: 'Bengaluru Tech Park',
        category: 'Electronics',
        section: 'Aisle 2 Bay F',
        product_count: 160,
        status: 'Active',
      },
      {
        id: 'shf-6',
        name: 'Stationery & Office H1',
        shelf_number: 'SH-06',
        store_id: 'str-3',
        store_name: 'Delhi Connaught Plaza',
        category: 'Stationery',
        section: 'Aisle 1 Bay H',
        product_count: 310,
        status: 'Active',
      },
      {
        id: 'shf-7',
        name: 'Toys & Gaming Zone I1',
        shelf_number: 'SH-07',
        store_id: 'str-3',
        store_name: 'Delhi Connaught Plaza',
        category: 'Toys',
        section: 'Aisle 2 Bay I',
        product_count: 75,
        status: 'Active',
      },
      {
        id: 'shf-8',
        name: 'Cold Beverages Bar K1',
        shelf_number: 'SH-08',
        store_id: 'str-4',
        store_name: 'Hyderabad Cyber Towers',
        category: 'Beverages',
        section: 'Aisle 1 Bay K',
        product_count: 150,
        status: 'Active',
      },
    ];

    for (const sh of shelves) {
      await pool.query(
        `INSERT INTO shelves (id, name, shelf_number, store_id, store_name, category, section, product_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           shelf_number = EXCLUDED.shelf_number,
           store_id = EXCLUDED.store_id,
           store_name = EXCLUDED.store_name,
           category = EXCLUDED.category,
           section = EXCLUDED.section,
           product_count = EXCLUDED.product_count,
           status = EXCLUDED.status`,
        [sh.id, sh.name, sh.shelf_number, sh.store_id, sh.store_name, sh.category, sh.section, sh.product_count, sh.status]
      );
    }
    console.log(`[Seed] Seeded ${shelves.length} shelves`);

    // 4. Insert Cameras
    const cameras = [
      {
        id: 'cam-1',
        name: 'Beverage Aisle Main Overhead',
        camera_code: 'CAM-MUM-01',
        shelf_id: 'shf-1',
        shelf_name: 'Beverages Aisle A1',
        store_id: 'str-1',
        store_name: 'Mumbai Central Flagship',
        status: 'Active',
        stream_url: 'rtsp://stream.cams-system.internal/mum/cam-01',
        resolution: '1080p (1920x1080)',
        fps: 30,
        last_active: '2 mins ago',
      },
      {
        id: 'cam-2',
        name: 'Snacks Counter Dual-Lens',
        camera_code: 'CAM-MUM-02',
        shelf_id: 'shf-2',
        shelf_name: 'Snacks & Confectionery B2',
        store_id: 'str-1',
        store_name: 'Mumbai Central Flagship',
        status: 'Active',
        stream_url: 'rtsp://stream.cams-system.internal/mum/cam-02',
        resolution: '1080p (1920x1080)',
        fps: 30,
        last_active: '1 min ago',
      },
      {
        id: 'cam-3',
        name: 'Electronics Shelf Wide View',
        camera_code: 'CAM-MUM-03',
        shelf_id: 'shf-3',
        shelf_name: 'Electronics Showcase C1',
        store_id: 'str-1',
        store_name: 'Mumbai Central Flagship',
        status: 'Offline',
        stream_url: 'rtsp://stream.cams-system.internal/mum/cam-03',
        resolution: '4K (3840x2160)',
        fps: 60,
        last_active: '25 mins ago',
      },
      {
        id: 'cam-4',
        name: 'Dairy Section Thermal Tracker',
        camera_code: 'CAM-BLR-01',
        shelf_id: 'shf-4',
        shelf_name: 'Dairy Essentials Section E1',
        store_id: 'str-2',
        store_name: 'Bengaluru Tech Park',
        status: 'Active',
        stream_url: 'rtsp://stream.cams-system.internal/blr/cam-01',
        resolution: '1080p (1920x1080)',
        fps: 30,
        last_active: 'Just now',
      },
      {
        id: 'cam-5',
        name: 'Gadgets High-Res Optical',
        camera_code: 'CAM-BLR-02',
        shelf_id: 'shf-5',
        shelf_name: 'Gadgets & Accessories F2',
        store_id: 'str-2',
        store_name: 'Bengaluru Tech Park',
        status: 'Active',
        stream_url: 'rtsp://stream.cams-system.internal/blr/cam-02',
        resolution: '4K (3840x2160)',
        fps: 60,
        last_active: '5 mins ago',
      },
      {
        id: 'cam-6',
        name: 'Stationery Aisle Panoramic',
        camera_code: 'CAM-DEL-01',
        shelf_id: 'shf-6',
        shelf_name: 'Stationery & Office H1',
        store_id: 'str-3',
        store_name: 'Delhi Connaught Plaza',
        status: 'Active',
        stream_url: 'rtsp://stream.cams-system.internal/del/cam-01',
        resolution: '1080p (1920x1080)',
        fps: 30,
        last_active: '12 mins ago',
      },
      {
        id: 'cam-7',
        name: 'Toys Section Cam 02',
        camera_code: 'CAM-DEL-02',
        shelf_id: 'shf-7',
        shelf_name: 'Toys & Gaming Zone I1',
        store_id: 'str-3',
        store_name: 'Delhi Connaught Plaza',
        status: 'Maintenance',
        stream_url: 'rtsp://stream.cams-system.internal/del/cam-02',
        resolution: '720p (1280x720)',
        fps: 24,
        last_active: '2 hours ago',
      },
      {
        id: 'cam-8',
        name: 'Cold Drinks Bar Ultra-Wide',
        camera_code: 'CAM-HYD-01',
        shelf_id: 'shf-8',
        shelf_name: 'Cold Beverages Bar K1',
        store_id: 'str-4',
        store_name: 'Hyderabad Cyber Towers',
        status: 'Active',
        stream_url: 'rtsp://stream.cams-system.internal/hyd/cam-01',
        resolution: '1080p (1920x1080)',
        fps: 30,
        last_active: '8 mins ago',
      },
    ];

    for (const c of cameras) {
      await pool.query(
        `INSERT INTO cameras (id, name, camera_code, shelf_id, shelf_name, store_id, store_name, status, stream_url, resolution, fps, last_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           camera_code = EXCLUDED.camera_code,
           shelf_id = EXCLUDED.shelf_id,
           shelf_name = EXCLUDED.shelf_name,
           store_id = EXCLUDED.store_id,
           store_name = EXCLUDED.store_name,
           status = EXCLUDED.status,
           stream_url = EXCLUDED.stream_url,
           resolution = EXCLUDED.resolution,
           fps = EXCLUDED.fps,
           last_active = EXCLUDED.last_active`,
        [c.id, c.name, c.camera_code, c.shelf_id, c.shelf_name, c.store_id, c.store_name, c.status, c.stream_url, c.resolution, c.fps, c.last_active]
      );
    }
    console.log(`[Seed] Seeded ${cameras.length} cameras`);

    // 5. Insert Users (with bcrypt hashed passwords and preserving original demo credentials)
    const users = [
      {
        id: 'usr-1',
        name: 'Alexandra Vance',
        email: 'admin@cams.com',
        rawPassword: 'admin123',
        role: 'Admin',
        status: 'Active',
        phone: '+91 98200 12345',
        assigned_store_id: null,
        assigned_store_name: null,
      },
      {
        id: 'usr-admin-demo',
        name: 'System Admin',
        email: 'admin@example.com',
        rawPassword: 'admin123',
        role: 'Admin',
        status: 'Active',
        phone: '+91 98200 00000',
        assigned_store_id: null,
        assigned_store_name: null,
      },
      {
        id: 'usr-2',
        name: 'Rajesh Sharma',
        email: 'manager@cams.com',
        rawPassword: 'manager123',
        role: 'Store Manager',
        status: 'Active',
        phone: '+91 98765 43210',
        assigned_store_id: 'str-1',
        assigned_store_name: 'Mumbai Central Flagship',
      },
      {
        id: 'usr-3',
        name: 'Priya Sundaram',
        email: 'analyst@cams.com',
        rawPassword: 'analyst123',
        role: 'Analyst',
        status: 'Active',
        phone: '+91 99887 76655',
        assigned_store_id: null,
        assigned_store_name: null,
      },
      {
        id: 'usr-4',
        name: 'Vikram Mehta',
        email: 'vmehta@cams.com',
        rawPassword: 'password123',
        role: 'Store Manager',
        status: 'Active',
        phone: '+91 97112 23344',
        assigned_store_id: 'str-2',
        assigned_store_name: 'Bengaluru Tech Park',
      },
    ];

    for (const u of users) {
      const passwordHash = bcrypt.hashSync(u.rawPassword, 10);
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, assigned_store_id, assigned_store_name, status, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           assigned_store_id = EXCLUDED.assigned_store_id,
           assigned_store_name = EXCLUDED.assigned_store_name,
           status = EXCLUDED.status,
           phone = EXCLUDED.phone`,
        [u.id, u.name, u.email, passwordHash, u.role, u.assigned_store_id, u.assigned_store_name, u.status, u.phone]
      );
    }
    console.log(`[Seed] Seeded ${users.length} users with secure bcrypt hashes`);

    console.log('✅ PostgreSQL database seeded successfully!');
  } catch (error) {
    console.error('❌ PostgreSQL seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
