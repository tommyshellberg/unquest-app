import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { AVAILABLE_QUESTS } from './vaedros-quests';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://192.168.178.67:3001/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// You might want to set your admin token in .env file
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('Error: ADMIN_TOKEN not found in environment variables');
  process.exit(1);
}

// Prepare the quest templates for server import
function prepareQuestTemplate(quest: any) {
  // Convert audioFile path from client format to server format
  let serverAudioFile = '';
  if (quest.audioFile) {
    // Extract the file name from the path (e.g., '@/../assets/audio/quest-1.mp3' -> 'quest-1.mp3')
    const matches = quest.audioFile.match(/quest-[^.]+\.mp3/);
    if (matches) {
      serverAudioFile = `audio/${matches[0]}`;
    }
  }

  return {
    customId: quest.id,
    mode: quest.mode,
    title: quest.title,
    recap: quest.recap,
    durationMinutes: quest.durationMinutes,
    reward: quest.reward,
    poiSlug: quest.poiSlug,
    audioFile: serverAudioFile,
    story: quest.story,
    options: quest.options,
  };
}

async function importQuestTemplates() {
  try {
    // Start with just the first quest for testing
    const questsToImport = AVAILABLE_QUESTS;

    console.log(
      `Preparing to import ${questsToImport.length} quest templates...`
    );

    // Map quests to the server format
    const templates = questsToImport.map(prepareQuestTemplate);

    console.log('Formatted templates:');
    console.log(JSON.stringify(templates, null, 2));

    // Set authorization header for this specific request
    const headers = {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    };

    // Import templates to server
    const response = await apiClient.post(
      '/quest-templates/import/bulk',
      {
        templates,
        overwrite: true,
      },
      { headers }
    );

    console.log('Import successful!');
    console.log(`Imported ${response.data.imported} templates`);

    // Optionally save the response to a log file
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      path.join(logDir, `import-log-${timestamp}.json`),
      JSON.stringify(response.data, null, 2)
    );
  } catch (error: any) {
    console.error('Error importing quest templates:');
    console.error(error.response?.data || error.message || error);
  }
}

// Run the import function
importQuestTemplates()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
