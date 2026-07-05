# Vagrant Logistics - Courier Calculator

A shipping contract reward calculator for EVE Online's Vagrant Logistics corporation and The Charter alliance. Built with high-end glassmorphism styling and precise, real-time quote computations.

## Installation & Usage

1. **Clone the repository**:
   ```bash
   git clone https://github.com/backbone666/vagrant-logistics-reward-calc.git
   ```
2. **Open the App**:
   Open `index.html` directly in any modern web browser.

3. **Calculate Quotes**:
   * Input the **Collateral** in ISK (suggested Janice Sell value).
   * Input the route's **Highsec Jumps** and **Dangerous Jumps** (Lowsec/Nullsec).
   * Input the **Volume** in m³ (or click the volume preset buttons: Freighter, DST, Blockade Runner).
   * The reward quote and route breakdown update instantly as you type.
   * Click **Copy Reward** to copy the calculated value to your clipboard.

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