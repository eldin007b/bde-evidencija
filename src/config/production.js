// Produkcijski config - bez sensitive podataka
export const config = {
  GITHUB_TOKEN: '', // Ostaviti prazno za produkciju
  GITHUB_REPO: 'eldin007b/gls-scraper',
  WORKFLOW_FILE: 'scraper.yml',
  // Flag da li je u development modu
  IS_DEVELOPMENT: false
};

export default config;