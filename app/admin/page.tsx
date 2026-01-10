"use client";

import { useState } from "react";

import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs, writeBatch, getDoc, Timestamp } from "firebase/firestore";

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
  return `${yyyy}-${mm}-${dd}_${hh}${min}${ss}`; // e.g. 2026-01-10_142530
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

    // Load chores + rooms
    const choresSnap = await getDocs(collection(db, "houses", HOUSE_ID, "chores"));
    const roomsSnap = await getDocs(collection(db, "houses", HOUSE_ID, "rooms"));

    const chores = choresSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const rooms = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

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

    // Get last week's assignments to enforce "no consecutive"
    // MVP approach: look up the most recent week doc (not perfect, but good enough)
    // We'll simply find any assignments with weekId != current and take the latest later if needed.
    // For now: enforce no consecutive only if you generated last time using a recent date id.
    // (We can improve to true calendar weeks after MVP.)
    const assignmentsSnap = await getDocs(collection(db, "houses", HOUSE_ID, "assignments"));
    const assignments = assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    const lastWeekAssignments = new Map<string, string>(); // roomId -> userId
    for (const a of assignments) {
      if (a.weekId && a.weekId !== weekId) {
        // last write wins (works fine for MVP if you generate weeks in order)
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

    // Allocate 12 slots
    for (let i = 0; i < chores.length; i++) {
      rooms.sort((a, b) => (b.deficit || 0) - (a.deficit || 0));
      rooms[0]._slots += 1;
      rooms[0].deficit -= 1;
    }

    // ---------
    // 2) Pick members within each room (rotation + no consecutive + no double in same week)
    // ---------
    const usedThisWeek = new Set<string>(); // userIds already assigned this week
    const plannedAssignments: Array<{ choreId: string; roomId: string; userId: string }> = [];

    // Shuffle chores so the same chore doesn't always go first
    const shuffledChores = [...chores].sort(() => Math.random() - 0.5);

    let choreIndex = 0;

    for (const r of rooms) {
      const slots = r._slots || 0;
      if (slots === 0) continue;

      const rotationOrder: string[] = r.rotationOrder || [];
      if (!rotationOrder.length) {
        setStatus(`❌ ${r.name} has no rotationOrder. Seed members again or fix room doc.`);
        return;
      }

      let pointer: number = r.rotationPointer || 0;

      for (let s = 0; s < slots; s++) {
        const lastUser = lastWeekAssignments.get(r.id);

        // find next eligible member
        let tries = 0;
        let chosenUser = "";

        while (tries < rotationOrder.length) {
          const candidate = rotationOrder[pointer % rotationOrder.length];
          pointer = (pointer + 1) % rotationOrder.length;
          tries++;

          if (candidate === lastUser) continue;           // no consecutive weeks
          if (usedThisWeek.has(candidate)) continue;      // no double assignment same week

          chosenUser = candidate;
          break;
        }

        if (!chosenUser) {
          setStatus(`❌ Could not find eligible member in ${r.name}. (Likely too small + constraints.)`);
          return;
        }

        usedThisWeek.add(chosenUser);

        const chore = shuffledChores[choreIndex++];
        plannedAssignments.push({
          choreId: chore.id,
          roomId: r.id,
          userId: chosenUser,
        });
      }

      // Save updated pointer back to the room
      r._newPointer = pointer;
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

    // Update rooms with new deficit + pointer
    for (const r of rooms) {
      batch.set(
        doc(db, "houses", HOUSE_ID, "rooms", r.id),
        { deficit: r.deficit || 0, rotationPointer: r._newPointer ?? r.rotationPointer ?? 0 },
        { merge: true }
      );
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
