#!/usr/bin/env node

/**
 * Convert Provisional User Script
 *
 * This script converts a provisional user to a full authenticated user
 * by setting isProvisional: false in the MongoDB database.
 *
 * Usage:
 *   node convert-provisional-user.js
 *
 * Environment Variables:
 *   TEST_EMAIL - Email of the provisional user to convert
 *   MONGODB_URI - MongoDB connection string
 *
 * Example:
 *   TEST_EMAIL="test@example.com" MONGODB_URI="mongodb://localhost:27017/unquest" node convert-provisional-user.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function convertProvisionalUser() {
  try {
    const email = process.env.TEST_EMAIL;
    const mongoUri = process.env.MONGODB_URI;

    if (!email) {
      console.error('ERROR: TEST_EMAIL environment variable is required');
      process.exit(1);
    }

    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI environment variable is required');
      process.exit(1);
    }

    console.log(`🔄 Converting provisional user: ${email}`);
    console.log(`📡 Using MongoDB: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

    // Use MongoDB shell command to update the user
    const updateCommand = `
      db.users.updateOne(
        { email: "${email}" },
        {
          $set: {
            isProvisional: false,
            isEmailVerified: true,
            emailVerifiedAt: new Date()
          }
        }
      )
    `;

    // Execute mongosh command
    const command = `mongosh "${mongoUri}" --eval '${updateCommand.replace(/\n/g, ' ')}'`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.error('❌ Error:', stderr);
      process.exit(1);
    }

    console.log('📝 MongoDB response:', stdout);

    if (stdout.includes('modifiedCount: 1') || stdout.includes('"modifiedCount":1')) {
      console.log('✅ Successfully converted provisional user to full user');
      console.log(`✉️  User ${email} is now a full authenticated user`);
    } else if (stdout.includes('matchedCount: 0') || stdout.includes('"matchedCount":0')) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    } else {
      console.warn('⚠️  User may have already been converted or update failed');
    }

  } catch (error) {
    console.error('❌ Failed to convert provisional user:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  convertProvisionalUser();
}

module.exports = { convertProvisionalUser };
