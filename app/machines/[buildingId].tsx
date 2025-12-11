// app/machines/[buildingId].tsx

import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../src/firebase";

// Possible machine statuses
type MachineStatus = "available" | "in-use" | "broken";

interface MachineDoc {
  id: number;
  type: "washer" | "dryer";
  status: MachineStatus;
  broken: boolean;
  reportMessage?: string | null;
  startTime?: Timestamp | null;
  duration?: number; // seconds
}

interface Machine extends MachineDoc {
  // Derived fields for UI
  timer: number;            // seconds left
  displayStatus: DisplayStatus;
}

type DisplayStatus = "available" | "in-use" | "finishing" | "broken";

const STATUS_CONFIG: Record<
  DisplayStatus,
  { text: string; color: string }
> = {
  available: { text: "Available", color: "#10B981" },
  "in-use": { text: "In Use", color: "#EF4444" },
  finishing: { text: "Finishing Soon", color: "#F59E0B" },
  broken: { text: "Out of Order", color: "#6B7280" },
};

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
};

interface MachineCardProps {
  machine: Machine;
  onAction: (machine: Machine) => void;
  onFix: (machine: Machine) => void;
  isAdmin: boolean;
}

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (machine: Machine, message: string) => void;
  machine: Machine | null;
}

export default function Machines() {
    console.log("buildingId:", buildingId);

  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();

  const [machinesRaw, setMachinesRaw] = useState<MachineDoc[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(
    null
  );

  const [now, setNow] = useState(Date.now());

  // Tick every second to recompute timers locally
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Firestore machines in this building
  useEffect(() => {
    if (!buildingId) return;

    const q = query(
      collection(db, "laundryRooms", buildingId as string, "machines"),
      orderBy("id", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: MachineDoc[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: data.id,
            type: data.type,
            status: data.status,
            broken: data.broken ?? false,
            reportMessage: data.reportMessage ?? null,
            startTime: data.startTime ?? null,
            duration: data.duration ?? 0,
          };
        });
        setMachinesRaw(docs);
      },
      (err) => {
        console.error("Error listening to machines:", err);
        Alert.alert("Error", "Failed to load machines.");
      }
    );

    return () => unsub();
  }, [buildingId]);

  // Compute timers and displayStatus from Firestore data + now
  const machines: Machine[] = useMemo(() => {
    return machinesRaw.map((m) => {
      let timer = 0;
      let displayStatus: DisplayStatus = "available";

      if (m.broken) {
        displayStatus = "broken";
        timer = 0;
      } else if (m.status === "in-use" && m.startTime && m.duration) {
        const startedAt = m.startTime.toMillis();
        const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
        const remaining = Math.max(0, Math.floor(m.duration - elapsed));
        timer = remaining;

        if (remaining <= 0) {
          displayStatus = "available";
        } else if (remaining <= 300) {
          displayStatus = "finishing";
        } else {
          displayStatus = "in-use";
        }
      } else {
        displayStatus = "available";
        timer = 0;
      }

      return {
        ...m,
        timer,
        displayStatus,
      };
    });
  }, [machinesRaw, now]);

  const isAdmin = auth.currentUser?.email === "admin@sdsu.edu";

  const handleAction = async (machine: Machine) => {
    if (!buildingId) return;

    // If broken, never allow normal "start"
    if (machine.broken || machine.displayStatus === "broken") {
      // Non-admin: open report modal again (or just show message)
      setSelectedMachine(machine);
      setModalVisible(true);
      return;
    }

    if (machine.displayStatus === "available") {
      // Start cycle
      const cycleTime =
        machine.type === "washer" ? 30 * 60 : 45 * 60; // seconds
      const machineRef = doc(
        db,
        "laundryRooms",
        buildingId as string,
        "machines",
        `Machine ${machine.id}`
      );

      try {
        await updateDoc(machineRef, {
          status: "in-use",
          broken: false,
          reportMessage: null,
          startTime: Timestamp.now(),
          duration: cycleTime,
        });
      } catch (err: any) {
        console.error(err);
        Alert.alert(
          "Error",
          err?.message ?? "Failed to start this machine."
        );
      }
    } else {
      // in-use or finishing → open report modal
      setSelectedMachine(machine);
      setModalVisible(true);
    }
  };

  const handleFix = async (machine: Machine) => {
    if (!isAdmin || !buildingId) return;

   const machineRef = doc(
     db,
     "laundryRooms",
     buildingId as string,
     "machines",
     `Machine ${machine.id}`
   );

    try {
      await updateDoc(machineRef, {
        broken: false,
        reportMessage: null,
        status: "available",
        startTime: null,
        duration: 0,
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.message ?? "Failed to fix machine.");
    }
  };

  const handleReportSubmit = async (machine: Machine, message: string) => {
    if (!buildingId) return;

    const machineRef = doc(
      db,
      "laundryRooms",
      buildingId as string,
      "machines",
      `Machine ${machine.id}`
    );

    try {
      await updateDoc(machineRef, {
        broken: true,
        status: "broken",
        reportMessage: message || "No description provided.",
        startTime: null,
        duration: 0,
      });

      Alert.alert(
        "Report Submitted",
        `Issue reported for ${machine.type} #${machine.id}. Thank you!`
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.message ?? "Failed to submit the report."
      );
    } finally {
      setModalVisible(false);
      setSelectedMachine(null);
    }
  };

  const selectedRoomName = buildingId; // or you could also store room metadata in Firestore

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <Text
        style={{
          color: "#FFF",
          fontSize: 22,
          fontWeight: "600",
          padding: 16,
        }}
      >
        {selectedRoomName}
      </Text>
      <ScrollView contentContainerStyle={styles.machinesGrid}>
        {machines.map((m) => (
          <MachineCard
            key={m.id}
            machine={m}
            onAction={handleAction}
            onFix={handleFix}
            isAdmin={isAdmin}
          />
        ))}
      </ScrollView>
      <ReportModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleReportSubmit}
        machine={selectedMachine}
      />
    </SafeAreaView>
  );
}

