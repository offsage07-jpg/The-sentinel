const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'sentinel123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const PORT = process.env.PORT || 10000;

app.get('/webhook', (req, res) => {
  console.log('Verify attempt:', req.query['hub.verify_token']);
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (msg && WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
      const from = msg.from;
      const text = (msg.text?.body || '').toLowerCase();
      let reply = "🛡️ The Sentinel is LIVE! Type: hi / help / status / scan";
      if (text.includes('hi') || text.includes('hello')) reply = "👋 Hey! The Sentinel is active and protecting. How can I help you today?";
      if (text.includes('help')) reply = "📖 Commands:\n• hi - Greeting\n• status - System check\n• scan - Security demo\n• help - This menu";
      if (text.includes('status')) reply = "✅ The Sentinel System: ONLINE\n🔒 Security: ACTIVE\n📡 Render: CONNECTED";
      if (text.includes('scan')) reply = "🔍 Scanning...\n✅ No threats found\n🔒 Firewall: OK\n🛡️ You are protected!";

      await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply }
      }, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
      console.log('Replied to:', from);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.sendStatus(200);
  }
});

app.get('/', (req, res) => res.send('The Sentinel is Running - OK'));

app.listen(PORT, () => console.log(`The Sentinel running on port ${PORT}`));
