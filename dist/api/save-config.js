import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const updatedConfig = req.body;
        const configPath = path.join(__dirname, '../../config/site.json');
        // Save to file
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
        res.status(200).json({
            success: true,
            message: 'Configuration saved successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Save config error:', error);
        res.status(500).json({
            error: 'Failed to save configuration',
            message: error.message,
        });
    }
}
//# sourceMappingURL=save-config.js.map