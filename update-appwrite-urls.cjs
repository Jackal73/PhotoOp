// update-appwrite-urls.js
// Usage: node update-appwrite-urls.js
// This script updates all Appwrite document fields containing 'localhost:5173' to use the cloud endpoint.

const { Client, Databases } = require("appwrite");

// === CONFIGURATION ===
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1"; // Your Appwrite Cloud endpoint
const APPWRITE_PROJECT = "653c9813ba407c5575c2"; // Your project ID
const APPWRITE_API_KEY =
  "standard_484a209b998fa9daccc8d67a748f72546586a67b6e1697f98abfb3ade1430837534dbca017f41aacd30c934c438398275130978fe6b6e50a83e3fd3df68aced00f7ed25ca60257b67876ea1fe40556df0842b1c8db60efec045934649db5bbc6de71d5f065aa59974bfce3c97446d0d1d9b8356a1b697c6228789b2ead4c5cff"; // <-- Replace with your Appwrite API key (with write permissions)

// List your collection IDs here
const COLLECTIONS = [
  "653ca999647c1e98f982", // posts
  "6a08c1330012bcb2e3ef", // reels
  "653ca9d749a99779c3ef", // users (profile pics)
  // Add more collection IDs as needed
];

// Fields to check for URLs
const FIELDS = ["imageUrl", "videoUrl", "thumbnailUrl"];

const LOCAL_URL = "http://localhost:5173/v1";
const CLOUD_URL = APPWRITE_ENDPOINT;

async function main() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT);
  // Set API key header for server-side SDK usage
  client.headers["X-Appwrite-Key"] = APPWRITE_API_KEY;

  const databases = new Databases(client);

  for (const collectionId of COLLECTIONS) {
    console.log(`\nChecking collection: ${collectionId}`);
    let page = 0;
    let totalUpdated = 0;
    while (true) {
      const docs = await databases.listDocuments(
        "653ca943779642839c09", // databaseId
        collectionId,
        [
          // You can add filters here if needed
        ],
      );
      if (!docs.documents.length) break;
      for (const doc of docs.documents) {
        let updated = false;
        const updatePayload = {};
        for (const field of FIELDS) {
          if (
            doc[field] &&
            typeof doc[field] === "string" &&
            doc[field].includes(LOCAL_URL)
          ) {
            updatePayload[field] = doc[field].replace(LOCAL_URL, CLOUD_URL);
            updated = true;
          }
        }
        if (updated) {
          await databases.updateDocument(
            "653ca943779642839c09", // databaseId
            collectionId,
            doc.$id,
            updatePayload,
          );
          totalUpdated++;
          console.log(`Updated document ${doc.$id} in ${collectionId}`);
        }
      }
      // If less than 25 docs, we're done (Appwrite default page size)
      if (docs.documents.length < 25) break;
      page++;
    }
    console.log(`Total updated in ${collectionId}: ${totalUpdated}`);
  }
  console.log("Done!");
}

main().catch(console.error);
