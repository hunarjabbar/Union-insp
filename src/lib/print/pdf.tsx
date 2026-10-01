// FILE: src/lib/print/pdf.tsx
// STAGE: 3
// UPDATED: 2026-10-01
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { generateInspectionQrDataUrl } from './qr';
import { formatDateTime, formatIQD } from '../utils';

export interface RenderReceiptPdfParams {
  receiptNumber: string;
  inspectionCode: string;
  plateNumber: string;
  category: string;
  stationName: string;
  laneName: string;
  result: string;
  defects: { type: string; description: string }[];
  qrUrl: string;
  paidAmountIqd?: number;
  paymentMethod?: string;
  issuedAt: Date;
  widthMm?: 58 | 80;
}

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.3,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 8,
    color: '#444444',
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'dashed',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  label: {
    color: '#555555',
  },
  value: {
    fontFamily: 'Helvetica-Bold',
  },
  resultBadge: {
    textAlign: 'center',
    marginVertical: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: '#000000',
  },
  resultText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  defectsContainer: {
    marginVertical: 3,
  },
  defectItem: {
    fontSize: 8,
    color: '#CC0000',
    marginVertical: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  qrImage: {
    width: 90,
    height: 90,
  },
  qrLabel: {
    fontSize: 7,
    color: '#666666',
    marginTop: 2,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 7,
    color: '#777777',
    marginTop: 4,
  },
});

interface DocumentProps extends RenderReceiptPdfParams {
  qrDataUrl: string;
}

export const ReceiptPdfDocument: React.FC<DocumentProps> = ({
  receiptNumber,
  inspectionCode,
  plateNumber,
  category,
  stationName,
  laneName,
  result,
  defects,
  paidAmountIqd,
  paymentMethod,
  issuedAt,
  qrDataUrl,
  widthMm = 80,
}) => {
  const pageWidthPt = widthMm === 80 ? 226 : 164;

  return (
    <Document>
      <Page size={[pageWidthPt, 500]} style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>UNION INSPECTION</Text>
          <Text style={styles.subtitle}>یونیەن ئینسپێکشن</Text>
          <Text style={styles.subtitle}>{stationName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Receipt No:</Text>
          <Text style={styles.value}>{receiptNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Inspection:</Text>
          <Text style={styles.value}>{inspectionCode}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Plate No:</Text>
          <Text style={styles.value}>{plateNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{category}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Lane:</Text>
          <Text style={styles.value}>{laneName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.resultBadge}>
          <Text style={styles.resultText}>STATUS: {result.toUpperCase()}</Text>
        </View>

        {defects.length > 0 && (
          <View style={styles.defectsContainer}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8 }}>DEFECTS DETECTED:</Text>
            {defects.map((d, i) => (
              <Text key={i} style={styles.defectItem}>
                • [{d.type}] {d.description}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.qrContainer}>
          {qrDataUrl ? (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image src={qrDataUrl} style={styles.qrImage} />
          ) : null}
          <Text style={styles.qrLabel}>Scan to verify</Text>
        </View>

        <View style={styles.divider} />

        {paidAmountIqd !== undefined && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Fee Paid:</Text>
              <Text style={styles.value}>{formatIQD(paidAmountIqd)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Method:</Text>
              <Text style={styles.value}>{paymentMethod || 'CASH'}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <Text style={styles.footerText}>Issued: {formatDateTime(issuedAt)}</Text>
      </Page>
    </Document>
  );
};

export async function renderReceiptPdf(params: RenderReceiptPdfParams): Promise<Buffer> {
  const qrDataUrl = await generateInspectionQrDataUrl(params.qrUrl, 200);
  const doc = <ReceiptPdfDocument {...params} qrDataUrl={qrDataUrl} />;
  const instance = pdf(doc);
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
