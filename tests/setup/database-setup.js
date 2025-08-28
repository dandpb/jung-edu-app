"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestCourse = exports.cleanupTestUser = exports.getTestUserByRole = exports.executeQuery = exports.createTestUser = exports.seedTestCourse = exports.seedInitialTestData = exports.truncateAllTables = exports.dropTestTables = exports.createTestTables = exports.getTestDatabase = exports.cleanupTestDatabase = exports.setupTestDatabase = void 0;
const pg_1 = require("pg");
const test_config_1 = require("./test-config");
const test_helpers_1 = require("../utils/test-helpers");
/**
 * Database Test Setup and Management
 * Handles test database initialization, cleanup, and data seeding
 */
let testPool = null;
let isSetup = false;
const setupTestDatabase = async () => {
    if (isSetup && testPool) {
        return testPool;
    }
    try {
        // Create connection pool for test database
        testPool = new pg_1.Pool({
            host: test_config_1.testConfig.database.host,
            port: test_config_1.testConfig.database.port,
            database: test_config_1.testConfig.database.database,
            user: test_config_1.testConfig.database.username,
            password: test_config_1.testConfig.database.password,
            max: 10, // Maximum number of connections
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: false // Disable SSL for test environment
        });
        // Test connection
        const client = await testPool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Test database connection established');
        // Create test tables if they don't exist
        await (0, exports.createTestTables)();
        // Seed initial test data
        await (0, exports.seedInitialTestData)();
        isSetup = true;
        return testPool;
    }
    catch (error) {
        console.error('❌ Failed to setup test database:', error);
        throw error;
    }
};
exports.setupTestDatabase = setupTestDatabase;
const cleanupTestDatabase = async () => {
    if (testPool) {
        await testPool.end();
        testPool = null;
        isSetup = false;
        console.log('✅ Test database connections closed');
    }
};
exports.cleanupTestDatabase = cleanupTestDatabase;
const getTestDatabase = () => {
    if (!testPool) {
        throw new Error('Test database not initialized. Call setupTestDatabase first.');
    }
    return testPool;
};
exports.getTestDatabase = getTestDatabase;
const createTestTables = async () => {
    const client = await testPool.connect();
    try {
        // Enable UUID extension
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        // Users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        profile_image VARCHAR(500),
        bio TEXT,
        date_of_birth DATE,
        phone_number VARCHAR(20),
        address JSONB,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `);
        // Courses table
        await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        level VARCHAR(20) DEFAULT 'beginner',
        language VARCHAR(10) DEFAULT 'en',
        duration INTEGER, -- in weeks
        estimated_hours INTEGER,
        price DECIMAL(10,2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'USD',
        is_published BOOLEAN DEFAULT false,
        is_free BOOLEAN DEFAULT true,
        thumbnail_url VARCHAR(500),
        video_preview_url VARCHAR(500),
        instructor_id UUID REFERENCES users(id),
        tags TEXT[],
        prerequisites TEXT[],
        learning_objectives TEXT[],
        syllabus JSONB DEFAULT '[]',
        enrollment_count INTEGER DEFAULT 0,
        rating_average DECIMAL(2,1) DEFAULT 0.0,
        rating_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        published_at TIMESTAMP
      )
    `);
        // Lessons table
        await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        type VARCHAR(20) DEFAULT 'video',
        order_index INTEGER NOT NULL,
        duration INTEGER, -- in minutes
        is_published BOOLEAN DEFAULT false,
        is_free BOOLEAN DEFAULT false,
        video_url VARCHAR(500),
        video_thumbnail VARCHAR(500),
        video_duration INTEGER, -- in seconds
        attachments JSONB DEFAULT '[]',
        quiz JSONB,
        notes TEXT,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
        // Enrollments table
        await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        progress JSONB DEFAULT '{}',
        enrolled_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        last_accessed_at TIMESTAMP DEFAULT NOW(),
        payment_status VARCHAR(20) DEFAULT 'free',
        certificate_issued BOOLEAN DEFAULT false,
        rating JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);
        // Progress tracking table
        await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
        lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
        is_completed BOOLEAN DEFAULT false,
        completion_percentage INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0, -- in seconds
        quiz_score INTEGER,
        quiz_attempts INTEGER DEFAULT 0,
        notes TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(enrollment_id, lesson_id)
      )
    `);
        // Course ratings table
        await client.query(`
      CREATE TABLE IF NOT EXISTS course_ratings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(course_id, user_id)
      )
    `);
        // Sessions table for authentication
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      )
    `);
        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category, subcategory)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON lesson_progress(enrollment_id)');
        console.log('✅ Test tables created successfully');
    }
    catch (error) {
        console.error('❌ Error creating test tables:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createTestTables = createTestTables;
const dropTestTables = async () => {
    const client = await testPool.connect();
    try {
        const tables = [
            'user_sessions',
            'course_ratings',
            'lesson_progress',
            'enrollments',
            'lessons',
            'courses',
            'users'
        ];
        for (const table of tables) {
            await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        }
        console.log('✅ Test tables dropped successfully');
    }
    catch (error) {
        console.error('❌ Error dropping test tables:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.dropTestTables = dropTestTables;
const truncateAllTables = async () => {
    const client = await testPool.connect();
    try {
        // Disable foreign key checks temporarily
        await client.query('SET CONSTRAINTS ALL DEFERRED');
        const tables = [
            'user_sessions',
            'course_ratings',
            'lesson_progress',
            'enrollments',
            'lessons',
            'courses',
            'users'
        ];
        for (const table of tables) {
            await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        }
        // Re-enable foreign key checks
        await client.query('SET CONSTRAINTS ALL IMMEDIATE');
        console.log('✅ All test tables truncated');
    }
    catch (error) {
        console.error('❌ Error truncating tables:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.truncateAllTables = truncateAllTables;
const seedInitialTestData = async () => {
    const client = await testPool.connect();
    try {
        // Check if test users already exist
        const existingUsers = await client.query('SELECT COUNT(*) FROM users WHERE email LIKE \'%@example.com\'');
        if (parseInt(existingUsers.rows[0].count) > 0) {
            console.log('ℹ️ Test data already exists, skipping seed');
            return;
        }
        // Create test users
        const testUsers = [
            {
                email: 'test.student@example.com',
                username: 'teststudent',
                firstName: 'Test',
                lastName: 'Student',
                passwordHash: '$2b$10$rOv4K2tMNDGJoKY3e3.qWuJKZZ3zQJJ7K5K5K5K5K5K5K5K5K5K5K', // TestPass123!
                role: 'student'
            },
            {
                email: 'test.teacher@example.com',
                username: 'testteacher',
                firstName: 'Test',
                lastName: 'Teacher',
                passwordHash: '$2b$10$rOv4K2tMNDGJoKY3e3.qWuJKZZ3zQJJ7K5K5K5K5K5K5K5K5K5K5K',
                role: 'teacher'
            },
            {
                email: 'test.admin@example.com',
                username: 'testadmin',
                firstName: 'Test',
                lastName: 'Admin',
                passwordHash: '$2b$10$rOv4K2tMNDGJoKY3e3.qWuJKZZ3zQJJ7K5K5K5K5K5K5K5K5K5K5K',
                role: 'admin'
            }
        ];
        for (const user of testUsers) {
            await client.query(`
        INSERT INTO users (email, username, first_name, last_name, password_hash, role, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [user.email, user.username, user.firstName, user.lastName, user.passwordHash, user.role]);
        }
        console.log('✅ Initial test data seeded');
    }
    catch (error) {
        console.error('❌ Error seeding test data:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.seedInitialTestData = seedInitialTestData;
const seedTestCourse = async (instructorId) => {
    const client = await testPool.connect();
    try {
        // Get test teacher if no instructor provided
        if (!instructorId) {
            const teacherResult = await client.query("SELECT id FROM users WHERE role = 'teacher' LIMIT 1");
            instructorId = teacherResult.rows[0]?.id;
        }
        if (!instructorId) {
            throw new Error('No instructor available for test course');
        }
        // Create test course
        const courseResult = await client.query(`
      INSERT INTO courses (
        title, description, short_description, category, level,
        duration, estimated_hours, price, is_published, is_free,
        instructor_id, tags, learning_objectives
      ) VALUES (
        'Test Course: Introduction to Testing',
        'A comprehensive course about software testing practices and methodologies.',
        'Learn software testing from basics to advanced techniques.',
        'technology', 'beginner',
        8, 40, 99.99, true, false,
        $1, ARRAY['testing', 'software', 'quality'],
        ARRAY['Understand testing fundamentals', 'Write effective test cases', 'Implement test automation']
      ) RETURNING id
    `, [instructorId]);
        const courseId = courseResult.rows[0].id;
        // Create test lessons
        const lessons = [
            { title: 'Introduction to Testing', order: 1, duration: 30 },
            { title: 'Unit Testing Basics', order: 2, duration: 45 },
            { title: 'Integration Testing', order: 3, duration: 60 },
            { title: 'End-to-End Testing', order: 4, duration: 50 },
            { title: 'Test Automation', order: 5, duration: 90 }
        ];
        for (const lesson of lessons) {
            await client.query(`
        INSERT INTO lessons (course_id, title, description, order_index, duration, is_published, type)
        VALUES ($1, $2, $3, $4, $5, true, 'video')
      `, [
                courseId,
                lesson.title,
                `Lesson content for ${lesson.title}`,
                lesson.order,
                lesson.duration
            ]);
        }
        console.log(`✅ Test course created with ID: ${courseId}`);
        return courseId;
    }
    catch (error) {
        console.error('❌ Error creating test course:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.seedTestCourse = seedTestCourse;
const createTestUser = async (userData = {}) => {
    const client = await testPool.connect();
    try {
        const defaultUser = {
            email: test_helpers_1.randomHelpers.randomEmail(),
            username: test_helpers_1.randomHelpers.randomString(8),
            firstName: 'Test',
            lastName: 'User',
            passwordHash: '$2b$10$rOv4K2tMNDGJoKY3e3.qWuJKZZ3zQJJ7K5K5K5K5K5K5K5K5K5K5K',
            role: 'student',
            isVerified: true
        };
        const user = { ...defaultUser, ...userData };
        const result = await client.query(`
      INSERT INTO users (email, username, first_name, last_name, password_hash, role, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [user.email, user.username, user.firstName, user.lastName, user.passwordHash, user.role, user.isVerified]);
        return result.rows[0].id;
    }
    catch (error) {
        console.error('❌ Error creating test user:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createTestUser = createTestUser;
const executeQuery = async (query, params = []) => {
    const client = await testPool.connect();
    try {
        const result = await client.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('❌ Error executing query:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.executeQuery = executeQuery;
const getTestUserByRole = async (role) => {
    const users = await (0, exports.executeQuery)('SELECT * FROM users WHERE role = $1 LIMIT 1', [role]);
    return users[0] || null;
};
exports.getTestUserByRole = getTestUserByRole;
const cleanupTestUser = async (userId) => {
    await (0, exports.executeQuery)('DELETE FROM users WHERE id = $1', [userId]);
};
exports.cleanupTestUser = cleanupTestUser;
const cleanupTestCourse = async (courseId) => {
    await (0, exports.executeQuery)('DELETE FROM courses WHERE id = $1', [courseId]);
};
exports.cleanupTestCourse = cleanupTestCourse;
exports.default = {
    setupTestDatabase: exports.setupTestDatabase,
    cleanupTestDatabase: exports.cleanupTestDatabase,
    getTestDatabase: exports.getTestDatabase,
    createTestTables: exports.createTestTables,
    dropTestTables: exports.dropTestTables,
    truncateAllTables: exports.truncateAllTables,
    seedInitialTestData: exports.seedInitialTestData,
    seedTestCourse: exports.seedTestCourse,
    createTestUser: exports.createTestUser,
    executeQuery: exports.executeQuery,
    getTestUserByRole: exports.getTestUserByRole,
    cleanupTestUser: exports.cleanupTestUser,
    cleanupTestCourse: exports.cleanupTestCourse
};
//# sourceMappingURL=database-setup.js.map