"use client";

import { useState } from "react";

import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs, writeBatch, getDoc } from "firebase/firestore";

import { HOUSE_ID, ENVIRONMENT } from "@/lib/config";

const CHORES = [
  { id: "chore_01", name: "Clean up Teacup room, Chapter Room, Date Room and take out Courtyard trash" },
  { id: "chore_02", name: "Empty Blue Girl Bathroom trash by 8 girl, check on toilet paper, and restock paper towels" },
  { id: "chore_03", name: "Clean fridges and take out mini kitchen trash" },
  { id: "chore_04", name: "Empty TWO dining room trashes #1" },
  { id: "chore_05", name: "Empty TWO dining room trashes #2" },
  { id: "chore_06", name: "Empty Single Girl bathroom trash, check on toilet paper, and restock paper towels" },
  { id: "chore_07", name: "Empty Pink Girl bathroom trash, check on toilet paper, and restock paper towels" },
  { id: "chore_08", name: "Clean Study Room and take out trash by 8 girl" },
  { id: "chore_09", name: "Empty Yellow Girl bathroom trash, check on toilet paper, and restock paper towels" },
  { id: "chore_10", name: "Sort mail" },
  { id: "chore_11", name: "Wipe down tables in dining room" },
];

const ROOMS_DATA = [
  { num: 1, capacity: 2, members: [] }, // Seniors removed: Sammy S, Isabella L
  { num: 2, capacity: 2, members: ["Katia A", "Sofia C"] },
  { num: 3, capacity: 4, members: ["Ainsley P", "Chandhana P", "Alyssa G", "Amelia N"] },
  { num: 4, capacity: 4, members: ["Summer L", "Kat G", "Terra K", "Olivia R"] },
  { num: 5, capacity: 1, members: [] }, // Senior removed: Penelope S
  { num: 6, capacity: 2, members: ["Fran S", "Kaitlyn N"] },
  { num: 7, capacity: 2, members: ["Isabella P"] }, // Senior removed: Annika S
  { num: 8, capacity: 1, members: ["Julissa P"] },
  { num: 9, capacity: 6, members: ["Elizabeth D", "Kaylee S", "Tyra K", "Zariana A", "Laura M"] },
  { num: 10, capacity: 4, members: ["Keira S", "Ava C", "Avary S", "Cadence R"] },
  { num: 11, capacity: 4, members: ["Summer B", "Sarah K", "Ariana M"] }, // Senior removed: Sam L
  { num: 12, capacity: 2, members: [] }, // Seniors removed: Grace C, Lauren L
  { num: 13, capacity: 2, members: [] }, // Seniors removed: Isabel W, Julia P
  { num: 14, capacity: 2, members: ["Mia H", "Cami K"] },
  { num: 15, capacity: 2, members: ["Brooke G", "Eve O"] },
  { num: 16, capacity: 2, members: ["Isabella A", "Hannah M"] },
  { num: 17, capacity: 2, members: [] }, // Seniors removed: Lindsay G, Olivia G
  { num: 18, capacity: 8, members: ["Mikayla P", "Zoe Q", "Isela V", "Sanaa K", "Saavya S", "Josie Z", "Katie W", "Carina D"] },
];

//top-level helper functions
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\./g, "")
    .replace(/\s+/g, "_");
}

