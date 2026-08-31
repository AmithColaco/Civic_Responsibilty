const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Crucial for cloud hosting later
        trustServerCertificate: true, // Vital for local development connections
        instanceName: process.env.DB_INSTANCE
    }
};

const initializeDatabaseSchema = async (pool) => {
    try {
        const targetDB = process.env.DB_NAME || 'CivicSense';
        
        // Add latitude, longitude, and after_media_attachments if they don't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'latitude')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD latitude DECIMAL(9,6);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'longitude')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD longitude DECIMAL(9,6);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'after_media_attachments')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD after_media_attachments NVARCHAR(MAX);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'complainee_email')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD complainee_email NVARCHAR(255);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'location_type')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD location_type NVARCHAR(100);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'issue_size')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD issue_size NVARCHAR(100);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'assigned_contractor')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD assigned_contractor NVARCHAR(255);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'parent_complaint_id')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD parent_complaint_id INT NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'category')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD category NVARCHAR(255);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'merged_into_id')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD merged_into_id INT NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINTS') AND name = 'is_potential_duplicate')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.COMPLAINTS ADD is_potential_duplicate BIT NOT NULL DEFAULT 0;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.USERS') AND name = 'role')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.USERS ADD role VARCHAR(100) DEFAULT 'citizen';
            END
            ELSE
            BEGIN
                ALTER TABLE ${targetDB}.dbo.USERS ALTER COLUMN role VARCHAR(100);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.USERS') AND name = 'department')
            BEGIN
                ALTER TABLE ${targetDB}.dbo.USERS ADD department NVARCHAR(255);
            END

            -- Also make sure APPROVED_OFFICIALS role column is altered if it exists
            IF EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('${targetDB}.dbo.APPROVED_OFFICIALS'))
            BEGIN
                ALTER TABLE ${targetDB}.dbo.APPROVED_OFFICIALS ALTER COLUMN role VARCHAR(100) NOT NULL;
            END
        `);

        // Create COMPLAINT_COMMENTS table for department remarks
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('${targetDB}.dbo.COMPLAINT_COMMENTS'))
            BEGIN
                CREATE TABLE ${targetDB}.dbo.COMPLAINT_COMMENTS (
                    id           INT IDENTITY(1,1) PRIMARY KEY,
                    complaint_no INT NOT NULL,
                    author_name  NVARCHAR(255) NOT NULL,
                    department   NVARCHAR(255) NOT NULL,
                    comment_text NVARCHAR(MAX) NOT NULL,
                    created_at   DATETIME DEFAULT GETDATE()
                );
            END
        `);

        // ================================================================
        // APPROVED_OFFICIALS whitelist table
        // Super Admin inserts engineer emails here. On login, the backend
        // checks this table and promotes the user's role accordingly.
        // ================================================================
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('${targetDB}.dbo.APPROVED_OFFICIALS'))
            BEGIN
                CREATE TABLE ${targetDB}.dbo.APPROVED_OFFICIALS (
                    id              INT IDENTITY(1,1) PRIMARY KEY,
                    email           NVARCHAR(255) NOT NULL UNIQUE,
                    role            VARCHAR(100)  NOT NULL DEFAULT 'engineer',
                    department      NVARCHAR(255),
                    ward_assignment NVARCHAR(255) DEFAULT 'All Wards',
                    invited_by      NVARCHAR(255),
                    invited_at      DATETIME DEFAULT GETDATE()
                );
            END
            ELSE
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${targetDB}.dbo.APPROVED_OFFICIALS') AND name = 'ward_assignment')
                BEGIN
                    ALTER TABLE ${targetDB}.dbo.APPROVED_OFFICIALS ADD ward_assignment NVARCHAR(255) DEFAULT 'All Wards';
                END
            END
        `);

        // Migrate legacy columns where role is null to 'citizen' standard baseline
        await pool.request().query(`
            UPDATE ${targetDB}.dbo.USERS SET role = 'citizen' WHERE role IS NULL;
        `);

        // ================================================================
        // Auto-seed and sync Super Admin accounts
        // Default Password: Winston@2006
        // ================================================================
        const superAdminAccounts = [
            { email: 'amithcolaco@gmail.com', password: 'Winston@2006', name: 'Super Admin Amith' },
            { email: 'admin@civicsense.in', password: 'Winston@2006', name: 'Super Admin Portal' },
            { email: 'admin@mangaluru.gov.in', password: 'Winston@2006', name: 'MCC Admin' }
        ];

        for (const admin of superAdminAccounts) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(admin.password, salt);

            const existingAdmin = await pool.request()
                .input('email', sql.NVarChar, admin.email)
                .query(`SELECT ID FROM ${targetDB}.dbo.USERS WHERE EMAIL = @email`);

            if (existingAdmin.recordset.length === 0) {
                await pool.request()
                    .input('name', sql.NVarChar, admin.name)
                    .input('email', sql.NVarChar, admin.email)
                    .input('password', sql.NVarChar, hashedPassword)
                    .input('role', sql.VarChar, 'super_admin')
                    .query(`
                        INSERT INTO ${targetDB}.dbo.USERS (NAME, EMAIL, PHONE, PASSWORD, role)
                        VALUES (@name, @email, '0000000000', @password, @role)
                    `);
            } else {
                await pool.request()
                    .input('email', sql.NVarChar, admin.email)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query(`UPDATE ${targetDB}.dbo.USERS SET role = 'super_admin', PASSWORD = @password WHERE EMAIL = @email`);
            }
        }
        console.log('✅ Super Admin accounts and passwords synced successfully.');

        // ================================================================
        // Auto-seed/sync specific official credentials (e.g. Corporators)
        // ================================================================
        const officialAccounts = [
            { email: 'corporator.kavoor@mangaluru.gov.in', password: 'qwerty', name: 'Corporator Ward 18 Kavoor', role: 'Corporator', department: 'City Council (Ward Corporators)', ward: 'Ward 18 - Kavoor' },
            { email: 'dhritim07@gmail.com', password: 'qwerty', name: 'Corporator Ward 15 Kunjathbail', role: 'Corporator', department: 'City Council (Ward Corporators)', ward: 'Ward 15 - Kunjathbail South' }
        ];

        for (const off of officialAccounts) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(off.password, salt);

            const existingUser = await pool.request()
                .input('email', sql.NVarChar, off.email)
                .query(`SELECT ID FROM ${targetDB}.dbo.USERS WHERE EMAIL = @email`);

            if (existingUser.recordset.length === 0) {
                await pool.request()
                    .input('name', sql.NVarChar, off.name)
                    .input('email', sql.NVarChar, off.email)
                    .input('password', sql.NVarChar, hashedPassword)
                    .input('role', sql.VarChar, off.role)
                    .input('department', sql.NVarChar, off.department)
                    .query(`
                        INSERT INTO ${targetDB}.dbo.USERS (NAME, EMAIL, PHONE, PASSWORD, role, department)
                        VALUES (@name, @email, '9900000000', @password, @role, @department)
                    `);
            } else {
                await pool.request()
                    .input('email', sql.NVarChar, off.email)
                    .input('password', sql.NVarChar, hashedPassword)
                    .input('role', sql.VarChar, off.role)
                    .input('department', sql.NVarChar, off.department)
                    .query(`UPDATE ${targetDB}.dbo.USERS SET PASSWORD = @password, role = @role, department = @department WHERE EMAIL = @email`);
            }

            await pool.request()
                .input('email', sql.NVarChar, off.email)
                .input('role', sql.VarChar, off.role)
                .input('department', sql.NVarChar, off.department)
                .input('ward', sql.NVarChar, off.ward)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email)
                    BEGIN
                        INSERT INTO ${targetDB}.dbo.APPROVED_OFFICIALS (email, role, department, ward_assignment)
                        VALUES (@email, @role, @department, @ward);
                    END
                    ELSE
                    BEGIN
                        UPDATE ${targetDB}.dbo.APPROVED_OFFICIALS
                        SET role = @role, department = @department, ward_assignment = @ward
                        WHERE email = @email;
                    END
                `);
        }
        console.log('✅ Whitelisted official accounts and passwords synced successfully.');
            // Migrate legacy department names to new names
            await pool.request().query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS 
                SET department = 'MCC' 
                WHERE department = 'MCC — Civil / Roads & Water Supply' 
                   OR department = 'MCC — Civil / Roads & Water Supply (Engineering Tier)';

                UPDATE ${targetDB}.dbo.COMPLAINTS 
                SET department = 'MESCOM' 
                WHERE department = 'MESCOM — Power Grid';

                UPDATE ${targetDB}.dbo.APPROVED_OFFICIALS 
                SET department = 'MCC' 
                WHERE department = 'MCC — Civil / Roads & Water Supply' 
                   OR department = 'MCC — Civil / Roads & Water Supply (Engineering Tier)';

                UPDATE ${targetDB}.dbo.APPROVED_OFFICIALS 
                SET department = 'MESCOM' 
                WHERE department = 'MESCOM — Power Grid';
            `);
            console.log('✅ Legacy department names migrated successfully.');

        // Auto-seed whitelisted official records for all 60 municipal wards of Mangaluru
        await seed60WardsOfficials(pool, targetDB);

        console.log('✅ Database schema checks and alterations executed successfully.');
    } catch (err) {
        console.error('❌ Database schema check failed:', err);
    }
};

const seed60WardsOfficials = async (pool, targetDB) => {
    const wards = [
        "Ward 1 - Surathkal West", "Ward 2 - Surathkal East", "Ward 3 - Katipalla East", "Ward 4 - Katipalla Krishnapura", "Ward 5 - Katipalla North",
        "Ward 6 - Idya East", "Ward 7 - Idya West", "Ward 8 - Hosabettu", "Ward 9 - Kulai", "Ward 10 - Baikampady",
        "Ward 11 - Panambur Bengre", "Ward 12 - Panjimogaru", "Ward 13 - Kunjathbail North", "Ward 14 - Marakada", "Ward 15 - Kunjathbail South",
        "Ward 16 - Bengre Kulur", "Ward 17 - Derebail North", "Ward 18 - Kavoor", "Ward 19 - Pacchanady", "Ward 20 - Tiruvail",
        "Ward 21 - Padavu West", "Ward 22 - Kadri Padav", "Ward 23 - Derebail East", "Ward 24 - Derebail South", "Ward 25 - Derebail West",
        "Ward 26 - Derebail Central", "Ward 27 - Boloor", "Ward 28 - Mannagudda", "Ward 29 - Kambla", "Ward 30 - Kodialbail",
        "Ward 31 - Bejai", "Ward 32 - Kadri North", "Ward 33 - Kadri South", "Ward 34 - Shivbagh", "Ward 35 - Padavu Central",
        "Ward 36 - Padav East", "Ward 37 - Maroli", "Ward 38 - Bendoor", "Ward 39 - Falnir", "Ward 40 - Court",
        "Ward 41 - Central Market", "Ward 42 - Donkarakery", "Ward 43 - Kudroli", "Ward 44 - Bunder", "Ward 45 - Port",
        "Ward 46 - Cantonment", "Ward 47 - Milagres", "Ward 48 - Kankanady Valencia", "Ward 49 - Kankanady", "Ward 50 - Alape South",
        "Ward 51 - Alape North", "Ward 52 - Kannur", "Ward 53 - Bajal", "Ward 54 - Jeppinamogaru", "Ward 55 - Attavara",
        "Ward 56 - Mangaladevi", "Ward 57 - Hoigebazar", "Ward 58 - Bolara", "Ward 59 - Jeppu", "Ward 60 - Bengre"
    ];

    const cleanSlug = (text) => (text || '')
        .toLowerCase()
        .replace(/ward\s*\d+\s*-\s*/, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    for (const wardName of wards) {
        const slug = cleanSlug(wardName);

        const officialTypes = [
            {
                email: `corporator.${slug}@mangaluru.gov.in`,
                role: 'Corporator',
                department: 'City Council (Ward Corporators)'
            },
            {
                email: `je.mcc.${slug}@mangaluru.gov.in`,
                role: 'Assistant Engineer (AE) / Junior Engineer (JE)',
                department: 'MCC'
            },
            {
                email: `so.mescom.${slug}@mangaluru.gov.in`,
                role: 'Section Officer (SO) / Assistant Engineer (AE)',
                department: 'MESCOM'
            },
            {
                email: `ae.water.${slug}@mangaluru.gov.in`,
                role: 'Assistant Executive Engineer (AEE) / Assistant Engineer (AE)',
                department: 'Water Supply & Sewage Board'
            },
            {
                email: `shi.health.${slug}@mangaluru.gov.in`,
                role: 'Senior Health Inspector (SHI) / Health Officer',
                department: 'Stray / Animal Welfare & Health Dept'
            }
        ];

        for (const off of officialTypes) {
            // Skip Ward 15 Corporator slot — dhritim07@gmail.com is the real Corporator
            if (wardName === 'Ward 15 - Kunjathbail South' && off.role === 'Corporator') continue;

            await pool.request()
                .input('email', sql.NVarChar, off.email)
                .input('role', sql.VarChar, off.role)
                .input('department', sql.NVarChar, off.department)
                .input('ward', sql.NVarChar, wardName)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email)
                    BEGIN
                        INSERT INTO ${targetDB}.dbo.APPROVED_OFFICIALS (email, role, department, ward_assignment)
                        VALUES (@email, @role, @department, @ward);
                    END
                `);
        }
    }

    // Explicit seeding for Corporator Dhriti (Ward 15 - real user, not auto-seeded)
    await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = 'dhritim07@gmail.com')
        BEGIN
            INSERT INTO ${targetDB}.dbo.APPROVED_OFFICIALS (email, role, department, ward_assignment)
            VALUES ('dhritim07@gmail.com', 'Corporator', 'City Council (Ward Corporators)', 'Ward 15 - Kunjathbail South');
        END
    `);

    // Remove any stale test accounts that may exist from development
    await pool.request().query(`
        DELETE FROM ${targetDB}.dbo.APPROVED_OFFICIALS
        WHERE email IN (
            'test_corporator@example.com',
            'test_je@example.com',
            'test_lineman@example.com',
            'test_so@example.com',
            'test_ae_bejai@example.com',
            'officer.test.invite@mangaluru.gov.in'
        )
    `);

    // Seed contractor accounts
    const contractors = [
        { email: 'contractor.mcc@mangaluru.gov.in', role: 'MCC Contractor', department: 'MCC', ward: 'All Wards' },
        { email: 'contractor.water@mangaluru.gov.in', role: 'Water Board Contractor', department: 'Water Supply & Sewage Board', ward: 'All Wards' },
        { email: 'contractor.mescom@mangaluru.gov.in', role: 'MESCOM Contractor', department: 'MESCOM', ward: 'All Wards' },
        { email: 'contractor.health@mangaluru.gov.in', role: 'Health Dept Contractor', department: 'Stray / Animal Welfare & Health Dept', ward: 'All Wards' },
    ];
    for (const c of contractors) {
        await pool.request()
            .input('email', sql.NVarChar, c.email)
            .input('role', sql.VarChar, c.role)
            .input('department', sql.NVarChar, c.department)
            .input('ward', sql.NVarChar, c.ward)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email)
                BEGIN
                    INSERT INTO ${targetDB}.dbo.APPROVED_OFFICIALS (email, role, department, ward_assignment)
                    VALUES (@email, @role, @department, @ward);
                END
                ELSE
                BEGIN
                    UPDATE ${targetDB}.dbo.APPROVED_OFFICIALS
                    SET role = @role, department = @department, ward_assignment = @ward
                    WHERE email = @email;
                END
            `);
    }

    console.log('✅ Approved officials seeded for all 60 municipal wards of Mangaluru across all key department roles.');
};

// Create a unified pool promise
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(async pool => {
        console.log('Connected to SQL Server Connection Pool successfully.');
        await initializeDatabaseSchema(pool);
        return pool;
    })
    .catch(err => {
        console.error('SQL Server Database Connection failed: ', err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};