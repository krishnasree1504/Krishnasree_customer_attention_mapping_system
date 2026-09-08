import bcrypt from 'bcryptjs';
import { pool } from './postgres';
import { User, Store, Shelf, Camera, SystemActivity, SystemStats } from './schema';

function mapStoreRow(row: any): Store {
  return {
    id: row.id,
    name: row.name,
    storeCode: row.store_code || row.storeCode || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    managerName: row.manager_name || row.managerName || 'Unassigned',
    status: row.status || 'Active',
    shelfCount: Number(row.shelf_count ?? row.shelfCount ?? 0),
    cameraCount: Number(row.camera_count ?? row.cameraCount ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function mapShelfRow(row: any): Shelf {
  const shelfName = row.shelf_name || row.name || '';
  return {
    id: row.id,
    shelfName: shelfName,
    name: row.name || shelfName,
    shelfNumber: row.shelf_number || row.shelfNumber || '',
    storeId: row.store_id || row.storeId || '',
    storeName: row.store_name || row.storeName || 'Store Location',
    category: row.category || 'General',
    section: row.section || 'Aisle 1',
    productCount: Number(row.product_count ?? row.productCount ?? 0),
    status: row.status || 'Active',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function mapCameraRow(row: any): Camera {
  const cameraName = row.camera_name || row.name || '';
  const cameraCode = row.camera_code || row.camera_id || row.cameraCode || row.cameraId || '';
  return {
    id: row.id,
    cameraName: cameraName,
    name: row.name || cameraName,
    cameraId: cameraCode,
    cameraCode: cameraCode,
    shelfId: row.shelf_id || row.shelfId || undefined,
    shelfName: row.shelf_name || row.shelfName || undefined,
    storeId: row.store_id || row.storeId || '',
    storeName: row.store_name || row.storeName || 'Store Location',
    status: row.status || 'Active',
    streamUrl: row.stream_url || row.streamUrl || '',
    resolution: row.resolution || '1080p (1920x1080)',
    fps: Number(row.fps ?? 30),
    lastActive: row.last_active || row.lastActive || 'Just now',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function mapUserRow(row: any, includePassword = false): User {
  const user: any = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    assignedStoreId: row.assigned_store_id || row.assignedStoreId || undefined,
    assignedStoreName: row.assigned_store_name || row.assignedStoreName || undefined,
    status: row.status || 'Active',
    phone: row.phone || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
  if (includePassword) {
    user.password = row.password_hash || row.password;
    user.password_hash = row.password_hash;
  }
  return user;
}

export class Database {
  private activities: SystemActivity[] = [
    {
      id: 'act-1',
      user: 'Alexandra Vance (Admin)',
      action: 'Registered new store branch',
      target: 'Hyderabad Cyber Towers (ST-TS-004)',
      timestamp: '15 mins ago',
      type: 'success',
    },
    {
      id: 'act-2',
      user: 'Rajesh Sharma',
      action: 'Updated camera stream URL',
      target: 'CAM-MUM-01 (Beverages)',
      timestamp: '32 mins ago',
      type: 'info',
    },
    {
      id: 'act-3',
      user: 'System Watchdog',
      action: 'Detected camera signal drop',
      target: 'CAM-MUM-03 (Electronics)',
      timestamp: '1 hour ago',
      type: 'warning',
    },
    {
      id: 'act-4',
      user: 'Vikram Mehta',
      action: 'Added shelf',
      target: 'Gadgets & Accessories F2',
      timestamp: '3 hours ago',
      type: 'success',
    },
    {
      id: 'act-5',
      user: 'Priya Sundaram',
      action: 'Generated store status report',
      target: 'Delhi Connaught Plaza',
      timestamp: '5 hours ago',
      type: 'info',
    },
  ];

  // ==========================================
  // USERS METHODS
  // ==========================================

  async getUsers(): Promise<User[]> {
    const res = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.assigned_store_id, 
        COALESCE(u.assigned_store_name, s.name) AS assigned_store_name,
        u.status, 
        u.phone, 
        u.created_at
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      ORDER BY u.created_at DESC
    `);
    return res.rows.map((r: any) => mapUserRow(r, false));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const res = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.assigned_store_id, 
        COALESCE(u.assigned_store_name, s.name) AS assigned_store_name,
        u.status, 
        u.phone, 
        u.created_at
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      WHERE u.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return undefined;
    return mapUserRow(res.rows[0], false);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const res = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.assigned_store_id, 
        COALESCE(u.assigned_store_name, s.name) AS assigned_store_name,
        u.status, 
        u.phone, 
        u.created_at
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );
    if (res.rows.length === 0) return undefined;
    return mapUserRow(res.rows[0], false);
  }

  async getUserWithPasswordByEmail(email: string): Promise<(User & { password_hash?: string }) | null> {
    const res = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash,
        u.role, 
        u.assigned_store_id, 
        COALESCE(u.assigned_store_name, s.name) AS assigned_store_name,
        u.status, 
        u.phone, 
        u.created_at
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );
    if (res.rows.length === 0) return null;
    return mapUserRow(res.rows[0], true) as User & { password_hash?: string };
  }

  async getUserWithPasswordById(id: string): Promise<(User & { password_hash?: string }) | null> {
    const res = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash,
        u.role, 
        u.assigned_store_id, 
        COALESCE(u.assigned_store_name, s.name) AS assigned_store_name,
        u.status, 
        u.phone, 
        u.created_at
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      WHERE u.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return mapUserRow(res.rows[0], true) as User & { password_hash?: string };
  }

  async validateUserCredentials(email: string, passwordAttempt: string): Promise<User | null> {
    const userWithPass = await this.getUserWithPasswordByEmail(email);
    if (!userWithPass) return null;
    if (userWithPass.status === 'Inactive') return null;

    const normalizedEmail = userWithPass.email.toLowerCase();
    const isDemoAdmin = normalizedEmail === 'admin@cams.com' || normalizedEmail === 'admin@example.com';
    const isDemoManager = normalizedEmail === 'manager@cams.com';
    const isDemoAnalyst = normalizedEmail === 'analyst@cams.com';

    let isPasswordMatch = false;
    const storedHash = userWithPass.password || userWithPass.password_hash || '';

    // Check bcrypt hash
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      try {
        isPasswordMatch = bcrypt.compareSync(passwordAttempt, storedHash);
      } catch {
        isPasswordMatch = false;
      }
    }

    // Check plaintext match
    if (!isPasswordMatch && storedHash && storedHash === passwordAttempt) {
      isPasswordMatch = true;
    }

    // Demo credentials fallback
    if (!isPasswordMatch) {
      if (isDemoAdmin) {
        isPasswordMatch = passwordAttempt === 'admin123' || passwordAttempt === 'password123';
      } else if (isDemoManager) {
        isPasswordMatch = passwordAttempt === 'manager123' || passwordAttempt === 'password123';
      } else if (isDemoAnalyst) {
        isPasswordMatch = passwordAttempt === 'analyst123' || passwordAttempt === 'password123';
      }
    }

    if (!isPasswordMatch) return null;

    // Return safe user object with no password_hash exposed
    const { password, ...safeUser } = userWithPass as any;
    delete safeUser.password_hash;
    return safeUser as User;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const id = data.id || `usr-${Date.now()}`;
    const name = data.name || 'New User';
    const email = data.email || 'user@cams.com';
    const rawPassword = data.password || 'password123';
    const passwordHash = bcrypt.hashSync(rawPassword, 10);
    const role = data.role || 'Analyst';
    const assignedStoreId = data.assignedStoreId || null;
    const assignedStoreName = data.assignedStoreName || null;
    const status = data.status || 'Active';
    const phone = data.phone || '+91 98000 00000';
    const createdAt = data.createdAt || new Date().toISOString();

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, assigned_store_id, assigned_store_name, status, phone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, name, email, passwordHash, role, assignedStoreId, assignedStoreName, status, phone, createdAt]
    );

    return {
      id,
      name,
      email,
      role: role as any,
      assignedStoreId: assignedStoreId || undefined,
      assignedStoreName: assignedStoreName || undefined,
      status: status as any,
      phone,
      createdAt,
    };
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIdx++}`);
      values.push(data.email);
    }
    if (data.password !== undefined) {
      updates.push(`password_hash = $${paramIdx++}`);
      values.push(bcrypt.hashSync(data.password, 10));
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramIdx++}`);
      values.push(data.role);
    }
    if (data.assignedStoreId !== undefined) {
      updates.push(`assigned_store_id = $${paramIdx++}`);
      values.push(data.assignedStoreId || null);
    }
    if (data.assignedStoreName !== undefined) {
      updates.push(`assigned_store_name = $${paramIdx++}`);
      values.push(data.assignedStoreName || null);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(data.status);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIdx++}`);
      values.push(data.phone);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
        values
      );
    }

    return (await this.getUserById(id)) || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================
  // STORES METHODS
  // ==========================================

  async getStores(): Promise<Store[]> {
    const res = await pool.query(`
      SELECT 
        id, 
        name, 
        store_code, 
        address, 
        city, 
        state, 
        manager_name, 
        status, 
        shelf_count, 
        camera_count, 
        created_at
      FROM stores
      ORDER BY created_at DESC
    `);
    return res.rows.map(mapStoreRow);
  }

  async getStoreById(id: string): Promise<Store | undefined> {
    const res = await pool.query(
      `SELECT 
        id, 
        name, 
        store_code, 
        address, 
        city, 
        state, 
        manager_name, 
        status, 
        shelf_count, 
        camera_count, 
        created_at
      FROM stores
      WHERE id = $1`,
      [id]
    );
    if (res.rows.length === 0) return undefined;
    return mapStoreRow(res.rows[0]);
  }

  async createStore(data: Partial<Store>): Promise<Store> {
    const id = data.id || `str-${Date.now()}`;
    const name = data.name || 'New Store';
    const storeCode = data.storeCode || `ST-IN-${Math.floor(100 + Math.random() * 900)}`;
    const address = data.address || 'MG Road';
    const city = data.city || 'Mumbai';
    const state = data.state || 'MH';
    const managerName = data.managerName || 'Unassigned';
    const status = data.status || 'Active';
    const shelfCount = data.shelfCount ?? 0;
    const cameraCount = data.cameraCount ?? 0;
    const createdAt = data.createdAt || new Date().toISOString();

    await pool.query(
      `INSERT INTO stores (id, name, store_code, address, city, state, manager_name, status, shelf_count, camera_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, name, storeCode, address, city, state, managerName, status, shelfCount, cameraCount, createdAt]
    );

    return {
      id,
      name,
      storeCode,
      address,
      city,
      state,
      managerName,
      status: status as any,
      shelfCount,
      cameraCount,
      createdAt,
    };
  }

  async updateStore(id: string, data: Partial<Store>): Promise<Store | undefined> {
    const current = await this.getStoreById(id);
    if (!current) return undefined;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(data.name);
    }
    if (data.storeCode !== undefined) {
      updates.push(`store_code = $${paramIdx++}`);
      values.push(data.storeCode);
    }
    if (data.address !== undefined) {
      updates.push(`address = $${paramIdx++}`);
      values.push(data.address);
    }
    if (data.city !== undefined) {
      updates.push(`city = $${paramIdx++}`);
      values.push(data.city);
    }
    if (data.state !== undefined) {
      updates.push(`state = $${paramIdx++}`);
      values.push(data.state);
    }
    if (data.managerName !== undefined) {
      updates.push(`manager_name = $${paramIdx++}`);
      values.push(data.managerName);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(data.status);
    }
    if (data.shelfCount !== undefined) {
      updates.push(`shelf_count = $${paramIdx++}`);
      values.push(data.shelfCount);
    }
    if (data.cameraCount !== undefined) {
      updates.push(`camera_count = $${paramIdx++}`);
      values.push(data.cameraCount);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE stores SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
        values
      );
    }

    // Synchronize store name across shelves, cameras, and assigned users if name changed
    if (data.name && data.name !== current.name) {
      await pool.query(`UPDATE shelves SET store_name = $1 WHERE store_id = $2`, [data.name, id]);
      await pool.query(`UPDATE cameras SET store_name = $1 WHERE store_id = $2`, [data.name, id]);
      await pool.query(`UPDATE users SET assigned_store_name = $1 WHERE assigned_store_id = $2`, [data.name, id]);
    }

    return (await this.getStoreById(id)) || undefined;
  }

  async deleteStore(id: string): Promise<boolean> {
    // Cascading deletion for cameras and shelves belonging to deleted store, and unassign users
    await pool.query(`DELETE FROM cameras WHERE store_id = $1`, [id]);
    await pool.query(`DELETE FROM shelves WHERE store_id = $1`, [id]);
    await pool.query(`UPDATE users SET assigned_store_id = NULL, assigned_store_name = NULL WHERE assigned_store_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM stores WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================
  // SHELVES METHODS
  // ==========================================

  async getShelves(): Promise<Shelf[]> {
    const res = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.shelf_number, 
        s.store_id, 
        COALESCE(s.store_name, st.name, 'Store Location') AS store_name,
        s.category, 
        s.section, 
        s.product_count, 
        s.status, 
        s.created_at
      FROM shelves s
      LEFT JOIN stores st ON s.store_id = st.id
      ORDER BY s.created_at DESC
    `);
    return res.rows.map(mapShelfRow);
  }

  async getShelfById(id: string): Promise<Shelf | undefined> {
    const res = await pool.query(
      `SELECT 
        s.id, 
        s.name, 
        s.shelf_number, 
        s.store_id, 
        COALESCE(s.store_name, st.name, 'Store Location') AS store_name,
        s.category, 
        s.section, 
        s.product_count, 
        s.status, 
        s.created_at
      FROM shelves s
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return undefined;
    return mapShelfRow(res.rows[0]);
  }

  async createShelf(data: Partial<Shelf>): Promise<Shelf> {
  const stores = await this.getStores();

  const targetStoreId =
    data.storeId || (stores[0] ? stores[0].id : 'str-1');

  const store = stores.find((s) => s.id === targetStoreId);
  const storeName = store
    ? store.name
    : (data.storeName || 'Store Location');

  const id = data.id || `shf-${Date.now()}`;
  const name = data.name || data.shelfName || 'New Shelf';
  const shelfNumber =
    data.shelfNumber || `SH-${Math.floor(10 + Math.random() * 90)}`;
  const category = data.category || 'General';
  const section = data.section || 'Aisle 1';
  const productCount = data.productCount ?? 50;
  const status = data.status || 'Active';
  const createdAt = data.createdAt || new Date().toISOString();

  await pool.query(
    `INSERT INTO shelves
      (id, name, shelf_name, shelf_number, store_id, store_name,
       category, section, product_count, status, created_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      name,
      name,
      shelfNumber,
      targetStoreId,
      storeName,
      category,
      section,
      productCount,
      status,
      createdAt
    ]
  );

  await pool.query(
    `UPDATE stores
     SET shelf_count = COALESCE(shelf_count, 0) + 1
     WHERE id = $1`,
    [targetStoreId]
  );

  return {
    id,
    name,
    shelfName: name,
    shelfNumber,
    storeId: targetStoreId,
    storeName,
    category,
    section,
    productCount,
    status: status as any,
    createdAt,
  };
}
  async updateShelf(id: string, data: Partial<Shelf>): Promise<Shelf | undefined> {
    const current = await this.getShelfById(id);
    if (!current) return undefined;

    const oldStoreId = current.storeId;
    let targetStoreName = current.storeName;

    if (data.storeId && data.storeId !== oldStoreId) {
      await pool.query(`UPDATE stores SET shelf_count = GREATEST(COALESCE(shelf_count, 0) - 1, 0) WHERE id = $1`, [oldStoreId]);
      await pool.query(`UPDATE stores SET shelf_count = COALESCE(shelf_count, 0) + 1 WHERE id = $1`, [data.storeId]);
      const newStore = await this.getStoreById(data.storeId);
      if (newStore) targetStoreName = newStore.name;
    } else if (data.storeId) {
      const s = await this.getStoreById(data.storeId);
      if (s) targetStoreName = s.name;
    }

    const updatedName = data.shelfName || data.name || current.name;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (updatedName !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(updatedName);
    }
    if (data.shelfNumber !== undefined) {
      updates.push(`shelf_number = $${paramIdx++}`);
      values.push(data.shelfNumber);
    }
    if (data.storeId !== undefined) {
      updates.push(`store_id = $${paramIdx++}`);
      values.push(data.storeId);
    }
    updates.push(`store_name = $${paramIdx++}`);
    values.push(targetStoreName);

    if (data.category !== undefined) {
      updates.push(`category = $${paramIdx++}`);
      values.push(data.category);
    }
    if (data.section !== undefined) {
      updates.push(`section = $${paramIdx++}`);
      values.push(data.section);
    }
    if (data.productCount !== undefined) {
      updates.push(`product_count = $${paramIdx++}`);
      values.push(data.productCount);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(data.status);
    }

    values.push(id);
    await pool.query(
      `UPDATE shelves SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      values
    );

    // Update shelf name on attached cameras
    if (updatedName !== current.name) {
      await pool.query(`UPDATE cameras SET shelf_name = $1 WHERE shelf_id = $2`, [updatedName, id]);
    }

    return (await this.getShelfById(id)) || undefined;
  }

  async deleteShelf(id: string): Promise<boolean> {
    const current = await this.getShelfById(id);
    if (!current) return false;

    // Decrement store shelf count
    await pool.query(`UPDATE stores SET shelf_count = GREATEST(COALESCE(shelf_count, 0) - 1, 0) WHERE id = $1`, [current.storeId]);

    // Unlink cameras attached to this shelf
    await pool.query(`UPDATE cameras SET shelf_id = NULL, shelf_name = NULL WHERE shelf_id = $1`, [id]);

    const result = await pool.query(`DELETE FROM shelves WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================
  // CAMERAS METHODS
  // ==========================================

  async getCameras(): Promise<Camera[]> {
    const res = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.camera_code, 
        c.shelf_id, 
        COALESCE(c.shelf_name, sh.name) AS shelf_name, 
        c.store_id, 
        COALESCE(c.store_name, st.name, 'Store Location') AS store_name, 
        c.status, 
        c.stream_url, 
        c.resolution, 
        c.fps, 
        c.last_active, 
        c.created_at
      FROM cameras c
      LEFT JOIN stores st ON c.store_id = st.id
      LEFT JOIN shelves sh ON c.shelf_id = sh.id
      ORDER BY c.created_at DESC
    `);
    return res.rows.map(mapCameraRow);
  }

  async getCameraById(id: string): Promise<Camera | undefined> {
    const res = await pool.query(
      `SELECT 
        c.id, 
        c.name, 
        c.camera_code, 
        c.shelf_id, 
        COALESCE(c.shelf_name, sh.name) AS shelf_name, 
        c.store_id, 
        COALESCE(c.store_name, st.name, 'Store Location') AS store_name, 
        c.status, 
        c.stream_url, 
        c.resolution, 
        c.fps, 
        c.last_active, 
        c.created_at
      FROM cameras c
      LEFT JOIN stores st ON c.store_id = st.id
      LEFT JOIN shelves sh ON c.shelf_id = sh.id
      WHERE c.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return undefined;
    return mapCameraRow(res.rows[0]);
  }

 async createCamera(data: Partial<Camera>): Promise<Camera> {
  const stores = await this.getStores();

  const targetStoreId =
    data.storeId || (stores[0] ? stores[0].id : 'str-1');

  const store = stores.find((s) => s.id === targetStoreId);

  const storeName = store
    ? store.name
    : (data.storeName || 'Store Location');

  let shelfName = data.shelfName;

  if (data.shelfId) {
    const shelf = await this.getShelfById(data.shelfId);
    if (shelf) {
      shelfName = shelf.name;
    }
  }

  const id = data.id || `cam-${Date.now()}`;
  const name = data.name || data.cameraName || 'New Camera';

  const cameraCode =
    data.cameraCode ||
    data.cameraId ||
    `CAM-IN-${Math.floor(10 + Math.random() * 90)}`;

  const status = data.status || 'Active';
  const streamUrl =
    data.streamUrl || 'rtsp://stream.cams-system.internal/in/cam-01';
  const resolution = data.resolution || '1080p (1920x1080)';
  const fps = data.fps || 30;
  const lastActive = new Date().toISOString();
  const createdAt = data.createdAt || new Date().toISOString();

  await pool.query(
    `INSERT INTO cameras
      (id, name, camera_name, camera_id, camera_code,
       shelf_id, shelf_name, store_id, store_name, status,
       stream_url, resolution, fps, last_active, created_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15)`,
    [
      id,
      name,
      name,
      cameraCode,
      cameraCode,
      data.shelfId || null,
      shelfName || null,
      targetStoreId,
      storeName,
      status,
      streamUrl,
      resolution,
      fps,
      lastActive,
      createdAt
    ]
  );

  await pool.query(
    `UPDATE stores
     SET camera_count = COALESCE(camera_count, 0) + 1
     WHERE id = $1`,
    [targetStoreId]
  );

  return {
    id,
    name,
    cameraName: name,
    cameraId: cameraCode,
    cameraCode,
    shelfId: data.shelfId,
    shelfName,
    storeId: targetStoreId,
    storeName,
    status: status as any,
    streamUrl,
    resolution,
    fps,
    lastActive,
    createdAt,
  };

  await pool.query(
    `UPDATE stores
     SET camera_count = COALESCE(camera_count, 0) + 1
     WHERE id = $1`,
    [targetStoreId]
  );

  return {
    id,
    name,
    cameraName: name,
    cameraId: cameraCode,
    cameraCode,
    shelfId: data.shelfId,
    shelfName,
    storeId: targetStoreId,
    storeName,
    status: status as any,
    streamUrl,
    resolution,
    fps,
    lastActive,
    createdAt,
  };
}

  async updateCamera(id: string, data: Partial<Camera>): Promise<Camera | undefined> {
    const current = await this.getCameraById(id);
    if (!current) return undefined;

    const oldStoreId = current.storeId;
    let targetStoreName = current.storeName;

    if (data.storeId && data.storeId !== oldStoreId) {
      await pool.query(`UPDATE stores SET camera_count = GREATEST(COALESCE(camera_count, 0) - 1, 0) WHERE id = $1`, [oldStoreId]);
      await pool.query(`UPDATE stores SET camera_count = COALESCE(camera_count, 0) + 1 WHERE id = $1`, [data.storeId]);
      const newStore = await this.getStoreById(data.storeId);
      if (newStore) targetStoreName = newStore.name;
    } else if (data.storeId) {
      const s = await this.getStoreById(data.storeId);
      if (s) targetStoreName = s.name;
    }

    let shelfName = current.shelfName;
    if (data.shelfId !== undefined) {
      if (data.shelfId) {
        const shelf = await this.getShelfById(data.shelfId);
        shelfName = shelf ? shelf.name : undefined;
      } else {
        shelfName = undefined;
      }
    }

    const updatedName = data.cameraName || data.name || current.name;
    const updatedCode = data.cameraCode || data.cameraId || current.cameraCode;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (updatedName !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(updatedName);
    }
    if (updatedCode !== undefined) {
      updates.push(`camera_code = $${paramIdx++}`);
      values.push(updatedCode);
    }
    if (data.shelfId !== undefined) {
      updates.push(`shelf_id = $${paramIdx++}`);
      values.push(data.shelfId || null);
      updates.push(`shelf_name = $${paramIdx++}`);
      values.push(shelfName || null);
    }
    if (data.storeId !== undefined) {
      updates.push(`store_id = $${paramIdx++}`);
      values.push(data.storeId);
      updates.push(`store_name = $${paramIdx++}`);
      values.push(targetStoreName);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(data.status);
    }
    if (data.streamUrl !== undefined) {
      updates.push(`stream_url = $${paramIdx++}`);
      values.push(data.streamUrl);
    }
    if (data.resolution !== undefined) {
      updates.push(`resolution = $${paramIdx++}`);
      values.push(data.resolution);
    }
    if (data.fps !== undefined) {
      updates.push(`fps = $${paramIdx++}`);
      values.push(data.fps);
    }
    if (data.lastActive !== undefined) {
      updates.push(`last_active = $${paramIdx++}`);
      values.push(data.lastActive);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE cameras SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
        values
      );
    }

    return (await this.getCameraById(id)) || undefined;
  }

  async deleteCamera(id: string): Promise<boolean> {
    const current = await this.getCameraById(id);
    if (!current) return false;

    await pool.query(`UPDATE stores SET camera_count = GREATEST(COALESCE(camera_count, 0) - 1, 0) WHERE id = $1`, [current.storeId]);
    const result = await pool.query(`DELETE FROM cameras WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================
  // SYSTEM STATS
  // ==========================================

  async getStats(): Promise<SystemStats> {
    const res = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM stores) AS total_stores,
        (SELECT COUNT(*)::int FROM stores WHERE status = 'Active') AS active_stores,
        (SELECT COUNT(*)::int FROM shelves) AS total_shelves,
        (SELECT COUNT(*)::int FROM cameras) AS total_cameras,
        (SELECT COUNT(*)::int FROM cameras WHERE status = 'Active') AS active_cameras,
        (SELECT COUNT(*)::int FROM cameras WHERE status = 'Offline') AS offline_cameras,
        (SELECT COUNT(*)::int FROM cameras WHERE status = 'Maintenance') AS maintenance_cameras,
        (SELECT COUNT(*)::int FROM users) AS total_users;
    `);

    const row = res.rows[0] || {};
    return {
      totalStores: row.total_stores || 0,
      activeStores: row.active_stores || 0,
      totalShelves: row.total_shelves || 0,
      totalCameras: row.total_cameras || 0,
      activeCameras: row.active_cameras || 0,
      offlineCameras: row.offline_cameras || 0,
      maintenanceCameras: row.maintenance_cameras || 0,
      totalUsers: row.total_users || 0,
      recentActivities: this.activities,
    };
  }

  // ==========================================
  // VIDEO ANALYSES PERSISTENCE
  // ==========================================

  async saveVideoAnalysis(data: {
  id?: string;
  videoFilename: string;
  videoPath?: string;
  storeId?: string;
  cameraId?: string;
  status?: string;
  totalPeople?: number;
  uniquePeople?: number;
  durationSec?: number;
}) {
  const id = data.id || `va-${Date.now()}`;

  await pool.query(
    `INSERT INTO video_analyses
      (id, store_id, original_filename, original_video_path, status, created_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       original_filename = EXCLUDED.original_filename,
       original_video_path = EXCLUDED.original_video_path,
       store_id = EXCLUDED.store_id,
       status = EXCLUDED.status,
       completed_at = CURRENT_TIMESTAMP`,
    [
      id,
      data.storeId || null,
      data.videoFilename,
      data.videoPath || null,
      data.status || 'completed',
    ]
  );

  return id;
}

  async saveAnalysisResult(analysisId: string, resultData: any) {
    const id = `res-${analysisId}`;
    await pool.query(
      `INSERT INTO analysis_results (id, analysis_id, results_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         results_data = EXCLUDED.results_data`,
      [id, analysisId, JSON.stringify(resultData)]
    );
    return id;
  }

  async getVideoAnalyses(): Promise<any[]> {
    const res = await pool.query(`SELECT * FROM video_analyses ORDER BY created_at DESC`);
    return res.rows;
  }

  async getAnalysisResult(analysisId: string): Promise<any | null> {
    const res = await pool.query(`SELECT * FROM analysis_results WHERE analysis_id = $1`, [analysisId]);
    if (res.rows.length === 0) return null;
    return res.rows[0].results_data;
  }
}

export const db = new Database();
