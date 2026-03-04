CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE,
    content TEXT,
    category1 VARCHAR(100),
    category2 VARCHAR(100),
    category3 VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    card VARCHAR(255),
    merchant VARCHAR(255) NOT NULL,
    amount_krw DECIMAL(15, 2) NOT NULL,
    amount_usd DECIMAL(15, 2) DEFAULT 0.00,
    payment_method VARCHAR(100),
    merchant_info VARCHAR(255),
    discount DECIMAL(15, 2) DEFAULT 0.00,
    points DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50),
    due_date DATE,
    approval_no VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS member;
CREATE TABLE IF NOT EXISTS member (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    username VARCHAR(255) DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) DEFAULT NULL
);
