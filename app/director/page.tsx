"use client";

import { useState } from "react";

import { db } from "@/lib/firebase";
import { collection, getDocs, where, query, doc, getDoc, writeBatch } from "firebase/firestore";
import { AlphaPhiLogo } from "@/components/alpha-phi-logo";

const HOUSE_ID = "house_alpha_phi_test";

function getWeekId(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}${min}${ss}`;
}

export default function DirectorPage() {
  const [assignments, setAssignments] = useState<Array<{ roomName: string; memberName: string; choreName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);

  // Load assignments for a given weekId and join with rooms/members/chores
  const loadWeekAssignments = async (weekId: string): Promise<Array<{ roomName: string; memberName: string; choreName: string }>> => {
    try {
      // Fetch assignments for this week
      const assignmentsQuery = query(
        collection(db, "houses", HOUSE_ID, "assignments"),
        where("weekId", "==", weekId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      // Fetch all rooms, members, and chores to create lookup maps
      const [roomsSnap, membersSnap, choresSnap] = await Promise.all([
        getDocs(collection(db, "houses", HOUSE_ID, "rooms")),
        getDocs(collection(db, "houses", HOUSE_ID, "members")),
        getDocs(collection(db, "houses", HOUSE_ID, "chores")),
      ]);

      const roomMap = new Map(roomsSnap.docs.map((d) => [d.id, d.data().name as string]));
      const memberMap = new Map(membersSnap.docs.map((d) => [d.id, d.data().name as string]));
      const choreMap = new Map(choresSnap.docs.map((d) => [d.id, d.data().name as string]));

      // Join the data
      const joinedAssignments = assignmentsData.map((assignment) => ({
        roomName: roomMap.get(assignment.roomId) || assignment.roomId,
        memberName: memberMap.get(assignment.userId) || assignment.userId,
        choreName: choreMap.get(assignment.choreId) || assignment.choreId,
      }));

      return joinedAssignments;
    } catch (error) {
      console.error("Error loading week assignments:", error);
      throw error;
    }
  };

  // Generate chores for the week
  const handleGenerateChores = async () => {
    setLoading(true);
    setStatus("Generating week...");
    setAssignments([]);

    try {
      const weekId = getWeekId();
      const weekRef = doc(db, "houses", HOUSE_ID, "weeks", weekId);

      // Prevent accidental double-generation
      const existingWeek = await getDoc(weekRef);
      if (existingWeek.exists()) {
        setStatus(`❌ Week ${weekId} already exists. (Delete it in Firestore if you want to regenerate.)`);
        setLoading(false);
        return;
      }

      // Load chores + rooms + members
      const [choresSnap, roomsSnap, membersSnap] = await Promise.all([
        getDocs(collection(db, "houses", HOUSE_ID, "chores")),
        getDocs(collection(db, "houses", HOUSE_ID, "rooms")),
        getDocs(collection(db, "houses", HOUSE_ID, "members")),
      ]);

      const chores = choresSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      const rooms = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      if (chores.length !== 12) {
        setStatus(`❌ Expected 12 chores, found ${chores.length}.`);
        setLoading(false);
        return;
      }
      if (rooms.length !== 18) {
        setStatus(`❌ Expected 18 rooms, found ${rooms.length}.`);
        setLoading(false);
        return;
      }

      // Total people currently living in the house (use occupancy, not capacity)
      const totalOccupancy = rooms.reduce((sum, r) => sum + (r.occupancy || 0), 0);
      if (totalOccupancy <= 0) {
        setStatus("❌ Total occupancy is 0. Check room docs.");
        setLoading(false);
        return;
      }
      if (members.length !== totalOccupancy) {
        setStatus(`❌ Member count (${members.length}) doesn't match total occupancy (${totalOccupancy}).`);
        setLoading(false);
        return;
      }

      // Get last week's assignments to enforce "no consecutive"
      const assignmentsSnap = await getDocs(collection(db, "houses", HOUSE_ID, "assignments"));
      const assignments = assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      // Calculate total assignments made so far (for member deficit calculation)
      const totalAssignmentsSoFar = assignments.filter((a) => a.weekId && a.weekId !== weekId).length;

      // Initialize member deficit map and update member objects
      const memberDataMap = new Map<string, any>();
      for (const m of members) {
        const assignmentCount = m.assignmentCount || 0;
        // Each member should have done: (totalAssignmentsSoFar / totalOccupancy) chores
        // Deficit = expected - actual
        const expectedAssignments = totalAssignmentsSoFar / totalOccupancy;
        const deficit = expectedAssignments - assignmentCount;
        memberDataMap.set(m.id, {
          ...m,
          assignmentCount,
          deficit,
          roomId: m.roomId,
        });
      }

      const lastWeekAssignments = new Map<string, string>(); // roomId -> userId
      // Group assignments by weekId and find the most recent week
      const assignmentsByWeek = new Map<string, typeof assignments>();
      for (const a of assignments) {
        if (a.weekId && a.weekId !== weekId) {
          if (!assignmentsByWeek.has(a.weekId)) {
            assignmentsByWeek.set(a.weekId, []);
          }
          assignmentsByWeek.get(a.weekId)!.push(a);
        }
      }
      // Get the most recent weekId (since it's timestamp-based, lexicographic sort works)
      const weekIds = Array.from(assignmentsByWeek.keys()).sort().reverse();
      if (weekIds.length > 0) {
        const mostRecentWeekId = weekIds[0];
        for (const a of assignmentsByWeek.get(mostRecentWeekId) || []) {
          lastWeekAssignments.set(a.roomId, a.userId);
        }
      }

      // ---------
      // 1) Choose which rooms get the 12 chore slots (weighted fairness via deficit)
      // ---------
      // Update each room's deficit by its share
      for (const r of rooms) {
        const share = ((r.occupancy || 0) / totalOccupancy) * chores.length;
        r.deficit = (r.deficit || 0) + share;
        r._slots = 0;
      }

      // Allocate 12 slots (optimized: find max deficit each iteration instead of sorting)
      for (let i = 0; i < chores.length; i++) {
        // Find room with maximum deficit
        let maxDeficitIdx = 0;
        for (let j = 1; j < rooms.length; j++) {
          if ((rooms[j].deficit || 0) > (rooms[maxDeficitIdx].deficit || 0)) {
            maxDeficitIdx = j;
          }
        }
        rooms[maxDeficitIdx]._slots = (rooms[maxDeficitIdx]._slots || 0) + 1;
        rooms[maxDeficitIdx].deficit = (rooms[maxDeficitIdx].deficit || 0) - 1;
      }

      // ---------
      // 2) Pick members using member-level deficit (fairness across all 51 members)
      // ---------
      const usedThisWeek = new Set<string>(); // userIds already assigned this week
      const plannedAssignments: Array<{ choreId: string; roomId: string; userId: string }> = [];

      // Shuffle chores so the same chore doesn't always go first
      const shuffledChores = [...chores].sort(() => Math.random() - 0.5);

      let choreIndex = 0;

      // Process rooms that got slots
      for (const r of rooms) {
        const slots = r._slots || 0;
        if (slots === 0) continue;

        const rotationOrder: string[] = r.rotationOrder || [];
        if (!rotationOrder.length) {
          setStatus(`❌ ${r.name} has no rotationOrder. Seed members again or fix room doc.`);
          setLoading(false);
          return;
        }

        // Get members in this room
        const roomMembers = Array.from(memberDataMap.values()).filter((m) => m.roomId === r.id);
        if (roomMembers.length === 0) {
          setStatus(`❌ ${r.name} has no members.`);
          setLoading(false);
          return;
        }

        const lastUser = lastWeekAssignments.get(r.id);

        for (let s = 0; s < slots; s++) {
          // Find eligible members from this room, sorted by deficit (highest first)
          const eligibleMembers = roomMembers
            .filter((m) => {
              // Relax constraints for fairness:
              // - If room has only 1 member, allow consecutive (fairness > constraint)
              // - Otherwise, respect no consecutive and no double assignment
              if (roomMembers.length === 1) {
                return !usedThisWeek.has(m.id); // Only check no double assignment
              }
              // For multi-member rooms, respect both constraints
              if (m.id === lastUser) return false; // no consecutive weeks
              if (usedThisWeek.has(m.id)) return false; // no double assignment same week
              return true;
            })
            .sort((a, b) => (b.deficit || 0) - (a.deficit || 0)); // Highest deficit first

          // If no eligible members with constraints, relax constraints for fairness
          let chosenMember = eligibleMembers[0];

          if (!chosenMember) {
            // Relax constraints: allow consecutive if needed for fairness
            const relaxedEligible = roomMembers
              .filter((m) => !usedThisWeek.has(m.id)) // Only check no double assignment
              .sort((a, b) => (b.deficit || 0) - (a.deficit || 0));

            chosenMember = relaxedEligible[0];
          }

          if (!chosenMember) {
            setStatus(`❌ Could not find eligible member in ${r.name} even with relaxed constraints.`);
            setLoading(false);
            return;
          }

          usedThisWeek.add(chosenMember.id);

          // Update member's deficit for this week's calculation
          chosenMember.deficit = (chosenMember.deficit || 0) - 1;
          chosenMember._assignmentCount = (chosenMember._assignmentCount || chosenMember.assignmentCount || 0) + 1;

          const chore = shuffledChores[choreIndex++];
          plannedAssignments.push({
            choreId: chore.id,
            roomId: r.id,
            userId: chosenMember.id,
          });
        }
      }

      if (plannedAssignments.length !== 12) {
        setStatus(`❌ Expected 12 assignments, generated ${plannedAssignments.length}.`);
        setLoading(false);
        return;
      }

      // ---------
      // 3) Write to Firestore (week + assignments + update room deficits/pointers)
      // ---------
      const batch = writeBatch(db);

      batch.set(weekRef, {
        weekId,
        createdAt: Date.now(),
        totalChores: 12,
      });

      plannedAssignments.forEach((a, idx) => {
        const assignmentId = `${weekId}_a${String(idx + 1).padStart(2, "0")}`;
        batch.set(doc(db, "houses", HOUSE_ID, "assignments", assignmentId), {
          weekId,
          choreId: a.choreId,
          roomId: a.roomId,
          userId: a.userId,
          status: "assigned",
          createdAt: Date.now(),
        });
      });

      // Update rooms with new deficit
      for (const r of rooms) {
        batch.set(
          doc(db, "houses", HOUSE_ID, "rooms", r.id),
          { deficit: r.deficit || 0 },
          { merge: true }
        );
      }

      // Update members with new assignment counts and deficits
      for (const m of members) {
        const updatedMember = memberDataMap.get(m.id);
        if (updatedMember && updatedMember._assignmentCount !== undefined) {
          // Calculate new deficit: expected assignments after this week - actual
          const newTotalAssignments = totalAssignmentsSoFar + plannedAssignments.length;
          const expectedAssignments = newTotalAssignments / totalOccupancy;
          const newDeficit = expectedAssignments - updatedMember._assignmentCount;

          batch.set(
            doc(db, "houses", HOUSE_ID, "members", m.id),
            {
              assignmentCount: updatedMember._assignmentCount,
              deficit: newDeficit,
            },
            { merge: true }
          );
        }
      }

      await batch.commit();

      // Fetch the newly created assignments and display them
      const loadedAssignments = await loadWeekAssignments(weekId);
      setAssignments(loadedAssignments);
      setCurrentWeekId(weekId);
      setStatus(`✅ Generated week ${weekId}!`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error generating week. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // Download assignments as CSV
  const downloadCSV = () => {
    if (assignments.length === 0) return;

    // CSV header
    const header = "Room,Member,Chore\n";

    // CSV rows with proper escaping
    const rows = assignments.map((assignment) => {
      // Escape commas and quotes in values
      const escapeCSV = (value: string) => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      return `${escapeCSV(assignment.roomName)},${escapeCSV(assignment.memberName)},${escapeCSV(assignment.choreName)}`;
    });

    const csvContent = header + rows.join("\n");

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Filename format: chore-assignments-YYYY-MM-DD.csv
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    link.download = `chore-assignments-${yyyy}-${mm}-${dd}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download assignments as PDF
  const downloadPDF = async () => {
    if (assignments.length === 0) return;

    try {
      // Dynamically import jsPDF and autoTable to avoid SSR issues
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      
      // Get the autoTable function from the module
      const autoTable = (autoTableModule as any).default || autoTableModule;
      
      const doc = new jsPDF();
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const weekId = currentWeekId || `${yyyy}-${mm}-${dd}`;

      // Add title
      doc.setFontSize(18);
      doc.text("Weekly Chore Assignments", 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Week: ${weekId}`, 14, 28);
      doc.setTextColor(0, 0, 0);

      // Prepare table data
      const tableData = assignments.map((assignment) => [
        assignment.roomName,
        assignment.memberName,
        assignment.choreName,
      ]);

      // Generate table using autoTable function
      autoTable(doc, {
        head: [["Room", "Member", "Chore"]],
        body: tableData,
        startY: 35,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [244, 244, 245], // bg-muted color
          textColor: [24, 24, 27], // foreground color
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Room column
          1: { cellWidth: 60 }, // Member column
          2: { cellWidth: "auto" }, // Chore column (takes remaining space)
        },
        margin: { top: 35, right: 14, bottom: 20, left: 14 },
      });

      // Save PDF
      doc.save(`chore-assignments-${yyyy}-${mm}-${dd}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setStatus("❌ Error generating PDF. Please try again.");
    }
  };

  // Simple spinner icon component
  const SpinnerIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );

  // Simple sparkles icon component
  const SparklesIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <AlphaPhiLogo className="h-12 w-12 text-primary" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-foreground">Alpha Phi</span>
              <span className="text-xs text-muted-foreground -mt-0.5">San Jose</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">Chore Manager</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-1">
        {/* Hero Section with Generate Button */}
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-8">
            <AlphaPhiLogo className="h-42 w-42 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Weekly Chore Generator
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto text-pretty">
              Generate fair and randomized chore assignments for all chapter members with one click.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGenerateChores}
              disabled={loading}
              className="flex items-center gap-2 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  {assignments.length > 0 ? "Regenerate Week" : "Generate Week"}
                </>
              )}
            </button>
            {assignments.length > 0 && (
              <>
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-secondary text-secondary-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Download CSV
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-secondary text-secondary-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Card */}
        {status && (
          <div className="mb-6 p-4 rounded-lg bg-card border border-border max-w-2xl mx-auto">
            <p className="text-card-foreground text-center">{status}</p>
          </div>
        )}

        {/* Chore Assignments Table */}
        {assignments.length > 0 ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Chore
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment, index) => (
                    <tr
                      key={index}
                      className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-card-foreground">
                        {assignment.roomName}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground">
                        {assignment.memberName}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground">
                        {assignment.choreName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <SparklesIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No assignments yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Click the button above to generate this week's chore assignments for the chapter.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <AlphaPhiLogo className="h-8 w-8 text-primary" />
              <span className="text-sm text-muted-foreground">Alpha Phi San Jose Beta Psi Chapter</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
