import { db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

export interface SoberLivingHome {
  id: string;
  name: string;
  address: string;
  gender: "Men" | "Women";
  phone: string;
  website?: string;
  heroImage?: string;
  neighborhood?: string;
  coordinates?: { lat: number; lng: number };
  notes?: string;
  [key: string]: unknown;
}

const COLLECTION = "sober_living";

export const SoberLivingService = {
  getAllHomes: async (): Promise<SoberLivingHome[]> => {
    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SoberLivingHome);
  },

  addHome: async (home: Omit<SoberLivingHome, "id">) => {
    return await addDoc(collection(db, COLLECTION), home);
  },

  updateHome: async (id: string, data: Partial<SoberLivingHome>) => {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, data);
  },

  deleteHome: async (id: string) => {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  // Seed initial data
  seedInitialHomes: async (homes: SoberLivingHome[]) => {
    const batch = writeBatch(db);

    // Delete existing (optional, or just append?)
    // For safety, let's just add new ones or overwrite by ID if we provided IDs.
    // But since we generate IDs, let's assume we want to Clear First if this is a "Reset"

    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => batch.delete(d.ref));

    homes.forEach((home) => {
      const ref = doc(collection(db, COLLECTION)); // Auto ID
      // If home.id is generic "temp", ignore it. Or use it?
      // Better to let Firestore generate IDs for new collection
      const { id: _id, ...data } = home;
      batch.set(ref, data);
    });

    await batch.commit();
  },
};

/**
 * Initial sober living homes seed data.
 * Moved from scripts/seed-sober-living-data.ts (deleted in Track AI sprint).
 */
export const INITIAL_SOBER_LIVING_HOMES: SoberLivingHome[] = [
  // Region 5
  {
    id: "temp_1",
    name: "A Vision for You",
    gender: "Men",
    address: "PO Box 120114, Nashville, TN 37212",
    phone: "(615) 989-0190",
    website: "https://avisionforyourecovery.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_2",
    name: "STATS House",
    gender: "Women",
    address: "Franklin County, TN",
    phone: "(931) 308-4003",
    neighborhood: "Franklin County",
  },
  {
    id: "temp_3",
    name: "Pearltown Housing Initiative",
    gender: "Women",
    address: "Hickman County, TN",
    phone: "(931) 400-2948",
    neighborhood: "Hickman County",
  },
  {
    id: "temp_4",
    name: "Beacon Recovery Residences",
    gender: "Women",
    address: "Rutherford County, TN",
    phone: "(615) 987-5803",
    website: "https://www.beaconrecoveryres.com/",
    neighborhood: "Rutherford County",
  },
  {
    id: "temp_5",
    name: "Threshold Recovery",
    gender: "Men",
    address: "Rutherford County, TN",
    phone: "(629) 201-5996",
    website: "https://threshold-recovery.com/",
    neighborhood: "Rutherford County",
  },
  {
    id: "temp_6",
    name: "501 House",
    gender: "Women",
    address: "Sumner County, TN",
    phone: "",
    website: "https://the501house.com/",
    neighborhood: "Sumner County",
  },
  // Region 4 (Davidson)
  {
    id: "temp_7",
    name: "A Design for Living",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 266-5665",
    website: "https://adesignforlivingrecoveryhomes.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_8",
    name: "Axiom Recovery Homes",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(629) 207-6455",
    website: "https://axiomrecoveryhomes.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_9",
    name: "Cupid Ministries",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 853-2652",
    website: "https://cupidministries.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_10",
    name: "Footprints 2 Recovery",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 306-3805",
    website: "https://footprints2recovery.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_11",
    name: "Hawk's Nest House",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 968-1771",
    website: "https://hawksnesthouse.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_12",
    name: "Healing Housing",
    gender: "Women",
    address: "Nashville, TN",
    phone: "888-445-HEAL",
    website: "https://healinghousing.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_13",
    name: "Just Breathe",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(270) 994-0129",
    website: "https://justbreatherecovery.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_14",
    name: "Mending Hearts",
    gender: "Women",
    address: "Nashville, TN",
    phone: "(866) 416-1909",
    website: "https://mendingheartsinc.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_15",
    name: "My Father's House",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 319-5579",
    website: "https://myfathershousenashville.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_16",
    name: "Neo's Recovery",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 828-4560",
    website: "https://neosrecoveryhouse.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_17",
    name: "New Vision",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(304) 552-6024",
    website: "https://newvisionrecovery.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_18",
    name: "Next Chapter Homes",
    gender: "Women",
    address: "Nashville, TN",
    phone: "(615) 638-5155",
    website: "https://nextchapterhomes.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_19",
    name: "Next Steps",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(336) 420-6704",
    website: "https://nextstepsrecoverytn.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_20",
    name: "Old Hickory Recovery",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 375-4629",
    website: "https://oldhickoryrecovery.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_21",
    name: "Phoenix Recovery",
    gender: "Women",
    address: "Nashville, TN",
    phone: "(615) 669-5007",
    website: "https://phnxrecovery.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_22",
    name: "Sober Solutions",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 474-0573",
    website: "https://sobersolutionsnashville.com/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_23",
    name: "Stepping Stones",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 669-2373",
    website: "https://steppingstonesrecoveryhomes.org/",
    neighborhood: "Nashville",
  },
  {
    id: "temp_24",
    name: "Welcome Home Ministries",
    gender: "Men",
    address: "Nashville, TN",
    phone: "(615) 309-7087",
    website: "https://welcomehomemin.org/",
    neighborhood: "Nashville",
  },
];
