/**
 * Backup MongoDB to local JSON files (timestamp-based)
 * Run: node scripts/backup-mongodb.js
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function backupDatabase() {
  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected'.cyan.underline);

    const db = mongoose.connection.db;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\nBacking up ${collections.length} collections...\n`);

    for (const col of collections) {
      const collectionName = col.name;
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      const filePath = path.join(backupPath, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      console.log(`✓ ${collectionName}: ${documents.length} documents`);
    }

    console.log(`\n✅ Backup complete: ${backupPath}`);
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    process.exit(1);
  }
}

backupDatabase();
