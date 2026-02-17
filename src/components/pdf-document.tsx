import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer"

// Register fonts if needed, using standard fonts for now
Font.register({
    family: "Helvetica",
    fonts: [
        { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf" }, // Standard font fallback
    ],
})

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        fontFamily: "Helvetica",
    },
    contentWrapper: {
        paddingTop: 50,
        paddingBottom: 60,
        paddingHorizontal: 35,
        flex: 1,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#1E293B",
    },
    subtitle: {
        fontSize: 12,
        color: "#64748B",
    },
    section: {
        margin: 10,
        padding: 10,
    },
    dayHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 15,
        marginBottom: 10,
        color: "#2563EB",
    },
    activity: {
        marginBottom: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: "#E2E8F0",
    },
    timeSlot: {
        fontSize: 10,
        color: "#64748B",
        marginBottom: 2,
    },
    activityName: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 2,
    },
    description: {
        fontSize: 10,
        color: "#334155",
        marginBottom: 2,
    },
    cost: {
        fontSize: 10,
        color: "#10B981",
    },
    summary: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#F8FAFC",
        borderRadius: 4,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    summaryText: {
        fontSize: 12,
        marginBottom: 2,
    },
})

interface ItineraryData {
    overview: {
        destination: string
        duration: string
        totalEstimatedCost: string
    }
    days: {
        day: number
        activities: {
            timeSlot: string
            name: string
            description: string
            cost: string
            whyRecommended: string
        }[]
        transportation: string
        dailyCost: string
    }[]
    summary: {
        totalEstimatedCost: string
        totalActivities: number
        keyHighlights: string[]
    }
    tripMetadata?: {
        name?: string
        startDate?: string
        endDate?: string
        userName?: string
    }
}

export function PdfDocument({ data }: { data: ItineraryData }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Background Image */}
                <Image
                    src="/mta.jpeg"
                    style={{
                        position: 'absolute',
                        minWidth: '100%',
                        minHeight: '100%',
                        height: '100%',
                        width: '100%',
                        top: 0,
                        left: 0,
                        opacity: 0.1, // Low opacity for background
                        zIndex: -1,
                    }}
                    fixed
                />

                <View style={styles.contentWrapper}>
                    <View style={styles.header}>
                        {/* Logo and MTA Title Row */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                            <Image
                                src="/mta.jpeg"
                                style={{ width: 50, height: 50, objectFit: 'contain', marginRight: 10 }}
                            />
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#2563EB" }}>MTA</Text>
                        </View>

                        {/* Details Rows */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                            {/* Left Column */}
                            <View>
                                {data.tripMetadata?.userName && (
                                    <Text style={{ fontSize: 14, color: "#1E293B", marginBottom: 5 }}>
                                        <Text style={{ fontWeight: "bold", color: "#64748B" }}>Traveller Name: </Text>
                                        {data.tripMetadata.userName}
                                    </Text>
                                )}
                                <Text style={{ fontSize: 14, color: "#1E293B", marginBottom: 5 }}>
                                    <Text style={{ fontWeight: "bold", color: "#64748B" }}>Destination (Venue): </Text>
                                    {data.overview.destination}
                                </Text>
                            </View>

                            {/* Right Column */}
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ fontSize: 14, color: "#1E293B", marginBottom: 5 }}>
                                    <Text style={{ fontWeight: "bold", color: "#64748B" }}>Duration: </Text>
                                    {data.overview.duration}
                                </Text>
                                {data.tripMetadata?.startDate && data.tripMetadata?.endDate && (
                                    <Text style={{ fontSize: 14, color: "#1E293B" }}>
                                        <Text style={{ fontWeight: "bold", color: "#64748B" }}>Dates: </Text>
                                        {new Date(data.tripMetadata.startDate).toLocaleDateString()} - {new Date(data.tripMetadata.endDate).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {data.days.map((day) => (
                        <View key={day.day}>
                            <Text style={styles.dayHeader}>
                                Day {day.day} - {day.dailyCost.replace(/₹/g, "Rs. ")}
                            </Text>
                            {day.activities.map((activity, index) => (
                                <View key={index} style={styles.activity}>
                                    <Text style={styles.timeSlot}>{activity.timeSlot}</Text>
                                    <Text style={styles.activityName}>{activity.name}</Text>
                                    <Text style={styles.description}>{activity.description}</Text>
                                    <Text style={styles.cost}>Cost: {activity.cost.replace(/₹/g, "Rs. ")}</Text>
                                </View>
                            ))}
                        </View>
                    ))}

                    <View style={styles.summary}>
                        <Text style={styles.summaryTitle}>Trip Summary</Text>
                        <Text style={styles.summaryText}>
                            Total Estimated Cost: {data.summary.totalEstimatedCost.replace(/₹/g, "Rs. ")}
                        </Text>
                        <Text style={styles.summaryText}>
                            Total Activities: {data.summary.totalActivities}
                        </Text>
                        <Text style={styles.summaryText}>
                            Highlights: {data.summary.keyHighlights.join(", ")}
                        </Text>
                    </View>
                </View>

                <Text
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        fontSize: 10,
                        color: "#64748B",
                    }}
                    fixed
                >
                    Generated by MTA Planner
                </Text>
            </Page>
        </Document>
    )
}
