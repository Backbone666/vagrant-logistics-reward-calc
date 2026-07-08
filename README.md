# Vagrant Logistics - Courier Calculator

A shipping contract reward calculator for EVE Online's Vagrant Logistics corporation and The Charter alliance. Built with high-end glassmorphism styling and precise, real-time quote computations.

## Installation & Local Development

1. Clone the repository:
```bash
git clone https://github.com/backbone666/vagrant-logistics-reward-calc.git
cd vagrant-logistics-reward-calc
```

2. Install development tools:
```bash
npm install
```

3. Launch the local development server (avoids CORS issues loading rate config files):
```bash
npm run dev
```
Open http://localhost:3000 in your web browser.

## Project Structure

* `index.html` — Calculator user interface, assets, and DOM interaction script.
* `calculator.js` — Core calculator logic, module exports, and service classifier.
* `rate_card_config.json` — Operational config containing base rates, cyno fees, and collateral brackets.
* `style.css` — Custom glassmorphism responsive design inspired by the Amarr Empire.
* `test/calculator.test.js` — Automated test suite verifying calculation scenarios.

## Development Commands

* **Run Tests**:
   ```bash
   npm run test
   ```
* **Lint Check**:
   ```bash
   npm run lint
   ```
* **Auto-format**:
   ```bash
   npm run format
   ```