// Machine card
const MachineCard = ({ machine, onAction, onFix, isAdmin }: MachineCardProps) => {
  const config = STATUS_CONFIG[machine.displayStatus];
  const isBroken = machine.displayStatus === "broken";

  return (
    <View style={styles.machineCard}>
      <View
        style={[
          styles.machineStatusIndicator,
          { backgroundColor: config.color },
        ]}
      />
      <View style={styles.machineInfo}>
        <Text style={styles.machineType}>
          {machine.type.toUpperCase()} #{machine.id}
        </Text>
        <Text style={[styles.machineStatusText, { color: config.color }]}>
          {config.text}
        </Text>

        {machine.reportMessage && isBroken && (
          <Text style={{ color: "#F9FAFB", marginTop: 4, fontSize: 12 }}>
            {machine.reportMessage}
          </Text>
        )}

        {(machine.displayStatus === "in-use" ||
          machine.displayStatus === "finishing") && (
          <Text style={styles.machineTimer}>
            {formatTime(machine.timer)}
          </Text>
        )}
      </View>

      <View style={{ marginTop: 12, marginLeft: 10 }}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isBroken && styles.actionButtonDisabled,
          ]}
          onPress={() => onAction(machine)}
        >
          <Text style={styles.actionButtonText}>
            {machine.displayStatus === "available" ? "Start" : "Report"}
          </Text>
        </TouchableOpacity>

        {isAdmin && isBroken && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: "#10B981", marginTop: 6 },
            ]}
            onPress={() => onFix(machine)}
          >
            <Text style={styles.actionButtonText}>Mark Fixed</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Report modal
const ReportModal = ({
  visible,
  onClose,
  onSubmit,
  machine,
}: ReportModalProps) => {
  const [reportMessage, setReportMessage] = useState("");

  const handleSubmit = () => {
    if (machine) {
      onSubmit(machine, reportMessage);
      setReportMessage("");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            Report Machine #{machine?.id}
          </Text>
          <Text style={styles.modalSubtitle}>
            Please describe the issue.
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g., 'not spinning', 'won't turn on'"
            placeholderTextColor="#9CA3AF"
            multiline
            value={reportMessage}
            onChangeText={setReportMessage}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSubmit]}
              onPress={handleSubmit}
            >
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// styles (same as before, unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  machinesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    padding: 10,
  },
  machineCard: {
    width: "46%",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 15,
    margin: "2%",
    position: "relative",
    overflow: "hidden",
  },
  machineStatusIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
  },
  machineInfo: {
    marginLeft: 10,
    alignItems: "flex-start",
  },
  machineType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  machineStatusText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  machineTimer: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E5E7EB",
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  actionButtonDisabled: {
    backgroundColor: "#4B5563",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#374151",
    borderRadius: 8,
    color: "#FFF",
    padding: 15,
    height: 100,
    textAlignVertical: "top",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#4B5563",
    marginRight: 10,
  },
  modalButtonSubmit: {
    backgroundColor: "#4F46E5",
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
