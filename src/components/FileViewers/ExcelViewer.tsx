'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface ExcelViewerProps {
  data: ArrayBuffer;
}

export default function ExcelViewer({ data }: ExcelViewerProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  const [sheetData, setSheetData] = useState<any[][]>([]);

  useEffect(() => {
    try {
      // Read the workbook
      const wb = XLSX.read(data, { type: 'array' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);

      // Load first sheet
      if (wb.SheetNames.length > 0) {
        loadSheet(wb, 0);
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
    }
  }, [data]);

  const loadSheet = (wb: XLSX.WorkBook, index: number) => {
    const sheetName = wb.SheetNames[index];
    const worksheet = wb.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    setSheetData(jsonData as any[][]);
    setCurrentSheet(index);
  };

  const changeSheet = (index: number) => {
    if (workbook) {
      loadSheet(workbook, index);
    }
  };

  const exportToCSV = () => {
    if (workbook && sheetNames[currentSheet]) {
      const worksheet = workbook.Sheets[sheetNames[currentSheet]];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sheetNames[currentSheet]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sheet Navigation */}
      <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {sheetNames.map((name, index) => (
            <Button
              key={index}
              onClick={() => changeSheet(index)}
              className={`px-4 py-2 rounded text-sm ${
                currentSheet === index
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              }`}
            >
              {name}
            </Button>
          ))}
        </div>

        <Button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Sheet Data Table */}
      <div className="bg-gray-800 rounded-lg p-4 max-h-[600px] overflow-auto">
        {sheetData.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {sheetData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex === 0 ? 'bg-gray-700' : 'hover:bg-gray-700/50'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`border border-gray-600 px-4 py-2 text-sm ${
                        rowIndex === 0
                          ? 'font-bold text-white'
                          : 'text-gray-200'
                      }`}
                    >
                      {cell !== null && cell !== undefined ? String(cell) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-400 text-center py-8">
            No data available in this sheet
          </div>
        )}
      </div>

      {/* Sheet Info */}
      <div className="text-gray-400 text-sm">
        Sheet: {sheetNames[currentSheet]} | Rows: {sheetData.length} | Columns:{' '}
        {sheetData[0]?.length || 0}
      </div>
    </div>
  );
}
