package com.example.demo2.service;

import com.example.demo2.mapper.TransactionMapper;
import com.example.demo2.model.Transaction;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class TransactionService {

    @Autowired
    private TransactionMapper transactionMapper;

    public List<Transaction> getAllTransactions() {
        return transactionMapper.findAll();
    }

    public Map<String, Object> getPagedTransactions(int page, int size, String searchDate, String searchMerchant,
            String startDate, String endDate) {
        int offset = (page - 1) * size;
        List<Transaction> transactions = transactionMapper.findPaged(offset, size, searchDate, searchMerchant,
                startDate, endDate);
        int total = transactionMapper.count(searchDate, searchMerchant, startDate, endDate);
        int totalPages = (int) Math.ceil((double) total / size);
        Map<String, Object> stats = transactionMapper.getSearchStatistics(searchDate, searchMerchant, startDate,
                endDate);

        Map<String, Object> result = new HashMap<>();
        result.put("transactions", transactions);
        result.put("total", total);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);
        result.put("searchStats", stats);
        return result;
    }

    public void createTransaction(Transaction transaction) {
        transactionMapper.insert(transaction);
    }

    @Transactional
    public void uploadTransactions(MultipartFile file) throws Exception {
        String fileName = file.getOriginalFilename();
        if (fileName != null && (fileName.endsWith(".xls") || fileName.endsWith(".xlsx"))) {
            processExcelFile(file);
        } else if (fileName != null && fileName.endsWith(".csv")) {
            processCsvFile(file);
        } else {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.");
        }
    }

    private void processCsvFile(MultipartFile file) throws Exception {
        try (BufferedReader fileReader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
                CSVParser csvParser = new CSVParser(fileReader,
                        CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true)
                                .setTrim(true).build())) {

            Iterable<CSVRecord> csvRecords = csvParser.getRecords();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            for (CSVRecord csvRecord : csvRecords) {
                Transaction transaction = new Transaction();
                transaction.setDate(LocalDate.parse(csvRecord.get("date"), formatter));
                transaction.setTime(csvRecord.get("time"));
                transaction.setCard(csvRecord.get("card"));
                transaction.setMerchant(csvRecord.get("merchant"));
                transaction.setAmountKrw(new BigDecimal(csvRecord.get("amount_krw")));
                transaction.setAmountUsd(new BigDecimal(csvRecord.get("amount_usd")));
                transaction.setPaymentMethod(csvRecord.get("payment_method"));
                transaction.setMerchantInfo(csvRecord.get("merchant_info"));
                transaction.setDiscount(new BigDecimal(csvRecord.get("discount")));
                transaction.setPoints(new BigDecimal(csvRecord.get("points")));
                transaction.setStatus(csvRecord.get("status"));
                if (csvRecord.isSet("due_date") && !csvRecord.get("due_date").isEmpty()) {
                    transaction.setDueDate(LocalDate.parse(csvRecord.get("due_date"), formatter));
                }
                transaction.setApprovalNo(csvRecord.get("approval_no"));

                transactionMapper.insert(transaction);
            }
        }
    }

    private void processExcelFile(MultipartFile file) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Transaction transaction = new Transaction();
                transaction.setDate(parseDateCell(row.getCell(0)));
                transaction.setTime(getCellValueAsString(row.getCell(1)));
                transaction.setCard(getCellValueAsString(row.getCell(2)));
                transaction.setMerchant(getCellValueAsString(row.getCell(3)));
                transaction.setAmountKrw(new BigDecimal(getCellValueAsString(row.getCell(4)).replace(",", "")));
                transaction.setAmountUsd(new BigDecimal(getCellValueAsString(row.getCell(5)).replace(",", "")));
                transaction.setPaymentMethod(getCellValueAsString(row.getCell(6)));
                transaction.setMerchantInfo(getCellValueAsString(row.getCell(7)));
                transaction.setDiscount(new BigDecimal(getCellValueAsString(row.getCell(8)).replace(",", "")));
                transaction.setPoints(new BigDecimal(getCellValueAsString(row.getCell(9)).replace(",", "")));
                transaction.setStatus(getCellValueAsString(row.getCell(10)));

                String dueDateStr = getCellValueAsString(row.getCell(11));
                if (dueDateStr != null && !dueDateStr.isEmpty()) {
                    transaction.setDueDate(parseDateCell(row.getCell(11)));
                }
                transaction.setApprovalNo(getCellValueAsString(row.getCell(12)));

                if (transaction.getDate() != null) {
                    transactionMapper.insert(transaction);
                }
            }
        }
    }

    private LocalDate parseDateCell(Cell cell) {
        if (cell == null)
            return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        } else {
            String dateStr = getCellValueAsString(cell);
            if (dateStr == null || dateStr.isEmpty())
                return null;
            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    java.util.Date date = cell.getDateCellValue();
                    return new SimpleDateFormat("yyyy-MM-dd").format(date);
                } else {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    return cell.getStringCellValue();
                }
            default:
                return "";
        }
    }
}
