-- 쇼핑몰 관련 테이벌 생성 스크립트 (MariaDB)

-- 1. 상품 테이블 (products)
CREATE TABLE IF NOT EXISTS products (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '상품 ID',
    product_code VARCHAR(100) UNIQUE COMMENT '상품 코드',
    product_name VARCHAR(255) NOT NULL COMMENT '상품명',
    brand_id BIGINT COMMENT '브랜드 ID',
    supplier_id BIGINT COMMENT '공급사 ID',
    tax_type VARCHAR(20) DEFAULT 'TAX' COMMENT '과세 타입 (TAX/免稅 등)',
    sale_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '판매 상태',
    display_yn BOOLEAN DEFAULT TRUE COMMENT '노출 여부',
    list_price INT DEFAULT 0 COMMENT '정가',
    sale_price INT DEFAULT 0 COMMENT '판매가',
    stock_manage_yn BOOLEAN DEFAULT TRUE COMMENT '재고 관리 여부',
    total_stock INT DEFAULT 0 COMMENT '총 재고',
    safety_stock INT DEFAULT 0 COMMENT '안전 재고',
    thumb_image_url VARCHAR(500) COMMENT '썸네일 이미지 URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. 상품 옵션 테이블 (product_options)
CREATE TABLE IF NOT EXISTS product_options (
    option_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '옵션 ID',
    product_id BIGINT NOT NULL COMMENT '상품 ID',
    option_key VARCHAR(100) COMMENT '옵션 키 (색상/사이즈 등)',
    option_sku VARCHAR(100) UNIQUE COMMENT '옵션 SKU',
    option_price INT DEFAULT 0 COMMENT '옵션 추가금액',
    display_yn BOOLEAN DEFAULT TRUE COMMENT '노출 여부',
    sale_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '판매 상태',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_product_option_pid (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. 재고 테이블 (stocks)
CREATE TABLE IF NOT EXISTS stocks (
    stock_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '재고 ID',
    product_id BIGINT NOT NULL COMMENT '상품 ID',
    option_id BIGINT COMMENT '옵션 ID (단일상품인 경우 null 가능)',
    quantity INT DEFAULT 0 COMMENT '현재 수량',
    safety_stock INT DEFAULT 0 COMMENT '안전 재고',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_stocks_pid (product_id),
    INDEX idx_stocks_oid (option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. 대량 작업 마스터 테이블 (bulk_jobs)
CREATE TABLE IF NOT EXISTS bulk_jobs (
    job_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '작업 ID',
    job_type VARCHAR(50) NOT NULL COMMENT '작업 타입 (STATUS/DISPLAY/PRICE/STOCK)',
    status VARCHAR(50) NOT NULL COMMENT '작업 상태 (UPLOADED/VALIDATED/EXECUTED/FAILED)',
    total_count INT DEFAULT 0 COMMENT '총 항목 수',
    error_count INT DEFAULT 0 COMMENT '에러 항목 수',
    actor_id BIGINT COMMENT '작업자 ID',
    actor_role VARCHAR(50) COMMENT '작업자 권한',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. 대량 작업 상세 테이블 (bulk_job_items)
CREATE TABLE IF NOT EXISTS bulk_job_items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '아이템 ID',
    job_id BIGINT NOT NULL COMMENT '작업 ID',
    row_no INT NOT NULL COMMENT '엑셀 로우 번호',
    product_id BIGINT COMMENT '상품 ID (옵션 기반인 경우 null 가능)',
    option_sku VARCHAR(100) COMMENT '옵션 SKU',
    payload_json TEXT COMMENT '변경 내용 JSON',
    status VARCHAR(50) NOT NULL COMMENT '처리 상태 (PENDING/OK/ERROR)',
    error_message VARCHAR(500) COMMENT '에러 메시지',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    index idx_bulk_item_jobid (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. 변경 이력 로그 테이블 (change_logs)
CREATE TABLE IF NOT EXISTS change_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '로그 ID',
    actor_id BIGINT COMMENT '변경자 ID',
    actor_role VARCHAR(50) COMMENT '변경자 권한',
    target_type VARCHAR(50) NOT NULL COMMENT '변경 대상 타입 (PRODUCT/OPTION/STOCK 등)',
    product_id BIGINT NOT NULL COMMENT '상품 ID',
    option_id BIGINT COMMENT '옵션 ID (상품인 경우 null 가능)',
    change_type VARCHAR(50) NOT NULL COMMENT '변경 타입 (STATUS/DISPLAY/PRICE/STOCK/ETC)',
    before_json TEXT COMMENT '변경 전 데이터',
    after_json TEXT COMMENT '변경 후 데이터',
    reason VARCHAR(500) COMMENT '변경 사유',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    INDEX idx_changelog_pid (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
