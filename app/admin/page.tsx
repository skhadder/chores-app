"use client";

import { useState } from "react";

import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs, writeBatch, getDoc } from "firebase/firestore";

const HOUSE_ID = "house_alpha_phi_test";

const CHORES = [
  { id: "chore_01", name: "Clean up living room, chapter room, date room, take out outside trash in courtyard" },
  { id: "chore_02", name: "Empty blue girl bathroom trash by 8 girl, check on toilet paper, restock paper towels" },
  { id: "chore_03", name: "Clean fridges and take out mini kitchen trash" },
  { id: "chore_04", name: "Empty ONE dining room trash #1" },
  { id: "chore_05", name: "Empty ONE dining room trash #2" },
  { id: "chore_06", name: "Empty ONE dining room trash #3" },
  { id: "chore_07", name: "Empty ONE dining room trash #4" },
  { id: "chore_08", name: "Empty single girl bathroom trash, check on toilet paper, restock paper towels" },
  { id: "chore_09", name: "Do the mini kitchen dishes & put away" },
  { id: "chore_10", name: "Empty pink girl bathroom trash, check on toilet paper, restock paper towels" },
  { id: "chore_11", name: "Clean study room & take out trash by 8 girl" },
  { id: "chore_12", name: "Empty yellow girl bathroom trash, check on toilet paper, restock paper towels" },
];

const ROOMS_DATA = [
  { num: 1, capacity: 2, members: ["Sammy S", "Isabella L"] },
  { num: 2, capacity: 2, members: ["Katia A", "Sofia C"] },
  { num: 3, capacity: 4, members: ["Ainsley P", "Chandhana P", "Alyssa G", "Amelia N"] },
  { num: 4, capacity: 4, members: ["Summer L", "Kat G", "Terra K", "Olivia R"] },
  { num: 5, capacity: 1, members: ["Penelope S"] },
  { num: 6, capacity: 2, members: ["Fran S", "Kaitlyn N"] },
  { num: 7, capacity: 2, members: ["Isabella P", "Annika S"] },
  { num: 8, capacity: 1, members: ["Julissa P"] },
  { num: 9, capacity: 6, members: ["Elizabeth D", "Kaylee S", "Tyra K", "Zariana A", "Laura M"] },
  { num: 10, capacity: 4, members: ["Keira S", "Ava C", "Avary S", "Cadence R"] },
  { num: 11, capacity: 4, members: ["Summer B", "Sam L", "Sarah K", "Ariana M"] },
  { num: 12, capacity: 2, members: ["Grace C", "Lauren L"] },
  { num: 13, capacity: 2, members: ["Isabel W", "Julia P"] },
  { num: 14, capacity: 2, members: ["Mia H", "Cami K"] },
  { num: 15, capacity: 2, members: ["Brooke G", "Eve O"] },
  { num: 16, capacity: 2, members: ["Isabella A", "Hannah M"] },
  { num: 17, capacity: 2, members: ["Lindsay G", "Olivia G"] },
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

    if (chores.length !== 12) {
      setStatus(`❌ Expected 12 chores, found ${chores.length}.`);
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
        return;
      }

      // Get members in this room
      const roomMembers = Array.from(memberDataMap.values()).filter(m => m.roomId === r.id);
      if (roomMembers.length === 0) {
        setStatus(`❌ ${r.name} has no members.`);
        return;
      }

      const lastUser = lastWeekAssignments.get(r.id);

      for (let s = 0; s < slots; s++) {
        // Find eligible members from this room, sorted by deficit (highest first)
        const eligibleMembers = roomMembers
          .filter(m => {
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
            .filter(m => !usedThisWeek.has(m.id)) // Only check no double assignment
            .sort((a, b) => (b.deficit || 0) - (a.deficit || 0));
          
          chosenMember = relaxedEligible[0];
        }

        if (!chosenMember) {
          setStatus(`❌ Could not find eligible member in ${r.name} even with relaxed constraints.`);
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
