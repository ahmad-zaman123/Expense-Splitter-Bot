# WhatsApp Expense Splitter Bot

A WhatsApp bot that splits expenses among a group of people and calculates who owes whom. Built with Node.js and the Meta WhatsApp Business API.

## Features

- Add people and their expenses via simple WhatsApp commands
- Automatically calculates equal share per person
- Shows exactly who needs to pay whom and how much
- Per-user session management (each user has their own expense list)
- Update an existing person's amount by adding them again

## Commands

| Command | Description |
|---------|-------------|
| `hi` / `hello` / `start` | Show welcome message and instructions |
| `add <Name> <Amount>` | Add a person with their paid amount |
| `list` | View all current entries and total |
| `split` | Calculate and show settlements |
| `reset` | Clear your session and start over |

**Example:**
```
add Ali 1000
add Ahmad 500
add Sara 500
split
```

**Output:**
```
💸 Expense Summary
👥 People: 3
💰 Total:  PKR 2000.00
📊 Share:  PKR 666.67 each

Settlements:
➡️ Ahmad pays Ali: PKR 166.67
➡️ Sara pays Ali: PKR 166.67
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **API:** Meta WhatsApp Business Cloud API
- **HTTP Client:** Axios

## Getting Started

### Prerequisites

- Node.js v16+
- Meta Developer Account with WhatsApp Business API access

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ahmad-zaman123/Expense-Splitter-Bot.git
   cd Expense-Splitter-Bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. Set the following in your `.env`:
   ```
   WHATSAPP_TOKEN=your_access_token
   PHONE_NUMBER_ID=your_phone_number_id
   VERIFY_TOKEN=your_verify_token
   PORT=3000
   ```

### Running Locally

```bash
npm start
```
