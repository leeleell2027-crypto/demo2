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
    role VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `holiday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `holiday_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_holiday_date` (`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `holiday` ADD COLUMN IF NOT EXISTS `is_recurring` tinyint(1) NOT NULL DEFAULT 0 AFTER `name`;

-- Notice Table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notice_start_date DATE,
    notice_end_date DATE,
    -- Hierarchy for replies
    ref INT NOT NULL, 
    step INT NOT NULL DEFAULT 0,
    depth INT NOT NULL DEFAULT 0,
    view_count INT DEFAULT 0
);

-- Notice Attachment Table
CREATE TABLE IF NOT EXISTS notice_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notice_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
);

-- Notice Comment Table
CREATE TABLE IF NOT EXISTS notice_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notice_id INT NOT NULL,
    parent_id INT NULL,
    member_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES notice_comments(id) ON DELETE CASCADE
);

CREATE TABLE trade_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 거래 식별자',
    executed_at DATETIME NOT NULL COMMENT '체결시간',
    coin VARCHAR(100) NOT NULL COMMENT '코인 (예: BTC, ETH)',
    market VARCHAR(10) NOT NULL COMMENT '마켓 (예: KRW-BTC)',
    side VARCHAR(10) NOT NULL COMMENT '종류 (예: BUY, SELL)',
    quantity VARCHAR(100) NOT NULL COMMENT '거래수량',
    price VARCHAR(20) NOT NULL COMMENT '거래단가',
    total_amount VARCHAR(20) NOT NULL COMMENT '거래금액',
    fee VARCHAR(20) NOT NULL COMMENT '수수료',
    settlement_amount VARCHAR(20) NOT NULL COMMENT '정산금액',
    ordered_at DATETIME NOT NULL COMMENT '주문시간'
) ;


CREATE TABLE `trade_btc_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '고유 거래 식별자', 
  `ordered_at` varchar(10) NOT NULL COMMENT '날짜',
  `btc_price` varchar(100) NOT NULL COMMENT '가격', 
  PRIMARY KEY (`id`)
);

-- https://api.upbit.com/v1/candles/days?market=KRW-BTC&count=1&to=2023-06-06%2023:59:00