function getWeekId(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}${min}${ss}`;
}
export default function AdminPage() {
  const [status, setStatus] = useState("");
  const [generatedText, setGeneratedText] = useState("");


  const seedChores = async () => { 
    setStatus("Seeding chores...");
    try {
      for (const chore of CHORES) {
        await setDoc(doc(db, "houses", HOUSE_ID, "chores", chore.id), {
          name: chore.name,
          createdAt: Date.now(),
        });
      }
      setStatus("✅ Chores seeded successfully!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error seeding chores. Check console.");
    }
  };

  const checkChores = async () => {
    try {
      const snap = await getDocs(collection(db, "houses", HOUSE_ID, "chores"));
      setStatus(`✅ Found ${snap.size} chores in Firestore.`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error reading chores.");
    }
  };

    const seedRoomsAndMembers = async () => {
    setStatus("Seeding rooms + members...");
    try {
      const batch = writeBatch(db);

      for (const room of ROOMS_DATA) {
        const roomId = `room_${String(room.num).padStart(2, "0")}`;
        const memberIds: string[] = [];

        // Create member docs
        for (const fullName of room.members) {
          const memberId = `member_${slugify(fullName)}`;
          memberIds.push(memberId);

          batch.set(doc(db, "houses", HOUSE_ID, "members", memberId), {
            name: fullName,
            roomId,
            assignmentCount: 0,
            deficit: 0,
            createdAt: Date.now(),
          });
        }

        // Create room doc (includes rotation setup)
        batch.set(doc(db, "houses", HOUSE_ID, "rooms", roomId), {
          name: `Room ${room.num}`,
          capacity: room.capacity,
          occupancy: room.members.length,
          rotationOrder: memberIds,
          rotationPointer: 0,
          deficit: 0,
          createdAt: Date.now(),
        });
      }

      await batch.commit();
      setStatus("✅ Seeded rooms + members successfully!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error seeding rooms + members. Check console.");
    }
  };

  const generateWeek = async () => {
  setStatus("Generating week...");
  setGeneratedText("");

  try {
    const weekId = getWeekId();
    const weekRef = doc(db, "houses", HOUSE_ID, "weeks", weekId);

    // Prevent accidental double-generation
    const existingWeek = await getDoc(weekRef);
    if (existingWeek.exists()) {
      setStatus(`❌ Week ${weekId} already exists. (Delete it in Firestore if you want to regenerate.)`);
      return;
    }

    // Load chores + rooms + members
    const choresSnap = await getDocs(collection(db, "houses", HOUSE_ID, "chores"));
    const roomsSnap = await getDocs(collection(db, "houses", HOUSE_ID, "rooms"));
    const membersSnap = await getDocs(collection(db, "houses", HOUSE_ID, "members"));

    const chores = choresSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const rooms = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    if (chores.length !== 11) {
      setStatus(`❌ Expected 11 chores, found ${chores.length}.`);
      return;
    }
    if (rooms.length !== 18) {
      setStatus(`❌ Expected 18 rooms, found ${rooms.length}.`);
      return;
    }

    // Total people currently living in the house (use occupancy, not capacity)
    const totalOccupancy = rooms.reduce((sum, r) => sum + (r.occupancy || 0), 0);
    if (totalOccupancy <= 0) {
      setStatus("❌ Total occupancy is 0. Check room docs.");
      return;
    }
    if (members.length !== totalOccupancy) {
      setStatus(`❌ Member count (${members.length}) doesn't match total occupancy (${totalOccupancy}).`);
      return;
    }

    // Get last week's assignments to enforce "no consecutive"
    const assignmentsSnap = await getDocs(collection(db, "houses", HOUSE_ID, "assignments"));
    const assignments = assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    // Calculate total assignments made so far (for member deficit calculation)
    const totalAssignmentsSoFar = assignments.filter(a => a.weekId && a.weekId !== weekId).length;
    
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

    // Get last week's assignments to enforce "no consecutive" (member-based, not room-based)
    const lastWeekMemberAssignments = new Set<string>(); // userIds assigned last week
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
        lastWeekMemberAssignments.add(a.userId);
      }
    }

    // ---------
    // Allocate chores directly to members using member-level deficit (pure member-level fairness)
    // ---------
    const usedThisWeek = new Set<string>(); // userIds already assigned this week
    const plannedAssignments: Array<{ choreId: string; roomId: string; userId: string }> = [];

    // Shuffle chores so the same chore doesn't always go first
    const shuffledChores = [...chores].sort(() => Math.random() - 0.5);

    // Get all members as an array for processing
    const allMembers = Array.from(memberDataMap.values());

    // Allocate each chore to the member with highest deficit
    for (let i = 0; i < chores.length; i++) {
      // Find eligible members (not used this week, not assigned last week if possible)
      const eligibleMembers = allMembers
        .filter(m => {
          if (usedThisWeek.has(m.id)) return false; // no double assignment same week
          return true;
        })
        .sort((a, b) => {
          // Sort by deficit (highest first), but prioritize members who weren't assigned last week
          const aWasLastWeek = lastWeekMemberAssignments.has(a.id);
          const bWasLastWeek = lastWeekMemberAssignments.has(b.id);
          
          // If one was assigned last week and the other wasn't, prefer the one who wasn't
          if (aWasLastWeek && !bWasLastWeek) return 1;
          if (!aWasLastWeek && bWasLastWeek) return -1;
          
          // Otherwise, sort by deficit (highest first)
          return (b.deficit || 0) - (a.deficit || 0);
        });

      // If no eligible members (shouldn't happen), try relaxing the "no consecutive" constraint
      let chosenMember = eligibleMembers[0];
      
      if (!chosenMember) {
        // Relax constraints: allow consecutive if needed for fairness
        const relaxedEligible = allMembers
          .filter(m => !usedThisWeek.has(m.id)) // Only check no double assignment
          .sort((a, b) => (b.deficit || 0) - (a.deficit || 0));
        
        chosenMember = relaxedEligible[0];
      }

      if (!chosenMember) {
        setStatus(`❌ Could not find eligible member even with relaxed constraints.`);
        return;
      }

      usedThisWeek.add(chosenMember.id);
      
      // Update member's deficit for this week's calculation
      chosenMember.deficit = (chosenMember.deficit || 0) - 1;
      chosenMember._assignmentCount = (chosenMember._assignmentCount || chosenMember.assignmentCount || 0) + 1;

      const chore = shuffledChores[i];
      plannedAssignments.push({
        choreId: chore.id,
        roomId: chosenMember.roomId, // Keep roomId for display/tracking
        userId: chosenMember.id,
      });
    }

    if (plannedAssignments.length !== 11) {
      setStatus(`❌ Expected 11 assignments, generated ${plannedAssignments.length}.`);
      return;
    }

    // ---------
    // 3) Write to Firestore (week + assignments + update member deficits)
    // ---------
    const batch = writeBatch(db);

    batch.set(weekRef, {
      weekId,
      createdAt: Date.now(),
      totalChores: 11,
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

    // ---------
    // 4) Build copy/paste message
    // ---------
    // Map ids to readable names
    const memberMapSnap = await getDocs(collection(db, "houses", HOUSE_ID, "members"));
    const choreMap = new Map(chores.map((c) => [c.id, c.name]));
    const memberMap = new Map(memberMapSnap.docs.map((d) => [d.id, (d.data() as any).name]));

    const lines = plannedAssignments.map((a) => {
      const memberName = memberMap.get(a.userId) || a.userId;
      const choreName = choreMap.get(a.choreId) || a.choreId;
      return `• ${memberName} — ${choreName}`;
    });

    const message = `Chore Assignments (${weekId})\n\n${lines.join("\n")}`;
    setGeneratedText(message);
    setStatus(`✅ Generated week ${weekId}!`);
  } catch (err) {
    console.error(err);
    setStatus("❌ Error generating week. Check console.");
  }
};

  return (
    <main style={{ padding: 32 }}>
      <h1>Admin – Chore Generator</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={seedChores}>Seed chores</button>
        <button onClick={checkChores}>Check chores</button>
        <button onClick={seedRoomsAndMembers}>Seed rooms + members</button>
        <button onClick={generateWeek}>Generate week</button>
      </div>

      <p style={{ marginTop: 16 }}>{status}</p>
      {generatedText && (
        <>
            <h3 style={{ marginTop: 20 }}>Copy/Paste Message</h3>
            <textarea
            value={generatedText}
            readOnly
            style={{ width: "100%", height: 260, marginTop: 8 }}
            />
        </>
     )}
    </main>
  );
}
