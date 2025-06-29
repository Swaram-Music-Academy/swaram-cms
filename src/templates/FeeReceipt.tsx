import {
  Document,
  Page,
  PDFViewer,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import condensedSource from "/RobotoCondensed-VariableFont.ttf";

import { useNavigate, useParams } from "react-router-dom";
import { numberToWords } from "@/lib/utils/amount";
import { useQuery } from "@tanstack/react-query";
import { receiptFns, receiptKeys } from "@/query/receipts";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";

Font.register({ family: "RobotoCondensed", src: condensedSource });
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/Roboto-300.ttf", fontWeight: 300 },
    { src: "/Roboto-400.ttf" },
    { src: "/Roboto-500.ttf", fontWeight: 500 },
    { src: "/Roboto-600.ttf", fontWeight: 600 },
    { src: "/Roboto-700.ttf", fontWeight: 700 },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "white",
    alignItems: "center",
    fontFamily: "Roboto",
    fontWeight: 400,
  },
  banner: {
    backgroundColor: "#52525c",
    width: "100%",
    color: "white",
    fontSize: "10pt",
    paddingHorizontal: "16px",
    paddingVertical: "4px",
    justifyContent: "center",
    fontFamily: "RobotoCondensed",
    flexDirection: "row",
  },
  section: {
    fontSize: "12pt",
    paddingHorizontal: 24,
    width: "100%",
  },
  container: {
    backgroundColor: "#eeeef0",
    width: "100%",
    padding: 16,
  },
});

export default function FeeReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useQuery({
    queryKey: receiptKeys.getReceipt(id!),
    queryFn: () => receiptFns.getReceiptFn(id!),
  });
  return (
    <>
      {isLoading ? (
        <div className="w-screen h-screen grid place-content-center">
          <Loader />
        </div>
      ) : (
        <>
          {data && (
            <PDFViewer className="h-screen w-full">
              <Document title={`Fee Receipt`}>
                <Page size="A4" style={styles.page}>
                  {/* Logo */}
                  <Image
                    source={"/swaramlogo.jpg"}
                    style={{ objectFit: "cover", width: "45%" }}
                  />
                  {/* Details Banner */}
                  <View style={styles.banner}>
                    <Text>
                      A-408, Raj Corner, Opp. Vasupujya Residency, Pal, Surat -
                      395 009
                    </Text>
                  </View>
                  <View
                    style={[styles.banner, { gap: "24px", marginTop: "-1px" }]}
                  >
                    <Text>Email: swaram.music.academy@gmail.com</Text>
                    <Text>Mobile: +91 75730 34123, +91 98980 94123</Text>
                  </View>
                  {/* Receipt Title */}
                  <View style={[styles.section, { margin: 16 }]}>
                    <Text
                      style={{
                        fontSize: "18pt",
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      Fee Receipt
                    </Text>
                  </View>
                  {/* Body */}
                  <View
                    style={[
                      styles.section,
                      {
                        width: "100%",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 32,
                      },
                    ]}
                  >
                    <Text>
                      Date:{" "}
                      {new Date().toLocaleString("en-gb", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <Text>Receipt. No: {data.receipt_number}</Text>
                  </View>

                  <View style={styles.container}>
                    <View
                      style={[
                        styles.section,
                        {
                          flexDirection: "row",
                          gap: 48,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "column", gap: 8 }}>
                        <Text>Received with thanks from</Text>
                        <Text>Payment Type</Text>
                        <Text>Reference Number</Text>
                        <Text>Description</Text>
                        <Text>Amount</Text>
                        <Text>Amount in words</Text>
                      </View>
                      <View style={{ flexDirection: "column", gap: 8 }}>
                        <Text style={{ fontWeight: "medium" }}>
                          {data.payee}
                        </Text>
                        <Text style={{ fontWeight: "medium" }}>
                          {data.payment_method}
                        </Text>
                        <Text style={{ fontWeight: "medium" }}>
                          {data.reference_number || "-"}
                        </Text>
                        <Text style={{ fontWeight: "medium" }}>
                          {data.description}
                        </Text>
                        <Text style={{ fontWeight: "medium" }}>
                          ₹{data.amount}
                        </Text>
                        <Text style={{ fontWeight: "medium" }}>
                          {numberToWords(data.amount)} rupees only
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.section,
                      {
                        marginTop: "auto",
                        flexDirection: "row",
                        justifyContent: "space-around",
                      },
                    ]}
                  >
                    <Text
                      style={{ borderTop: "1px solid #7f7f7f", padding: 8 }}
                    >
                      Stamp and Receiver's Signature
                    </Text>
                  </View>
                  <View style={[styles.banner, { marginTop: 16 }]}>
                    <Text>
                      NOTE: Fees paid are non-refundable under any
                      circumstances.
                    </Text>
                  </View>
                </Page>
              </Document>
            </PDFViewer>
          )}
          {error && (
            <div className="w-screen h-screen flex flex-col items-center justify-center">
              <p className="text-xl">
                Something went wrong. Please try again later.
              </p>
              <div className="flex mt-4">
                <Button
                  className="text-lg"
                  variant="link"
                  onClick={() => navigate(-1)}
                >
                  {" "}
                  Go back
                </Button>
                <Button
                  className="text-lg"
                  variant="link"
                  onClick={() => navigate(0)}
                >
                  {" "}
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
