"use client"

import React from "react"
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { Download } from "lucide-react"

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: "Helvetica" 
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20,
    fontWeight: "bold",
    color: "#111"
  },
  dayContainer: {
    marginBottom: 20,
    padding: 10,
    borderLeft: "2px solid #2563eb",
    backgroundColor: "#f8fafc"
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e3a8a"
  },
  activityContainer: {
    marginBottom: 10,
    paddingLeft: 10
  },
  activityName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 2,
    lineHeight: 1.4
  },
  activityDetail: {
    fontSize: 9,
    color: "#64748b",
  },
  rawText: {
    fontSize: 9,
    fontFamily: "Courier",
    lineHeight: 1.5,
    color: "#333",
  }
})

function ItineraryPDF({ 
  itineraryData, 
  destination 
}: { 
  itineraryData: any
  destination: string 
}) {
  const days = itineraryData?.days || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Itinerary: {destination}</Text>
        
        {days.length > 0 ? (
           days.map((day: any, i: number) => (
            <View key={i} style={styles.dayContainer}>
              <Text style={styles.dayTitle}>Day {day.day} {day.dailyCost ? `- Cost: ${day.dailyCost}` : ""}</Text>
              {day.activities?.map((act: any, j: number) => (
                <View key={j} style={styles.activityContainer}>
                  <Text style={styles.activityName}>
                    {act.timeSlot || "Any time"} | {act.name || "Activity"}
                  </Text>
                  {act.description && (
                    <Text style={styles.activityDesc}>{act.description}</Text>
                  )}
                  <Text style={styles.activityDetail}>
                    {[act.cost, act.dietaryOptions, act.accessibilityInfo].filter(Boolean).join(" • ")}
                  </Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View>
            <Text style={styles.rawText}>
              {JSON.stringify(itineraryData, null, 2)}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

export default function ItineraryPdfDownload({ 
  itineraryData, 
  destination 
}: { 
  itineraryData: any
  destination: string 
}) {
  return (
    <PDFDownloadLink
      document={<ItineraryPDF itineraryData={itineraryData} destination={destination} />}
      fileName={`Itinerary-${destination.replace(/\s+/g, "_")}.pdf`}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      {/* @ts-ignore : PDFDownloadLink render props types can be finicky */}
      {({ loading }) => (
        <>
          <Download className="w-3.5 h-3.5" />
          {loading ? "Preparing PDF..." : "Export to PDF"}
        </>
      )}
    </PDFDownloadLink>
  )
}
