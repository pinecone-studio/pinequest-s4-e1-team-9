import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(COMPANIES_FILE);
    } catch {
      await fs.writeFile(COMPANIES_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

ensureDataDir();

router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(COMPANIES_FILE, 'utf-8');
    const companies = JSON.parse(data);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const data = await fs.readFile(COMPANIES_FILE, 'utf-8');
    const companies = JSON.parse(data);

    const newCompany = {
      id: crypto.randomUUID(),
      name,
      domain,
      createdAt: new Date().toISOString()
    };

    companies.push(newCompany);
    await fs.writeFile(COMPANIES_FILE, JSON.stringify(companies, null, 2));

    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

export default router;
